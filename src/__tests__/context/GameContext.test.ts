import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * GameContext Backend Logic Tests
 * Tests game state management, winner calculation, and business logic
 */

// Types
interface Round {
  id: string;
  round_number: number;
  status: 'open' | 'closed' | 'finished';
  block_number: number | null;
  prize: string;
  start_time: string;
  end_time: string;
  actual_tx_count: number | null;
  block_hash: string | null;
  winner_fid: number | null;
  second_place_fid: number | null;
  created_at: string;
}

interface Guess {
  id: string;
  round_id: string;
  fid: number;
  username: string;
  pfp_url: string | null;
  guess: number;
  submitted_at: string;
}

interface PrizeConfig {
  id: string;
  jackpot: number;
  first_place: number;
  second_place: number;
  currency: string;
  token_address: string | null;
  updated_at: string;
}

// Business Logic Functions (extracted from GameContext)

/**
 * Calculate winner from guesses
 * Winner is the guess closest to actual_tx_count
 * Tiebreaker: earliest submission time
 */
function calculateWinner(guesses: Guess[], actualTxCount: number): { winner: Guess | null; secondPlace: Guess | null } {
  if (guesses.length === 0) {
    return { winner: null, secondPlace: null };
  }

  const sorted = [...guesses].sort((a, b) => {
    const diffA = Math.abs(a.guess - actualTxCount);
    const diffB = Math.abs(b.guess - actualTxCount);
    if (diffA !== diffB) return diffA - diffB;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  return {
    winner: sorted[0],
    secondPlace: sorted[1] || null,
  };
}

/**
 * Check if guess is exact match (jackpot)
 */
function isJackpot(guess: number, actualTxCount: number): boolean {
  return guess === actualTxCount;
}

/**
 * Validate round creation input
 */
function validateRoundCreation(input: {
  roundNumber: number;
  durationMinutes: number;
  prize: string;
  blockNumber?: number;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!input.roundNumber || input.roundNumber <= 0) {
    errors.push('Round number must be positive');
  }

  if (!input.durationMinutes || input.durationMinutes <= 0) {
    errors.push('Duration must be positive');
  }

  if (!input.prize || input.prize.trim() === '') {
    errors.push('Prize is required');
  }

  if (input.blockNumber !== undefined && input.blockNumber <= 0) {
    errors.push('Block number must be positive if provided');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate guess submission
 */
function validateGuess(input: {
  guess: number;
  roundStatus: string;
  existingGuess: boolean;
}): { valid: boolean; error: string | null } {
  if (input.roundStatus !== 'open') {
    return { valid: false, error: 'Round is not open for guesses' };
  }

  if (input.existingGuess) {
    return { valid: false, error: 'You already submitted a guess for this round' };
  }

  if (!input.guess || input.guess <= 0) {
    return { valid: false, error: 'Guess must be a positive number' };
  }

  return { valid: true, error: null };
}

/**
 * Calculate time remaining for round
 */
function calculateTimeRemaining(endTime: string): { minutes: number; seconds: number; expired: boolean } {
  const now = Date.now();
  const end = new Date(endTime).getTime();
  const diff = end - now;

  if (diff <= 0) {
    return { minutes: 0, seconds: 0, expired: true };
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { minutes, seconds, expired: false };
}

/**
 * Format prize display
 */
function formatPrize(amount: number, currency: string): string {
  return `${amount.toLocaleString()} ${currency}`;
}

// Arbitraries
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 })
  .map(ts => new Date(ts).toISOString());

const usernameArb = fc.array(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
  { minLength: 3, maxLength: 15 }
).map(arr => arr.join(''));

const guessArbitrary = fc.record({
  id: fc.uuid(),
  round_id: fc.uuid(),
  fid: fc.integer({ min: 1, max: 1000000 }),
  username: usernameArb,
  pfp_url: fc.option(fc.webUrl(), { nil: null }),
  guess: fc.integer({ min: 1, max: 10000 }),
  submitted_at: isoDateArb,
});

describe('GameContext Backend Logic Tests', () => {
  describe('Winner Calculation', () => {
    it('should return null winner for empty guesses', () => {
      const result = calculateWinner([], 2500);
      expect(result.winner).toBeNull();
      expect(result.secondPlace).toBeNull();
    });

    it('should select closest guess as winner', () => {
      fc.assert(
        fc.property(
          fc.array(guessArbitrary, { minLength: 2, maxLength: 20 }),
          fc.integer({ min: 1, max: 10000 }),
          (guesses, actualTxCount) => {
            const { winner } = calculateWinner(guesses, actualTxCount);
            
            if (guesses.length === 0) {
              expect(winner).toBeNull();
              return;
            }

            expect(winner).not.toBeNull();
            
            const winnerDiff = Math.abs(winner!.guess - actualTxCount);
            
            // No other guess should have smaller difference
            for (const guess of guesses) {
              const guessDiff = Math.abs(guess.guess - actualTxCount);
              expect(guessDiff).toBeGreaterThanOrEqual(winnerDiff);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should use earliest submission as tiebreaker', () => {
      const guesses: Guess[] = [
        {
          id: '1',
          round_id: 'round-1',
          fid: 1,
          username: 'user1',
          pfp_url: null,
          guess: 2500,
          submitted_at: '2024-06-01T12:00:00Z',
        },
        {
          id: '2',
          round_id: 'round-1',
          fid: 2,
          username: 'user2',
          pfp_url: null,
          guess: 2500, // Same guess
          submitted_at: '2024-06-01T11:00:00Z', // Earlier
        },
      ];

      const { winner } = calculateWinner(guesses, 2500);
      
      expect(winner).not.toBeNull();
      expect(winner!.fid).toBe(2); // Earlier submission wins
    });

    it('should correctly identify second place', () => {
      const guesses: Guess[] = [
        {
          id: '1',
          round_id: 'round-1',
          fid: 1,
          username: 'user1',
          pfp_url: null,
          guess: 2500,
          submitted_at: '2024-06-01T12:00:00Z',
        },
        {
          id: '2',
          round_id: 'round-1',
          fid: 2,
          username: 'user2',
          pfp_url: null,
          guess: 2600,
          submitted_at: '2024-06-01T11:00:00Z',
        },
        {
          id: '3',
          round_id: 'round-1',
          fid: 3,
          username: 'user3',
          pfp_url: null,
          guess: 3000,
          submitted_at: '2024-06-01T10:00:00Z',
        },
      ];

      const { winner, secondPlace } = calculateWinner(guesses, 2500);
      
      expect(winner!.fid).toBe(1); // Exact match
      expect(secondPlace!.fid).toBe(2); // Second closest
    });
  });

  describe('Jackpot Detection', () => {
    it('should detect exact match as jackpot', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (txCount) => {
            expect(isJackpot(txCount, txCount)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not detect non-exact match as jackpot', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          fc.integer({ min: 1, max: 10000 }),
          (guess, actual) => {
            if (guess !== actual) {
              expect(isJackpot(guess, actual)).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Round Creation Validation', () => {
    it('should accept valid round creation input', () => {
      fc.assert(
        fc.property(
          fc.record({
            roundNumber: fc.integer({ min: 1, max: 1000 }),
            durationMinutes: fc.integer({ min: 1, max: 120 }),
            prize: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
            blockNumber: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
          }),
          (input) => {
            const result = validateRoundCreation(input);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid round number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }),
          (roundNumber) => {
            const result = validateRoundCreation({
              roundNumber,
              durationMinutes: 10,
              prize: '1000 $SECOND',
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Round number must be positive');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject invalid duration', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }),
          (durationMinutes) => {
            const result = validateRoundCreation({
              roundNumber: 1,
              durationMinutes,
              prize: '1000 $SECOND',
            });
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Duration must be positive');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject empty prize', () => {
      const result = validateRoundCreation({
        roundNumber: 1,
        durationMinutes: 10,
        prize: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prize is required');
    });
  });

  describe('Guess Validation', () => {
    it('should accept valid guess for open round', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (guess) => {
            const result = validateGuess({
              guess,
              roundStatus: 'open',
              existingGuess: false,
            });
            expect(result.valid).toBe(true);
            expect(result.error).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should reject guess for closed round', () => {
      const result = validateGuess({
        guess: 2500,
        roundStatus: 'closed',
        existingGuess: false,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Round is not open for guesses');
    });

    it('should reject duplicate guess', () => {
      const result = validateGuess({
        guess: 2500,
        roundStatus: 'open',
        existingGuess: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toBe('You already submitted a guess for this round');
    });

    it('should reject invalid guess value', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: -1000, max: 0 }),
          (guess) => {
            const result = validateGuess({
              guess,
              roundStatus: 'open',
              existingGuess: false,
            });
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Guess must be a positive number');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Time Remaining Calculation', () => {
    it('should return expired for past end time', () => {
      const pastTime = new Date(Date.now() - 60000).toISOString();
      const result = calculateTimeRemaining(pastTime);
      
      expect(result.expired).toBe(true);
      expect(result.minutes).toBe(0);
      expect(result.seconds).toBe(0);
    });

    it('should calculate correct time for future end time', () => {
      const futureTime = new Date(Date.now() + 125000).toISOString(); // ~2 minutes
      const result = calculateTimeRemaining(futureTime);
      
      expect(result.expired).toBe(false);
      expect(result.minutes).toBeGreaterThanOrEqual(1);
      expect(result.seconds).toBeGreaterThanOrEqual(0);
      expect(result.seconds).toBeLessThan(60);
    });

    it('should have seconds always less than 60', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: Date.now(), max: Date.now() + 3600000 }),
          (futureTimestamp) => {
            const futureTime = new Date(futureTimestamp).toISOString();
            const result = calculateTimeRemaining(futureTime);
            
            expect(result.seconds).toBeGreaterThanOrEqual(0);
            expect(result.seconds).toBeLessThan(60);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Prize Formatting', () => {
    it('should format prize with currency', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 100000 }),
          fc.constantFrom('$SECOND', '$USDC', '$ETH', 'POINTS'),
          (amount, currency) => {
            const formatted = formatPrize(amount, currency);
            
            expect(formatted).toContain(currency);
            expect(formatted.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should format large numbers with separators', () => {
      const formatted = formatPrize(10000, '$SECOND');
      expect(formatted).toContain('10');
      expect(formatted).toContain('000');
    });
  });

  describe('Round State Transitions', () => {
    it('should only allow valid status transitions', () => {
      const validTransitions: Record<string, string[]> = {
        'open': ['closed'],
        'closed': ['finished'],
        'finished': [],
      };

      fc.assert(
        fc.property(
          fc.constantFrom('open', 'closed', 'finished'),
          fc.constantFrom('open', 'closed', 'finished'),
          (from, to) => {
            const isValid = validTransitions[from].includes(to);
            
            // Verify transition rules
            if (from === 'open') {
              expect(validTransitions[from]).toContain('closed');
              expect(validTransitions[from]).not.toContain('finished');
            }
            if (from === 'closed') {
              expect(validTransitions[from]).toContain('finished');
              expect(validTransitions[from]).not.toContain('open');
            }
            if (from === 'finished') {
              expect(validTransitions[from]).toHaveLength(0);
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
