-- Create mock_sessions table
CREATE TABLE mock_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_questions INT NOT NULL,
  score INT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mock_sessions ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can INSERT their own mock sessions
CREATE POLICY "Users can insert their own mock sessions"
  ON mock_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 2: Users can SELECT their own mock sessions
CREATE POLICY "Users can select their own mock sessions"
  ON mock_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create index on user_id for faster queries
CREATE INDEX idx_mock_sessions_user_id ON mock_sessions(user_id);

-- Create index on created_at for sorting by date
CREATE INDEX idx_mock_sessions_created_at ON mock_sessions(created_at DESC);
