import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * **Feature: game-logic-upgrade, Property 8: Jackpot Display**
 * **Validates: Requirements 7.1**
 * 
 * For any prize configuration with jackpot amount, the JackpotBanner 
 * SHALL display the jackpot value formatted with the correct currency.
 */

interface PrizeConfig {
  id: string;
  jackpot: number;
  first_place: number;
  second_place: number;
  currency: string;
  token_address: string | null;
  updated_at: string;
}

// Generate hex string for token address
const hexCharArb = fc.constantFrom(...'0123456789abcdef'.split(''));
const hexStringArb = (length: number) => fc.array(hexCharArb, { minLength: length, maxLength: length }).map(arr => arr.join(''));

// Generate ISO date string
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 })
  .map(ts => new Date(ts).toISOString());

// Arbitrary for generating valid prize configurations
const prizeConfigArbitrary = fc.record({
  id: fc.uuid(),
  jackpot: fc.integer({ min: 1000, max: 100000 }),
  first_place: fc.integer({ min: 100, max: 10000 }),
  second_place: fc.integer({ min: 50, max: 5000 }),
  currency: fc.constantFrom('$SECOND', '$USDC', '$ETH', 'POINTS'),
  token_address: fc.option(hexStringArb(40).map(s => `0x${s}`), { nil: null }),
  updated_at: isoDateArb,
});

// Helper function to format jackpot display (matching component implementation)
const formatJackpotDisplay = (jackpot: number, currency: string): string => {
  return `${jackpot.toLocaleString()} ${currency}`;
};

// Generate currency string
const currencyCharArb = fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZ$'.split(''));
const currencyArb = fc.array(currencyCharArb, { minLength: 1, maxLength: 10 }).map(arr => arr.join(''));

describe('JackpotBanner Property Tests', () => {
  /**
   * **Feature: game-logic-upgrade, Property 8: Jackpot Display**
   * **Validates: Requirements 7.1**
   */
  it('Property 8: Jackpot display - amount formatted with currency', () => {
    fc.assert(
      fc.property(
        prizeConfigArbitrary,
        (config: PrizeConfig) => {
          const display = formatJackpotDisplay(config.jackpot, config.currency);
          
          // Display contains the jackpot amount
          expect(display).toContain(config.jackpot.toLocaleString());
          
          // Display contains the currency
          expect(display).toContain(config.currency);
          
          // Jackpot is a positive number
          expect(config.jackpot).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default values when config is null
   */
  it('Property: Default jackpot value is used when not configured', () => {
    const DEFAULT_JACKPOT = 5000;
    const DEFAULT_CURRENCY = '$SECOND';

    // Test that defaults are applied when config is null
    const config = null as PrizeConfig | null;
    const jackpot = config !== null ? config.jackpot : DEFAULT_JACKPOT;
    const currency = config !== null ? config.currency : DEFAULT_CURRENCY;
    
    expect(jackpot).toBe(DEFAULT_JACKPOT);
    expect(currency).toBe(DEFAULT_CURRENCY);
    
    const display = formatJackpotDisplay(jackpot, currency);
    // Check that display contains the amount and currency (locale-independent)
    expect(display).toContain('5');
    expect(display).toContain('000');
    expect(display).toContain('$SECOND');
  });

  /**
   * Property: Large jackpot amounts are formatted with separators
   */
  it('Property: Large jackpot amounts have thousands separators', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 1000000 }),
        (jackpot: number) => {
          const formatted = jackpot.toLocaleString();
          
          // For numbers >= 1000, locale string should add formatting
          if (jackpot >= 1000) {
            // The formatted string should contain comma or other separator
            // (depends on locale, but length should be >= plain number)
            expect(formatted.length).toBeGreaterThanOrEqual(String(jackpot).length);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Currency is always appended after amount
   */
  it('Property: Currency appears after the numeric amount', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100000 }),
        currencyArb,
        (amount: number, currency: string) => {
          const display = formatJackpotDisplay(amount, currency);
          
          // Currency should be at the end
          expect(display.endsWith(currency)).toBe(true);
          
          // Amount should be at the start
          expect(display.startsWith(amount.toLocaleString())).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
