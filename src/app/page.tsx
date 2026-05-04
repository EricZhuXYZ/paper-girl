import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { CharacterSelect } from '@/components/CharacterSelect'
import { auth } from '@/lib/auth'

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) redirect('/login')

  return (
    <CharacterSelect
      user={{
        name: session.user.name,
        email: session.user.email,
      }}
    />
  )
}
