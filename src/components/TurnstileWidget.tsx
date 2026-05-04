'use client'

import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'

type TurnstileRenderOptions = {
  sitekey: string
  callback: (token: string) => void
  'expired-callback': () => void
  'error-callback': (errorCode?: string) => boolean
  'timeout-callback': () => void
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
    if (window.turnstile) setScriptLoaded(true)
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

    const widgetId = window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
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

    return () => {
      onTokenChangeRef.current(null)
      window.turnstile?.remove(widgetId)
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
        className="min-h-[65px] overflow-hidden rounded-md border border-[#e6cbd4] bg-white px-3 py-2"
      />
      {status === 'loading' ? (
        <div className="mt-2 text-sm text-[#8b596a]">正在加载人机验证...</div>
      ) : null}
      {status === 'error' ? (
        <div className="mt-2 rounded-md border border-[#f0b7c2] bg-[#fff1f4] px-3 py-2 text-sm text-[#a33d55]">
          Turnstile 加载失败
          {errorCode ? `（${errorCode}）` : ''}。请检查站点密钥是否允许当前域名。
        </div>
      ) : null}
    </>
  )
}
