# CUTF Backend Setup & Deployment

## Architecture

- **Framework**: NestJS 10
- **Database**: PostgreSQL 14+
- **ORM**: TypeORM
- **Node**: 18+

## Database Schema

Tables automatically created via TypeORM synchronization:

### shops
- `id` (varchar, PK)
- `name` (varchar)
- `tagline` (varchar)
- `isOpen` (boolean)
- `averageServiceTime` (int)
- `nextTokenNumber` (int)
- `dailyCount` (int)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### services
- `id` (varchar, PK)
- `name` (varchar)
- `duration` (int)
- `price` (decimal)
- `shop_id` (varchar, FK)

### queue_tokens
- `id` (uuid, PK)
- `number` (int)
- `displayNumber` (varchar)
- `serviceId` (varchar)
- `customerName` (varchar, nullable)
- `status` (enum: waiting | serving | called | completed | cancelled | skipped)
- `position` (int)
- `estimatedWait` (int)
- `createdAt` (timestamp)
- `calledAt` (timestamp, nullable)
- `servingStartedAt` (timestamp, nullable)
- `completedAt` (timestamp, nullable)
- `shop_id` (varchar, FK)
- Indexes: (shop_id, number), (status), (createdAt)

## Installation

```bash
# Install dependencies
npm install

# Set environment variables
cp .env.example .env
# Edit .env with your database credentials

# Create database
createdb cutf_queue

# Run migrations (auto-sync via TypeORM)
npm run start:dev
```

## Running

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

All endpoints return `{ success: boolean, data: T, message?: string }`

### Shop

**GET /api/shop**
```json
{
  "success": true,
  "data": {
    "id": "shop_001",
    "name": "APEX CUTS",
    "tagline": "Precision cuts, no waiting around.",
    "isOpen": true,
    "services": [
      { "id": "haircut", "name": "Haircut", "duration": 25, "price": 25 }
    ],
    "averageServiceTime": 25,
    "nextTokenNumber": 49,
    "dailyCount": 48
  }
}
```

**PATCH /api/shop**
```json
{
  "name": "New Name",
  "tagline": "New tagline",
  "isOpen": false,
  "averageServiceTime": 30
}
```

### Queue

**GET /api/queue/summary**
```json
{
  "success": true,
  "data": {
    "waitingCount": 5,
    "currentServing": { /* QueueTokenDto */ },
    "upNext": [ /* 3 QueueTokenDtos */ ],
    "estimatedWaitForNew": 125,
    "averageServiceTime": 25
  }
}
```

**POST /api/queue/tokens**
```json
{
  "serviceId": "haircut",
  "customerName": "John"
}
```

**GET /api/queue/tokens/:number**
Returns QueueTokenDto or null

**POST /api/queue/call-next**
Calls the next waiting customer

**POST /api/queue/complete**
Completes current serving and calls next

**PATCH /api/queue/tokens/:id/cancel**
Cancels a waiting token

**PATCH /api/queue/tokens/:id/skip**
Skips a waiting token (no-show)

## Database Seeding

On first boot with `NODE_ENV=development` and an empty database, seed data is automatically loaded:
- Shop configuration
- Service definitions
- Sample tokens (completed + current + waiting)

## CORS Configuration

By default allows:
- `http://localhost:3000` (frontend dev)
- `http://localhost:3001` (backend dev)

Update `CORS_ORIGIN` env var for production domains (comma-separated).

## Error Handling

- **400 Bad Request**: Invalid input, shop closed
- **404 Not Found**: Resource doesn't exist
- **500 Internal Server Error**: Unexpected error

## Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Update database credentials
- [ ] Update `CORS_ORIGIN` with frontend domain
- [ ] Set production database connection
- [ ] Run migrations
- [ ] Seed initial shop data
- [ ] Monitor logs
