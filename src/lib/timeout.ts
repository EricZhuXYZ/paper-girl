import { AppError } from '@/lib/errors'

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new AppError({
        code: 'TIMEOUT',
        message: 'Provider request timed out',
        status: 504,
        cause: error,
      })
    }
    throw error
  } finally {
    clearTimeout(timer)
  }
}
