import * as React from 'react'

export function Avatar({ className, children }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`inline-flex items-center justify-center rounded-full overflow-hidden bg-gray-800 ${className || ''}`}>{children}</div>
}

export function AvatarImage({ src, alt }: { src?: string; alt?: string }): JSX.Element {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src || ''} alt={alt || ''} className="h-full w-full object-cover" />
}

export function AvatarFallback({ children, className }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`h-full w-full flex items-center justify-center ${className || ''}`}>{children}</div>
}
