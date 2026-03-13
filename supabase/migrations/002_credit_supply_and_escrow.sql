-- Phase 2: Credit Supply Table + Escrow Function

-- Credit supply tracker (single-row table)
CREATE TABLE credit_supply (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Only one row
  total_supply INTEGER NOT NULL DEFAULT 21000000,
  circulating INTEGER NOT NULL DEFAULT 1000000,
  locked INTEGER NOT NULL DEFAULT 20000000,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert initial supply state
INSERT INTO credit_supply (total_supply, circulating, locked)
VALUES (21000000, 1000000, 20000000);

-- RLS for credit_supply (read-only for everyone, admin can update)
ALTER TABLE credit_supply ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read credit supply"
  ON credit_supply FOR SELECT
  USING (true);

CREATE POLICY "Admin can update credit supply"
  ON credit_supply FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- Escrow function: atomically deduct credits from user and create tweet request + transaction
CREATE OR REPLACE FUNCTION submit_tweet_with_escrow(
  p_tweet_url TEXT,
  p_tweet_id TEXT,
  p_want_likes BOOLEAN,
  p_want_comments BOOLEAN,
  p_want_reposts BOOLEAN,
  p_want_bookmarks BOOLEAN,
  p_credits_deposited INTEGER
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_credits INTEGER;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check user has enough credits (lock row for update)
  SELECT credits INTO v_current_credits
  FROM users
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_current_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_current_credits < p_credits_deposited THEN
    RAISE EXCEPTION 'Insufficient credits. You have % but need %', v_current_credits, p_credits_deposited;
  END IF;

  -- Must select at least one engagement type
  IF NOT (p_want_likes OR p_want_comments OR p_want_reposts OR p_want_bookmarks) THEN
    RAISE EXCEPTION 'Select at least one engagement type';
  END IF;

  -- Must deposit at least 1 credit
  IF p_credits_deposited < 1 THEN
    RAISE EXCEPTION 'Must deposit at least 1 credit';
  END IF;

  -- Deduct credits from user
  UPDATE users
  SET credits = credits - p_credits_deposited
  WHERE id = v_user_id;

  -- Create tweet request
  INSERT INTO tweet_requests (user_id, tweet_url, tweet_id, want_likes, want_comments, want_reposts, want_bookmarks, credits_deposited, credits_remaining, status)
  VALUES (v_user_id, p_tweet_url, p_tweet_id, p_want_likes, p_want_comments, p_want_reposts, p_want_bookmarks, p_credits_deposited, p_credits_deposited, 'active')
  RETURNING id INTO v_request_id;

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (v_user_id, 'spend', -p_credits_deposited, v_request_id, 'Escrowed credits for tweet engagement');

  RETURN v_request_id;
END;
$$;

-- Cancel/refund function: return remaining credits to user
CREATE OR REPLACE FUNCTION cancel_tweet_request(p_request_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_remaining INTEGER;
  v_status tweet_request_status;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get request details (only owner can cancel)
  SELECT user_id, credits_remaining, status
  INTO v_user_id, v_remaining, v_status
  FROM tweet_requests
  WHERE id = p_request_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not yours';
  END IF;

  IF v_status NOT IN ('active', 'paused') THEN
    RAISE EXCEPTION 'Can only cancel active or paused requests';
  END IF;

  -- Refund remaining credits
  IF v_remaining > 0 THEN
    UPDATE users
    SET credits = credits + v_remaining
    WHERE id = v_user_id;

    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (v_user_id, 'refund', v_remaining, p_request_id, 'Refund from cancelled tweet request');
  END IF;

  -- Mark as cancelled with 0 remaining
  UPDATE tweet_requests
  SET status = 'cancelled', credits_remaining = 0
  WHERE id = p_request_id;
END;
$$;

-- Toggle pause function
CREATE OR REPLACE FUNCTION toggle_tweet_request_pause(p_request_id UUID)
RETURNS tweet_request_status
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status tweet_request_status;
  v_new_status tweet_request_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT status INTO v_status
  FROM tweet_requests
  WHERE id = p_request_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or not yours';
  END IF;

  IF v_status = 'active' THEN
    v_new_status := 'paused';
  ELSIF v_status = 'paused' THEN
    v_new_status := 'active';
  ELSE
    RAISE EXCEPTION 'Can only toggle active/paused requests';
  END IF;

  UPDATE tweet_requests
  SET status = v_new_status
  WHERE id = p_request_id;

  RETURN v_new_status;
END;
$$;
