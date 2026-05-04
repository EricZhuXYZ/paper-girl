'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { signIn, signUp } from '@/lib/auth-client'

type AuthMode = 'login' | 'register'

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const result =
        mode === 'login'
          ? await signIn.email({
              email,
              password,
            })
          : await signUp.email({
              name: name.trim() || email.split('@')[0] || '新用户',
              email,
              password,
            })

      if (result.error) {
        setError(result.error.message ?? '认证失败，请检查邮箱和密码。')
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      setError('认证服务暂时不可用，请稍后再试。')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isRegistering = mode === 'register'

  return (
    <form
      onSubmit={onSubmit}
      className="w-full max-w-[420px] rounded-lg border border-[#ead2da] bg-white/82 p-6 shadow-soft backdrop-blur"
    >
      <div className="mb-6">
        <p className="text-sm font-medium text-[#bd5b79]">纸片人女友聊天</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal text-[#241b20]">
          {isRegistering ? '创建账号' : '登录账号'}
        </h1>
      </div>

      <div className="mb-5 grid grid-cols-2 rounded-md bg-[#f4e8ed] p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login')
            setError(null)
          }}
          className={`rounded px-3 py-2 text-sm font-medium transition ${
            mode === 'login' ? 'bg-white text-[#241b20] shadow-sm' : 'text-[#8b596a]'
          }`}
        >
          登录
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register')
            setError(null)
          }}
          className={`rounded px-3 py-2 text-sm font-medium transition ${
            mode === 'register'
              ? 'bg-white text-[#241b20] shadow-sm'
              : 'text-[#8b596a]'
          }`}
        >
          注册
        </button>
      </div>

      <div className="space-y-4">
        {isRegistering ? (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-[#5f4a52]">昵称</span>
            <input
              value={name}
              onChange={event => setName(event.target.value)}
              autoComplete="name"
              disabled={isSubmitting}
              className="h-11 w-full rounded-md border border-[#e6cbd4] bg-white px-3 outline-none transition focus:border-[#bd5b79]"
              placeholder="给自己取个昵称"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#5f4a52]">邮箱</span>
          <input
            value={email}
            onChange={event => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
            disabled={isSubmitting}
            className="h-11 w-full rounded-md border border-[#e6cbd4] bg-white px-3 outline-none transition focus:border-[#bd5b79]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-[#5f4a52]">密码</span>
          <input
            value={password}
            onChange={event => setPassword(event.target.value)}
            type="password"
            autoComplete={isRegistering ? 'new-password' : 'current-password'}
            required
            minLength={8}
            disabled={isSubmitting}
            className="h-11 w-full rounded-md border border-[#e6cbd4] bg-white px-3 outline-none transition focus:border-[#bd5b79]"
            placeholder="至少 8 位"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-[#f0b7c2] bg-[#fff1f4] px-3 py-2 text-sm text-[#a33d55]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#bd5b79] px-4 font-medium text-white transition hover:bg-[#a64b68] disabled:bg-[#d8a8b8]"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRegistering ? (
          <UserPlus className="h-4 w-4" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        {isRegistering ? '注册并进入' : '登录'}
      </button>
    </form>
  )
}
