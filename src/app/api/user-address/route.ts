import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS';
const NEYNAR_BASE_URL = 'https://api.neynar.com/v2/farcaster';

/**
 * Get wallet address for a Farcaster user by FID
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fid = searchParams.get('fid');

  if (!fid) {
    return NextResponse.json({ error: 'FID is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${NEYNAR_BASE_URL}/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY,
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }

    const data = await response.json();
    const user = data?.users?.[0];

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get verified ETH addresses or custody address
    const verifiedAddresses = user.verified_addresses?.eth_addresses || [];
    const custodyAddress = user.custody_address;
    
    // Prefer verified address, fallback to custody
    const walletAddress = verifiedAddresses[0] || custodyAddress;

    return NextResponse.json({
      fid: user.fid,
      username: user.username,
      walletAddress,
      verifiedAddresses,
      custodyAddress,
    });
  } catch (error: any) {
    console.error('[UserAddress] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
