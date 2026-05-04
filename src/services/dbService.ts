import { and, desc, eq } from 'drizzle-orm'
import { getDb } from '@/db'
import { chatMessages, chatSessions, generationTasks } from '@/db/schema'
import {
  CHARACTER_ID_TO_DB,
  type CharacterId,
  type HistoryMessage,
  type ImageType,
  type MessageDTO,
  type MessageType,
  type RelationshipStage,
  type SafetyLevel,
} from '@/types/chat'

export async function getOrCreateSession(params: {
  sessionId?: string
  userId: string
  characterId: CharacterId
}) {
  const db = getDb()
  const fallback = {
    id: params.sessionId ?? crypto.randomUUID(),
    messageCount: 0,
    relationshipStage: 'ice_breaking' as RelationshipStage,
  }
  if (!db) return fallback

  if (params.sessionId) {
    const existing = await db.query.chatSessions.findFirst({
      where: and(
        eq(chatSessions.id, params.sessionId),
        eq(chatSessions.userId, params.userId),
        eq(chatSessions.characterId, CHARACTER_ID_TO_DB[params.characterId])
      ),
    })
    if (existing) {
      return {
        id: existing.id,
        messageCount: existing.messageCount,
        relationshipStage: existing.relationshipStage,
      }
    }
  }

  const id = crypto.randomUUID()
  await db.insert(chatSessions).values({
    id,
    userId: params.userId,
    characterId: CHARACTER_ID_TO_DB[params.characterId],
  })
  return { ...fallback, id }
}

export async function saveMessage(params: {
  sessionId: string
  role: 'user' | 'assistant'
  type: MessageType
  content: string
  voiceText?: string | null
  audioUrl?: string | null
  imageUrl?: string | null
  imageType?: ImageType | null
  imagePrompt?: string | null
  emotion?: string | null
  relationshipStage?: RelationshipStage | null
  safetyLevel?: SafetyLevel | null
  rawLlmResponse?: unknown
}): Promise<MessageDTO> {
  const id = crypto.randomUUID()
  const createdAt = new Date()
  const dto: MessageDTO = {
    id,
    role: params.role,
    type: params.type,
    content: params.content,
    voiceText: params.voiceText,
    audioUrl: params.audioUrl,
    imageUrl: params.imageUrl,
    imageType: params.imageType,
    imagePrompt: params.imagePrompt,
    emotion: params.emotion,
    relationshipStage: params.relationshipStage,
    safetyLevel: params.safetyLevel,
    createdAt: createdAt.toISOString(),
  }

  const db = getDb()
  if (!db) return dto

  await db.insert(chatMessages).values({
    id,
    sessionId: params.sessionId,
    role: params.role,
    type: params.type,
    content: params.content,
    voiceText: params.voiceText,
    audioUrl: params.audioUrl,
    imageUrl: params.imageUrl,
    imageType: params.imageType,
    imagePrompt: params.imagePrompt,
    emotion: params.emotion,
    relationshipStage: params.relationshipStage,
    safetyLevel: params.safetyLevel,
    rawLlmResponse: params.rawLlmResponse,
    createdAt,
  })

  return dto
}

export async function getRecentHistory(sessionId: string, limit = 20): Promise<HistoryMessage[]> {
  const db = getDb()
  if (!db) return []

  const rows = await db
    .select({
      role: chatMessages.role,
      content: chatMessages.content,
      type: chatMessages.type,
    })
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit)

  return rows.reverse()
}

export async function updateSessionProgress(params: {
  sessionId: string
  messageCount: number
  relationshipStage: RelationshipStage
}) {
  const db = getDb()
  if (!db) return

  await db
    .update(chatSessions)
    .set({
      messageCount: params.messageCount,
      relationshipStage: params.relationshipStage,
      updatedAt: new Date(),
    })
    .where(eq(chatSessions.id, params.sessionId))
}

export async function recordGenerationTask(params: {
  sessionId: string
  messageId?: string
  provider: 'openrouter' | 'doubao_tts' | 'seedream'
  status: 'pending' | 'success' | 'failed'
  requestPayload?: unknown
  responsePayload?: unknown
  errorCode?: string
  errorMessage?: string
  durationMs?: number
}) {
  const db = getDb()
  if (!db) return

  await db.insert(generationTasks).values({
    id: crypto.randomUUID(),
    sessionId: params.sessionId,
    messageId: params.messageId,
    provider: params.provider,
    status: params.status,
    requestPayload: params.requestPayload,
    responsePayload: params.responsePayload,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    durationMs: params.durationMs,
  })
}
