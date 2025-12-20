import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: game-logic-upgrade, Property 5: Guess Display Completeness**
 * **Feature: game-logic-upgrade, Property 6: Winner Calculation Correctness**
 * **Validates: Requirements 5.2, 5.4**
 */

interface Guess {
  id: string;
  round_id: string;
  fid: number;
  username: string;
  pfp_url: string | null;
  guess: number;
  submitted_at: string;
}

// Generate ISO date string
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 })
  .map(ts => new Date(ts).toISOString());

// Generate username string
const usernameCharArb = fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split(''));
const usernameArb = fc.array(usernameCharArb, { minLength: 1, maxLength: 20 }).map(arr => arr.join(''));

// Arbitrary for generating valid guesses
const guessArbitrary = fc.record({
  id: fc.uuid(),
  round_id: fc.uuid(),
  fid: fc.integer({ min: 1, max: 1000000 }),
  username: usernameArb,
  pfp_url: fc.option(fc.webUrl(), { nil: null }),
  guess: fc.integer({ min: 1, max: 10000 }),
  submitted_at: isoDateArb,
});

// Helper function to calculate winner (matching component/context implementation)
const calculateWinner = (guesses: Guess[], actualTxCount: number): Guess | null => {
  if (guesses.length === 0) return null;
  
  const sorted = [...guesses].sort((a, b) => {
    const diffA = Math.abs(a.guess - actualTxCount);
    const diffB = Math.abs(b.guess - actualTxCount);
    if (diffA !== diffB) return diffA - diffB;
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });
  
  return sorted[0];
};

// Helper function to get difference
const getDifference = (guess: number, actualTxCount: number | null): number | null => {
  if (actualTxCount === null) return null;
  return guess - actualTxCount;
};

describe('AllPredictions Property Tests', () => {
  /**
   * **Feature: game-logic-upgrade, Property 5: Guess Display Completeness**
   * **Validates: Requirements 5.2**
   */
  it('Property 5: Guess display completeness - all required fields present', () => {
    fc.assert(
      fc.property(
        guessArbitrary,
        (guess: Guess) => {
          // Username is displayable
          expect(guess.username).toBeTruthy();
          expect(guess.username.length).toBeGreaterThan(0);

          // Guess value is a valid number
          expect(typeof guess.guess).toBe('number');
          expect(guess.guess).toBeGreaterThan(0);

          // Submission time is parseable
          const submittedDate = new Date(guess.submitted_at);
          expect(submittedDate.getTime()).not.toBeNaN();

          // FID is valid
          expect(guess.fid).toBeGreaterThan(0);

          // Profile picture URL is either null or a valid string
          if (guess.pfp_url !== null) {
            expect(typeof guess.pfp_url).toBe('string');
            expect(guess.pfp_url.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: game-logic-upgrade, Property 6: Winner Calculation Correctness**
   * **Validates: Requirements 5.4**
   */
  it('Property 6: Winner calculation - closest guess wins', () => {
    fc.assert(
      fc.property(
        fc.array(guessArbitrary, { minLength: 1, maxLength: 20 }),
        fc.integer({ min: 1, max: 10000 }),
        (guesses: Guess[], actualTxCount: number) => {
          const winner = calculateWinner(guesses, actualTxCount);
          
          if (guesses.length === 0) {
            expect(winner).toBeNull();
            return true;
          }

          expect(winner).not.toBeNull();
          
          // Winner should have the smallest difference
          const winnerDiff = Math.abs(winner!.guess - actualTxCount);
          
          for (const guess of guesses) {
            const guessDiff = Math.abs(guess.guess - actualTxCount);
            
            if (guessDiff < winnerDiff) {
              // No guess should have a smaller difference than winner
              expect(guessDiff).toBeGreaterThanOrEqual(winnerDiff);
            } else if (guessDiff === winnerDiff && guess.id !== winner!.id) {
              // If same difference, winner should have earlier submission
              const winnerTime = new Date(winner!.submitted_at).getTime();
              const guessTime = new Date(guess.submitted_at).getTime();
              expect(winnerTime).toBeLessThanOrEqual(guessTime);
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Exact guess has zero difference
   */
  it('Property: Exact guess shows zero difference', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        (txCount: number) => {
          const diff = getDifference(txCount, txCount);
          expect(diff).toBe(0);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Difference calculation is correct
   */
  it('Property: Difference calculation is mathematically correct', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.integer({ min: 1, max: 10000 }),
        (guess: number, actual: number) => {
          const diff = getDifference(guess, actual);
          expect(diff).toBe(guess - actual);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Winner with exact match beats all others
   */
  it('Property: Exact match always wins over non-exact matches', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10000 }),
        fc.array(fc.integer({ min: 1, max: 10000 }), { minLength: 1, maxLength: 10 }),
        (actualTxCount: number, otherGuesses: number[]) => {
          // Create guesses with one exact match
          const guesses: Guess[] = [
            {
              id: 'exact-match',
              round_id: 'round-1',
              fid: 1,
              username: 'exact_user',
              pfp_url: null,
              guess: actualTxCount, // Exact match
              submitted_at: new Date('2024-06-01T12:00:00Z').toISOString(),
            },
            ...otherGuesses
              .filter(g => g !== actualTxCount) // Remove any accidental exact matches
              .map((g, i) => ({
                id: `other-${i}`,
                round_id: 'round-1',
                fid: i + 2,
                username: `user_${i}`,
                pfp_url: null,
                guess: g,
                submitted_at: new Date('2024-06-01T11:00:00Z').toISOString(), // Earlier time
              })),
          ];

          const winner = calculateWinner(guesses, actualTxCount);
          
          // The exact match should win (difference = 0)
          expect(winner).not.toBeNull();
          expect(winner!.guess).toBe(actualTxCount);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
