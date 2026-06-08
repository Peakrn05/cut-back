export class ApiResponseDto<T> {
  success: boolean
  data: T
  message?: string

  constructor(success: boolean, data: T, message?: string) {
    this.success = success
    this.data = data
    this.message = message
  }

  static ok<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, message)
  }

  static error<T = null>(data?: T, message?: string): ApiResponseDto<T | null> {
    return new ApiResponseDto(false, data ?? null, message)
  }
}
