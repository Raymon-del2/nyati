-- Create daily_rate_limits table for tracking 100 requests/day per user
CREATE TABLE IF NOT EXISTS daily_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_key VARCHAR(10) NOT NULL, -- Format: YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, day_key)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_daily_rate_limits_user_day 
ON daily_rate_limits(user_id, day_key);

-- Add RLS policies
ALTER TABLE daily_rate_limits ENABLE ROW LEVEL SECURITY;

-- Allow users to see only their own rate limits
CREATE POLICY "Users can view own daily rate limits" 
ON daily_rate_limits FOR SELECT 
USING (auth.uid() = user_id);

-- Allow service role to insert/update (for the proxy)
CREATE POLICY "Service role can manage daily rate limits" 
ON daily_rate_limits FOR ALL 
USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments
COMMENT ON TABLE daily_rate_limits IS 'Tracks daily API request usage per user (100 req/day limit)';
COMMENT ON COLUMN daily_rate_limits.day_key IS 'Date in YYYY-MM-DD format for daily tracking';
COMMENT ON COLUMN daily_rate_limits.count IS 'Number of API requests made on this day';
