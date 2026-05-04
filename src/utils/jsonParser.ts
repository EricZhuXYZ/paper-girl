import { AppError } from '@/lib/errors'
import type { ImageType, LLMReply, RelationshipStage, ReplyType, SafetyLevel } from '@/types/chat'

const replyTypes = new Set<ReplyType>(['text', 'voice', 'image'])
const imageTypes = new Set<ImageType>(['selfie', 'life', 'meme'])
const stages = new Set<RelationshipStage>([
  'ice_breaking',
  'familiar_flirting',
  'intimate_company',
])
const safetyLevels = new Set<SafetyLevel>(['safe', 'boundary', 'crisis'])

export const FALLBACK_REPLY: LLMReply = {
  replyType: 'text',
  text: '我刚刚有点走神啦。你再跟我说一遍，好不好？',
  voiceText: null,
  imageType: null,
  imagePrompt: null,
  emotion: 'fallback',
  relationshipStage: 'ice_breaking',
  safetyLevel: 'safe',
}

export function parseLlmJson(content: string): unknown {
  const trimmed = content.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) {
      throw new AppError({
        code: 'LLM_PARSE_ERROR',
        message: 'LLM response did not include JSON',
        status: 502,
      })
    }
    try {
      return JSON.parse(match[0])
    } catch (error) {
      throw new AppError({
        code: 'LLM_PARSE_ERROR',
        message: 'Failed to parse LLM JSON',
        status: 502,
        cause: error,
      })
    }
  }
}

export function normalizeLlmReply(input: unknown, stage: RelationshipStage): LLMReply {
  if (!input || typeof input !== 'object') {
    return { ...FALLBACK_REPLY, relationshipStage: stage }
  }

  const data = input as Record<string, unknown>
  const text =
    typeof data.text === 'string' && data.text.trim()
      ? data.text.trim()
      : FALLBACK_REPLY.text
  const safetyLevel = safetyLevels.has(data.safetyLevel as SafetyLevel)
    ? (data.safetyLevel as SafetyLevel)
    : 'safe'
  const relationshipStage = stages.has(data.relationshipStage as RelationshipStage)
    ? (data.relationshipStage as RelationshipStage)
    : stage
  let replyType = replyTypes.has(data.replyType as ReplyType)
    ? (data.replyType as ReplyType)
    : 'text'
  let voiceText = typeof data.voiceText === 'string' ? data.voiceText.trim() : null
  let imageType = imageTypes.has(data.imageType as ImageType)
    ? (data.imageType as ImageType)
    : null
  let imagePrompt = typeof data.imagePrompt === 'string' ? data.imagePrompt.trim() : null

  if (safetyLevel !== 'safe') replyType = 'text'
  if (replyType === 'voice' && !voiceText) replyType = 'text'
  if (replyType === 'image' && (!imageType || !imagePrompt)) replyType = 'text'
  if (replyType !== 'voice') voiceText = null
  if (replyType !== 'image') {
    imageType = null
    imagePrompt = null
  }

  return {
    replyType,
    text,
    voiceText,
    imageType,
    imagePrompt,
    emotion: typeof data.emotion === 'string' ? data.emotion : 'neutral',
    relationshipStage,
    safetyLevel,
  }
}
