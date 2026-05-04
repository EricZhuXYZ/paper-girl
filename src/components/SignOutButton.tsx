'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { signOut } from '@/lib/auth-client'

export function SignOutButton() {
  const router = useRouter()

  async function onSignOut() {
    await signOut()
    router.replace('/login')
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={onSignOut}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-[#e7cbd4] bg-white/70 px-3 text-sm text-[#8b596a] transition hover:bg-white"
    >
      <LogOut className="h-4 w-4" />
      退出
    </button>
  )
}
