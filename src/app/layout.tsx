import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const metadata: Metadata = {
  title: 'Bitcoin Blocks - Predict & Win',
  description: 'Predict Bitcoin block transactions and win prizes!',
  icons: {
    icon: `${baseUrl}/icon.png`,
  },
  openGraph: {
    title: 'Bitcoin Blocks',
    description: 'Predict Bitcoin block transactions and win prizes!',
    url: baseUrl,
    siteName: 'Bitcoin Blocks',
    images: [`${baseUrl}/og-image.png`],
    type: 'website',
  },
  other: {
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: `${baseUrl}/og-image.png`,
      button: {
        title: 'Play Now',
        action: {
          type: 'launch_frame',
          name: 'Bitcoin Blocks',
          url: baseUrl,
          splashImageUrl: `${baseUrl}/splash.png`,
          splashBackgroundColor: '#1a1a2e',
        },
      },
    }),
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
