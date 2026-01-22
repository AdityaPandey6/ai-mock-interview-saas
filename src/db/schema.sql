-- User profile
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  plan TEXT DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question bank
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  question TEXT,
  category TEXT,
  topic TEXT,
  difficulty TEXT,
  ideal_answer TEXT,
  rubric JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Interview session
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  category TEXT,
  difficulty TEXT,
  status TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  total_score FLOAT
);

-- Answers
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  question_id UUID REFERENCES questions(id),
  user_answer TEXT,
  llm_score JSONB,
  final_score FLOAT,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
