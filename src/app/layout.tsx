export const dynamic = 'force-dynamic'
import { Inter } from 'next/font/google'
import './globals.css'
import NextDynamic from 'next/dynamic'
const Providers = NextDynamic(() => import('./providers').then(m => m.Providers), { ssr: false })
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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

export async function generateMetadata() {
  const APP_URL = process.env.NEXT_PUBLIC_APP_URL
  const FRAME_IMAGE_URL = process.env.NEXT_PUBLIC_FRAME_IMAGE_URL
  const SPLASH_IMAGE_URL = process.env.NEXT_PUBLIC_SPLASH_IMAGE_URL

  if (!APP_URL) throw new Error('Missing env: NEXT_PUBLIC_APP_URL')
  if (!FRAME_IMAGE_URL) throw new Error('Missing env: NEXT_PUBLIC_FRAME_IMAGE_URL')
  if (!SPLASH_IMAGE_URL) throw new Error('Missing env: NEXT_PUBLIC_SPLASH_IMAGE_URL')

  return {
    title: 'Bitcoin Blocks',
    description:
      "Predict Bitcoin transactions & compete! Login, guess, and win by forecasting the next block's transaction count. Real-time updates and leaderboard powered by SpacetimeDB.",
    other: {
      'fc:frame': JSON.stringify({
        version: 'next',
        imageUrl: FRAME_IMAGE_URL,
        button: {
          title: 'Launch Bitcoin Blocks',
          action: {
            type: 'launch_frame',
            name: 'Bitcoin Blocks',
            url: APP_URL,
            splashImageUrl: SPLASH_IMAGE_URL,
            splashBackgroundColor: '#ffffff',
          },
        },
      }),
    },
  }
}
