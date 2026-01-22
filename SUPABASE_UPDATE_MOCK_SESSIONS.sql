-- =====================================================
-- UPDATE MOCK_SESSIONS TABLE
-- =====================================================
-- Add missing columns used by the application

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'status'
  ) THEN
    ALTER TABLE mock_sessions 
    ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned'));
  END IF;
END $$;

-- Add started_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'started_at'
  ) THEN
    ALTER TABLE mock_sessions 
    ADD COLUMN started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Add ended_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE mock_sessions 
    ADD COLUMN ended_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Update score column to total_score if needed
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'score'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'total_score'
  ) THEN
    ALTER TABLE mock_sessions 
    RENAME COLUMN score TO total_score;
  END IF;
END $$;

-- Add total_score if it doesn't exist at all
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'total_score'
  ) THEN
    ALTER TABLE mock_sessions 
    ADD COLUMN total_score INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add policy for updating mock sessions
DROP POLICY IF EXISTS "Users can update their own mock sessions" ON mock_sessions;
CREATE POLICY "Users can update their own mock sessions"
  ON mock_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mock_sessions' 
ORDER BY ordinal_position;
