import { TypeOrmModuleOptions } from '@nestjs/typeorm'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { ServiceEntity } from '@/shop/entities/service.entity'
import { QueueTokenEntity } from '@/queue/entities/queue-token.entity'
import { SlotReservationEntity } from '@/slot/entities/slot-reservation.entity'

export const getDatabaseConfig = (): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'cutf_queue',
  entities: [ShopEntity, ServiceEntity, QueueTokenEntity, SlotReservationEntity],
  autoLoadEntities: true,
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
})
