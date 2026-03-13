-- Add creator reputation fields to users table
-- TweetScore, Ethos Network score, and blue badge status

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tweet_score FLOAT,
  ADD COLUMN IF NOT EXISTS ethos_score FLOAT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS scores_updated_at TIMESTAMPTZ;
