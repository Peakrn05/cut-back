import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { ServiceId, TokenStatus } from '@/common/types/queue.types'

@Entity('queue_tokens')
@Index(['shop_id', 'number'], { unique: true })
@Index(['status'])
@Index(['createdAt'])
export class QueueTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  number: number

  @Column()
  displayNumber: string

  @Column()
  serviceId: ServiceId

  @Column({ nullable: true })
  customerName?: string

  @Column({ type: 'varchar', default: 'waiting' })
  status: TokenStatus

  @Column({ default: 0 })
  position: number

  @Column({ default: 0 })
  estimatedWait: number

  @Column()
  createdAt: Date

  @Column({ nullable: true })
  calledAt?: Date

  @Column({ nullable: true })
  servingStartedAt?: Date

  @Column({ nullable: true })
  completedAt?: Date

  @ManyToOne(() => ShopEntity, shop => shop.tokens, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: ShopEntity

  @Column()
  shop_id: string
}
