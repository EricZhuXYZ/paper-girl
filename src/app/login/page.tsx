import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { auth } from '@/lib/auth'

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) redirect('/')

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <AuthForm />
    </main>
  )
}
