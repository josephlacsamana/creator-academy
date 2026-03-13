-- Phase 4: Leaderboard RPC function
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_leaderboard(
  p_period TEXT DEFAULT 'all',
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  user_id UUID,
  x_username TEXT,
  x_display_name TEXT,
  x_avatar_url TEXT,
  is_verified BOOLEAN,
  tweet_score FLOAT,
  ethos_score FLOAT,
  total_credits_collected BIGINT,
  total_engagements BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_since TIMESTAMPTZ;
BEGIN
  IF p_period = 'week' THEN
    v_since := NOW() - INTERVAL '7 days';
  ELSIF p_period = 'month' THEN
    v_since := NOW() - INTERVAL '30 days';
  ELSE
    v_since := '1970-01-01'::TIMESTAMPTZ;
  END IF;

  RETURN QUERY
  SELECT
    u.id AS user_id,
    u.x_username,
    u.x_display_name,
    u.x_avatar_url,
    u.is_verified,
    u.tweet_score,
    u.ethos_score,
    COALESCE(SUM(e.credits_earned), 0)::BIGINT AS total_credits_collected,
    COUNT(e.id)::BIGINT AS total_engagements
  FROM users u
  LEFT JOIN engagements e ON e.engager_user_id = u.id
    AND e.status = 'verified'
    AND e.created_at >= v_since
  GROUP BY u.id, u.x_username, u.x_display_name, u.x_avatar_url, u.is_verified, u.tweet_score, u.ethos_score
  HAVING COALESCE(SUM(e.credits_earned), 0) > 0
  ORDER BY total_credits_collected DESC
  LIMIT p_limit;
END;
$$;
