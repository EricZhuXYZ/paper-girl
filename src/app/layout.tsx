import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID ?? 'G-9QJ6WRV8EW'

export const metadata: Metadata = {
  title: '纸片人女友聊天',
  description: 'AI 虚拟恋爱聊天 MVP',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${googleAnalyticsId}');
          `}
        </Script>
      </body>
    </html>
  )
}
