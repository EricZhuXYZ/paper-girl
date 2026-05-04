import { NextResponse } from 'next/server'
import { isCharacterId } from '@/data/characters'
import { toAppError } from '@/lib/errors'
import { logError } from '@/lib/logger'
import { generateImage } from '@/services/imageService'
import type { ImageType } from '@/types/chat'

const imageTypes = new Set<ImageType>(['selfie', 'life', 'meme'])

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.characterId !== 'string' || !isCharacterId(body.characterId)) {
      return NextResponse.json({ error: 'invalid characterId' }, { status: 400 })
    }
    if (!imageTypes.has(body.imageType as ImageType)) {
      return NextResponse.json({ error: 'invalid imageType' }, { status: 400 })
    }
    if (typeof body.imagePrompt !== 'string' || !body.imagePrompt.trim()) {
      return NextResponse.json({ error: 'imagePrompt is required' }, { status: 400 })
    }

    const result = await generateImage({
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
      characterId: body.characterId,
      imageType: body.imageType as ImageType,
      imagePrompt: body.imagePrompt,
    })

    return NextResponse.json({
      imageUrl: result.imageUrl,
      r2ObjectKey: result.r2ObjectKey,
    })
  } catch (error) {
    const appError = toAppError(error)
    logError('image_route_failed', {
      code: appError.code,
      message: appError.message,
      status: appError.status,
    })
    return NextResponse.json(
      { error: '图片生成失败，稍后再试一下。', code: appError.code },
      { status: appError.status >= 400 ? appError.status : 502 }
    )
  }
}
