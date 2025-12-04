"use client"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold">Something went wrong!</h2>
        <p className="text-sm opacity-70">{error?.message || 'Unexpected error'}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
