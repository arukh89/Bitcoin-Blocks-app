export type Database = {
  public: {
    Tables: {
      rounds: {
        Row: {
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
        };
        Insert: Omit<Database['public']['Tables']['rounds']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['rounds']['Insert']>;
      };
      guesses: {
        Row: {
          id: string;
          round_id: string;
          fid: number;
          username: string;
          pfp_url: string | null;
          guess: number;
          submitted_at: string;
        };
        Insert: Omit<Database['public']['Tables']['guesses']['Row'], 'id' | 'submitted_at'>;
        Update: Partial<Database['public']['Tables']['guesses']['Insert']>;
      };
      chat_messages: {
        Row: {
          id: string;
          round_id: string;
          fid: number;
          username: string;
          pfp_url: string | null;
          message: string;
          type: 'chat' | 'guess' | 'system' | 'winner';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['chat_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['chat_messages']['Insert']>;
      };
      prize_config: {
        Row: {
          id: string;
          jackpot: number;
          first_place: number;
          second_place: number;
          currency: string;
          token_address: string | null;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['prize_config']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['prize_config']['Insert']>;
      };
    };
  };
};

export type Round = Database['public']['Tables']['rounds']['Row'];
export type Guess = Database['public']['Tables']['guesses']['Row'];
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type PrizeConfig = Database['public']['Tables']['prize_config']['Row'];
