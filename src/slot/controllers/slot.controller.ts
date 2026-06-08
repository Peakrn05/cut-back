import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common'
import { SlotService } from '../services/slot.service'
import { ReserveSlotDto, AvailableSlotsDto, SlotReservationDto } from '../dto/slot.dto'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/slots')
export class SlotController {
  constructor(private slotService: SlotService) {}

  @Get('available')
  async getAvailableSlots(
    @Query('date') date: string,
  ): Promise<ApiResponseDto<AvailableSlotsDto>> {
    if (!date) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      date = tomorrow.toISOString().slice(0, 10)
    }
    const data = await this.slotService.getAvailableSlots(date)
    return ApiResponseDto.ok(data)
  }

  @Post('reserve')
  async reserveSlot(
    @Body() dto: ReserveSlotDto,
  ): Promise<ApiResponseDto<SlotReservationDto>> {
    const data = await this.slotService.reserveSlot(dto)
    return ApiResponseDto.ok(data)
  }

  @Get(':id')
  async getReservation(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<SlotReservationDto>> {
    const data = await this.slotService.getReservation(id)
    return ApiResponseDto.ok(data)
  }

  @Patch(':id/cancel')
  async cancelReservation(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<void>> {
    await this.slotService.cancelReservation(id)
    return ApiResponseDto.ok(undefined)
  }
}
