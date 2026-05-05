'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileRenderOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': (errorCode?: string) => boolean
  'timeout-callback': () => void
  size?: 'normal' | 'flexible' | 'compact'
  theme?: 'light' | 'dark' | 'auto'
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      remove: (widgetId: string) => void
      reset: (widgetId?: string) => void
    }
  }
}

type TurnstileWidgetProps = {
  siteKey: string
  onTokenChange: (token: string | null) => void
}

export function TurnstileWidget({ siteKey, onTokenChange }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const onTokenChangeRef = useRef(onTokenChange)
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorCode, setErrorCode] = useState<string | null>(null)

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange
  }, [onTokenChange])

  useEffect(() => {
    if (window.turnstile) {
      setScriptLoaded(true)
      return
    }

    const interval = window.setInterval(() => {
      if (!window.turnstile) return
      setScriptLoaded(true)
      window.clearInterval(interval)
    }, 100)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (status !== 'loading') return

    const timeout = window.setTimeout(() => {
      setStatus(currentStatus => (currentStatus === 'loading' ? 'error' : currentStatus))
      setErrorCode(currentCode => currentCode ?? 'load-timeout')
    }, 8000)

    return () => window.clearTimeout(timeout)
  }, [status])

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current || !window.turnstile) return

    let widgetId: string | null = null

    try {
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        size: 'flexible',
        theme: 'light',
        callback: token => {
          setStatus('ready')
          setErrorCode(null)
          onTokenChangeRef.current(token)
        },
        'expired-callback': () => {
          setStatus('loading')
          onTokenChangeRef.current(null)
        },
        'error-callback': errorCode => {
          setStatus('error')
          setErrorCode(errorCode ?? null)
          onTokenChangeRef.current(null)
          return true
        },
        'timeout-callback': () => {
          setStatus('error')
          setErrorCode('timeout')
          onTokenChangeRef.current(null)
        },
      })
    } catch {
      setStatus('error')
      setErrorCode('render-failed')
      onTokenChangeRef.current(null)
    }

    return () => {
      onTokenChangeRef.current(null)
      if (widgetId) window.turnstile?.remove(widgetId)
    }
  }, [scriptLoaded, siteKey])

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={() => setScriptLoaded(true)}
      />
      <div
        ref={containerRef}
        className="min-h-[65px] w-full overflow-hidden"
      />
      {status === 'error' ? (
        <div className="mt-2 rounded-md border border-[#f0b7c2] bg-[#fff1f4] px-3 py-2 text-sm text-[#a33d55]">
          Turnstile 加载失败
          {errorCode ? `（${errorCode}）` : ''}。请检查站点密钥是否允许当前域名。
        </div>
      ) : null}
    </>
  )
}
