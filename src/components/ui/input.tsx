import * as React from 'react'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref
) {
  return (
    <input
      ref={ref}
      className={`w-full rounded-md border border-white/10 bg-black/30 text-white px-3 py-2 outline-none focus:border-white/30 ${className || ''}`}
      {...props}
    />
  )
})
