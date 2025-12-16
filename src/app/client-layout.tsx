'use client'

import dynamic from 'next/dynamic'
import { Toaster } from '@/components/ui/sonner'

const Providers = dynamic(() => import('./providers').then(m => m.Providers), { ssr: false })

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      {children}
      <Toaster richColors position="top-center" />
    </Providers>
  )
}
