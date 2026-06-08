import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SlotReservationEntity } from '../entities/slot-reservation.entity'
import { ShopEntity } from '@/shop/entities/shop.entity'
import {
  AvailableSlotsDto,
  ReserveSlotDto,
  SlotReservationDto,
  TimeSlotDto,
} from '../dto/slot.dto'

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(SlotReservationEntity)
    private reservationRepo: Repository<SlotReservationEntity>,
    @InjectRepository(ShopEntity)
    private shopRepo: Repository<ShopEntity>,
  ) {}

  async getAvailableSlots(date: string, shopId = 'shop_001'): Promise<AvailableSlotsDto> {
    this.validateDateNotPast(date)

    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')

    const allSlots = this.generateSlots(shop.openTime, shop.closeTime, shop.averageServiceTime)

    const taken = await this.reservationRepo.find({
      where: { shop_id: shopId, date, status: 'confirmed' },
    })
    const takenTimes = new Set(taken.map(r => r.timeSlot))

    const nowMinutes = this.todayMinutes()
    const isToday = date === this.todayString()

    const slots: TimeSlotDto[] = allSlots.map(time => {
      const [h, m] = time.split(':').map(Number)
      const slotMinutes = h * 60 + m
      const pastForToday = isToday && slotMinutes <= nowMinutes
      return {
        time,
        available: !takenTimes.has(time) && !pastForToday,
      }
    })

    return { date, slots }
  }

  async reserveSlot(dto: ReserveSlotDto, shopId = 'shop_001'): Promise<SlotReservationDto> {
    this.validateDateNotPast(dto.date)

    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')

    const validSlots = this.generateSlots(shop.openTime, shop.closeTime, shop.averageServiceTime)
    if (!validSlots.includes(dto.timeSlot)) {
      throw new BadRequestException(`${dto.timeSlot} is not a valid time slot`)
    }

    // Block slots that have already passed for today
    if (dto.date === this.todayString()) {
      const [h, m] = dto.timeSlot.split(':').map(Number)
      if (h * 60 + m <= this.todayMinutes()) {
        throw new BadRequestException('That time slot has already passed')
      }
    }

    const existing = await this.reservationRepo.findOne({
      where: { shop_id: shopId, date: dto.date, timeSlot: dto.timeSlot, status: 'confirmed' },
    })
    if (existing) throw new BadRequestException('That time slot is already booked')

    const reservation = this.reservationRepo.create({
      shop_id: shopId,
      date: dto.date,
      timeSlot: dto.timeSlot,
      serviceId: dto.serviceId,
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone?.trim() || undefined,
      status: 'confirmed',
      createdAt: new Date(),
    })

    await this.reservationRepo.save(reservation)
    return this.toDto(reservation)
  }

  async getReservation(id: string): Promise<SlotReservationDto> {
    const r = await this.reservationRepo.findOne({ where: { id } })
    if (!r) throw new NotFoundException('Reservation not found')
    return this.toDto(r)
  }

  async cancelReservation(id: string): Promise<void> {
    const r = await this.reservationRepo.findOne({ where: { id } })
    if (!r) throw new NotFoundException('Reservation not found')
    if (r.status !== 'confirmed') throw new BadRequestException('Only confirmed reservations can be cancelled')
    r.status = 'cancelled'
    await this.reservationRepo.save(r)
  }

  // ── helpers ──────────────────────────────────────────────────────────────

  private generateSlots(openTime: string, closeTime: string, interval: number): string[] {
    const [oh, om] = openTime.split(':').map(Number)
    const [ch, cm] = closeTime.split(':').map(Number)
    const openMin = oh * 60 + om
    const closeMin = ch * 60 + cm
    const slots: string[] = []
    for (let t = openMin; t + interval <= closeMin; t += interval) {
      const h = Math.floor(t / 60).toString().padStart(2, '0')
      const m = (t % 60).toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
    return slots
  }

  private validateDateNotPast(date: string): void {
    const today = this.todayString()
    if (date < today) throw new BadRequestException('Cannot select a past date')
  }

  private todayString(): string {
    return new Date().toISOString().slice(0, 10)
  }

  private todayMinutes(): number {
    const now = new Date()
    return now.getHours() * 60 + now.getMinutes()
  }

  private toDto(r: SlotReservationEntity): SlotReservationDto {
    return {
      id: r.id,
      date: r.date,
      timeSlot: r.timeSlot,
      serviceId: r.serviceId,
      customerName: r.customerName,
      customerPhone: r.customerPhone,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }
  }
}
