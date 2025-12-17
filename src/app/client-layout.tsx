'use client'

import dynamic from 'next/dynamic'
import { Toaster } from '@/components/ui/sonner'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const Providers = dynamic(() => import('./providers').then(m => m.Providers), { ssr: false })

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Providers>
        {children}
        <Toaster richColors position="top-center" />
      </Providers>
    </ErrorBoundary>
  )
}
