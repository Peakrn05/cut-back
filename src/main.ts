import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.useGlobalPipes(new ValidationPipe({ transform: true }))

  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
      : ['http://localhost:3000'],
    credentials: true,
  })

  const port = parseInt(process.env.PORT ?? '3001', 10)
  await app.listen(port)
  console.log(`Server running on http://localhost:${port}`)
}

bootstrap()
