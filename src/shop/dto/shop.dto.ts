import { IsString, IsBoolean, IsNumber, IsOptional, Min } from 'class-validator'

export class ServiceDto {
  id: string
  name: string
  duration: number
  price: number
}

export class ShopDto {
  id: string
  name: string
  tagline: string
  isOpen: boolean
  services: ServiceDto[]
  averageServiceTime: number
  nextTokenNumber: number
  dailyCount: number
}

export class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  tagline?: string

  @IsOptional()
  @IsBoolean()
  isOpen?: boolean

  @IsOptional()
  @IsNumber()
  @Min(1)
  averageServiceTime?: number
}

export class ShopResponseDto {
  success: boolean
  data: ShopDto
}
