import { getCharacterById } from '@/data/characters'
import { AppError, friendlyErrorText, toAppError } from '@/lib/errors'
import { logError, logInfo } from '@/lib/logger'
import { calculateRelationshipStage } from '@/utils/stage'
import type { CharacterId, ChatResponse, MessageDTO } from '@/types/chat'
import {
  getOrCreateSession,
  getRecentHistory,
  recordGenerationTask,
  saveMessage,
  updateSessionProgress,
} from '@/services/dbService'
import { recordErrorLog } from '@/services/logService'
import { generateLlmReply } from '@/services/llmService'
import { synthesizeSpeech } from '@/services/ttsService'
import { generateImage } from '@/services/imageService'

export async function handleChatMessage(params: {
  sessionId?: string
  userId: string
  characterId: CharacterId
  message: string
}): Promise<ChatResponse> {
  const requestId = crypto.randomUUID()
  const startedAt = Date.now()
  let sessionId = params.sessionId ?? crypto.randomUUID()
  let userMessage: MessageDTO = localUserMessage(sessionId, params.message)

  try {
    const character = getCharacterById(params.characterId)
    if (!character) {
      throw new AppError({
        code: 'BAD_RESPONSE',
        message: 'Invalid characterId',
        status: 400,
      })
    }

    const session = await getOrCreateSession(params)
    sessionId = session.id
    const messageCount = session.messageCount + 1
    const relationshipStage = calculateRelationshipStage(messageCount)
    const history = await getRecentHistory(sessionId, 20)
    userMessage = await saveMessage({
      sessionId,
      role: 'user',
      type: 'text',
      content: params.message,
    })

    const llm = await generateLlmReply({
      character,
      stage: relationshipStage,
      history,
      userMessage: params.message,
    })
    await recordGenerationTask({
      sessionId,
      provider: 'openrouter',
      status: 'success',
      durationMs: llm.durationMs,
      responsePayload: llm.raw,
    })

    let reply = llm.reply
    let audioUrl: string | null = null
    let imageUrl: string | null = null
    let imagePrompt = reply.imagePrompt
    let degraded = false

    if (reply.replyType === 'voice' && reply.voiceText) {
      try {
        const tts = await synthesizeSpeech({
          sessionId,
          characterId: params.characterId,
          text: reply.voiceText,
        })
        audioUrl = tts.audioUrl
        await recordGenerationTask({
          sessionId,
          provider: 'doubao_tts',
          status: 'success',
          durationMs: tts.durationMs,
        })
      } catch (error) {
        degraded = true
        reply = { ...reply, replyType: 'text', voiceText: null }
        await recordProviderFailure('doubao_tts', error, sessionId, requestId)
      }
    }

    if (reply.replyType === 'image' && reply.imageType && reply.imagePrompt) {
      try {
        const image = await generateImage({
          requestId,
          sessionId,
          characterId: params.characterId,
          imageType: reply.imageType,
          imagePrompt: reply.imagePrompt,
        })
        imageUrl = image.imageUrl
        imagePrompt = image.prompt
        await recordGenerationTask({
          sessionId,
          provider: 'seedream',
          status: 'success',
          durationMs: image.durationMs,
          requestPayload: {
            imageType: reply.imageType,
            r2ObjectKey: image.r2ObjectKey,
            avatarReferenceUrl: image.avatarReferenceUrl,
            prompt: image.prompt,
          },
        })
      } catch (error) {
        degraded = true
        reply = { ...reply, replyType: 'text', imageType: null, imagePrompt: null }
        await recordProviderFailure('seedream', error, sessionId, requestId)
      }
    }

    const assistantMessage = await saveMessage({
      sessionId,
      role: 'assistant',
      type: reply.replyType,
      content: reply.text,
      voiceText: reply.voiceText,
      audioUrl,
      imageUrl,
      imageType: reply.imageType,
      imagePrompt,
      emotion: reply.emotion,
      relationshipStage: reply.relationshipStage,
      safetyLevel: reply.safetyLevel,
      rawLlmResponse: llm.raw,
    })
    await updateSessionProgress({
      sessionId,
      messageCount,
      relationshipStage: reply.relationshipStage,
    })

    logInfo('chat_completed', {
      requestId,
      sessionId,
      characterId: params.characterId,
      relationshipStage: reply.relationshipStage,
      messageCount,
      replyType: reply.replyType,
      safetyLevel: reply.safetyLevel,
      durationMs: Date.now() - startedAt,
      degraded,
    })

    return { sessionId, userMessage, assistantMessage }
  } catch (error) {
    const appError = toAppError(error)
    logError('chat_failed', {
      requestId,
      sessionId,
      characterId: params.characterId,
      code: appError.code,
      message: appError.message,
      status: appError.status,
    })
    await recordErrorLog({
      sessionId,
      requestId,
      provider: 'openrouter',
      code: appError.code,
      message: appError.message,
      status: appError.status,
      stack: appError.stack,
    })

    const assistantMessage = localAssistantMessage(sessionId, friendlyErrorText(appError.code))
    return { sessionId, userMessage, assistantMessage }
  }
}

async function recordProviderFailure(
  provider: 'doubao_tts' | 'seedream',
  error: unknown,
  sessionId: string,
  requestId: string
) {
  const appError = toAppError(error)
  await recordGenerationTask({
    sessionId,
    provider,
    status: 'failed',
    errorCode: appError.code,
    errorMessage: appError.message,
  })
  await recordErrorLog({
    sessionId,
    requestId,
    provider,
    code: appError.code,
    message: appError.message,
    status: appError.status,
    stack: appError.stack,
  })
}

function localUserMessage(sessionId: string, content: string): MessageDTO {
  return {
    id: crypto.randomUUID(),
    role: 'user',
    type: 'text',
    content,
    createdAt: new Date().toISOString(),
  }
}

function localAssistantMessage(sessionId: string, content: string): MessageDTO {
  return {
    id: crypto.randomUUID(),
    role: 'assistant',
    type: 'text',
    content,
    emotion: 'fallback',
    relationshipStage: 'ice_breaking',
    safetyLevel: 'safe',
    createdAt: new Date().toISOString(),
  }
}
