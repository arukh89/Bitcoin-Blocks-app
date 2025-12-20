import { NextRequest, NextResponse } from 'next/server';

// Primary and fallback API endpoints
const MEMPOOL_API = process.env.MEMPOOL_API_BASE || 'https://mempool.space/api';
const BLOCKSTREAM_API = 'https://blockstream.info/api';
const MAX_RETRIES = 2;
const INITIAL_BACKOFF_MS = 500;
const TIMEOUT_MS = 15000;

interface BitcoinBlock {
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
  size: number;
}

interface MempoolInfo {
  count: number;
  vsize: number;
  total_fee: number;
}

interface FeeEstimates {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(url: string, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch with retry and fallback to blockstream
 */
async function fetchWithFallback(
  mempoolPath: string,
  blockstreamPath?: string
): Promise<Response> {
  let lastError: Error | null = null;

  // Try mempool.space first
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetchWithTimeout(`${MEMPOOL_API}${mempoolPath}`);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error: any) {
      lastError = error;
      console.log(`[Mempool API] Attempt ${attempt + 1}/${MAX_RETRIES} failed:`, error.message);
    }

    if (attempt < MAX_RETRIES - 1) {
      await new Promise((r) => setTimeout(r, INITIAL_BACKOFF_MS * Math.pow(2, attempt)));
    }
  }

  // Fallback to blockstream if path provided
  if (blockstreamPath) {
    console.log('[Mempool API] Trying blockstream fallback...');
    try {
      const response = await fetchWithTimeout(`${BLOCKSTREAM_API}${blockstreamPath}`);
      if (response.ok) return response;
    } catch (error: any) {
      console.log('[Mempool API] Blockstream fallback failed:', error.message);
    }
  }

  throw lastError || new Error('All API attempts failed');
}

/**
 * Get recent blocks
 */
async function getRecentBlocks(): Promise<BitcoinBlock[]> {
  const response = await fetchWithFallback('/blocks', '/blocks');
  const blocks = await response.json();

  return blocks.slice(0, 10).map((block: any) => ({
    height: block.height,
    hash: block.id,
    tx_count: block.tx_count,
    timestamp: block.timestamp,
    size: block.size,
  }));
}

/**
 * Get block by height
 */
async function getBlockByHeight(height: number): Promise<BitcoinBlock> {
  // Get block hash from height
  const hashResponse = await fetchWithFallback(
    `/block-height/${height}`,
    `/block-height/${height}`
  );
  const blockHash = await hashResponse.text();

  // Get block details
  const blockResponse = await fetchWithFallback(`/block/${blockHash}`, `/block/${blockHash}`);
  const blockData = await blockResponse.json();

  return {
    height: blockData.height,
    hash: blockData.id,
    tx_count: blockData.tx_count,
    timestamp: blockData.timestamp,
    size: blockData.size,
  };
}

/**
 * Get block at timestamp (closest block)
 */
async function getBlockAtTimestamp(timestamp: number): Promise<BitcoinBlock> {
  const response = await fetchWithFallback('/blocks', '/blocks');
  const blocks = await response.json();

  let closestBlock = blocks[0];
  let minDiff = Math.abs(blocks[0].timestamp - timestamp);

  for (const block of blocks) {
    const diff = Math.abs(block.timestamp - timestamp);
    if (diff < minDiff) {
      minDiff = diff;
      closestBlock = block;
    }
  }

  return {
    height: closestBlock.height,
    hash: closestBlock.id,
    tx_count: closestBlock.tx_count,
    timestamp: closestBlock.timestamp,
    size: closestBlock.size,
  };
}

/**
 * Get mempool statistics (mempool.space only)
 */
async function getMempoolStats(): Promise<MempoolInfo> {
  const response = await fetchWithFallback('/mempool');
  const data = await response.json();

  return {
    count: data.count,
    vsize: data.vsize,
    total_fee: data.total_fee,
  };
}

/**
 * Get fee estimates (mempool.space only)
 */
async function getFeeEstimates(): Promise<FeeEstimates> {
  const response = await fetchWithFallback('/v1/fees/recommended');
  const data = await response.json();

  return {
    fastestFee: data.fastestFee,
    halfHourFee: data.halfHourFee,
    hourFee: data.hourFee,
    economyFee: data.economyFee,
    minimumFee: data.minimumFee,
  };
}

/**
 * Get all stats combined (for BitcoinStats component)
 */
async function getAllStats() {
  // Fetch blocks first (has fallback)
  let latestBlock = null;
  try {
    const blocks = await getRecentBlocks();
    latestBlock = blocks[0] || null;
  } catch (e) {
    console.log('[Mempool API] Failed to get blocks');
  }

  // Try mempool stats (no fallback)
  let mempool = null;
  try {
    mempool = await getMempoolStats();
  } catch (e) {
    console.log('[Mempool API] Failed to get mempool stats');
  }

  // Try fee estimates (no fallback)
  let fees = null;
  try {
    fees = await getFeeEstimates();
  } catch (e) {
    console.log('[Mempool API] Failed to get fee estimates');
  }

  return { latestBlock, mempool, fees };
}

/**
 * API Route to fetch Bitcoin block data
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'recent-blocks') {
      const blocks = await getRecentBlocks();
      return NextResponse.json(blocks);
    }

    if (action === 'block-by-height') {
      const height = searchParams.get('height');
      if (!height) {
        return NextResponse.json({ error: 'Height parameter is required' }, { status: 400 });
      }
      const block = await getBlockByHeight(parseInt(height));
      return NextResponse.json(block);
    }

    if (action === 'block-at-time') {
      const timestamp = searchParams.get('timestamp');
      if (!timestamp) {
        return NextResponse.json({ error: 'Timestamp parameter is required' }, { status: 400 });
      }
      const block = await getBlockAtTimestamp(parseInt(timestamp));
      return NextResponse.json(block);
    }

    if (action === 'mempool-stats') {
      const stats = await getMempoolStats();
      return NextResponse.json(stats);
    }

    if (action === 'fee-estimates') {
      const fees = await getFeeEstimates();
      return NextResponse.json(fees);
    }

    if (action === 'all-stats') {
      const stats = await getAllStats();
      return NextResponse.json(stats);
    }

    // Legacy API
    const blockHeight = searchParams.get('block');
    if (blockHeight) {
      const block = await getBlockByHeight(parseInt(blockHeight));
      return NextResponse.json(block);
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('[Mempool API] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch block data', retried: true },
      { status: 503 }
    );
  }
}
