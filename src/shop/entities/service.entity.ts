import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm'
import { ShopEntity } from './shop.entity'

export type ServiceId = 'haircut' | 'beard' | 'haircut-beard' | 'kids' | 'styling'

@Entity('services')
export class ServiceEntity {
  @PrimaryColumn()
  id: ServiceId

  @Column()
  name: string

  @Column()
  duration: number

  @Column()
  price: number

  @ManyToOne(() => ShopEntity, shop => shop.services, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'shop_id' })
  shop: ShopEntity

  @Column()
  shop_id: string
}
