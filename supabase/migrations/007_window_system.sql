-- Phase 5: Window System — Database + State Engine
-- Adds window-based engagement system: per-type goals, auto-funnel, window settlement
-- Safe to run: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- =============================================================================
-- 1. Add window columns to tweet_requests
-- =============================================================================

ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS window_id TEXT;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS likes_goal INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS comments_goal INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS reposts_goal INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS bookmarks_goal INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS likes_fulfilled INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS comments_fulfilled INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS reposts_fulfilled INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS bookmarks_fulfilled INT DEFAULT 0;
ALTER TABLE tweet_requests ADD COLUMN IF NOT EXISTS submit_mode TEXT DEFAULT 'goal';

-- =============================================================================
-- 2. Partial unique index: one active request per user per window
--    (cancelled requests don't count)
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_tweet_requests_user_window_active
  ON tweet_requests (user_id, window_id)
  WHERE status != 'cancelled';

-- Index for window settlement queries
CREATE INDEX IF NOT EXISTS idx_tweet_requests_window_id
  ON tweet_requests (window_id)
  WHERE status = 'active';

-- =============================================================================
-- 3. RPC: submit_tweet_v2
-- =============================================================================

CREATE OR REPLACE FUNCTION submit_tweet_v2(
  p_tweet_url TEXT,
  p_tweet_id TEXT,
  p_window_id TEXT,
  p_likes_goal INT DEFAULT 0,
  p_comments_goal INT DEFAULT 0,
  p_reposts_goal INT DEFAULT 0,
  p_bookmarks_goal INT DEFAULT 0,
  p_credits_deposited INT DEFAULT 0,
  p_submit_mode TEXT DEFAULT 'goal'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_credits INT;
  v_request_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Validate minimum deposit
  IF p_credits_deposited < 50 THEN
    RAISE EXCEPTION 'Minimum deposit is 50 credits';
  END IF;

  -- Validate submit_mode
  IF p_submit_mode NOT IN ('goal', 'credit') THEN
    RAISE EXCEPTION 'submit_mode must be "goal" or "credit"';
  END IF;

  -- Check user balance
  SELECT credits INTO v_user_credits
  FROM users
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_user_credits IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF v_user_credits < p_credits_deposited THEN
    RAISE EXCEPTION 'Insufficient credits. You have % but need %', v_user_credits, p_credits_deposited;
  END IF;

  -- Check 1-per-window constraint (the unique index enforces this,
  -- but we give a friendlier error message)
  IF EXISTS (
    SELECT 1 FROM tweet_requests
    WHERE user_id = v_user_id
    AND window_id = p_window_id
    AND status != 'cancelled'
  ) THEN
    RAISE EXCEPTION 'You already have a request in this window';
  END IF;

  -- Deduct credits from user
  UPDATE users
  SET credits = credits - p_credits_deposited
  WHERE id = v_user_id;

  -- Create tweet request with window data
  INSERT INTO tweet_requests (
    user_id, tweet_url, tweet_id,
    want_likes, want_comments, want_reposts, want_bookmarks,
    credits_deposited, credits_remaining, status,
    window_id, likes_goal, comments_goal, reposts_goal, bookmarks_goal,
    likes_fulfilled, comments_fulfilled, reposts_fulfilled, bookmarks_fulfilled,
    submit_mode
  )
  VALUES (
    v_user_id, p_tweet_url, p_tweet_id,
    p_likes_goal > 0, p_comments_goal > 0, p_reposts_goal > 0, p_bookmarks_goal > 0,
    p_credits_deposited, p_credits_deposited, 'active',
    p_window_id, p_likes_goal, p_comments_goal, p_reposts_goal, p_bookmarks_goal,
    0, 0, 0, 0,
    p_submit_mode
  )
  RETURNING id INTO v_request_id;

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (
    v_user_id, 'spend', p_credits_deposited, v_request_id,
    'Deposited ' || p_credits_deposited || ' credits for window ' || p_window_id
  );

  RETURN v_request_id;
END;
$$;

-- =============================================================================
-- 4. RPC: claim_engagement_v2
--    FCFS with per-type goal tracking and auto-funnel
-- =============================================================================

CREATE OR REPLACE FUNCTION claim_engagement_v2(
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
  v_engager_request_id UUID;
  v_goal INT;
  v_fulfilled INT;
BEGIN
  v_engager_id := auth.uid();

  IF v_engager_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the tweet request
  SELECT * INTO v_request
  FROM tweet_requests
  WHERE id = p_tweet_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Tweet request not found';
  END IF;

  -- Self-engagement check
  IF v_request.user_id = v_engager_id THEN
    RAISE EXCEPTION 'Cannot engage on your own tweet';
  END IF;

  -- Must be active
  IF v_request.status != 'active' THEN
    RAISE EXCEPTION 'Tweet request is not active';
  END IF;

  -- Calculate credit cost
  v_credit_cost := CASE p_engagement_type
    WHEN 'like' THEN 1
    WHEN 'comment' THEN 1
    WHEN 'repost' THEN 2
    WHEN 'bookmark' THEN 2
  END;

  -- Check credits remaining
  IF v_request.credits_remaining < v_credit_cost THEN
    RAISE EXCEPTION 'Insufficient credits remaining on this request';
  END IF;

  -- FCFS check: for goal mode, verify type hasn't been fully fulfilled
  IF v_request.submit_mode = 'goal' THEN
    v_goal := CASE p_engagement_type
      WHEN 'like' THEN v_request.likes_goal
      WHEN 'comment' THEN v_request.comments_goal
      WHEN 'repost' THEN v_request.reposts_goal
      WHEN 'bookmark' THEN v_request.bookmarks_goal
    END;

    v_fulfilled := CASE p_engagement_type
      WHEN 'like' THEN v_request.likes_fulfilled
      WHEN 'comment' THEN v_request.comments_fulfilled
      WHEN 'repost' THEN v_request.reposts_fulfilled
      WHEN 'bookmark' THEN v_request.bookmarks_fulfilled
    END;

    IF v_goal <= 0 THEN
      RAISE EXCEPTION 'This engagement type is not requested';
    END IF;

    IF v_fulfilled >= v_goal THEN
      RAISE EXCEPTION 'Goal already met for this engagement type';
    END IF;
  ELSE
    -- Credit mode: just need the engagement type to be wanted
    IF (p_engagement_type = 'like' AND NOT v_request.want_likes)
      OR (p_engagement_type = 'comment' AND NOT v_request.want_comments)
      OR (p_engagement_type = 'repost' AND NOT v_request.want_reposts)
      OR (p_engagement_type = 'bookmark' AND NOT v_request.want_bookmarks) THEN
      RAISE EXCEPTION 'This engagement type is not requested';
    END IF;
  END IF;

  -- Duplicate check
  IF EXISTS (
    SELECT 1 FROM engagements
    WHERE tweet_request_id = p_tweet_request_id
    AND engager_user_id = v_engager_id
    AND engagement_type = p_engagement_type
  ) THEN
    RAISE EXCEPTION 'Already claimed this engagement';
  END IF;

  -- Create engagement record (auto-verified for now)
  INSERT INTO engagements (
    tweet_request_id, engager_user_id, engagement_type,
    status, credits_earned, claimed_at, verified_at
  )
  VALUES (
    p_tweet_request_id, v_engager_id, p_engagement_type,
    'verified', v_credit_cost, NOW(), NOW()
  )
  RETURNING id INTO v_engagement_id;

  -- Deduct from request escrow
  UPDATE tweet_requests
  SET credits_remaining = credits_remaining - v_credit_cost,
      likes_fulfilled = likes_fulfilled + CASE WHEN p_engagement_type = 'like' THEN 1 ELSE 0 END,
      comments_fulfilled = comments_fulfilled + CASE WHEN p_engagement_type = 'comment' THEN 1 ELSE 0 END,
      reposts_fulfilled = reposts_fulfilled + CASE WHEN p_engagement_type = 'repost' THEN 1 ELSE 0 END,
      bookmarks_fulfilled = bookmarks_fulfilled + CASE WHEN p_engagement_type = 'bookmark' THEN 1 ELSE 0 END
  WHERE id = p_tweet_request_id;

  -- Auto-funnel: if engager has active request in same window, add credits there
  -- Otherwise, add to engager's balance
  SELECT id INTO v_engager_request_id
  FROM tweet_requests
  WHERE user_id = v_engager_id
  AND window_id = v_request.window_id
  AND status = 'active'
  LIMIT 1;

  IF v_engager_request_id IS NOT NULL THEN
    -- Auto-funnel: add credits to engager's active request in same window
    UPDATE tweet_requests
    SET credits_remaining = credits_remaining + v_credit_cost
    WHERE id = v_engager_request_id;

    -- Log transaction: auto-funnel
    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (
      v_engager_id, 'earn', v_credit_cost, v_engagement_id,
      'Collected ' || v_credit_cost || ' credits (' || p_engagement_type || ') → auto-funneled to your request'
    );
  ELSE
    -- No active request in same window: add to balance
    UPDATE users
    SET credits = credits + v_credit_cost
    WHERE id = v_engager_id;

    INSERT INTO transactions (user_id, type, amount, reference_id, description)
    VALUES (
      v_engager_id, 'earn', v_credit_cost, v_engagement_id,
      'Collected ' || v_credit_cost || ' credits for ' || p_engagement_type
    );
  END IF;

  -- Log spend transaction for request owner
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (
    v_request.user_id, 'spend', v_credit_cost, v_engagement_id,
    'Paid ' || v_credit_cost || ' credits for ' || p_engagement_type || ' engagement'
  );

  -- Check if request should be completed
  -- Goal mode: all goals met. Credit mode: no credits remaining.
  IF v_request.submit_mode = 'goal' THEN
    -- Re-read updated values
    PERFORM 1 FROM tweet_requests
    WHERE id = p_tweet_request_id
    AND (likes_goal <= 0 OR likes_fulfilled >= likes_goal)
    AND (comments_goal <= 0 OR comments_fulfilled >= comments_goal)
    AND (reposts_goal <= 0 OR reposts_fulfilled >= reposts_goal)
    AND (bookmarks_goal <= 0 OR bookmarks_fulfilled >= bookmarks_goal);

    IF FOUND THEN
      UPDATE tweet_requests SET status = 'completed' WHERE id = p_tweet_request_id;
    END IF;
  END IF;

  -- Credit mode OR fallback: complete if no credits remain
  IF (SELECT credits_remaining FROM tweet_requests WHERE id = p_tweet_request_id) <= 0 THEN
    UPDATE tweet_requests SET status = 'completed' WHERE id = p_tweet_request_id;
  END IF;

  RETURN v_engagement_id;
END;
$$;

-- =============================================================================
-- 5. RPC: top_up_request
-- =============================================================================

CREATE OR REPLACE FUNCTION top_up_request(
  p_request_id UUID,
  p_amount INT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_credits INT;
  v_request tweet_requests%ROWTYPE;
  v_new_remaining INT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Lock user row
  SELECT credits INTO v_user_credits
  FROM users
  WHERE id = v_user_id
  FOR UPDATE;

  IF v_user_credits < p_amount THEN
    RAISE EXCEPTION 'Insufficient credits';
  END IF;

  -- Lock and validate request
  SELECT * INTO v_request
  FROM tweet_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF v_request IS NULL THEN
    RAISE EXCEPTION 'Request not found';
  END IF;

  IF v_request.user_id != v_user_id THEN
    RAISE EXCEPTION 'Not your request';
  END IF;

  IF v_request.status != 'active' THEN
    RAISE EXCEPTION 'Request is not active';
  END IF;

  -- Deduct from user balance
  UPDATE users
  SET credits = credits - p_amount
  WHERE id = v_user_id;

  -- Add to request escrow
  UPDATE tweet_requests
  SET credits_remaining = credits_remaining + p_amount,
      credits_deposited = credits_deposited + p_amount
  WHERE id = p_request_id
  RETURNING credits_remaining INTO v_new_remaining;

  -- Log transaction
  INSERT INTO transactions (user_id, type, amount, reference_id, description)
  VALUES (
    v_user_id, 'spend', p_amount, p_request_id,
    'Top-up: added ' || p_amount || ' credits to request'
  );

  RETURN v_new_remaining;
END;
$$;

-- =============================================================================
-- 6. RPC: settle_window
--    Returns remaining credits from all active requests in a window
-- =============================================================================

CREATE OR REPLACE FUNCTION settle_window(
  p_window_id TEXT
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request RECORD;
  v_settled_count INT := 0;
BEGIN
  -- Only admin or service role should call this
  -- SECURITY DEFINER runs as the function owner (postgres)

  FOR v_request IN
    SELECT id, user_id, credits_remaining
    FROM tweet_requests
    WHERE window_id = p_window_id
    AND status = 'active'
    FOR UPDATE
  LOOP
    -- Return remaining credits to user
    IF v_request.credits_remaining > 0 THEN
      UPDATE users
      SET credits = credits + v_request.credits_remaining
      WHERE id = v_request.user_id;

      -- Log refund transaction
      INSERT INTO transactions (user_id, type, amount, reference_id, description)
      VALUES (
        v_request.user_id, 'refund', v_request.credits_remaining, v_request.id,
        'Window ' || p_window_id || ' settled: ' || v_request.credits_remaining || ' credits returned'
      );
    END IF;

    -- Mark as completed
    UPDATE tweet_requests
    SET status = 'completed',
        credits_remaining = 0
    WHERE id = v_request.id;

    v_settled_count := v_settled_count + 1;
  END LOOP;

  RETURN v_settled_count;
END;
$$;
