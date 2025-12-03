export interface GuessEntry {
  fid?: bigint
  address?: string
  username?: string
  guess: bigint
  submittedAt: bigint
}

export function calculateWinners(
  guesses: GuessEntry[],
  actualTxCount: bigint
): GuessEntry[] {
  return [...guesses].sort((a, b) => {
    const da = a.guess > actualTxCount ? a.guess - actualTxCount : actualTxCount - a.guess
    const db = b.guess > actualTxCount ? b.guess - actualTxCount : actualTxCount - b.guess
    if (da !== db) return Number(da - db)
    return Number(a.submittedAt - b.submittedAt)
  })
}

export function getWinner(
  guesses: GuessEntry[],
  actualTxCount: bigint,
  position: 1 | 2 | 'jackpot'
): GuessEntry | null {
  const sorted = calculateWinners(guesses, actualTxCount)
  if (position === 1) return sorted[0] || null
  if (position === 2) return sorted[1] || null
  if (position === 'jackpot') {
    const first = sorted[0]
    return first && first.guess === actualTxCount ? first : null
  }
  return null
}
