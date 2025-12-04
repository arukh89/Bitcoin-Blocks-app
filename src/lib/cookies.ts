export type CookieOptions = {
  httpOnly?: boolean
  sameSite?: 'lax' | 'strict' | 'none'
  secure?: boolean
  path?: string
  maxAge?: number
}

export function secureCookie(): boolean {
  return (
    process.env.NODE_ENV === 'production' ||
    (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false)
  )
}

export function baseCookieOptions(opts?: Partial<CookieOptions>): CookieOptions {
  const secure = secureCookie()
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    ...opts,
  }
}
