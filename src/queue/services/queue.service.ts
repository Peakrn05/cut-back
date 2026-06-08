import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QueueTokenEntity } from '../entities/queue-token.entity'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { ServiceEntity } from '@/shop/entities/service.entity'
import { QueueTokenDto, QueueSummaryDto, TakeTokenDto } from '../dto/queue.dto'
import { SERVICE_IDS, ServiceId, TokenStatus } from '@/common/types/queue.types'

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueTokenEntity)
    private tokenRepo: Repository<QueueTokenEntity>,
    @InjectRepository(ShopEntity)
    private shopRepo: Repository<ShopEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepo: Repository<ServiceEntity>,
  ) {}

  async takeToken(dto: TakeTokenDto, shopId = 'shop_001'): Promise<QueueTokenDto> {
    if (!SERVICE_IDS.includes(dto.serviceId)) {
      throw new BadRequestException('Invalid service selected')
    }

    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')
    if (!shop.isOpen) throw new BadRequestException('Shop is closed')

    const now = new Date()
    if (!this.isWithinBusinessHours(now, shop)) {
      throw new BadRequestException(
        `Shop is open between ${shop.openTime} and ${shop.closeTime}`,
      )
    }

    const service = await this.serviceRepo.findOne({ where: { id: dto.serviceId, shop_id: shopId } })
    if (!service) throw new BadRequestException('Service is not available')

    const tokenNumber = shop.nextTokenNumber
    const waiting = await this.tokenRepo.count({ where: { shop_id: shopId, status: 'waiting' } })
    const serving = await this.tokenRepo.findOne({ where: { shop_id: shopId, status: 'serving' } })

    const remaining = serving && serving.servingStartedAt
      ? Math.max(0, shop.averageServiceTime - this.minutesSince(serving.servingStartedAt))
      : 0

    const estimatedWait = Math.round(remaining + waiting * shop.averageServiceTime)

    if (shop.closeTime) {
      const minutesToClose = this.minutesUntilTime(shop.closeTime)
      if (minutesToClose !== null && estimatedWait + service.duration > minutesToClose) {
        throw new BadRequestException(
          `Queue is full — we cannot accept more customers before closing at ${this.formatTime12h(shop.closeTime)}`,
        )
      }
    }

    const token = await this.tokenRepo.manager.transaction(async manager => {
      const tokenRepository = manager.getRepository(QueueTokenEntity)
      const shopRepository = manager.getRepository(ShopEntity)

      const queuedToken = tokenRepository.create({
        number: tokenNumber,
        displayNumber: this.formatTokenNumber(tokenNumber),
        serviceId: dto.serviceId,
        customerName: dto.customerName?.trim() || undefined,
        status: 'waiting' as TokenStatus,
        position: waiting + 1,
        estimatedWait,
        createdAt: new Date(),
        shop,
        shop_id: shopId,
      })

      await tokenRepository.save(queuedToken)

      shop.nextTokenNumber++
      shop.dailyCount++
      await shopRepository.save(shop)

      return queuedToken
    })

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

    const updated = waiting.map((token, index) => {
      const position = index + 1
      token.position = position
      token.estimatedWait = Math.round(remaining + (position - 1) * shop.averageServiceTime)
      return token
    })

    if (updated.length > 0) {
      await this.tokenRepo.save(updated)
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

  private isWithinBusinessHours(date: Date, shop: ShopEntity): boolean {
    const minutes = date.getHours() * 60 + date.getMinutes()
    const open = this.getMinutesFromHHMM(shop.openTime)
    const close = this.getMinutesFromHHMM(shop.closeTime)

    return minutes >= open && minutes < close
  }

  private getMinutesFromHHMM(hhmm: string): number {
    const [h, m] = hhmm.split(':').map(Number)
    return h * 60 + m
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
