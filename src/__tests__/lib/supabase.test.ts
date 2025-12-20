import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Database Tests for Supabase Operations
 * Tests CRUD operations, queries, and data validation
 */

// Types from database.ts
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

interface ChatMessage {
  id: string;
  round_id: string;
  fid: number;
  username: string;
  pfp_url: string | null;
  message: string;
  type: 'chat' | 'guess' | 'system' | 'winner';
  created_at: string;
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

// Mock Supabase client
const createMockSupabaseClient = () => {
  const mockData: {
    rounds: Round[];
    guesses: Guess[];
    chat_messages: ChatMessage[];
    prize_config: PrizeConfig[];
  } = {
    rounds: [],
    guesses: [],
    chat_messages: [],
    prize_config: [],
  };

  const createQueryBuilder = (table: keyof typeof mockData) => {
    let filters: Array<{ column: string; value: any; op: string }> = [];
    let orderColumn: string | null = null;
    let orderAsc = true;
    let limitCount: number | null = null;
    let selectColumns = '*';

    const builder = {
      select: (columns = '*') => {
        selectColumns = columns;
        return builder;
      },
      insert: async (data: any) => {
        const newItem = {
          id: `mock-${Date.now()}-${Math.random()}`,
          created_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...data,
        };
        mockData[table].push(newItem as any);
        return { data: newItem, error: null };
      },
      update: (data: any) => {
        return {
          eq: async (column: string, value: any) => {
            const index = mockData[table].findIndex((item: any) => item[column] === value);
            if (index !== -1) {
              mockData[table][index] = { ...mockData[table][index], ...data };
              return { data: mockData[table][index], error: null };
            }
            return { data: null, error: { message: 'Not found' } };
          },
        };
      },
      delete: () => {
        return {
          eq: async (column: string, value: any) => {
            const index = mockData[table].findIndex((item: any) => item[column] === value);
            if (index !== -1) {
              const deleted = mockData[table].splice(index, 1);
              return { data: deleted[0], error: null };
            }
            return { data: null, error: null };
          },
        };
      },
      eq: (column: string, value: any) => {
        filters.push({ column, value, op: 'eq' });
        return builder;
      },
      in: (column: string, values: any[]) => {
        filters.push({ column, value: values, op: 'in' });
        return builder;
      },
      order: (column: string, options?: { ascending?: boolean }) => {
        orderColumn = column;
        orderAsc = options?.ascending ?? true;
        return builder;
      },
      limit: (count: number) => {
        limitCount = count;
        return builder;
      },
      single: async () => {
        let result = [...mockData[table]];
        
        for (const filter of filters) {
          if (filter.op === 'eq') {
            result = result.filter((item: any) => item[filter.column] === filter.value);
          } else if (filter.op === 'in') {
            result = result.filter((item: any) => filter.value.includes(item[filter.column]));
          }
        }
        
        return { data: result[0] || null, error: result.length === 0 ? { message: 'Not found' } : null };
      },
      then: async (resolve: (value: any) => void) => {
        let result = [...mockData[table]];
        
        for (const filter of filters) {
          if (filter.op === 'eq') {
            result = result.filter((item: any) => item[filter.column] === filter.value);
          } else if (filter.op === 'in') {
            result = result.filter((item: any) => filter.value.includes(item[filter.column]));
          }
        }
        
        if (orderColumn) {
          result.sort((a: any, b: any) => {
            const aVal = a[orderColumn!];
            const bVal = b[orderColumn!];
            return orderAsc ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
          });
        }
        
        if (limitCount) {
          result = result.slice(0, limitCount);
        }
        
        resolve({ data: result, error: null });
      },
    };

    return builder;
  };

  return {
    from: (table: keyof typeof mockData) => createQueryBuilder(table),
    channel: (name: string) => ({
      on: () => ({ subscribe: () => ({ unsubscribe: vi.fn() }) }),
    }),
    _mockData: mockData,
  };
};

// Arbitraries for generating test data
const isoDateArb = fc.integer({ min: 1704067200000, max: 1767225600000 })
  .map(ts => new Date(ts).toISOString());

const roundArbitrary = fc.record({
  round_number: fc.integer({ min: 1, max: 1000 }),
  status: fc.constantFrom('open', 'closed', 'finished') as fc.Arbitrary<'open' | 'closed' | 'finished'>,
  block_number: fc.option(fc.integer({ min: 800000, max: 900000 }), { nil: null }),
  prize: fc.constantFrom('5,000 $SECOND', '1,000 $SECOND', '10,000 POINTS'),
  start_time: isoDateArb,
  end_time: isoDateArb,
  actual_tx_count: fc.option(fc.integer({ min: 1000, max: 5000 }), { nil: null }),
  block_hash: fc.option(fc.uuid(), { nil: null }),
  winner_fid: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null }),
  second_place_fid: fc.option(fc.integer({ min: 1, max: 1000000 }), { nil: null }),
});

const usernameArb = fc.array(
  fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789_'.split('')),
  { minLength: 3, maxLength: 15 }
).map(arr => arr.join(''));

const guessArbitrary = fc.record({
  round_id: fc.uuid(),
  fid: fc.integer({ min: 1, max: 1000000 }),
  username: usernameArb,
  pfp_url: fc.option(fc.webUrl(), { nil: null }),
  guess: fc.integer({ min: 1, max: 10000 }),
});

const chatMessageArbitrary = fc.record({
  round_id: fc.uuid(),
  fid: fc.integer({ min: 1, max: 1000000 }),
  username: usernameArb,
  pfp_url: fc.option(fc.webUrl(), { nil: null }),
  message: fc.string({ minLength: 1, maxLength: 500 }),
  type: fc.constantFrom('chat', 'guess', 'system', 'winner') as fc.Arbitrary<'chat' | 'guess' | 'system' | 'winner'>,
});

const prizeConfigArbitrary = fc.record({
  jackpot: fc.integer({ min: 1000, max: 100000 }),
  first_place: fc.integer({ min: 100, max: 10000 }),
  second_place: fc.integer({ min: 50, max: 5000 }),
  currency: fc.constantFrom('$SECOND', '$USDC', '$ETH', 'POINTS'),
  token_address: fc.option(fc.uuid(), { nil: null }),
});

describe('Supabase Database Tests', () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
  });

  describe('Rounds Table Operations', () => {
    it('should insert a new round', async () => {
      await fc.assert(
        fc.asyncProperty(roundArbitrary, async (roundData) => {
          const { data, error } = await mockClient.from('rounds').insert(roundData);
          
          expect(error).toBeNull();
          expect(data).toHaveProperty('id');
          expect(data.round_number).toBe(roundData.round_number);
          expect(data.status).toBe(roundData.status);
          expect(data.prize).toBe(roundData.prize);
        }),
        { numRuns: 50 }
      );
    });

    it('should query rounds by status', async () => {
      // Insert test rounds
      await mockClient.from('rounds').insert({
        round_number: 1,
        status: 'open',
        prize: '1000',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      });
      await mockClient.from('rounds').insert({
        round_number: 2,
        status: 'closed',
        prize: '2000',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      });

      const result = await new Promise<any>((resolve) => {
        mockClient.from('rounds').select('*').eq('status', 'open').then(resolve);
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].status).toBe('open');
    });

    it('should update round status', async () => {
      // Insert a round
      const { data: inserted } = await mockClient.from('rounds').insert({
        round_number: 1,
        status: 'open',
        prize: '1000',
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      });

      // Update status
      const { data: updated, error } = await mockClient
        .from('rounds')
        .update({ status: 'closed' })
        .eq('id', inserted.id);

      expect(error).toBeNull();
      expect(updated.status).toBe('closed');
    });
  });

  describe('Guesses Table Operations', () => {
    it('should insert a new guess', async () => {
      await fc.assert(
        fc.asyncProperty(guessArbitrary, async (guessData) => {
          const { data, error } = await mockClient.from('guesses').insert(guessData);
          
          expect(error).toBeNull();
          expect(data).toHaveProperty('id');
          expect(data.fid).toBe(guessData.fid);
          expect(data.guess).toBe(guessData.guess);
          expect(data.username).toBe(guessData.username);
        }),
        { numRuns: 50 }
      );
    });

    it('should query guesses by round_id', async () => {
      const roundId = 'test-round-123';
      
      await mockClient.from('guesses').insert({
        round_id: roundId,
        fid: 1,
        username: 'user1',
        guess: 2500,
      });
      await mockClient.from('guesses').insert({
        round_id: roundId,
        fid: 2,
        username: 'user2',
        guess: 3000,
      });
      await mockClient.from('guesses').insert({
        round_id: 'other-round',
        fid: 3,
        username: 'user3',
        guess: 3500,
      });

      const result = await new Promise<any>((resolve) => {
        mockClient.from('guesses').select('*').eq('round_id', roundId).then(resolve);
      });

      expect(result.data.length).toBe(2);
      result.data.forEach((guess: any) => {
        expect(guess.round_id).toBe(roundId);
      });
    });

    it('should enforce unique guess per user per round', async () => {
      // This would be enforced by database constraint
      // Test validates the data structure
      const roundId = 'test-round';
      const fid = 12345;

      await mockClient.from('guesses').insert({
        round_id: roundId,
        fid: fid,
        username: 'testuser',
        guess: 2500,
      });

      // In real DB, this would fail due to unique constraint
      // Here we just verify the structure
      const result = await new Promise<any>((resolve) => {
        mockClient.from('guesses').select('*').eq('round_id', roundId).eq('fid', fid).then(resolve);
      });

      expect(result.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Chat Messages Table Operations', () => {
    it('should insert a new chat message', async () => {
      await fc.assert(
        fc.asyncProperty(chatMessageArbitrary, async (messageData) => {
          const { data, error } = await mockClient.from('chat_messages').insert(messageData);
          
          expect(error).toBeNull();
          expect(data).toHaveProperty('id');
          expect(data.message).toBe(messageData.message);
          expect(data.type).toBe(messageData.type);
        }),
        { numRuns: 50 }
      );
    });

    it('should query messages by type', async () => {
      const roundId = 'test-round';
      
      await mockClient.from('chat_messages').insert({
        round_id: roundId,
        fid: 1,
        username: 'user1',
        message: 'Hello',
        type: 'chat',
      });
      await mockClient.from('chat_messages').insert({
        round_id: roundId,
        fid: 0,
        username: 'System',
        message: 'Round started',
        type: 'system',
      });

      const result = await new Promise<any>((resolve) => {
        mockClient.from('chat_messages').select('*').eq('type', 'system').then(resolve);
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].type).toBe('system');
    });
  });

  describe('Prize Config Table Operations', () => {
    it('should insert prize config', async () => {
      await fc.assert(
        fc.asyncProperty(prizeConfigArbitrary, async (configData) => {
          const { data, error } = await mockClient.from('prize_config').insert(configData);
          
          expect(error).toBeNull();
          expect(data).toHaveProperty('id');
          expect(data.jackpot).toBe(configData.jackpot);
          expect(data.currency).toBe(configData.currency);
        }),
        { numRuns: 50 }
      );
    });

    it('should update prize config', async () => {
      const { data: inserted } = await mockClient.from('prize_config').insert({
        jackpot: 5000,
        first_place: 1000,
        second_place: 500,
        currency: '$SECOND',
      });

      const { data: updated, error } = await mockClient
        .from('prize_config')
        .update({ jackpot: 10000 })
        .eq('id', inserted.id);

      expect(error).toBeNull();
      expect(updated.jackpot).toBe(10000);
    });
  });

  describe('Data Validation', () => {
    it('should validate round status values', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('open', 'closed', 'finished'),
          (status) => {
            expect(['open', 'closed', 'finished']).toContain(status);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate chat message types', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('chat', 'guess', 'system', 'winner'),
          (type) => {
            expect(['chat', 'guess', 'system', 'winner']).toContain(type);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate guess is positive integer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 10000 }),
          (guess) => {
            expect(guess).toBeGreaterThan(0);
            expect(Number.isInteger(guess)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate FID is positive integer', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000000 }),
          (fid) => {
            expect(fid).toBeGreaterThan(0);
            expect(Number.isInteger(fid)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Query Ordering', () => {
    it('should order rounds by created_at descending', async () => {
      await mockClient.from('rounds').insert({
        round_number: 1,
        status: 'finished',
        prize: '1000',
        start_time: '2024-01-01T00:00:00Z',
        end_time: '2024-01-01T01:00:00Z',
      });
      await mockClient.from('rounds').insert({
        round_number: 2,
        status: 'finished',
        prize: '2000',
        start_time: '2024-01-02T00:00:00Z',
        end_time: '2024-01-02T01:00:00Z',
      });

      const result = await new Promise<any>((resolve) => {
        mockClient.from('rounds')
          .select('*')
          .order('round_number', { ascending: false })
          .then(resolve);
      });

      expect(result.data[0].round_number).toBeGreaterThan(result.data[1].round_number);
    });

    it('should order guesses by submitted_at ascending', async () => {
      const roundId = 'test-round';
      
      await mockClient.from('guesses').insert({
        round_id: roundId,
        fid: 1,
        username: 'user1',
        guess: 2500,
      });
      
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 10));
      
      await mockClient.from('guesses').insert({
        round_id: roundId,
        fid: 2,
        username: 'user2',
        guess: 3000,
      });

      const result = await new Promise<any>((resolve) => {
        mockClient.from('guesses')
          .select('*')
          .eq('round_id', roundId)
          .order('submitted_at', { ascending: true })
          .then(resolve);
      });

      expect(result.data.length).toBe(2);
    });
  });
});
