import { NextResponse } from 'next/server'
import { getCharacterById, isCharacterId } from '@/data/characters'
import { toAppError } from '@/lib/errors'
import { logError } from '@/lib/logger'
import { synthesizeSpeech } from '@/services/ttsService'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>
    if (typeof body.text !== 'string' || !body.text.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }
    if (typeof body.characterId !== 'string' || !isCharacterId(body.characterId)) {
      return NextResponse.json({ error: 'invalid characterId' }, { status: 400 })
    }

    const character = getCharacterById(body.characterId)
    const result = await synthesizeSpeech({
      sessionId: typeof body.sessionId === 'string' ? body.sessionId : crypto.randomUUID(),
      characterId: body.characterId,
      text: body.text,
    })

    return NextResponse.json({
      audioUrl: result.audioUrl,
      voiceId: character?.voiceId,
    })
  } catch (error) {
    const appError = toAppError(error)
    logError('tts_route_failed', {
      code: appError.code,
      message: appError.message,
      status: appError.status,
    })
    return NextResponse.json(
      { error: '语音生成失败，稍后再试一下。', code: appError.code },
      { status: appError.status >= 400 ? appError.status : 502 }
    )
  }
}
