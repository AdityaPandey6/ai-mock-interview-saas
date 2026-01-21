/**
 * Database Types
 * Interview Preparation SaaS - Supabase Database Types
 */

import type { EvaluationRubric, QuestionCategory, QuestionDifficulty } from './question.types';
import type { EvaluationResult, EvaluationMetadata } from './evaluation.types';

// =============================================================================
// PROFILES TABLE
// =============================================================================

export interface Profile {
  id: string;                          // UUID, references auth.users
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  daily_evaluations_used: number;
  daily_evaluations_reset_at: string;  // timestamp
  total_interviews_completed: number;
  created_at: string;
  updated_at: string;
}

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export const TIER_LIMITS: Record<SubscriptionTier, number> = {
  free: 5,
  pro: 50,
  enterprise: -1, // unlimited
};

// =============================================================================
// QUESTIONS TABLE
// =============================================================================

export interface QuestionRow {
  id: string;                          // UUID
  title: string;
  question_text: string;
  category: QuestionCategory;
  topic: string;
  difficulty: QuestionDifficulty;
  ideal_answer: string;
  rubric: EvaluationRubric;            // JSONB
  tags: string[];                      // text[]
  estimated_time_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INTERVIEW SESSIONS TABLE
// =============================================================================

export interface InterviewSession {
  id: string;                          // UUID
  user_id: string;                     // references profiles.id
  title: string;
  session_type: SessionType;
  category_filter: QuestionCategory | null;
  difficulty_filter: QuestionDifficulty | null;
  total_questions: number;
  completed_questions: number;
  total_score: number | null;
  max_possible_score: number | null;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SessionType = 'practice' | 'mock_interview' | 'timed_test';
export type SessionStatus = 'in_progress' | 'completed' | 'abandoned';

// =============================================================================
// ANSWERS TABLE
// =============================================================================

export interface Answer {
  id: string;                          // UUID
  session_id: string;                  // references interview_sessions.id
  question_id: string;                 // references questions.id
  user_id: string;                     // references profiles.id
  user_answer: string;
  evaluation_result: EvaluationResult | null;  // JSONB
  evaluation_metadata: EvaluationMetadata | null; // JSONB
  time_taken_seconds: number | null;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// INSERT/UPDATE TYPES
// =============================================================================

export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

export type QuestionInsert = Omit<QuestionRow, 'id' | 'created_at' | 'updated_at'>;
export type QuestionUpdate = Partial<Omit<QuestionRow, 'id' | 'created_at'>>;

export type InterviewSessionInsert = Omit<InterviewSession, 'id' | 'created_at' | 'updated_at'>;
export type InterviewSessionUpdate = Partial<Omit<InterviewSession, 'id' | 'created_at'>>;

export type AnswerInsert = Omit<Answer, 'id' | 'created_at' | 'updated_at'>;
export type AnswerUpdate = Partial<Omit<Answer, 'id' | 'created_at'>>;

// =============================================================================
// SUPABASE DATABASE TYPE (for client generation)
// =============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      questions: {
        Row: QuestionRow;
        Insert: QuestionInsert;
        Update: QuestionUpdate;
      };
      interview_sessions: {
        Row: InterviewSession;
        Insert: InterviewSessionInsert;
        Update: InterviewSessionUpdate;
      };
      answers: {
        Row: Answer;
        Insert: AnswerInsert;
        Update: AnswerUpdate;
      };
    };
  };
}
