# Supabase Backend Setup Guide

## Steps to Set Up Your Supabase Backend

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query** to create a new SQL query

### Step 2: Run the Setup SQL Script
1. Copy all the SQL from [SUPABASE_SETUP.sql](./SUPABASE_SETUP.sql)
2. Paste it into the SQL Editor
3. Click **Run** (or press `Cmd+Enter` / `Ctrl+Enter`)
4. Wait for the queries to complete successfully

### Step 3: Verify the Setup
Run these queries one by one to verify everything was created:

```sql
-- Check if tables exist and see their structure
SELECT * FROM questions LIMIT 1;
SELECT * FROM attempts LIMIT 1;

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies 
WHERE tablename IN ('questions', 'attempts');

-- Count inserted questions
SELECT COUNT(*) FROM questions;
```

### Step 4: Test Your Setup (Optional)
You can test the RLS policies by:
1. Creating a test user (or use your existing user)
2. Running inserts to the attempts table
3. Verifying that SELECT queries respect the RLS policies

---

## What Was Created

### Tables
- **questions** - Stores interview questions with difficulty levels and topics
- **attempts** - Tracks user attempts at answering questions

### Security (RLS Policies)
✅ Questions table - Public read access (everyone can see questions)  
✅ Attempts table - Private (users can only see/edit their own attempts)

### Sample Data
✅ 11 interview questions across JavaScript and Backend topics  
✅ Covering Easy, Medium, and Hard difficulty levels

---

## API Integration in React

Once the backend is ready, you can fetch data in your React app:

```typescript
// Fetch all questions
const { data: questions, error } = await supabase
  .from('questions')
  .select('*');

// Submit an attempt
const { data, error } = await supabase
  .from('attempts')
  .insert({
    user_id: user.id,
    question_id: questionId,
    is_correct: isCorrect,
    time_taken: timeTaken
  });

// Get user's attempts
const { data: attempts, error } = await supabase
  .from('attempts')
  .select('*')
  .eq('user_id', user.id);
```

---

## Next Steps

1. ✅ Run the SQL setup script
2. ⬜ Create React components to display questions
3. ⬜ Build quiz logic to track attempts
4. ⬜ Create dashboard to show user statistics
5. ⬜ Add leaderboard features (if needed)
