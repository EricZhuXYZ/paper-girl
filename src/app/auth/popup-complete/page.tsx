'use client'

import { useEffect } from 'react'

export default function OAuthPopupCompletePage() {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.location.replace('/')
      window.setTimeout(() => {
        window.close()
      }, 100)
      return
    }

    window.location.replace('/')
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7f9] px-6 text-center">
      <div>
        <p className="text-base font-medium text-[#241b20]">登录成功</p>
        <p className="mt-2 text-sm text-[#8b596a]">正在进入人物选择页...</p>
      </div>
    </main>
  )
}
