import * as React from 'react'

export function Badge({ className, children, variant }: React.PropsWithChildren<{ className?: string; variant?: 'outline' | 'default' }>): JSX.Element {
  const base = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs'
  return <span className={`${base} ${className || ''}`}>{children}</span>
}
