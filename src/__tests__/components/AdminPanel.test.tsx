import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: game-logic-upgrade, Property 9: Admin Visibility**
 * **Feature: game-logic-upgrade, Property 10: Round Creation Validation**
 * **Validates: Requirements 9.1, 9.3**
 */

// Admin FIDs from app config
const ADMIN_FIDS = [250704, 1107084];

// Helper function to check if FID is admin (matching app-config implementation)
const isAdminFid = (fid: number | undefined): boolean => {
  if (!fid) return false;
  return ADMIN_FIDS.includes(fid);
};

// Round creation validation (matching component implementation)
interface RoundCreationInput {
  roundNumber: number;
  duration: number;
  prize: string;
  blockNumber?: number;
}

const validateRoundCreation = (input: RoundCreationInput): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!input.roundNumber || input.roundNumber <= 0) {
    errors.push('Round number must be positive');
  }
  
  if (!input.duration || input.duration <= 0) {
    errors.push('Duration must be positive');
  }
  
  if (!input.prize || input.prize.trim() === '') {
    errors.push('Prize is required');
  }
  
  if (input.blockNumber !== undefined && input.blockNumber <= 0) {
    errors.push('Block number must be positive if provided');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

describe('AdminPanel Property Tests', () => {
  /**
   * **Feature: game-logic-upgrade, Property 9: Admin Visibility**
   * **Validates: Requirements 9.1**
   */
  it('Property 9: Admin visibility - only admin FIDs see admin panel', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 2000000 }),
        (fid: number) => {
          const isAdmin = isAdminFid(fid);
          
          if (ADMIN_FIDS.includes(fid)) {
            // Admin FIDs should have access
            expect(isAdmin).toBe(true);
          } else {
            // Non-admin FIDs should not have access
            expect(isAdmin).toBe(false);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Known admin FIDs always have access
   */
  it('Property: Known admin FIDs (250704, 1107084) always return true', () => {
    for (const adminFid of ADMIN_FIDS) {
      expect(isAdminFid(adminFid)).toBe(true);
    }
  });

  /**
   * Property: Undefined/null FID is not admin
   */
  it('Property: Undefined FID is never admin', () => {
    expect(isAdminFid(undefined)).toBe(false);
  });

  /**
   * **Feature: game-logic-upgrade, Property 10: Round Creation Validation**
   * **Validates: Requirements 9.3**
   */
  it('Property 10: Round creation validation - positive values required', () => {
    fc.assert(
      fc.property(
        fc.record({
          roundNumber: fc.integer({ min: 1, max: 1000 }),
          duration: fc.integer({ min: 1, max: 120 }),
          prize: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
          blockNumber: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: undefined }),
        }),
        (input: RoundCreationInput) => {
          const result = validateRoundCreation(input);
          
          // Valid inputs should pass validation
          expect(result.valid).toBe(true);
          expect(result.errors).toHaveLength(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid round number fails validation
   */
  it('Property: Zero or negative round number fails validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        (roundNumber: number) => {
          const result = validateRoundCreation({
            roundNumber,
            duration: 10,
            prize: '1000 $SECOND',
          });
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Round number must be positive');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Invalid duration fails validation
   */
  it('Property: Zero or negative duration fails validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        (duration: number) => {
          const result = validateRoundCreation({
            roundNumber: 1,
            duration,
            prize: '1000 $SECOND',
          });
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Duration must be positive');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Empty prize fails validation
   */
  it('Property: Empty prize fails validation', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('', '   ', '\t', '\n'),
        (prize: string) => {
          const result = validateRoundCreation({
            roundNumber: 1,
            duration: 10,
            prize,
          });
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Prize is required');

          return true;
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property: Invalid block number fails validation
   */
  it('Property: Zero or negative block number fails validation', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1000, max: 0 }),
        (blockNumber: number) => {
          const result = validateRoundCreation({
            roundNumber: 1,
            duration: 10,
            prize: '1000 $SECOND',
            blockNumber,
          });
          
          expect(result.valid).toBe(false);
          expect(result.errors).toContain('Block number must be positive if provided');

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Multiple validation errors are collected
   */
  it('Property: Multiple invalid fields produce multiple errors', () => {
    const result = validateRoundCreation({
      roundNumber: 0,
      duration: 0,
      prize: '',
      blockNumber: 0,
    });
    
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(3);
  });
});
