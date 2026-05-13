'use client'

import { Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'

const dismissedKey = 'paper-girl-ios-install-dismissed'

function isIosBrowser() {
  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform
  const maxTouchPoints = window.navigator.maxTouchPoints

  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

function isStandaloneMode() {
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean }

  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

function hasDismissedPrompt() {
  try {
    return window.localStorage.getItem(dismissedKey) === 'true'
  } catch {
    return false
  }
}

function dismissPrompt() {
  try {
    window.localStorage.setItem(dismissedKey, 'true')
  } catch {
    // Ignore storage failures in private browsing or restricted environments.
  }
}

export function IosInstallPrompt() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!isIosBrowser() || isStandaloneMode() || hasDismissedPrompt()) {
      return
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true)
    }, 1600)

    return () => window.clearTimeout(timer)
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <div className="fixed inset-x-3 bottom-4 z-50 mx-auto max-w-[420px] rounded-lg border border-[#efd3dc] bg-white/95 p-4 text-[#241b20] shadow-[0_18px_50px_rgba(69,34,48,0.18)] backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#fff0f4] text-[#bd5b79]">
          <Share className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">添加到主屏幕</p>
          <p className="mt-1 text-sm leading-5 text-[#6f5360]">
            点击浏览器的分享按钮，选择“添加到主屏幕”，下次可以像 App 一样打开。
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            dismissPrompt()
            setIsVisible(false)
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8b596a] transition hover:bg-[#f7eef2] hover:text-[#241b20]"
          aria-label="关闭添加到主屏幕提示"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
