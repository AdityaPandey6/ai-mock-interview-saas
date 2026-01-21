/**
 * Question Data Types
 * Interview Preparation SaaS - Type Definitions
 */

// =============================================================================
// RUBRIC TYPES
// =============================================================================

/**
 * Evaluation rubric with weighted scoring
 * Total score MUST equal 10
 */
export interface EvaluationRubric {
  concept_accuracy: RubricCriteria;
  example_usage: RubricCriteria;
  edge_cases: RubricCriteria;
  clarity: RubricCriteria;
}

export interface RubricCriteria {
  max_score: number;
  weight_description: string;
  scoring_guide: ScoringLevel[];
}

export interface ScoringLevel {
  score: number;
  description: string;
}

// =============================================================================
// QUESTION TYPES
// =============================================================================

export type QuestionCategory = 
  | 'frontend'
  | 'backend'
  | 'system_design'
  | 'data_structures'
  | 'algorithms'
  | 'databases'
  | 'devops'
  | 'behavioral';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export type QuestionTopic = string; // Flexible for various topics

export interface Question {
  id?: string;
  title: string;
  question_text: string;
  category: QuestionCategory;
  topic: QuestionTopic;
  difficulty: QuestionDifficulty;
  ideal_answer: string;
  rubric: EvaluationRubric;
  tags?: string[];
  estimated_time_minutes?: number;
  created_at?: string;
  updated_at?: string;
}

// =============================================================================
// QUESTION SEED FORMAT (for bulk import)
// =============================================================================

export interface QuestionSeed {
  title: string;
  question_text: string;
  category: QuestionCategory;
  topic: QuestionTopic;
  difficulty: QuestionDifficulty;
  ideal_answer: string;
  rubric: EvaluationRubric;
  tags?: string[];
  estimated_time_minutes?: number;
}

// =============================================================================
// VALIDATION
// =============================================================================

export const RUBRIC_WEIGHTS = {
  concept_accuracy: 4,
  example_usage: 3,
  edge_cases: 2,
  clarity: 1,
} as const;

export const TOTAL_RUBRIC_SCORE = 10;

export function validateRubricWeights(rubric: EvaluationRubric): boolean {
  const total = 
    rubric.concept_accuracy.max_score +
    rubric.example_usage.max_score +
    rubric.edge_cases.max_score +
    rubric.clarity.max_score;
  
  return total === TOTAL_RUBRIC_SCORE;
}
