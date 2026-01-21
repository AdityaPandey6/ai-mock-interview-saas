-- =====================================================
-- ADD ANSWER TEXT COLUMN TO ATTEMPTS TABLE
-- =====================================================

-- Add answer_text column to attempts table
ALTER TABLE attempts 
ADD COLUMN answer_text TEXT;

-- Verify the column was added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'attempts' 
ORDER BY ordinal_position;
