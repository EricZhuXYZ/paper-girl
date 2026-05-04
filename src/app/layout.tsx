import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '纸片人女友聊天',
  description: 'AI 虚拟恋爱聊天 MVP',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
