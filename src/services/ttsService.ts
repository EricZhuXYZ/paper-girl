import { AppError, providerErrorCode } from '@/lib/errors'
import { optionalEnv, requiredEnv } from '@/lib/env'
import { fetchWithTimeout } from '@/lib/timeout'
import { cleanTextForSpeech } from '@/utils/cleanText'
import { getCharacterById } from '@/data/characters'
import type { CharacterId } from '@/types/chat'

export async function synthesizeSpeech(params: {
  sessionId: string
  characterId: CharacterId
  text: string
}): Promise<{ audioUrl: string; durationMs: number }> {
  const startedAt = Date.now()
  const character = getCharacterById(params.characterId)
  if (!character) {
    throw new AppError({
      code: 'BAD_RESPONSE',
      message: 'Invalid character for TTS',
      status: 400,
    })
  }

  const endpoint = optionalEnv(
    'DOUBAO_TTS_URL',
    'https://openspeech.bytedance.com/api/v3/tts/unidirectional'
  )!
  const apiKey = requiredEnv('DOUBAO_TTS_API_KEY')
  const resourceId = optionalEnv('DOUBAO_TTS_RESOURCE_ID', 'seed-tts-2.0')!
  const body = {
    user: {
      uid: params.sessionId,
    },
    namespace: 'TTS',
    req_params: {
      text: cleanTextForSpeech(params.text),
      speaker: character.voiceId,
      audio_params: {
        format: 'mp3',
        sample_rate: 24000,
        bit_rate: 128000,
      },
      additions: JSON.stringify({
        context_texts: ['像真人聊天一样，自然、有情绪，符合当前角色人设'],
      }),
    },
  }

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'X-Api-Resource-Id': resourceId,
      },
      body: JSON.stringify(body),
    },
    15_000
  )

  if (!response.ok) {
    throw new AppError({
      code: providerErrorCode(response.status),
      message: `TTS request failed with status ${response.status}`,
      status: response.status,
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('audio')) {
    const buffer = Buffer.from(await response.arrayBuffer())
    return {
      audioUrl: `data:audio/mpeg;base64,${buffer.toString('base64')}`,
      durationMs: Date.now() - startedAt,
    }
  }

  const data = parseDoubaoTtsResponse(await response.text())
  const audio =
    extractString(data, ['audio_url', 'audioUrl', 'url']) ??
    extractNestedString(data, ['data', 'audio_url']) ??
    extractNestedString(data, ['data', 'url'])
  const base64 =
    extractString(data, ['data', 'audio', 'audio_base64', 'base64']) ??
    extractNestedString(data, ['data', 'audio']) ??
    extractNestedString(data, ['data', 'audio_base64'])

  if (audio) return { audioUrl: audio, durationMs: Date.now() - startedAt }
  if (base64) {
    return {
      audioUrl: `data:audio/mpeg;base64,${base64}`,
      durationMs: Date.now() - startedAt,
    }
  }

  throw new AppError({
    code: 'TTS_FAILED',
    message: 'TTS response did not include audio data',
    status: 502,
  })
}

function extractString(data: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (typeof data[key] === 'string' && data[key]) return data[key] as string
  }
  return null
}

function extractNestedString(data: Record<string, unknown>, path: string[]) {
  let value: unknown = data
  for (const key of path) {
    if (!value || typeof value !== 'object') return null
    value = (value as Record<string, unknown>)[key]
  }
  return typeof value === 'string' && value ? value : null
}

function parseDoubaoTtsResponse(text: string): Record<string, unknown> {
  const trimmed = text.trim()
  if (!trimmed) return {}

  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>
    return parsed
  } catch {
    const chunks: string[] = []
    for (const line of trimmed.split(/\r?\n/)) {
      if (!line.trim()) continue
      try {
        const parsed = JSON.parse(line) as Record<string, unknown>
        if (typeof parsed.data === 'string') chunks.push(parsed.data)
      } catch {
        continue
      }
    }
    if (chunks.length > 0) {
      return { data: chunks.join('') }
    }
    return {}
  }
}
