import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Index } from 'typeorm'
import { ShopEntity } from '@/shop/entities/shop.entity'

export type SlotStatus = 'confirmed' | 'cancelled' | 'completed'

@Entity('slot_reservations')
@Index(['shop_id', 'date', 'timeSlot'])
export class SlotReservationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  shop_id: string

  @ManyToOne(() => ShopEntity)
  @JoinColumn({ name: 'shop_id' })
  shop: ShopEntity

  @Column()
  date: string  // YYYY-MM-DD

  @Column()
  timeSlot: string  // HH:MM

  @Column()
  serviceId: string

  @Column()
  customerName: string

  @Column({ nullable: true })
  customerPhone?: string

  @Column({ default: 'confirmed' })
  status: SlotStatus

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date
}
