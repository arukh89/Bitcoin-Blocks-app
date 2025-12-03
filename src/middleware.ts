import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Protect /admin route
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const siweSession = request.cookies.get('siwe_session')?.value
    const neynarSession = request.cookies.get('neynar_session')?.value
    
    if (!siweSession && !neynarSession) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
    
    try {
      // Parse session
      let address: string | null = null
      let fid: number | null = null
      
      if (siweSession) {
        const session = JSON.parse(siweSession)
        address = session.address
      }
      
      if (neynarSession) {
        const session = JSON.parse(neynarSession)
        fid = session.fid
      }
      
      // Check admin
      const adminFids = process.env.NEXT_PUBLIC_ADMIN_FIDS?.split(',').map(Number) || []
      const adminWallets = process.env.NEXT_PUBLIC_ADMIN_WALLETS?.split(',').map(s => s.toLowerCase()) || []
      
      const isAdmin = (fid && adminFids.includes(fid)) || 
                     (address && adminWallets.includes(address.toLowerCase()))
      
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
      }
    } catch (error) {
      console.error('Middleware auth check failed:', error)
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}
