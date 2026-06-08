import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QueueTokenEntity } from '../entities/queue-token.entity'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { QueueTokenDto, QueueSummaryDto, TakeTokenDto, ServiceId, TokenStatus } from '../dto/queue.dto'

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueTokenEntity)
    private tokenRepo: Repository<QueueTokenEntity>,
    @InjectRepository(ShopEntity)
    private shopRepo: Repository<ShopEntity>,
  ) {}

  async takeToken(dto: TakeTokenDto, shopId = 'shop_001'): Promise<QueueTokenDto> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')
    if (!shop.isOpen) throw new BadRequestException('Shop is closed')

    const tokenNumber = shop.nextTokenNumber
    const waiting = await this.tokenRepo.count({ where: { shop_id: shopId, status: 'waiting' } })
    const serving = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'serving' },
    })

    const remaining = serving && serving.servingStartedAt
      ? Math.max(0, shop.averageServiceTime - this.minutesSince(serving.servingStartedAt))
      : 0

    const estimatedWait = Math.round(remaining + waiting * shop.averageServiceTime)

    // Reject if this customer cannot be fully served before close time
    if (shop.closeTime) {
      const minutesToClose = this.minutesUntilTime(shop.closeTime)
      if (minutesToClose !== null && estimatedWait + shop.averageServiceTime > minutesToClose) {
        throw new BadRequestException(
          `Queue is full — we cannot accept more customers before closing at ${this.formatTime12h(shop.closeTime)}`,
        )
      }
    }

    const token = this.tokenRepo.create({
      number: tokenNumber,
      displayNumber: this.formatTokenNumber(tokenNumber),
      serviceId: dto.serviceId,
      customerName: dto.customerName?.trim() || undefined,
      status: 'waiting',
      position: waiting + 1,
      estimatedWait,
      createdAt: new Date(),
      shop,
      shop_id: shopId,
    })

    await this.tokenRepo.save(token)

    shop.nextTokenNumber++
    shop.dailyCount++
    await this.shopRepo.save(shop)

    return this.toDto(token)
  }

  async getToken(tokenNumber: number, shopId = 'shop_001'): Promise<QueueTokenDto | null> {
    const token = await this.tokenRepo.findOne({
      where: { number: tokenNumber, shop_id: shopId },
      relations: ['shop'],
    })
    return token ? this.toDto(token) : null
  }

  async getAllTokens(shopId = 'shop_001'): Promise<QueueTokenDto[]> {
    const tokens = await this.tokenRepo.find({
      where: { shop_id: shopId },
      order: { createdAt: 'DESC' },
      relations: ['shop'],
    })
    return tokens.map(t => this.toDto(t))
  }

  async getQueueSummary(shopId = 'shop_001'): Promise<QueueSummaryDto> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')

    await this.recalculatePositions(shopId)

    const serving = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'serving' },
      relations: ['shop'],
    })

    const waiting = await this.tokenRepo.find({
      where: { shop_id: shopId, status: 'waiting' },
      order: { createdAt: 'ASC' },
      relations: ['shop'],
    })

    const upNext = waiting.slice(0, 3)

    const remaining = serving && serving.servingStartedAt
      ? Math.max(0, shop.averageServiceTime - this.minutesSince(serving.servingStartedAt))
      : 0

    const estimatedWaitForNew = Math.round(remaining + waiting.length * shop.averageServiceTime)

    let isQueueFull = false
    if (shop.closeTime) {
      const minutesToClose = this.minutesUntilTime(shop.closeTime)
      if (minutesToClose !== null && estimatedWaitForNew + shop.averageServiceTime > minutesToClose) {
        isQueueFull = true
      }
    }

    return {
      waitingCount: waiting.length,
      currentServing: serving ? this.toDto(serving) : null,
      upNext: upNext.map(t => this.toDto(t)),
      estimatedWaitForNew,
      averageServiceTime: shop.averageServiceTime,
      isQueueFull,
      openTime: shop.openTime,
      closeTime: shop.closeTime,
    }
  }

  async callNext(shopId = 'shop_001'): Promise<QueueTokenDto | null> {
    const serving = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'serving' },
    })
    if (serving) return null

    const next = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'waiting' },
      order: { createdAt: 'ASC' },
      relations: ['shop'],
    })

    if (!next) return null

    const now = new Date()
    next.status = 'serving'
    next.calledAt = now
    next.servingStartedAt = now
    next.position = 0

    await this.tokenRepo.save(next)
    await this.recalculatePositions(shopId)

    return this.toDto(next)
  }

  async completeServing(shopId = 'shop_001'): Promise<QueueTokenDto | null> {
    const serving = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'serving' },
      relations: ['shop'],
    })

    if (!serving) return null

    serving.status = 'completed'
    serving.completedAt = new Date()
    await this.tokenRepo.save(serving)

    const next = await this.callNext(shopId)
    return next
  }

  async cancelToken(tokenId: string): Promise<void> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId } })
    if (!token) throw new NotFoundException('Token not found')
    if (token.status !== 'waiting') throw new BadRequestException('Only waiting tokens can be cancelled')

    token.status = 'cancelled'
    await this.tokenRepo.save(token)
    await this.recalculatePositions(token.shop_id)
  }

  async skipToken(tokenId: string): Promise<void> {
    const token = await this.tokenRepo.findOne({ where: { id: tokenId } })
    if (!token) throw new NotFoundException('Token not found')
    if (token.status !== 'waiting') throw new BadRequestException('Only waiting tokens can be skipped')

    token.status = 'skipped'
    await this.tokenRepo.save(token)
    await this.recalculatePositions(token.shop_id)
  }

  private async recalculatePositions(shopId: string): Promise<void> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) return

    const serving = await this.tokenRepo.findOne({
      where: { shop_id: shopId, status: 'serving' },
    })

    const remaining = serving && serving.servingStartedAt
      ? Math.max(0, shop.averageServiceTime - this.minutesSince(serving.servingStartedAt))
      : 0

    const waiting = await this.tokenRepo.find({
      where: { shop_id: shopId, status: 'waiting' },
      order: { createdAt: 'ASC' },
    })

    let pos = 1
    for (const token of waiting) {
      const wait = remaining + (pos - 1) * shop.averageServiceTime
      token.position = pos
      token.estimatedWait = Math.round(wait)
      await this.tokenRepo.save(token)
      pos++
    }
  }

  private toDto(token: QueueTokenEntity): QueueTokenDto {
    return {
      id: token.id,
      number: token.number,
      displayNumber: token.displayNumber,
      serviceId: token.serviceId,
      customerName: token.customerName,
      status: token.status,
      position: token.position,
      estimatedWait: token.estimatedWait,
      createdAt: token.createdAt.toISOString(),
      calledAt: token.calledAt?.toISOString(),
      servingStartedAt: token.servingStartedAt?.toISOString(),
      completedAt: token.completedAt?.toISOString(),
    }
  }

  private formatTokenNumber(num: number): string {
    return num.toString().padStart(3, '0')
  }

  private minutesSince(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date
    return Math.floor((Date.now() - d.getTime()) / 60_000)
  }

  // Returns minutes from now until HH:MM today; null if time has already passed
  private minutesUntilTime(hhmm: string): number | null {
    const [h, m] = hhmm.split(':').map(Number)
    const target = new Date()
    target.setHours(h, m, 0, 0)
    const diff = Math.floor((target.getTime() - Date.now()) / 60_000)
    return diff > 0 ? diff : null
  }

  private formatTime12h(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hour = h % 12 || 12
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`
  }
}
