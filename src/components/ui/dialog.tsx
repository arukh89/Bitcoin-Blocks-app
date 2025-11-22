import * as React from 'react'

type DialogProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open = true, onOpenChange, children }: DialogProps): JSX.Element {
  React.useEffect(() => {
    onOpenChange?.(open)
  }, [open, onOpenChange])
  return <div role="dialog" aria-modal={open} className="fixed inset-0 z-50 flex items-center justify-center">{children}</div>
}

export function DialogContent({ children, className }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return (
    <div className={`relative bg-black/90 border border-white/10 rounded-xl p-4 shadow-xl ${className || ''}`}>
      {children}
    </div>
  )
}

export function DialogHeader({ children }: React.PropsWithChildren): JSX.Element {
  return <div className="mb-3">{children}</div>
}

export function DialogTitle({ children, className }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <h3 className={`text-lg font-bold ${className || ''}`}>{children}</h3>
}

export function DialogDescription({ children, className }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <p className={`text-sm text-gray-400 ${className || ''}`}>{children}</p>
}
