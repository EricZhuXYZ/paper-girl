'use client'

import { useEffect } from 'react'

export default function OAuthPopupCompletePage() {
  useEffect(() => {
    window.opener?.postMessage(
      { type: 'paper-girl:google-oauth-complete' },
      window.location.origin
    )
    window.close()
  }, [])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fff7f9] px-6 text-center">
      <div>
        <p className="text-base font-medium text-[#241b20]">登录成功</p>
        <p className="mt-2 text-sm text-[#8b596a]">正在返回纸片人女友聊天...</p>
      </div>
    </main>
  )
}
