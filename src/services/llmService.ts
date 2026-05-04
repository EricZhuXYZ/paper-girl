import { AppError, providerErrorCode } from '@/lib/errors'
import { optionalEnv, requiredEnv } from '@/lib/env'
import { fetchWithTimeout } from '@/lib/timeout'
import { parseLlmJson, normalizeLlmReply } from '@/utils/jsonParser'
import type { Character, HistoryMessage, LLMReply, RelationshipStage } from '@/types/chat'
import { buildLlmMessages } from '@/lib/prompt'

export async function generateLlmReply(params: {
  character: Character
  stage: RelationshipStage
  history: HistoryMessage[]
  userMessage: string
}): Promise<{ reply: LLMReply; raw: unknown; durationMs: number }> {
  const startedAt = Date.now()
  const apiKey = requiredEnv('OPENROUTER_API_KEY')
  const endpoint = optionalEnv(
    'OPENROUTER_BASE_URL',
    'https://openrouter.ai/api/v1/chat/completions'
  )!
  const model = optionalEnv(
    'OPENROUTER_MODEL',
    'google/gemini-3-flash-preview-20251217'
  )!
  const body = {
    model,
    messages: buildLlmMessages(params),
    response_format: { type: 'json_object' },
  }

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    },
    30_000
  )

  if (!response.ok) {
    throw new AppError({
      code: providerErrorCode(response.status),
      message: `OpenRouter request failed with status ${response.status}`,
      status: response.status,
    })
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new AppError({
      code: 'BAD_RESPONSE',
      message: 'OpenRouter response did not include message content',
      status: 502,
    })
  }

  const raw = parseLlmJson(content)
  return {
    reply: normalizeLlmReply(raw, params.stage),
    raw,
    durationMs: Date.now() - startedAt,
  }
}
