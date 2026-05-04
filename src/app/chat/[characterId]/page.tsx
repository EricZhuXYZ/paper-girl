import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import { ChatScreen } from '@/components/ChatScreen'
import { getCharacterById } from '@/data/characters'
import { auth } from '@/lib/auth'

export default async function ChatPage({
  params,
}: {
  params: Promise<{ characterId: string }>
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/login')

  const { characterId } = await params
  const character = getCharacterById(characterId)
  if (!character) notFound()

  return <ChatScreen character={character} />
}
