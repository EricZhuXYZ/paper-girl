import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/AuthForm'
import { auth } from '@/lib/auth'

export const metadata: Metadata = {
  title: '欢迎登录纸片人',
}

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
