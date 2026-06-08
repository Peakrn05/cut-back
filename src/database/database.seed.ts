import { DataSource } from 'typeorm'
import { ShopEntity } from '@/shop/entities/shop.entity'
import { ServiceEntity } from '@/shop/entities/service.entity'
import { QueueTokenEntity } from '@/queue/entities/queue-token.entity'

export const seedDatabase = async (dataSource: DataSource) => {
  const shopRepo = dataSource.getRepository(ShopEntity)
  const serviceRepo = dataSource.getRepository(ServiceEntity)
  const tokenRepo = dataSource.getRepository(QueueTokenEntity)

  const existingShop = await shopRepo.findOne({ where: { id: 'shop_001' } })
  if (existingShop) return

  // Create shop
  const shop = shopRepo.create({
    id: 'shop_001',
    name: 'APEX CUTS',
    tagline: 'Precision cuts, no waiting around.',
    isOpen: true,
    averageServiceTime: 25,
    nextTokenNumber: 49,
    dailyCount: 48,
  })
  await shopRepo.save(shop)

  // Create services
  const services = [
    { id: 'haircut', name: 'Haircut', duration: 25, price: 25, shop },
    { id: 'beard', name: 'Beard Trim', duration: 15, price: 15, shop },
    { id: 'haircut-beard', name: 'Haircut + Beard', duration: 35, price: 35, shop },
    { id: 'kids', name: 'Kids Cut', duration: 20, price: 18, shop },
    { id: 'styling', name: 'Style & Finish', duration: 20, price: 22, shop },
  ]
  await serviceRepo.save(services)

  // Create sample tokens (completed history)
  const now = new Date()
  const m = (minutes: number) => new Date(now.getTime() - minutes * 60_000)

  const tokens = [
    { number: 35, displayNumber: '035', serviceId: 'haircut', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(195), completedAt: m(165), shop },
    { number: 36, displayNumber: '036', serviceId: 'beard', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(170), completedAt: m(148), shop },
    { number: 37, displayNumber: '037', serviceId: 'haircut-beard', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(150), completedAt: m(112), shop },
    { number: 38, displayNumber: '038', serviceId: 'kids', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(120), completedAt: m(96), shop },
    { number: 39, displayNumber: '039', serviceId: 'haircut', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(100), completedAt: m(73), shop },
    { number: 40, displayNumber: '040', serviceId: 'styling', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(80), completedAt: m(55), customerName: 'Daniel', shop },
    { number: 41, displayNumber: '041', serviceId: 'beard', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(60), completedAt: m(42), shop },
    { number: 42, displayNumber: '042', serviceId: 'haircut', status: 'completed', position: -1, estimatedWait: 0, createdAt: m(45), completedAt: m(18), customerName: 'James', shop },
    { number: 43, displayNumber: '043', serviceId: 'haircut', status: 'serving', position: 0, estimatedWait: 0, createdAt: m(32), calledAt: m(10), servingStartedAt: m(9), customerName: 'Marcus', shop },
    { number: 44, displayNumber: '044', serviceId: 'beard', status: 'waiting', position: 1, estimatedWait: 17, createdAt: m(28), shop },
    { number: 45, displayNumber: '045', serviceId: 'haircut-beard', status: 'waiting', position: 2, estimatedWait: 32, createdAt: m(22), customerName: 'Leo', shop },
    { number: 46, displayNumber: '046', serviceId: 'kids', status: 'waiting', position: 3, estimatedWait: 57, createdAt: m(15), shop },
    { number: 47, displayNumber: '047', serviceId: 'haircut', status: 'waiting', position: 4, estimatedWait: 77, createdAt: m(10), customerName: 'Chris', shop },
    { number: 48, displayNumber: '048', serviceId: 'styling', status: 'waiting', position: 5, estimatedWait: 97, createdAt: m(5), shop },
  ]

  await tokenRepo.save(tokens)
  console.log('Database seeded successfully')
}
