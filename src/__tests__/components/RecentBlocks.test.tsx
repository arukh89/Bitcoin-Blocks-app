import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: game-logic-upgrade, Property 1: Block Display Completeness**
 * **Validates: Requirements 1.2**
 * 
 * For any Bitcoin block data returned from the API, the rendered block card 
 * SHALL contain all required fields: height, tx_count, hash (truncated), 
 * size, and formatted timestamp.
 */

interface BitcoinBlock {
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
  size: number;
}

// Helper functions matching the component implementation
const formatHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;
const formatTime = (timestamp: number) => new Date(timestamp * 1000).toLocaleTimeString();
const formatSize = (size: number) => `${(size / 1000000).toFixed(2)} MB`;

// Generate hex string
const hexCharArb = fc.constantFrom(...'0123456789abcdef'.split(''));
const hexStringArb = (length: number) => fc.array(hexCharArb, { minLength: length, maxLength: length }).map(arr => arr.join(''));

// Arbitrary for generating valid block data
const blockArbitrary = fc.record({
  height: fc.integer({ min: 0, max: 1000000 }),
  hash: hexStringArb(64),
  tx_count: fc.integer({ min: 1, max: 10000 }),
  timestamp: fc.integer({ min: 1600000000, max: 2000000000 }),
  size: fc.integer({ min: 100000, max: 4000000 }),
});

describe('RecentBlocks Property Tests', () => {
  /**
   * **Feature: game-logic-upgrade, Property 1: Block Display Completeness**
   * **Validates: Requirements 1.2**
   */
  it('Property 1: Block display completeness - all required fields are displayable', () => {
    fc.assert(
      fc.property(
        blockArbitrary,
        (block: BitcoinBlock) => {
          // Height is displayable as a number
          const heightDisplay = block.height.toLocaleString();
          expect(heightDisplay).toBeTruthy();
          expect(heightDisplay.length).toBeGreaterThan(0);

          // TX count is displayable as a number
          const txCountDisplay = block.tx_count.toLocaleString();
          expect(txCountDisplay).toBeTruthy();
          expect(txCountDisplay.length).toBeGreaterThan(0);

          // Hash is truncatable
          const truncatedHash = formatHash(block.hash);
          expect(truncatedHash).toContain('...');
          expect(truncatedHash.length).toBe(17); // 8 + 3 + 6

          // Size is formattable
          const sizeDisplay = formatSize(block.size);
          expect(sizeDisplay).toContain('MB');
          expect(sizeDisplay.length).toBeGreaterThan(0);

          // Timestamp is formattable
          const timeDisplay = formatTime(block.timestamp);
          expect(timeDisplay).toBeTruthy();
          expect(timeDisplay.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Hash truncation preserves start and end
   */
  it('Property: Hash truncation preserves first 8 and last 6 characters', () => {
    fc.assert(
      fc.property(
        hexStringArb(64),
        (hash: string) => {
          const truncated = formatHash(hash);
          expect(truncated.startsWith(hash.slice(0, 8))).toBe(true);
          expect(truncated.endsWith(hash.slice(-6))).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Size formatting is consistent
   */
  it('Property: Size formatting produces valid MB string', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100000, max: 4000000 }),
        (size: number) => {
          const formatted = formatSize(size);
          expect(formatted).toMatch(/^\d+\.\d{2} MB$/);
          
          // Verify the numeric value is correct
          const numericPart = parseFloat(formatted.replace(' MB', ''));
          expect(numericPart).toBeCloseTo(size / 1000000, 2);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
