import { AppError } from '@/lib/errors'

export function optionalEnv(name: string, fallback?: string): string | undefined {
  return process.env[name] ?? fallback
}

export function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: `${name} is not set`,
      status: 500,
    })
  }
  return value
}
