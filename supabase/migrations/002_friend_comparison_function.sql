-- Friend Comparison Function
-- Returns comparison data between two users based on their poll votes

CREATE OR REPLACE FUNCTION get_friend_comparison(
  current_user_id UUID,
  friend_user_id UUID
)
RETURNS TABLE (
  poll_id UUID,
  question TEXT,
  options TEXT[],
  user_option INTEGER,
  friend_option INTEGER,
  comparison_type TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH user_votes AS (
    SELECT 
      poll_id,
      option_index,
      created_at
    FROM poll_votes 
    WHERE user_id = current_user_id
  ),
  friend_votes AS (
    SELECT 
      poll_id,
      option_index,
      created_at
    FROM poll_votes 
    WHERE user_id = friend_user_id
  ),
  comparisons AS (
    SELECT 
      COALESCE(u.poll_id, f.poll_id) as poll_id,
      u.option_index as user_option,
      f.option_index as friend_option,
      CASE 
        WHEN u.option_index = f.option_index THEN 'match'
        ELSE 'different'
      END as comparison_type
    FROM user_votes u
    FULL OUTER JOIN friend_votes f ON u.poll_id = f.poll_id
    WHERE u.poll_id IS NOT NULL AND f.poll_id IS NOT NULL
  )
  SELECT 
    c.poll_id,
    p.question,
    p.options,
    c.user_option,
    c.friend_option,
    c.comparison_type
  FROM comparisons c
  JOIN polls p ON c.poll_id = p.id
  ORDER BY p.created_at DESC;
END;
$$;
