export async function recentBlocks(): Promise<Array<{ height: number; hash: string }>> {
  const res = await fetch('/api/mempool?action=recent-blocks')
  if (!res.ok) throw new Error('Failed to fetch recent blocks')
  return res.json()
}

export async function blockByHeight(height: number): Promise<{ blockHash: string; txCount?: number }> {
  const res = await fetch(`/api/mempool?action=block-by-height&height=${height}`)
  if (!res.ok) throw new Error(`Block #${height} not found yet. Try again later.`)
  return res.json()
}

export async function txCountByHash(blockHash: string): Promise<number> {
  const res = await fetch(`/api/mempool?action=tx-count&blockHash=${blockHash}`)
  if (!res.ok) throw new Error('Failed to fetch transaction count')
  const data = await res.json() as { txCount: number }
  return data.txCount
}
