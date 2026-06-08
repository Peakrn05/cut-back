import { IsString, IsOptional, IsEnum } from 'class-validator'

export type ServiceId = 'haircut' | 'beard' | 'haircut-beard' | 'kids' | 'styling'
export type TokenStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'skipped'

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
}

export class TakeTokenDto {
  @IsEnum(['haircut', 'beard', 'haircut-beard', 'kids', 'styling'])
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
