export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      rounds: {
        Row: {
          id: string
          round_number: number
          status: 'open' | 'closed' | 'finished'
          block_number: number | null
          prize: string
          start_time: string
          end_time: string
          actual_tx_count: number | null
          block_hash: string | null
          winner_fid: number | null
          second_place_fid: number | null
          winner_claimed: boolean
          second_place_claimed: boolean
          winner_claim_tx: string | null
          second_place_claim_tx: string | null
          claim_deadline: string | null
          first_place_prize: number | null
          second_place_prize: number | null
          prize_currency: string | null
          winner_username: string | null
          second_place_username: string | null
          created_at: string
        }
        Insert: {
          id?: string
          round_number?: number
          status?: 'open' | 'closed' | 'finished'
          block_number?: number | null
          prize: string
          start_time?: string
          end_time: string
          actual_tx_count?: number | null
          block_hash?: string | null
          winner_fid?: number | null
          second_place_fid?: number | null
          winner_claimed?: boolean
          second_place_claimed?: boolean
          winner_claim_tx?: string | null
          second_place_claim_tx?: string | null
          claim_deadline?: string | null
          first_place_prize?: number | null
          second_place_prize?: number | null
          prize_currency?: string | null
          winner_username?: string | null
          second_place_username?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          round_number?: number
          status?: 'open' | 'closed' | 'finished'
          block_number?: number | null
          prize?: string
          start_time?: string
          end_time?: string
          actual_tx_count?: number | null
          block_hash?: string | null
          winner_fid?: number | null
          second_place_fid?: number | null
          winner_claimed?: boolean
          second_place_claimed?: boolean
          winner_claim_tx?: string | null
          second_place_claim_tx?: string | null
          claim_deadline?: string | null
          first_place_prize?: number | null
          second_place_prize?: number | null
          prize_currency?: string | null
          winner_username?: string | null
          second_place_username?: string | null
          created_at?: string
        }
        Relationships: []
      }
      guesses: {
        Row: {
          id: string
          round_id: string
          fid: number
          username: string
          pfp_url: string | null
          guess: number
          submitted_at: string
        }
        Insert: {
          id?: string
          round_id: string
          fid: number
          username: string
          pfp_url?: string | null
          guess: number
          submitted_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          fid?: number
          username?: string
          pfp_url?: string | null
          guess?: number
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'guesses_round_id_fkey'
            columns: ['round_id']
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          round_id: string
          fid: number
          username: string
          pfp_url: string | null
          message: string
          type: 'chat' | 'guess' | 'system' | 'winner'
          created_at: string
        }
        Insert: {
          id?: string
          round_id: string
          fid: number
          username: string
          pfp_url?: string | null
          message: string
          type?: 'chat' | 'guess' | 'system' | 'winner'
          created_at?: string
        }
        Update: {
          id?: string
          round_id?: string
          fid?: number
          username?: string
          pfp_url?: string | null
          message?: string
          type?: 'chat' | 'guess' | 'system' | 'winner'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'chat_messages_round_id_fkey'
            columns: ['round_id']
            referencedRelation: 'rounds'
            referencedColumns: ['id']
          }
        ]
      }
      prize_config: {
        Row: {
          id: string
          jackpot: number
          first_place: number
          second_place: number
          currency: string
          token_address: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          jackpot?: number
          first_place?: number
          second_place?: number
          currency?: string
          token_address?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          jackpot?: number
          first_place?: number
          second_place?: number
          currency?: string
          token_address?: string | null
          updated_at?: string
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
  }
}

export type Round = Database['public']['Tables']['rounds']['Row']
export type Guess = Database['public']['Tables']['guesses']['Row']
export type ChatMessage = Database['public']['Tables']['chat_messages']['Row']
export type PrizeConfig = Database['public']['Tables']['prize_config']['Row']
