-- Phase 3: Claim Engagement RPC + Feed RLS Fix
-- Run this in Supabase SQL Editor

-- Fix: Allow authenticated users to read any user profile
-- (needed for feed to show creator info on tweet cards)
CREATE POLICY "Authenticated users can read all profiles"
  ON users FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Claim engagement function: verify + transfer credits from escrow to engager
CREATE OR REPLACE FUNCTION claim_engagement(
  p_tweet_request_id UUID,
  p_engagement_type engagement_type
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request tweet_requests%ROWTYPE;
  v_credit_cost INT;
  v_engagement_id UUID;
  v_engager_id UUID;
BEGIN
  v_engager_id := auth.uid();

  IF v_engager_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get the tweet request (lock for update)
  SELECT * INTO v_request
  FROM tweet_requests
  WHERE id = p_tweet_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Tweet request not found';
  END IF;

  -- Can't engage on your own tweets
  IF v_request.user_id = v_engager_id THEN
    RAISE EXCEPTION 'Cannot engage on your own tweet';
  END IF;

  -- Must be active
  IF v_request.status != 'active' THEN
    RAISE EXCEPTION 'Tweet request is not active';
  END IF;

  -- Must want this engagement type
  IF (p_engagement_type = 'like' AND NOT v_request.want_likes)
    OR (p_engagement_type = 'comment' AND NOT v_request.want_comments)
    OR (p_engagement_type = 'repost' AND NOT v_request.want_reposts)
    OR (p_engagement_type = 'bookmark' AND NOT v_request.want_bookmarks) THEN
    RAISE EXCEPTION 'This engagement type is not requested';
  END IF;

  -- Check for duplicate
  IF EXISTS (
    SELECT 1 FROM engagements
    WHERE tweet_request_id = p_tweet_request_id
    AND engager_user_id = v_engager_id
    AND engagement_type = p_engagement_type
  ) THEN
    RAISE EXCEPTION 'Already claimed this engagement';
  END IF;

  -- Calculate credit cost
  v_credit_cost := CASE p_engagement_type
    WHEN 'like' THEN 1
    WHEN 'comment' THEN 1
    WHEN 'repost' THEN 2
    WHEN 'bookmark' THEN 2
  END;

  -- Check sufficient escrow
  IF v_request.credits_remaining < v_credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits remaining';
  END IF;

  -- Create engagement (auto-verified for MVP; API verification added later)
  INSERT INTO engagements (
    tweet_request_id, engager_user_id, engagement_type,
    status, credits_earned, claimed_at, verified_at
  )
  VALUES (
    p_tweet_request_id, v_engager_id, p_engagement_type,
    'verified', v_credit_cost, NOW(), NOW()
  )
  RETURNING id INTO v_engagement_id;

  -- Deduct from escrow
  UPDATE tweet_requests
  SET credits_remaining = credits_remaining - v_credit_cost
  WHERE id = p_tweet_request_id;

  -- Credit the engager
  UPDATE users
  SET credits = credits + v_credit_cost
  WHERE id = v_engager_id;

  -- Log earn transaction for engager
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (
    v_engager_id, 'earn', v_credit_cost, v_engagement_id,
    'Collected ' || v_credit_cost || ' credits for ' || p_engagement_type
  );

  -- Auto-complete if no credits remaining
  IF (SELECT credits_remaining FROM tweet_requests WHERE id = p_tweet_request_id) <= 0 THEN
    UPDATE tweet_requests SET status = 'completed' WHERE id = p_tweet_request_id;
  END IF;

  RETURN v_engagement_id;
END;
$$;
