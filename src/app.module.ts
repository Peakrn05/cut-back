import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { getDatabaseConfig } from './database/database.config'
import { ShopModule } from './shop/shop.module'
import { QueueModule } from './queue/queue.module'
import { SlotModule } from './slot/slot.module'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DataSource } from 'typeorm'
import { seedDatabase } from './database/database.seed'

@Module({
  imports: [
    TypeOrmModule.forRoot(getDatabaseConfig()),
    ShopModule,
    QueueModule,
    SlotModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}

  async onApplicationBootstrap() {
    await seedDatabase(this.dataSource)
  }
}
