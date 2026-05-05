'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { authClient, signIn, signUp } from '@/lib/auth-client'
import { TurnstileWidget } from '@/components/TurnstileWidget'

type AuthMode = 'login' | 'register'

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const googlePopupName = 'paper-girl-google-oauth'

export function AuthForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [turnstileResetKey, setTurnstileResetKey] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)

  const isRegistering = mode === 'register'

  const handleTurnstileTokenChange = useCallback((token: string | null) => {
    setTurnstileToken(token)
  }, [])

  useEffect(() => {
    setTurnstileToken(null)
    setTurnstileResetKey(key => key + 1)
  }, [mode])

  function resetTurnstile() {
    setTurnstileToken(null)
    setTurnstileResetKey(key => key + 1)
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!turnstileToken) {
      setError('请先完成人机验证。')
      return
    }

    const captchaResponse = turnstileToken ?? ''

    setIsSubmitting(true)

    try {
      const result =
        mode === 'login'
          ? await signIn.email({
              email,
              password,
              fetchOptions: {
                headers: {
                  'x-captcha-response': captchaResponse,
                },
              },
            })
          : await signUp.email({
              name: name.trim() || email.split('@')[0] || '新用户',
              email,
              password,
              fetchOptions: {
                headers: {
                  'x-captcha-response': captchaResponse,
                },
              },
            })

      if (result.error) {
        setError(result.error.message ?? '认证失败，请检查邮箱和密码。')
        resetTurnstile()
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      setError('认证服务暂时不可用，请稍后再试。')
      resetTurnstile()
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onGoogleSignIn() {
    setError(null)
    setIsGoogleSubmitting(true)
    const popup = openGooglePopup()

    if (!popup) {
      setError('浏览器阻止了 Google 登录弹窗，请允许弹窗后重试。')
      setIsGoogleSubmitting(false)
      return
    }

    try {
      const result = await signIn.social({
        provider: 'google',
        callbackURL: '/',
        disableRedirect: true,
      })

      if (result.error) {
        setError(result.error.message ?? 'Google 登录失败，请稍后再试。')
        popup.close()
        return
      }

      const authUrl = result.data?.url
      if (!authUrl) {
        setError('Google 登录地址生成失败，请稍后再试。')
        popup.close()
        return
      }

      popup.location.href = authUrl

      const signedIn = await waitForGoogleSession(popup)
      if (!signedIn) {
        setError('Google 登录窗口已关闭，请重新尝试。')
        return
      }

      router.replace('/')
      router.refresh()
    } catch {
      popup.close()
      setError('Google 登录服务暂时不可用，请稍后再试。')
    } finally {
      setIsGoogleSubmitting(false)
    }
  }

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

      <button
        type="button"
        onClick={onGoogleSignIn}
        disabled={isSubmitting || isGoogleSubmitting}
        className="mb-5 flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[#e6cbd4] bg-white px-4 font-medium text-[#241b20] transition hover:border-[#bd5b79] hover:bg-[#fff7f9] disabled:text-[#a88a95]"
      >
        {isGoogleSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleLogo className="h-4 w-4" />
        )}
        使用 Google 登录
      </button>

      <div className="mb-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#ead2da]" />
        <span className="text-xs text-[#8b596a]">或使用邮箱</span>
        <div className="h-px flex-1 bg-[#ead2da]" />
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
              disabled={isSubmitting || isGoogleSubmitting}
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
            disabled={isSubmitting || isGoogleSubmitting}
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
            disabled={isSubmitting || isGoogleSubmitting}
            className="h-11 w-full rounded-md border border-[#e6cbd4] bg-white px-3 outline-none transition focus:border-[#bd5b79]"
            placeholder="至少 8 位"
          />
        </label>

        <div>
          {turnstileSiteKey ? (
            <TurnstileWidget
              key={turnstileResetKey}
              siteKey={turnstileSiteKey}
              onTokenChange={handleTurnstileTokenChange}
            />
          ) : (
            <div className="rounded-md border border-[#f0b7c2] bg-[#fff1f4] px-3 py-2 text-sm text-[#a33d55]">
              Turnstile 站点密钥未配置。
            </div>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-[#f0b7c2] bg-[#fff1f4] px-3 py-2 text-sm text-[#a33d55]">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={
          isSubmitting || isGoogleSubmitting || !turnstileSiteKey || !turnstileToken
        }
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

function openGooglePopup() {
  const width = 480
  const height = 640
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2)
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2)
  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'popup=yes',
    'resizable=yes',
    'scrollbars=yes',
  ].join(',')

  return window.open('', googlePopupName, features)
}

function waitForGoogleSession(popup: Window) {
  return new Promise<boolean>(resolve => {
    let attempts = 0
    const maxAttempts = 120

    const timer = window.setInterval(async () => {
      attempts += 1

      if (popup.closed) {
        window.clearInterval(timer)
        resolve(false)
        return
      }

      try {
        const session = await authClient.getSession()
        if (session.data) {
          popup.close()
          window.clearInterval(timer)
          resolve(true)
          return
        }
      } catch {
        // Session polling can fail briefly while OAuth is redirecting.
      }

      if (attempts >= maxAttempts) {
        popup.close()
        window.clearInterval(timer)
        resolve(false)
      }
    }, 1000)
  })
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.24 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.37c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.37 12 5.37Z"
        fill="#EA4335"
      />
    </svg>
  )
}
