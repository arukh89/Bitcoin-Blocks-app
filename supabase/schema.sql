-- Bitcoin Blocks Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Rounds table
CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'finished')),
  block_number INTEGER,
  prize TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ NOT NULL,
  actual_tx_count INTEGER,
  block_hash TEXT,
  winner_fid INTEGER,
  second_place_fid INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guesses table
CREATE TABLE IF NOT EXISTS guesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  fid INTEGER NOT NULL,
  username TEXT NOT NULL,
  pfp_url TEXT,
  guess INTEGER NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(round_id, fid)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
  fid INTEGER NOT NULL,
  username TEXT NOT NULL,
  pfp_url TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'chat' CHECK (type IN ('chat', 'guess', 'system', 'winner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prize config table
CREATE TABLE IF NOT EXISTS prize_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jackpot INTEGER NOT NULL DEFAULT 5000,
  first_place INTEGER NOT NULL DEFAULT 1000,
  second_place INTEGER NOT NULL DEFAULT 500,
  currency TEXT NOT NULL DEFAULT '$SECOND',
  token_address TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);
CREATE INDEX IF NOT EXISTS idx_rounds_created_at ON rounds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guesses_round_id ON guesses(round_id);
CREATE INDEX IF NOT EXISTS idx_guesses_fid ON guesses(fid);
CREATE INDEX IF NOT EXISTS idx_chat_round_id ON chat_messages(round_id);
CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_messages(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Rounds are viewable by everyone" ON rounds;
DROP POLICY IF EXISTS "Rounds can be inserted by anyone" ON rounds;
DROP POLICY IF EXISTS "Rounds can be updated by anyone" ON rounds;
DROP POLICY IF EXISTS "Guesses are viewable by everyone" ON guesses;
DROP POLICY IF EXISTS "Anyone can insert guesses" ON guesses;
DROP POLICY IF EXISTS "Chat messages are viewable by everyone" ON chat_messages;
DROP POLICY IF EXISTS "Anyone can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Prize config is viewable by everyone" ON prize_config;
DROP POLICY IF EXISTS "Prize config can be updated by anyone" ON prize_config;
DROP POLICY IF EXISTS "Prize config can be inserted by anyone" ON prize_config;

-- Rounds policies
CREATE POLICY "Rounds are viewable by everyone" ON rounds FOR SELECT USING (true);
CREATE POLICY "Rounds can be inserted by anyone" ON rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Rounds can be updated by anyone" ON rounds FOR UPDATE USING (true);

-- Guesses policies
CREATE POLICY "Guesses are viewable by everyone" ON guesses FOR SELECT USING (true);
CREATE POLICY "Anyone can insert guesses" ON guesses FOR INSERT WITH CHECK (true);

-- Chat messages policies
CREATE POLICY "Chat messages are viewable by everyone" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert chat messages" ON chat_messages FOR INSERT WITH CHECK (true);

-- Prize config policies
CREATE POLICY "Prize config is viewable by everyone" ON prize_config FOR SELECT USING (true);
CREATE POLICY "Prize config can be updated by anyone" ON prize_config FOR UPDATE USING (true);
CREATE POLICY "Prize config can be inserted by anyone" ON prize_config FOR INSERT WITH CHECK (true);

-- ============================================
-- REALTIME
-- ============================================

-- Enable Realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE rounds;
ALTER PUBLICATION supabase_realtime ADD TABLE guesses;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE prize_config;

-- ============================================
-- DEFAULT DATA
-- ============================================

-- Insert default prize config if not exists
INSERT INTO prize_config (jackpot, first_place, second_place, currency)
SELECT 5000, 1000, 500, '$SECOND'
WHERE NOT EXISTS (SELECT 1 FROM prize_config);
