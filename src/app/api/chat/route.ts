import { NextResponse } from 'next/server'
import { handleChatMessage } from '@/services/chatService'
import { validateChatRequest } from '@/lib/validators'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const params = validateChatRequest(body)
    const response = await handleChatMessage({
      ...params,
      userId: session.user.id,
    })
    return NextResponse.json(response)
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Invalid request',
      },
      { status: 400 }
    )
  }
}
