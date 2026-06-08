import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm'
import { ServiceEntity } from './service.entity'
import { QueueTokenEntity } from '@/queue/entities/queue-token.entity'

@Entity('shops')
export class ShopEntity {
  @PrimaryColumn()
  id: string

  @Column()
  name: string

  @Column()
  tagline: string

  @Column({ default: true })
  isOpen: boolean

  @Column({ default: '09:00' })
  openTime: string   // "HH:MM" 24h

  @Column({ default: '18:00' })
  closeTime: string  // "HH:MM" 24h

  @Column({ default: 25 })
  averageServiceTime: number

  @Column({ default: 1 })
  nextTokenNumber: number

  @Column({ default: 0 })
  dailyCount: number

  @OneToMany(() => ServiceEntity, service => service.shop, { eager: true })
  services: ServiceEntity[]

  @OneToMany(() => QueueTokenEntity, token => token.shop)
  tokens: QueueTokenEntity[]

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date
}
