-- Creator Academy — Initial Schema
-- Run this in Supabase SQL Editor

-- Enums
CREATE TYPE user_role AS ENUM ('member', 'admin');
CREATE TYPE tweet_request_status AS ENUM ('active', 'paused', 'cooldown', 'completed', 'cancelled');
CREATE TYPE engagement_type AS ENUM ('like', 'comment', 'repost', 'bookmark');
CREATE TYPE engagement_status AS ENUM ('pending', 'verified', 'failed', 'expired');
CREATE TYPE transaction_type AS ENUM ('earn', 'spend', 'bonus', 'admin_grant', 'refund');

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  x_user_id TEXT UNIQUE NOT NULL,
  x_username TEXT NOT NULL,
  x_display_name TEXT NOT NULL,
  x_avatar_url TEXT DEFAULT '',
  credits INTEGER NOT NULL DEFAULT 500,
  role user_role NOT NULL DEFAULT 'member',
  trust_score FLOAT NOT NULL DEFAULT 1.0,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tweet requests
CREATE TABLE tweet_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tweet_url TEXT NOT NULL,
  tweet_id TEXT NOT NULL,
  want_likes BOOLEAN NOT NULL DEFAULT false,
  want_comments BOOLEAN NOT NULL DEFAULT false,
  want_reposts BOOLEAN NOT NULL DEFAULT false,
  want_bookmarks BOOLEAN NOT NULL DEFAULT false,
  credits_deposited INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  status tweet_request_status NOT NULL DEFAULT 'active',
  cooldown_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Engagements
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tweet_request_id UUID NOT NULL REFERENCES tweet_requests(id) ON DELETE CASCADE,
  engager_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  engagement_type engagement_type NOT NULL,
  status engagement_status NOT NULL DEFAULT 'pending',
  credits_earned INTEGER NOT NULL DEFAULT 0,
  verified_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Prevent duplicate engagements
  UNIQUE(tweet_request_id, engager_user_id, engagement_type)
);

-- Transactions (credit ledger)
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  reference_id UUID,
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tweet_requests_user_id ON tweet_requests(user_id);
CREATE INDEX idx_tweet_requests_status ON tweet_requests(status);
CREATE INDEX idx_engagements_tweet_request_id ON engagements(tweet_request_id);
CREATE INDEX idx_engagements_engager_user_id ON engagements(engager_user_id);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users: can read own profile, admin can read all
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Tweet requests: all authenticated users can read active, own can manage
CREATE POLICY "Anyone can read active tweet requests"
  ON tweet_requests FOR SELECT
  USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can insert own tweet requests"
  ON tweet_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tweet requests"
  ON tweet_requests FOR UPDATE
  USING (auth.uid() = user_id);

-- Engagements: users can see own, tweet owner can see theirs
CREATE POLICY "Users can read own engagements"
  ON engagements FOR SELECT
  USING (engager_user_id = auth.uid());

CREATE POLICY "Users can insert engagements"
  ON engagements FOR INSERT
  WITH CHECK (auth.uid() = engager_user_id);

CREATE POLICY "Tweet owners can read engagements on their tweets"
  ON engagements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tweet_requests
      WHERE tweet_requests.id = engagements.tweet_request_id
      AND tweet_requests.user_id = auth.uid()
    )
  );

-- Transactions: users can only see own
CREATE POLICY "Users can read own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
