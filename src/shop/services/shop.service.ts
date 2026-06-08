import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ShopEntity } from '../entities/shop.entity'
import { ServiceEntity } from '../entities/service.entity'
import { ShopDto, UpdateShopDto } from '../dto/shop.dto'

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopEntity)
    private shopRepo: Repository<ShopEntity>,
    @InjectRepository(ServiceEntity)
    private serviceRepo: Repository<ServiceEntity>,
  ) {}

  async getShop(shopId = 'shop_001'): Promise<ShopDto> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')
    return this.toDto(shop)
  }

  async updateShop(shopId: string, dto: UpdateShopDto): Promise<ShopDto> {
    const shop = await this.shopRepo.findOne({ where: { id: shopId } })
    if (!shop) throw new NotFoundException('Shop not found')

    if (dto.name !== undefined) shop.name = dto.name
    if (dto.tagline !== undefined) shop.tagline = dto.tagline
    if (dto.isOpen !== undefined) shop.isOpen = dto.isOpen
    if (dto.averageServiceTime !== undefined) shop.averageServiceTime = dto.averageServiceTime

    await this.shopRepo.save(shop)
    return this.toDto(shop)
  }

  private toDto(shop: ShopEntity): ShopDto {
    return {
      id: shop.id,
      name: shop.name,
      tagline: shop.tagline,
      isOpen: shop.isOpen,
      services: shop.services.map(s => ({
        id: s.id,
        name: s.name,
        duration: s.duration,
        price: s.price,
      })),
      averageServiceTime: shop.averageServiceTime,
      nextTokenNumber: shop.nextTokenNumber,
      dailyCount: shop.dailyCount,
    }
  }
}
