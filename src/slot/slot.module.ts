import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SlotReservationEntity } from './entities/slot-reservation.entity'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { ServiceEntity } from '@/shop/entities/service.entity'
import { SlotService } from './services/slot.service'
import { SlotController } from './controllers/slot.controller'

@Module({
  imports: [TypeOrmModule.forFeature([SlotReservationEntity, ShopEntity, ServiceEntity])],
  providers: [SlotService],
  controllers: [SlotController],
})
export class SlotModule {}
