export type AppErrorCode =
  | 'UNAUTHORIZED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'BAD_RESPONSE'
  | 'LLM_PARSE_ERROR'
  | 'TTS_FAILED'
  | 'IMAGE_FAILED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR'

export class AppError extends Error {
  code: AppErrorCode
  status: number
  cause?: unknown

  constructor(options: {
    code: AppErrorCode
    message: string
    status?: number
    cause?: unknown
  }) {
    super(options.message)
    this.name = 'AppError'
    this.code = options.code
    this.status = options.status ?? 500
    this.cause = options.cause
  }
}

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error
  if (error instanceof Error && error.name === 'AbortError') {
    return new AppError({
      code: 'TIMEOUT',
      message: 'Request timed out',
      status: 504,
      cause: error,
    })
  }
  if (error instanceof Error) {
    return new AppError({
      code: 'UNKNOWN_ERROR',
      message: error.message,
      status: 500,
      cause: error,
    })
  }
  return new AppError({
    code: 'UNKNOWN_ERROR',
    message: 'Unknown error',
    status: 500,
    cause: error,
  })
}

export function providerErrorCode(status: number): AppErrorCode {
  if (status === 401) return 'UNAUTHORIZED'
  if (status === 429) return 'RATE_LIMITED'
  return 'BAD_RESPONSE'
}

export function friendlyErrorText(code: AppErrorCode): string {
  if (code === 'UNAUTHORIZED') {
    return '服务配置好像有点问题，我刚刚没连上。稍后再试一下好不好？'
  }
  if (code === 'RATE_LIMITED') {
    return '现在找我的人好像有点多，我缓一下再回你。'
  }
  if (code === 'TIMEOUT') {
    return '我刚刚反应慢了一点。你再跟我说一遍，好不好？'
  }
  return '我刚刚有点走神啦。你再跟我说一遍，好不好？'
}
