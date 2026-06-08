import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { QueueTokenEntity } from './entities/queue-token.entity'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { QueueService } from './services/queue.service'
import { QueueController } from './controllers/queue.controller'

@Module({
  imports: [TypeOrmModule.forFeature([QueueTokenEntity, ShopEntity])],
  providers: [QueueService],
  controllers: [QueueController],
  exports: [QueueService],
})
export class QueueModule {}
