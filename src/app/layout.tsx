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
  const APP_URL = 'https://bitcoin-blocks-app.vercel.app'
  const FRAME_IMAGE_URL = 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_9f60f0c6-c9ab-41f5-a2d9-6234f1e9deea-58nnKDHo0Kl3GHSEKKjUNW1xfgwbxR'
  const SPLASH_IMAGE_URL = 'https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg'

  return {
    title: 'Bitcoin Blocks',
    description:
      "Predict Bitcoin transactions & compete! Login, guess, and win by forecasting the next block's transaction count. Real-time updates and leaderboard powered by SpacetimeDB.",
    other: {
      // Mini App Embed (current)
      'fc:miniapp': JSON.stringify({
        version: '1',
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
      // Backward compatibility for older clients still reading fc:frame
      'fc:frame': JSON.stringify({
        version: '1',
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
