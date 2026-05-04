import { AppError, providerErrorCode } from '@/lib/errors'
import { optionalEnv, requiredEnv } from '@/lib/env'
import { enhanceImagePrompt } from '@/lib/prompt'
import { fetchWithTimeout } from '@/lib/timeout'
import { getCharacterById } from '@/data/characters'
import type { CharacterId, ImageType } from '@/types/chat'
import { persistImageToR2 } from '@/services/r2Service'

export async function generateImage(params: {
  requestId?: string
  sessionId?: string
  characterId: CharacterId
  imageType: ImageType
  imagePrompt: string
}): Promise<{
  imageUrl: string
  temporaryImageUrl: string
  r2ObjectKey: string
  avatarReferenceUrl: string
  prompt: string
  durationMs: number
}> {
  const startedAt = Date.now()
  const character = getCharacterById(params.characterId)
  if (!character) {
    throw new AppError({
      code: 'BAD_RESPONSE',
      message: 'Invalid character for image generation',
      status: 400,
    })
  }

  const endpoint = optionalEnv(
    'SEEDREAM_IMAGE_URL',
    'https://ark.cn-beijing.volces.com/api/v3/images/generations'
  )!
  const model = optionalEnv('SEEDREAM_MODEL', 'doubao-seedream-4-0-250828')!
  const size = optionalEnv('SEEDREAM_SIZE', '2K')!
  const prompt = enhanceImagePrompt(params.imagePrompt, character)
  const avatarReferenceUrl = getAvatarReferenceUrl(character.avatarUrl)

  const response = await fetchWithTimeout(
    endpoint,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${requiredEnv('VOLCENGINE_ARK_API_KEY')}`,
      },
      body: JSON.stringify({
        model,
        prompt,
        image: [avatarReferenceUrl],
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size,
        stream: false,
        watermark: false,
      }),
    },
    30_000
  )

  if (!response.ok) {
    throw new AppError({
      code: providerErrorCode(response.status),
      message: `Seedream request failed with status ${response.status}`,
      status: response.status,
    })
  }

  const data = (await response.json()) as { data?: Array<{ url?: string }> }
  const temporaryImageUrl = data.data?.[0]?.url
  if (!temporaryImageUrl) {
    throw new AppError({
      code: 'IMAGE_FAILED',
      message: 'Seedream response did not include image URL',
      status: 502,
    })
  }

  const persisted = await persistImageToR2({
    sourceUrl: temporaryImageUrl,
    characterId: params.characterId,
    imageType: params.imageType,
    sessionId: params.sessionId,
    requestId: params.requestId,
  })

  return {
    imageUrl: persisted.publicUrl,
    temporaryImageUrl,
    r2ObjectKey: persisted.objectKey,
    avatarReferenceUrl,
    prompt,
    durationMs: Date.now() - startedAt,
  }
}

function getAvatarReferenceUrl(avatarUrl: string) {
  if (!/^https?:\/\//.test(avatarUrl)) {
    throw new AppError({
      code: 'BAD_RESPONSE',
      message: `Avatar reference must be a public URL: ${avatarUrl}`,
      status: 500,
    })
  }

  return avatarUrl
}
