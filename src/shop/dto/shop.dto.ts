import { IsString, IsBoolean, IsNumber, IsOptional, Min, Matches } from 'class-validator'

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
  openTime: string
  closeTime: string
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
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'openTime must be HH:MM format' })
  openTime?: string

  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'closeTime must be HH:MM format' })
  closeTime?: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  averageServiceTime?: number
}

export class ShopResponseDto {
  success: boolean
  data: ShopDto
}
