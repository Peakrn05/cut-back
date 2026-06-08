import { IsString, IsOptional, IsIn } from 'class-validator'
import { SERVICE_IDS, ServiceId, TokenStatus } from '@/common/types/queue.types'

export class QueueTokenDto {
  id: string
  number: number
  displayNumber: string
  serviceId: ServiceId
  customerName?: string
  status: TokenStatus
  position: number
  estimatedWait: number
  createdAt: string
  calledAt?: string
  servingStartedAt?: string
  completedAt?: string
}

export class QueueSummaryDto {
  waitingCount: number
  currentServing: QueueTokenDto | null
  upNext: QueueTokenDto[]
  estimatedWaitForNew: number
  averageServiceTime: number
  isQueueFull: boolean
  openTime: string
  closeTime: string
}

export class TakeTokenDto {
  @IsIn(SERVICE_IDS)
  serviceId: ServiceId

  @IsOptional()
  @IsString()
  customerName?: string
}

export class CallNextResponseDto {
  called: QueueTokenDto | null
  stillWaiting: number
}

export class CompleteServingResponseDto {
  completed: QueueTokenDto
  next: QueueTokenDto | null
}
