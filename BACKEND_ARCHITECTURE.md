# Interview Preparation SaaS - Backend Architecture

## Overview

This document describes the backend architecture for the Interview Preparation SaaS platform, including database schema, LLM evaluation pipeline, and optimization strategies.

---

## 1. Question Data Schema

### JSON Schema Location
- Schema: `supabase/seed/question_schema.json`
- Sample Data: `supabase/seed/sample_questions.json`
- TypeScript Types: `src/lib/types/question.types.ts`

### Rubric Scoring (Total = 10)

| Criterion | Max Score | Weight |
|-----------|-----------|--------|
| concept_accuracy | 4 | Core technical understanding |
| example_usage | 3 | Practical code examples |
| edge_cases | 2 | Edge cases and considerations |
| clarity | 1 | Communication quality |

### Sample Question Entry

```json
{
  "title": "JavaScript Closures",
  "question_text": "Explain what closures are in JavaScript...",
  "category": "frontend",
  "topic": "JavaScript Fundamentals",
  "difficulty": "medium",
  "ideal_answer": "A closure is a function that has access to variables from its outer function's scope...",
  "rubric": {
    "concept_accuracy": {
      "max_score": 4,
      "weight_description": "Accurate explanation of closure definition and mechanism",
      "scoring_guide": [
        { "score": 0, "description": "No understanding" },
        { "score": 4, "description": "Excellent explanation" }
      ]
    },
    "example_usage": { "max_score": 3, "..." },
    "edge_cases": { "max_score": 2, "..." },
    "clarity": { "max_score": 1, "..." }
  },
  "tags": ["javascript", "closures"],
  "estimated_time_minutes": 8
}
```

---

## 2. Database Schema

### Location
- Migration: `supabase/migrations/001_initial_schema.sql`
- TypeScript Types: `src/lib/types/database.types.ts`

### Tables

#### profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free',
  daily_evaluations_used INTEGER DEFAULT 0,
  daily_evaluations_reset_at TIMESTAMPTZ,
  total_interviews_completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### questions
```sql
CREATE TABLE questions (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  question_text TEXT NOT NULL,
  category question_category NOT NULL,
  topic TEXT NOT NULL,
  difficulty question_difficulty NOT NULL,
  ideal_answer TEXT NOT NULL,
  rubric JSONB NOT NULL,  -- Validated with constraints
  tags TEXT[],
  estimated_time_minutes INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### interview_sessions
```sql
CREATE TABLE interview_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  session_type session_type NOT NULL,
  category_filter question_category,
  difficulty_filter question_difficulty,
  total_questions INTEGER DEFAULT 0,
  completed_questions INTEGER DEFAULT 0,
  total_score DECIMAL(5,2),
  max_possible_score DECIMAL(5,2),
  status session_status DEFAULT 'in_progress',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

#### answers
```sql
CREATE TABLE answers (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES interview_sessions(id),
  question_id UUID REFERENCES questions(id),
  user_id UUID REFERENCES profiles(id),
  user_answer TEXT NOT NULL,
  evaluation_result JSONB,  -- LLM evaluation output
  evaluation_metadata JSONB, -- Model info, timing, tokens
  time_taken_seconds INTEGER,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Key Features
- JSONB constraints validate rubric and evaluation result structure
- Row Level Security (RLS) enforces user data isolation
- Automatic `updated_at` triggers
- Profile auto-creation on auth signup
- Rate limiting via stored functions

---

## 3. LLM Evaluation Pipeline

### Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│  Edge Function   │────▶│   LLM Provider  │
│   (React)       │     │ evaluate-answer  │     │ (OpenAI/Claude) │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │    Supabase      │
                        │    (Postgres)    │
                        └──────────────────┘
```

### Prompt Template

**System Prompt:**
```
You are an expert technical interviewer. Evaluate answers with STRICT scoring rules:
1. Return ONLY valid JSON
2. Do NOT exceed max_score for any criterion
3. Be objective and consistent
4. Base scores on demonstrated knowledge only
5. final_score MUST equal sum of individual scores
6. Scores MUST be integers
```

**User Prompt Structure:**
```
## QUESTION
{question_text}

## IDEAL ANSWER (Reference)
{ideal_answer}

## EVALUATION RUBRIC (STRICT LIMITS)
1. concept_accuracy (0-4): {weight_description}
2. example_usage (0-3): {weight_description}
3. edge_cases (0-2): {weight_description}
4. clarity (0-1): {weight_description}

## CANDIDATE'S ANSWER
{user_answer}

## REQUIRED OUTPUT (JSON ONLY)
{"concept_accuracy":..., "final_score":..., "overall_feedback":"...", "improvement_tips":"..."}
```

### Expected Output

```json
{
  "concept_accuracy": 3,
  "example_usage": 2,
  "edge_cases": 1,
  "clarity": 1,
  "final_score": 7,
  "overall_feedback": "Good understanding of closures with a practical example...",
  "improvement_tips": "Consider discussing memory implications and common pitfalls..."
}
```

### Validation Strategy

1. **JSON Parsing Recovery**
   - Direct parse attempt
   - Extract from markdown code blocks
   - Find JSON object pattern in response
   - Fix common issues (trailing commas, single quotes)

2. **Score Validation**
   - Verify each score is within bounds
   - Round non-integers
   - Clamp out-of-range values
   - Recalculate final_score if mismatched

3. **Retry Strategy**
   - Retry 1: Same prompt
   - Retry 2: Simplified prompt
   - Fallback: Default scores with error message

### Edge Function Handler

**Location:** `supabase/functions/evaluate-answer/index.ts`

**Flow:**
```
1. Authenticate user (JWT verification)
2. Check rate limit (daily evaluations)
3. Fetch question data
4. Build evaluation prompt
5. Call LLM with retry logic
6. Validate and repair response
7. Update answer record
8. Increment usage counter
9. Return result
```

---

## 4. Optimization Strategies

### Cost Optimization

| Strategy | Implementation |
|----------|---------------|
| Use cost-effective models | GPT-4o-mini ($0.15/1M input, $0.60/1M output) |
| Limit output tokens | max_tokens: 1024 |
| Cache common questions | (Future: Redis caching layer) |
| Prompt efficiency | Structured prompts, no unnecessary context |
| Rate limiting | Tier-based daily limits |

### Performance Optimization

| Strategy | Implementation |
|----------|---------------|
| Low temperature | 0.1 for deterministic output |
| JSON mode | response_format: { type: 'json_object' } |
| Connection pooling | Supabase handles this |
| Indexed queries | Category, difficulty, topic indexes |
| Edge Functions | Deployed close to users |

### Scalability

| Strategy | Implementation |
|----------|---------------|
| Stateless functions | Edge Functions scale automatically |
| Database optimization | Proper indexes, RLS policies |
| Model swapping | Provider abstraction layer |
| Horizontal scaling | Serverless architecture |

### Model Swapping Support

```typescript
const LLM_CONFIGS = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    baseUrl: 'https://api.anthropic.com/v1',
  },
};

// Switch providers via environment variable
const provider = Deno.env.get('LLM_PROVIDER') || 'openai';
```

---

## 5. File Structure

```
supabase/
├── config.toml                 # Supabase project config
├── migrations/
│   └── 001_initial_schema.sql  # Database schema
├── functions/
│   └── evaluate-answer/
│       └── index.ts            # Edge Function handler
└── seed/
    ├── question_schema.json    # JSON Schema for validation
    ├── sample_questions.json   # Sample question data
    └── seed_questions.sql      # SQL seed script

src/lib/
├── index.ts                    # Main exports
├── config/
│   └── index.ts                # Application configuration
├── types/
│   ├── index.ts
│   ├── question.types.ts       # Question type definitions
│   ├── evaluation.types.ts     # Evaluation type definitions
│   └── database.types.ts       # Database type definitions
├── validation/
│   ├── index.ts
│   └── evaluation-validator.ts # Response validation
└── services/
    ├── index.ts
    ├── llm-prompts.ts          # Prompt templates
    ├── llm-client.ts           # LLM provider abstraction
    └── evaluation-service.ts   # High-level evaluation API
```

---

## 6. Deployment

### Environment Variables

```bash
# Supabase
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...

# LLM (set via Supabase secrets)
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set LLM_PROVIDER=openai
```

### Database Migration

```bash
supabase db push
```

### Seed Data

```bash
supabase db seed --file supabase/seed/seed_questions.sql
```

### Deploy Edge Functions

```bash
supabase functions deploy evaluate-answer
```

---

## 7. Security Considerations

1. **Authentication**: All API calls require valid JWT
2. **Row Level Security**: Users can only access their own data
3. **Input Validation**: All inputs validated before processing
4. **Rate Limiting**: Prevents abuse and controls costs
5. **Secrets Management**: API keys stored in Supabase secrets
6. **CORS**: Properly configured for production domains
