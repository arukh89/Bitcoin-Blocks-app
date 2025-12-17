-- Migration: Add unique constraints to prevent race conditions
-- Run this in Supabase SQL Editor

-- 1. Prevent duplicate guesses per round per user
-- First, remove any existing duplicates (keep the earliest one)
DELETE FROM guesses a USING guesses b
WHERE a.id > b.id 
  AND a.round_id = b.round_id 
  AND a.fid = b.fid;

-- Add unique constraint
ALTER TABLE guesses 
ADD CONSTRAINT guesses_round_fid_unique 
UNIQUE (round_id, fid);

-- 2. Prevent duplicate check-ins per day per user
-- Create a function to extract date from timestamp
CREATE OR REPLACE FUNCTION date_from_timestamp(ts timestamptz)
RETURNS date AS $$
  SELECT ts::date;
$$ LANGUAGE SQL IMMUTABLE;

-- Add unique index on user + date (allows one check-in per day)
CREATE UNIQUE INDEX IF NOT EXISTS checkins_user_date_unique 
ON checkins (user_identifier, date_from_timestamp(checkin_date));

-- 3. Prevent duplicate reward claims
-- Add unique constraint on round + user + claim_type
ALTER TABLE reward_claims 
ADD CONSTRAINT reward_claims_unique 
UNIQUE (round_id, user_identifier, claim_type);

-- 4. Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guesses_round_id ON guesses(round_id);
CREATE INDEX IF NOT EXISTS idx_guesses_fid ON guesses(fid);
CREATE INDEX IF NOT EXISTS idx_checkins_user ON checkins(user_identifier);
CREATE INDEX IF NOT EXISTS idx_checkins_date ON checkins(checkin_date);
CREATE INDEX IF NOT EXISTS idx_reward_claims_user ON reward_claims(user_identifier);
CREATE INDEX IF NOT EXISTS idx_rounds_status ON rounds(status);

-- 5. Add RLS policies for security
-- Enable RLS on all tables
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE guesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access" ON rounds FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON guesses FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON checkins FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON prize_config FOR SELECT USING (true);
CREATE POLICY "Allow read access" ON settings FOR SELECT USING (true);

-- Allow insert for authenticated operations (via anon key with app logic)
CREATE POLICY "Allow insert" ON guesses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON checkins FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON reward_claims FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON chat_messages FOR INSERT WITH CHECK (true);

-- Allow update for user_stats (for streak updates)
CREATE POLICY "Allow update" ON user_stats FOR UPDATE USING (true);

-- Admin-only operations should be done via service role key
-- These policies allow the anon key to work for normal operations
