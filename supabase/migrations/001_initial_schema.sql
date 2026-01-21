-- =============================================================================
-- Interview Preparation SaaS - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization

-- =============================================================================
-- CUSTOM TYPES (ENUMS)
-- =============================================================================

CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE question_category AS ENUM (
  'frontend',
  'backend', 
  'system_design',
  'data_structures',
  'algorithms',
  'databases',
  'devops',
  'behavioral'
);
CREATE TYPE question_difficulty AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE session_type AS ENUM ('practice', 'mock_interview', 'timed_test');
CREATE TYPE session_status AS ENUM ('in_progress', 'completed', 'abandoned');

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  daily_evaluations_used INTEGER NOT NULL DEFAULT 0,
  daily_evaluations_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_interviews_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for subscription tier queries
CREATE INDEX idx_profiles_subscription_tier ON profiles(subscription_tier);

-- =============================================================================
-- QUESTIONS TABLE
-- =============================================================================

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  category question_category NOT NULL,
  topic TEXT NOT NULL,
  difficulty question_difficulty NOT NULL,
  ideal_answer TEXT NOT NULL,
  rubric JSONB NOT NULL,
  tags TEXT[] DEFAULT '{}',
  estimated_time_minutes INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_rubric CHECK (
    rubric ? 'concept_accuracy' AND
    rubric ? 'example_usage' AND
    rubric ? 'edge_cases' AND
    rubric ? 'clarity' AND
    (rubric->'concept_accuracy'->>'max_score')::int = 4 AND
    (rubric->'example_usage'->>'max_score')::int = 3 AND
    (rubric->'edge_cases'->>'max_score')::int = 2 AND
    (rubric->'clarity'->>'max_score')::int = 1
  ),
  CONSTRAINT positive_time CHECK (estimated_time_minutes IS NULL OR estimated_time_minutes > 0)
);

-- Indexes for common query patterns
CREATE INDEX idx_questions_category ON questions(category) WHERE is_active = true;
CREATE INDEX idx_questions_difficulty ON questions(difficulty) WHERE is_active = true;
CREATE INDEX idx_questions_topic ON questions(topic) WHERE is_active = true;
CREATE INDEX idx_questions_category_difficulty ON questions(category, difficulty) WHERE is_active = true;
CREATE INDEX idx_questions_tags ON questions USING GIN(tags) WHERE is_active = true;

-- Full-text search index on question text
CREATE INDEX idx_questions_text_search ON questions 
  USING GIN(to_tsvector('english', question_text || ' ' || title));

-- =============================================================================
-- INTERVIEW SESSIONS TABLE
-- =============================================================================

CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  session_type session_type NOT NULL,
  category_filter question_category,
  difficulty_filter question_difficulty,
  total_questions INTEGER NOT NULL DEFAULT 0,
  completed_questions INTEGER NOT NULL DEFAULT 0,
  total_score DECIMAL(5,2),
  max_possible_score DECIMAL(5,2),
  status session_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_question_counts CHECK (completed_questions <= total_questions),
  CONSTRAINT valid_score CHECK (total_score IS NULL OR (total_score >= 0 AND total_score <= max_possible_score))
);

-- Indexes for session queries
CREATE INDEX idx_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX idx_sessions_user_status ON interview_sessions(user_id, status);
CREATE INDEX idx_sessions_user_created ON interview_sessions(user_id, created_at DESC);

-- =============================================================================
-- ANSWERS TABLE
-- =============================================================================

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  evaluation_result JSONB,
  evaluation_metadata JSONB,
  time_taken_seconds INTEGER,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_evaluation_result CHECK (
    evaluation_result IS NULL OR (
      evaluation_result ? 'concept_accuracy' AND
      evaluation_result ? 'example_usage' AND
      evaluation_result ? 'edge_cases' AND
      evaluation_result ? 'clarity' AND
      evaluation_result ? 'final_score' AND
      evaluation_result ? 'overall_feedback' AND
      evaluation_result ? 'improvement_tips' AND
      (evaluation_result->>'concept_accuracy')::decimal >= 0 AND
      (evaluation_result->>'concept_accuracy')::decimal <= 4 AND
      (evaluation_result->>'example_usage')::decimal >= 0 AND
      (evaluation_result->>'example_usage')::decimal <= 3 AND
      (evaluation_result->>'edge_cases')::decimal >= 0 AND
      (evaluation_result->>'edge_cases')::decimal <= 2 AND
      (evaluation_result->>'clarity')::decimal >= 0 AND
      (evaluation_result->>'clarity')::decimal <= 1 AND
      (evaluation_result->>'final_score')::decimal >= 0 AND
      (evaluation_result->>'final_score')::decimal <= 10
    )
  ),
  CONSTRAINT positive_time_taken CHECK (time_taken_seconds IS NULL OR time_taken_seconds >= 0),
  
  -- Prevent duplicate answers for same question in same session
  CONSTRAINT unique_session_question UNIQUE(session_id, question_id)
);

-- Indexes for answer queries
CREATE INDEX idx_answers_session_id ON answers(session_id);
CREATE INDEX idx_answers_user_id ON answers(user_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_user_created ON answers(user_id, created_at DESC);
CREATE INDEX idx_answers_flagged ON answers(user_id) WHERE is_flagged = true;

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_interview_sessions_updated_at
  BEFORE UPDATE ON interview_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at
  BEFORE UPDATE ON answers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questions: All authenticated users can view active questions
CREATE POLICY "Authenticated users can view active questions"
  ON questions FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Interview Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions"
  ON interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Answers: Users can only access their own answers
CREATE POLICY "Users can view own answers"
  ON answers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own answers"
  ON answers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own answers"
  ON answers FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check and reset daily evaluation limits
CREATE OR REPLACE FUNCTION check_evaluation_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_limit INTEGER;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  
  -- Reset counter if it's a new day
  IF v_profile.daily_evaluations_reset_at < CURRENT_DATE THEN
    UPDATE profiles 
    SET daily_evaluations_used = 0, 
        daily_evaluations_reset_at = NOW()
    WHERE id = p_user_id;
    RETURN true;
  END IF;
  
  -- Get limit based on subscription tier
  v_limit := CASE v_profile.subscription_tier
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 50
    WHEN 'enterprise' THEN -1  -- unlimited
    ELSE 5
  END;
  
  -- Check if under limit (-1 means unlimited)
  IF v_limit = -1 OR v_profile.daily_evaluations_used < v_limit THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment evaluation counter
CREATE OR REPLACE FUNCTION increment_evaluation_count(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET daily_evaluations_used = daily_evaluations_used + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update session statistics when answer is submitted
CREATE OR REPLACE FUNCTION update_session_on_answer()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if evaluation result is set
  IF NEW.evaluation_result IS NOT NULL THEN
    UPDATE interview_sessions
    SET 
      completed_questions = completed_questions + 1,
      total_score = COALESCE(total_score, 0) + (NEW.evaluation_result->>'final_score')::decimal,
      max_possible_score = COALESCE(max_possible_score, 0) + 10,
      updated_at = NOW()
    WHERE id = NEW.session_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_session_stats
  AFTER INSERT OR UPDATE OF evaluation_result ON answers
  FOR EACH ROW EXECUTE FUNCTION update_session_on_answer();

-- =============================================================================
-- PROFILE AUTO-CREATION ON AUTH SIGNUP
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
