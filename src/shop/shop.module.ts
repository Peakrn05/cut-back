import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ShopEntity } from './entities/shop.entity'
import { ServiceEntity } from './entities/service.entity'
import { ShopService } from './services/shop.service'
import { ShopController } from './controllers/shop.controller'

@Module({
  imports: [TypeOrmModule.forFeature([ShopEntity, ServiceEntity])],
  providers: [ShopService],
  controllers: [ShopController],
  exports: [ShopService],
})
export class ShopModule {}
