export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          address: string
          created_at: string | null
          id: number
          message: string
          msg_type: string
          pfp_url: string | null
          round_id: string
          username: string
        }
        Insert: {
          address: string
          created_at?: string | null
          id?: number
          message: string
          msg_type?: string
          pfp_url?: string | null
          round_id?: string
          username: string
        }
        Update: {
          address?: string
          created_at?: string | null
          id?: number
          message?: string
          msg_type?: string
          pfp_url?: string | null
          round_id?: string
          username?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          checkin_date: string | null
          id: number
          pfp_url: string | null
          points_earned: number
          streak_count: number
          tx_hash: string | null
          user_identifier: string
          username: string
        }
        Insert: {
          checkin_date?: string | null
          id?: number
          pfp_url?: string | null
          points_earned: number
          streak_count: number
          tx_hash?: string | null
          user_identifier: string
          username: string
        }
        Update: {
          checkin_date?: string | null
          id?: number
          pfp_url?: string | null
          points_earned?: number
          streak_count?: number
          tx_hash?: string | null
          user_identifier?: string
          username?: string
        }
        Relationships: []
      }
      guesses: {
        Row: {
          fid: number
          guess: number
          id: number
          pfp_url: string | null
          round_id: number
          submitted_at: string | null
          username: string
        }
        Insert: {
          fid: number
          guess: number
          id?: number
          pfp_url?: string | null
          round_id: number
          submitted_at?: string | null
          username: string
        }
        Update: {
          fid?: number
          guess?: number
          id?: number
          pfp_url?: string | null
          round_id?: number
          submitted_at?: string | null
          username?: string
        }
        Relationships: []
      }
      logs: {
        Row: {
          created_at: string | null
          details: string | null
          event_type: string
          id: number
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          event_type: string
          id?: number
        }
        Update: {
          created_at?: string | null
          details?: string | null
          event_type?: string
          id?: number
        }
        Relationships: []
      }
      prize_config: {
        Row: {
          currency_type: string
          first_place_amount: number
          id: number
          jackpot_amount: number
          second_place_amount: number
          token_address: string | null
          updated_at: string | null
        }
        Insert: {
          currency_type?: string
          first_place_amount?: number
          id?: number
          jackpot_amount?: number
          second_place_amount?: number
          token_address?: string | null
          updated_at?: string | null
        }
        Update: {
          currency_type?: string
          first_place_amount?: number
          id?: number
          jackpot_amount?: number
          second_place_amount?: number
          token_address?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      reward_claims: {
        Row: {
          amount: number
          claim_type: string
          claimed_at: string | null
          created_at: string | null
          id: number
          round_id: number | null
          status: string
          token_address: string
          tx_hash: string | null
          user_identifier: string
        }
        Insert: {
          amount: number
          claim_type: string
          claimed_at?: string | null
          created_at?: string | null
          id?: number
          round_id?: number | null
          status?: string
          token_address?: string
          tx_hash?: string | null
          user_identifier: string
        }
        Update: {
          amount?: number
          claim_type?: string
          claimed_at?: string | null
          created_at?: string | null
          id?: number
          round_id?: number | null
          status?: string
          token_address?: string
          tx_hash?: string | null
          user_identifier?: string
        }
        Relationships: []
      }
      rounds: {
        Row: {
          actual_tx_count: number | null
          block_hash: string | null
          block_number: number | null
          created_at: string | null
          duration_minutes: number
          end_time: string
          id: number
          prize: string | null
          round_number: number
          second_place_fid: number | null
          start_time: string
          status: string
          winning_fid: number | null
        }
        Insert: {
          actual_tx_count?: number | null
          block_hash?: string | null
          block_number?: number | null
          created_at?: string | null
          duration_minutes?: number
          end_time: string
          id?: number
          prize?: string | null
          round_number: number
          second_place_fid?: number | null
          start_time?: string
          status?: string
          winning_fid?: number | null
        }
        Update: {
          actual_tx_count?: number | null
          block_hash?: string | null
          block_number?: number | null
          created_at?: string | null
          duration_minutes?: number
          end_time?: string
          id?: number
          prize?: string | null
          round_number?: number
          second_place_fid?: number | null
          start_time?: string
          status?: string
          winning_fid?: number | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      user_stats: {
        Row: {
          created_at: string | null
          current_streak: number
          id: number
          last_checkin_date: string | null
          longest_streak: number
          pfp_url: string | null
          total_checkins: number
          total_points: number
          updated_at: string | null
          user_identifier: string
          username: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number
          id?: number
          last_checkin_date?: string | null
          longest_streak?: number
          pfp_url?: string | null
          total_checkins?: number
          total_points?: number
          updated_at?: string | null
          user_identifier: string
          username: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number
          id?: number
          last_checkin_date?: string | null
          longest_streak?: number
          pfp_url?: string | null
          total_checkins?: number
          total_points?: number
          updated_at?: string | null
          user_identifier?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
