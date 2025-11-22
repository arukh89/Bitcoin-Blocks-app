import * as React from 'react'

type TabsContextType = {
  value: string
  setValue: (v: string) => void
}

const TabsCtx = React.createContext<TabsContextType | null>(null)

export function Tabs({ defaultValue, children, className }: React.PropsWithChildren<{ defaultValue: string; className?: string }>): JSX.Element {
  const [value, setValue] = React.useState(defaultValue)
  return (
    <TabsCtx.Provider value={{ value, setValue }}>
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  )
}

export function TabsList({ children, className }: React.PropsWithChildren<{ className?: string }>): JSX.Element {
  return <div className={`flex gap-2 p-1 rounded-lg ${className || ''}`}>{children}</div>
}

export function TabsTrigger({ value, children, className }: React.PropsWithChildren<{ value: string; className?: string }>): JSX.Element {
  const ctx = React.useContext(TabsCtx)!
  const active = ctx.value === value
  return (
    <button
      type="button"
      onClick={() => ctx.setValue(value)}
      className={`px-3 py-2 rounded-md ${active ? 'bg-white/10 text-white' : 'text-gray-400'} ${className || ''}`}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: React.PropsWithChildren<{ value: string; className?: string }>): JSX.Element | null {
  const ctx = React.useContext(TabsCtx)!
  if (ctx.value !== value) return null
  return <div className={className}>{children}</div>
}
