import { IsString, IsOptional, IsIn, Matches } from 'class-validator'
import { SERVICE_IDS, ServiceId } from '@/common/types/queue.types'

export class TimeSlotDto {
  time: string       // HH:MM
  available: boolean
}

export class AvailableSlotsDto {
  date: string
  slots: TimeSlotDto[]
}

export class ReserveSlotDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date: string

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'timeSlot must be HH:MM' })
  timeSlot: string

  @IsIn(SERVICE_IDS)
  serviceId: ServiceId

  @IsString()
  customerName: string

  @IsOptional()
  @IsString()
  customerPhone?: string
}

export class SlotReservationDto {
  id: string
  date: string
  timeSlot: string
  serviceId: ServiceId
  customerName: string
  customerPhone?: string
  status: string
  createdAt: string
}
