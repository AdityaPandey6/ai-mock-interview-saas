/**
 * LLM Evaluation Types
 * Interview Preparation SaaS - Evaluation Pipeline Types
 */

// =============================================================================
// LLM EVALUATION INPUT
// =============================================================================

export interface EvaluationInput {
  question_text: string;
  ideal_answer: string;
  rubric: EvaluationRubricInput;
  user_answer: string;
}

export interface EvaluationRubricInput {
  concept_accuracy: { max_score: number; weight_description: string };
  example_usage: { max_score: number; weight_description: string };
  edge_cases: { max_score: number; weight_description: string };
  clarity: { max_score: number; weight_description: string };
}

// =============================================================================
// LLM EVALUATION OUTPUT (STRICT JSON)
// =============================================================================

export interface EvaluationResult {
  concept_accuracy: number;
  example_usage: number;
  edge_cases: number;
  clarity: number;
  final_score: number;
  overall_feedback: string;
  improvement_tips: string;
}

// =============================================================================
// EVALUATION METADATA
// =============================================================================

export interface EvaluationMetadata {
  model_used: string;
  model_version: string;
  evaluation_timestamp: string;
  processing_time_ms: number;
  token_usage?: TokenUsage;
  retry_count?: number;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// =============================================================================
// COMPLETE EVALUATION RESPONSE
// =============================================================================

export interface EvaluationResponse {
  success: boolean;
  data?: EvaluationResult;
  metadata?: EvaluationMetadata;
  error?: EvaluationError;
}

export interface EvaluationError {
  code: string;
  message: string;
  details?: string;
}

// =============================================================================
// LLM CONFIGURATION
// =============================================================================

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  model: string;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini', // Cost-effective, fast
  temperature: 0.1,     // Low for deterministic output
  max_tokens: 1024,
  top_p: 0.95,
  frequency_penalty: 0,
  presence_penalty: 0,
};

// =============================================================================
// VALIDATION BOUNDS
// =============================================================================

export const SCORE_BOUNDS = {
  concept_accuracy: { min: 0, max: 4 },
  example_usage: { min: 0, max: 3 },
  edge_cases: { min: 0, max: 2 },
  clarity: { min: 0, max: 1 },
  final_score: { min: 0, max: 10 },
} as const;
