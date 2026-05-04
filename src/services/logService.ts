import { errorLogs } from '@/db/schema'
import { getDb } from '@/db'
import { logError } from '@/lib/logger'

export async function recordErrorLog(params: {
  sessionId?: string | null
  requestId?: string
  provider?: 'openrouter' | 'doubao_tts' | 'seedream'
  code: string
  message: string
  status?: number
  stack?: string
  metadata?: Record<string, unknown>
}) {
  const db = getDb()
  if (!db) {
    logError('error_log_without_db', params)
    return
  }

  try {
    await db.insert(errorLogs).values({
      id: crypto.randomUUID(),
      sessionId: params.sessionId ?? null,
      requestId: params.requestId,
      provider: params.provider,
      code: params.code,
      message: params.message,
      status: params.status,
      stack: params.stack,
      metadata: params.metadata,
    })
  } catch (error) {
    logError('error_log_failed', {
      code: params.code,
      message: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
