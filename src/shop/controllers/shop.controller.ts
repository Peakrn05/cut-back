import { Controller, Get, Patch, Body, Param } from '@nestjs/common'
import { ShopService } from '../services/shop.service'
import { ShopDto, UpdateShopDto } from '../dto/shop.dto'
import { ApiResponseDto } from '@/common/dto/api-response.dto'

@Controller('api/shop')
export class ShopController {
  constructor(private shopService: ShopService) {}

  @Get()
  async getShop(): Promise<ApiResponseDto<ShopDto>> {
    const data = await this.shopService.getShop()
    return ApiResponseDto.ok(data)
  }

  @Patch()
  async updateShop(@Body() dto: UpdateShopDto): Promise<ApiResponseDto<ShopDto>> {
    const data = await this.shopService.updateShop('shop_001', dto)
    return ApiResponseDto.ok(data)
  }
}
