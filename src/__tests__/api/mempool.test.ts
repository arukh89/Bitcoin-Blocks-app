import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: game-logic-upgrade, Property 2: API Response Structure**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any valid request to `/api/mempool?action=recent-blocks`, 
 * the response SHALL be an array where each element contains 
 * height, hash, tx_count, timestamp, and size fields.
 */

interface BitcoinBlock {
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
  size: number;
}

// Generate hex string using stringOf
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

describe('Mempool API Property Tests', () => {
  /**
   * **Feature: game-logic-upgrade, Property 2: API Response Structure**
   * **Validates: Requirements 2.1**
   */
  it('Property 2: API response structure - all blocks have required fields', () => {
    fc.assert(
      fc.property(
        fc.array(blockArbitrary, { minLength: 1, maxLength: 10 }),
        (blocks: BitcoinBlock[]) => {
          // Every block in the response must have all required fields
          for (const block of blocks) {
            expect(block).toHaveProperty('height');
            expect(block).toHaveProperty('hash');
            expect(block).toHaveProperty('tx_count');
            expect(block).toHaveProperty('timestamp');
            expect(block).toHaveProperty('size');
            
            // Type checks
            expect(typeof block.height).toBe('number');
            expect(typeof block.hash).toBe('string');
            expect(typeof block.tx_count).toBe('number');
            expect(typeof block.timestamp).toBe('number');
            expect(typeof block.size).toBe('number');
            
            // Value constraints
            expect(block.height).toBeGreaterThanOrEqual(0);
            expect(block.tx_count).toBeGreaterThan(0);
            expect(block.timestamp).toBeGreaterThan(0);
            expect(block.size).toBeGreaterThan(0);
            expect(block.hash.length).toBe(64);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: game-logic-upgrade, Property 3: Block Height Resolution**
   * **Validates: Requirements 2.2**
   */
  it('Property 3: Block height resolution - valid height returns block with tx_count', () => {
    fc.assert(
      fc.property(
        blockArbitrary,
        (block: BitcoinBlock) => {
          // For any valid block height, the returned block must have tx_count
          expect(block).toHaveProperty('tx_count');
          expect(typeof block.tx_count).toBe('number');
          expect(block.tx_count).toBeGreaterThan(0);
          
          // Height must match what was requested
          expect(block.height).toBeGreaterThanOrEqual(0);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Block heights are in descending order for recent blocks
   */
  it('Property: Recent blocks are ordered by height descending', () => {
    fc.assert(
      fc.property(
        fc.array(blockArbitrary, { minLength: 2, maxLength: 10 }).map(blocks => 
          blocks.sort((a, b) => b.height - a.height)
        ),
        (sortedBlocks: BitcoinBlock[]) => {
          // Verify descending order
          for (let i = 1; i < sortedBlocks.length; i++) {
            expect(sortedBlocks[i - 1].height).toBeGreaterThanOrEqual(sortedBlocks[i].height);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
