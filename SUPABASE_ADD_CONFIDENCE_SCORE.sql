-- =====================================================
-- ADD CONFIDENCE_SCORE TO MOCK_SESSIONS TABLE
-- =====================================================
-- Add confidence_score column to track interview confidence

-- Add confidence_score column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'mock_sessions' AND column_name = 'confidence_score'
  ) THEN
    ALTER TABLE mock_sessions 
    ADD COLUMN confidence_score INTEGER;
    
    -- Add check constraint to ensure values are between 0 and 100
    ALTER TABLE mock_sessions
    ADD CONSTRAINT confidence_score_range CHECK (confidence_score >= 0 AND confidence_score <= 100);
    
    RAISE NOTICE 'confidence_score column added successfully';
  ELSE
    RAISE NOTICE 'confidence_score column already exists';
  END IF;
END $$;

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'mock_sessions' AND column_name = 'confidence_score';
