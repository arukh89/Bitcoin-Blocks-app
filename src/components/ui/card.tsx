import * as React from 'react'

export function Card({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`rounded-xl border border-white/10 bg-black/30 backdrop-blur ${className || ''}`}>{children}</div>
}
export function CardHeader({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`px-4 py-3 ${className || ''}`}>{children}</div>
}
export function CardTitle({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <h3 className={`text-lg font-semibold ${className || ''}`}>{children}</h3>
}
export function CardContent({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`px-4 py-3 ${className || ''}`}>{children}</div>
}
