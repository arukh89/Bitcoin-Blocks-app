import { NextRequest, NextResponse } from 'next/server';

/**
 * API Route to fetch Bitcoin block data from mempool.space
 * GET /api/mempool?block=875420
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const blockHeight = searchParams.get('block');

  if (!blockHeight) {
    return NextResponse.json({ error: 'Block height is required' }, { status: 400 });
  }

  try {
    // First, get block hash from height
    const hashResponse = await fetch(
      `https://mempool.space/api/block-height/${blockHeight}`,
      { next: { revalidate: 60 } } // Cache for 60 seconds
    );

    if (!hashResponse.ok) {
      return NextResponse.json(
        { error: `Block #${blockHeight} not found` },
        { status: 404 }
      );
    }

    const blockHash = await hashResponse.text();

    // Then, get block details
    const blockResponse = await fetch(
      `https://mempool.space/api/block/${blockHash}`,
      { next: { revalidate: 60 } }
    );

    if (!blockResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch block details' },
        { status: 500 }
      );
    }

    const blockData = await blockResponse.json();

    return NextResponse.json({
      height: blockData.height,
      hash: blockData.id,
      tx_count: blockData.tx_count,
      timestamp: blockData.timestamp,
      size: blockData.size,
      weight: blockData.weight,
    });
  } catch (error: any) {
    console.error('[Mempool API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch block data' },
      { status: 500 }
    );
  }
}
