import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/app/providers'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased font-sans`}>
        <Providers>
          {children}
          <Toaster richColors position="top-center" />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  title: 'Bitcoin Blocks',
  description: 'Predict Bitcoin transactions & compete! Login, guess, and win by forecasting the next block\'s transaction count. Real-time updates and leaderboard powered by Supabase. Join the battle!',
  other: {
    'fc:miniapp': JSON.stringify({
      version: '1',
      name: process.env.NEXT_PUBLIC_MINIAPP_NAME || 'Bitcoin Blocks',
      url: process.env.NEXT_PUBLIC_MINIAPP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      splashImageUrl: process.env.NEXT_PUBLIC_MINIAPP_SPLASH_IMAGE_URL || '',
      splashBackgroundColor: process.env.NEXT_PUBLIC_MINIAPP_SPLASH_BG || '#ffffff'
    })
  }
}
