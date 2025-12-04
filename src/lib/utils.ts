import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs))
}

// Numeric conversion utilities for consistent bigint/number handling
export function toSafeNumber(val: bigint): number {
  return Number(val)
}

export function toBigInt(val: number | string | bigint): bigint {
  return typeof val === 'bigint' ? val : BigInt(val)
}

// Validate round timing and overlapping rounds
export type RoundLike = { status: 'open' | 'closed' | 'finished'; startTime: number; endTime: number }
export function validateRoundTiming(start: number, end: number, rounds: RoundLike[]) {
  if (end <= start) {
    throw new Error('End time must be after start time')
  }
  const hasOverlap = rounds.some(r =>
    r.status === 'open' &&
    ((start >= r.startTime && start < r.endTime) ||
      (end > r.startTime && end <= r.endTime) ||
      (start <= r.startTime && end >= r.endTime))
  )
  if (hasOverlap) {
    throw new Error('Round overlaps with existing round')
  }
}
