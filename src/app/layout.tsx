import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { IosInstallPrompt } from '@/components/IosInstallPrompt'
import './globals.css'

const googleAnalyticsId = process.env.NEXT_PUBLIC_GA_ID ?? 'G-9QJ6WRV8EW'

export const metadata: Metadata = {
  applicationName: '纸片人女友',
  title: '纸片人女友聊天',
  description: 'AI 虚拟恋爱聊天 MVP',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: '纸片人女友',
    statusBarStyle: 'default',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/app-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#f48fa8',
  viewportFit: 'cover',
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
        <IosInstallPrompt />
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
