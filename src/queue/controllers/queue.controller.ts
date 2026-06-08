import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common'
import { QueueService } from '../services/queue.service'
import { QueueTokenDto, QueueSummaryDto, TakeTokenDto, CallNextResponseDto, CompleteServingResponseDto } from '../dto/queue.dto'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/queue')
export class QueueController {
  constructor(private queueService: QueueService) {}

  @Get('summary')
  async getSummary(): Promise<ApiResponseDto<QueueSummaryDto>> {
    const data = await this.queueService.getQueueSummary()
    return ApiResponseDto.ok(data)
  }

  @Get('tokens')
  async getAllTokens(): Promise<ApiResponseDto<QueueTokenDto[]>> {
    const data = await this.queueService.getAllTokens()
    return ApiResponseDto.ok(data)
  }

  @Get('tokens/:number')
  async getToken(@Param('number') number: string): Promise<ApiResponseDto<QueueTokenDto | null>> {
    const data = await this.queueService.getToken(parseInt(number, 10))
    return ApiResponseDto.ok(data)
  }

  @Post('tokens')
  async takeToken(@Body() dto: TakeTokenDto): Promise<ApiResponseDto<QueueTokenDto>> {
    const data = await this.queueService.takeToken(dto)
    return ApiResponseDto.ok(data)
  }

  @Patch('tokens/:id/cancel')
  async cancelToken(@Param('id') id: string): Promise<ApiResponseDto<{ success: boolean }>> {
    await this.queueService.cancelToken(id)
    return ApiResponseDto.ok({ success: true })
  }

  @Patch('tokens/:id/skip')
  async skipToken(@Param('id') id: string): Promise<ApiResponseDto<{ success: boolean }>> {
    await this.queueService.skipToken(id)
    return ApiResponseDto.ok({ success: true })
  }

  @Post('call-next')
  async callNext(): Promise<ApiResponseDto<{ called: QueueTokenDto | null; stillWaiting: number }>> {
    const called = await this.queueService.callNext()
    const summary = await this.queueService.getQueueSummary()
    return ApiResponseDto.ok({ called, stillWaiting: summary.waitingCount })
  }

  @Post('complete')
  async completeServing(): Promise<ApiResponseDto<{ completed: QueueTokenDto | null; next: QueueTokenDto | null }>> {
    const completed = await this.queueService.getQueueSummary().then(s => s.currentServing)
    const next = await this.queueService.completeServing()
    return ApiResponseDto.ok({ completed: completed ?? null, next })
  }
}
