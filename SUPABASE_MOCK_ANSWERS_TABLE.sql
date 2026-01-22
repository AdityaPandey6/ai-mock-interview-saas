-- =====================================================
-- CREATE MOCK_ANSWERS TABLE
-- =====================================================
-- This table stores individual answers for mock interview sessions

CREATE TABLE IF NOT EXISTS mock_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES mock_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  llm_score JSONB NOT NULL,
  final_score INTEGER NOT NULL CHECK (final_score >= 0 AND final_score <= 10),
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate answers for same question in same session
  CONSTRAINT unique_mock_session_question UNIQUE(session_id, question_id)
);

-- Enable Row Level Security
ALTER TABLE mock_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can INSERT their own answers
CREATE POLICY "Users can insert their own mock answers"
  ON mock_answers
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can SELECT their own answers
CREATE POLICY "Users can select their own mock answers"
  ON mock_answers
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_mock_answers_session_id ON mock_answers(session_id);
CREATE INDEX idx_mock_answers_user_id ON mock_answers(user_id);
CREATE INDEX idx_mock_answers_question_id ON mock_answers(question_id);
CREATE INDEX idx_mock_answers_created_at ON mock_answers(created_at DESC);

-- Add comment
COMMENT ON TABLE mock_answers IS 'Stores individual question answers and evaluations for mock interview sessions';
