-- =====================================================
-- SUPABASE BACKEND SETUP - SQL SCRIPT
-- =====================================================

-- 1. CREATE QUESTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_text TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. CREATE ATTEMPTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  is_correct BOOLEAN DEFAULT FALSE,
  time_taken INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;

-- 4. CREATE RLS POLICIES FOR QUESTIONS TABLE
-- =====================================================
-- Policy: Allow SELECT for everyone (everyone can see all questions)
CREATE POLICY "Allow SELECT for everyone" ON questions
  FOR SELECT
  USING (true);

-- 5. CREATE RLS POLICIES FOR ATTEMPTS TABLE
-- =====================================================
-- Policy: Allow INSERT when auth.uid() = user_id
CREATE POLICY "Allow INSERT for authenticated users" ON attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Allow SELECT when auth.uid() = user_id (users can only see their own attempts)
CREATE POLICY "Allow SELECT own attempts" ON attempts
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Allow UPDATE own attempts
CREATE POLICY "Allow UPDATE own attempts" ON attempts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. INSERT SAMPLE INTERVIEW QUESTIONS (10+ questions)
-- =====================================================
INSERT INTO questions (question_text, topic, difficulty, answer) VALUES

-- Easy Questions
('What is the difference between let and var in JavaScript?', 'JavaScript', 'Easy', 
'let is block-scoped and cannot be redeclared in the same scope, while var is function-scoped and can be redeclared. let is the modern standard.'),

('What does the === operator do in JavaScript?', 'JavaScript', 'Easy',
'The === operator performs a strict equality check, comparing both value and type without type coercion. For example, "5" === 5 returns false.'),

('What is a closure in JavaScript?', 'JavaScript', 'Easy',
'A closure is a function that has access to variables from its outer (enclosing) function scope, even after the outer function returns.'),

('What is the difference between null and undefined?', 'JavaScript', 'Easy',
'undefined is a type representing an uninitialized variable or missing parameter. null is an assignment value representing no value.'),

-- Medium Questions
('What is async/await and how does it differ from promises?', 'JavaScript', 'Medium',
'async/await is syntactic sugar for promises that makes asynchronous code look synchronous. async functions return promises, and await pauses execution until a promise resolves.'),

('Explain the event loop in JavaScript.', 'JavaScript', 'Medium',
'The event loop continuously checks if the call stack is empty. If empty, it moves callbacks from the callback queue to the call stack, enabling asynchronous operations.'),

('What is the difference between map() and filter() array methods?', 'JavaScript', 'Medium',
'map() transforms each element in an array and returns a new array with the same length. filter() returns a new array with only elements that pass a test.'),

('How does prototypal inheritance work in JavaScript?', 'JavaScript', 'Medium',
'JavaScript uses prototypal inheritance where objects inherit properties from their prototype. Objects can inherit from other objects through their prototype chain.'),

-- Hard Questions
('What is the difference between shallow copy and deep copy?', 'JavaScript', 'Hard',
'Shallow copy copies the top level properties; nested objects are still referenced. Deep copy recursively copies all levels, creating entirely independent objects.'),

('How would you implement a debounce function?', 'JavaScript', 'Hard',
'A debounce function delays invoking a function until after a wait time has passed since the last call. It''s useful for optimizing events like window resize or search input.'),

('Explain the difference between REST and GraphQL.', 'Backend', 'Hard',
'REST uses multiple endpoints returning fixed data structures. GraphQL uses a single endpoint with flexible queries, clients request exactly what data they need, reducing over-fetching.');

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify your setup:
-- SELECT * FROM questions;
-- SELECT * FROM attempts;
-- SELECT * FROM information_schema.tables WHERE table_name IN ('questions', 'attempts');
