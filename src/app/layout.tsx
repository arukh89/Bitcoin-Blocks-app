import type { Metadata } from 'next'
export const dynamic = 'force-dynamic'
import { Inter } from 'next/font/google'
import NextDynamic from 'next/dynamic'
import './globals.css'
const Providers = NextDynamic(() => import('@/app/providers').then(m => m.Providers), { ssr: false })
import FarcasterWrapper from '@/components/FarcasterWrapper'
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
          <FarcasterWrapper>
            {children}
          </FarcasterWrapper>
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
    'fc:frame': JSON.stringify({
      'version': 'next',
      'imageUrl': 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_cmgifd2dg000204jp98x53ays-p9n6Mjcrk6gppFNpz3AczxHR2Yz5kR',
      'button': {
        'title': 'Launch Bitcoin Blocks',
        'action': {
          'type': 'launch_frame',
          'name': 'Bitcoin Blocks',
          'url': 'https://bitcoin-blocks-app.vercel.app',
          'splashImageUrl': 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg',
          'splashBackgroundColor': '#ffffff'
        }
      }
    }) 
  }
}
