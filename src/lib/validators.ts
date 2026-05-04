import { isCharacterId } from '@/data/characters'
import type { ChatRequest } from '@/types/chat'

export function validateChatRequest(input: unknown): ChatRequest {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid request body')
  }

  const body = input as Record<string, unknown>
  if (typeof body.characterId !== 'string' || !isCharacterId(body.characterId)) {
    throw new Error('Invalid characterId')
  }
  if (typeof body.message !== 'string' || !body.message.trim()) {
    throw new Error('Message is required')
  }
  if (
    body.sessionId !== undefined &&
    body.sessionId !== null &&
    typeof body.sessionId !== 'string'
  ) {
    throw new Error('Invalid sessionId')
  }

  return {
    sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
    characterId: body.characterId,
    message: body.message.trim().slice(0, 1000),
  }
}
