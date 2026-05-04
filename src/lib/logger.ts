function safePayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (/authorization|api.?key|password|token/i.test(key)) return [key, '[redacted]']
      if (typeof value === 'string' && value.length > 500) return [key, `${value.slice(0, 500)}...`]
      return [key, value]
    })
  )
}

export function logInfo(event: string, payload: Record<string, unknown> = {}) {
  console.info(
    JSON.stringify({
      level: 'info',
      event,
      timestamp: new Date().toISOString(),
      ...safePayload(payload),
    })
  )
}

export function logError(event: string, payload: Record<string, unknown> = {}) {
  console.error(
    JSON.stringify({
      level: 'error',
      event,
      timestamp: new Date().toISOString(),
      ...safePayload(payload),
    })
  )
}
