import * as React from 'react'

export function Label({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <label className={`block text-sm font-medium ${className || ''}`}>{children}</label>
}
