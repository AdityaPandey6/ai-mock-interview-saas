/**
 * Evaluation Response Validator
 * Interview Preparation SaaS - LLM Response Validation
 * 
 * Validates and sanitizes LLM evaluation responses to ensure
 * strict adherence to rubric scoring limits and JSON format.
 */

import type { EvaluationResult, EvaluationRubricInput } from '../types/evaluation.types';
import { SCORE_BOUNDS } from '../types/evaluation.types';

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

export interface ValidationResult {
  isValid: boolean;
  data?: EvaluationResult;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  wasRepaired: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  received: unknown;
  expected: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  action: string;
}

// =============================================================================
// JSON PARSING WITH RECOVERY
// =============================================================================

export function parseEvaluationResponse(rawResponse: string): {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
} {
  // Step 1: Try direct parsing
  try {
    const parsed = JSON.parse(rawResponse);
    return { success: true, data: parsed };
  } catch {
    // Continue to recovery steps
  }

  // Step 2: Extract JSON from markdown code blocks
  const jsonBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch) {
    try {
      const parsed = JSON.parse(jsonBlockMatch[1].trim());
      return { success: true, data: parsed };
    } catch {
      // Continue to next step
    }
  }

  // Step 3: Find JSON object pattern in response
  const jsonObjectMatch = rawResponse.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    try {
      const parsed = JSON.parse(jsonObjectMatch[0]);
      return { success: true, data: parsed };
    } catch {
      // Continue to next step
    }
  }

  // Step 4: Attempt to fix common JSON issues
  let sanitized = rawResponse
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/,\s*}/g, '}')          // Remove trailing commas
    .replace(/,\s*]/g, ']')          // Remove trailing commas in arrays
    .replace(/'/g, '"')              // Replace single quotes
    .trim();

  // Extract JSON object after sanitization
  const sanitizedMatch = sanitized.match(/\{[\s\S]*\}/);
  if (sanitizedMatch) {
    try {
      const parsed = JSON.parse(sanitizedMatch[0]);
      return { success: true, data: parsed };
    } catch {
      // Final failure
    }
  }

  return { 
    success: false, 
    error: 'Failed to parse response as JSON after all recovery attempts' 
  };
}

// =============================================================================
// SCORE VALIDATION & REPAIR
// =============================================================================

function validateAndRepairScore(
  value: unknown,
  field: keyof typeof SCORE_BOUNDS,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): { score: number; wasRepaired: boolean } {
  const bounds = SCORE_BOUNDS[field];
  let wasRepaired = false;

  // Handle missing value
  if (value === undefined || value === null) {
    errors.push({
      field,
      message: `Missing required field`,
      received: value,
      expected: `number between ${bounds.min} and ${bounds.max}`,
    });
    return { score: 0, wasRepaired: true };
  }

  // Convert to number
  let score = typeof value === 'number' ? value : Number(value);

  // Handle NaN
  if (isNaN(score)) {
    errors.push({
      field,
      message: `Invalid number`,
      received: value,
      expected: `number between ${bounds.min} and ${bounds.max}`,
    });
    return { score: 0, wasRepaired: true };
  }

  // Round to integer
  if (!Number.isInteger(score)) {
    warnings.push({
      field,
      message: `Score was not an integer`,
      action: `Rounded ${score} to ${Math.round(score)}`,
    });
    score = Math.round(score);
    wasRepaired = true;
  }

  // Clamp to bounds
  if (score < bounds.min) {
    warnings.push({
      field,
      message: `Score below minimum`,
      action: `Clamped ${score} to ${bounds.min}`,
    });
    score = bounds.min;
    wasRepaired = true;
  }

  if (score > bounds.max) {
    warnings.push({
      field,
      message: `Score above maximum`,
      action: `Clamped ${score} to ${bounds.max}`,
    });
    score = bounds.max;
    wasRepaired = true;
  }

  return { score, wasRepaired };
}

// =============================================================================
// STRING FIELD VALIDATION
// =============================================================================

function validateStringField(
  value: unknown,
  field: string,
  maxLength: number,
  errors: ValidationError[],
  warnings: ValidationWarning[]
): { text: string; wasRepaired: boolean } {
  let wasRepaired = false;

  if (value === undefined || value === null) {
    errors.push({
      field,
      message: `Missing required field`,
      received: value,
      expected: `non-empty string`,
    });
    return { text: 'No feedback provided.', wasRepaired: true };
  }

  let text = String(value);

  if (text.length === 0) {
    warnings.push({
      field,
      message: `Empty string`,
      action: `Set default value`,
    });
    text = 'No feedback provided.';
    wasRepaired = true;
  }

  if (text.length > maxLength) {
    warnings.push({
      field,
      message: `String exceeds maximum length`,
      action: `Truncated from ${text.length} to ${maxLength} characters`,
    });
    text = text.substring(0, maxLength) + '...';
    wasRepaired = true;
  }

  return { text, wasRepaired };
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

export function validateEvaluationResult(
  rawResponse: string,
  _rubric?: EvaluationRubricInput
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  let wasRepaired = false;

  // Parse JSON
  const parseResult = parseEvaluationResponse(rawResponse);
  if (!parseResult.success || !parseResult.data) {
    return {
      isValid: false,
      errors: [{
        field: 'response',
        message: parseResult.error || 'Invalid JSON',
        received: rawResponse.substring(0, 200),
        expected: 'Valid JSON object',
      }],
      warnings: [],
      wasRepaired: false,
    };
  }

  const data = parseResult.data;

  // Validate and repair individual scores
  const conceptResult = validateAndRepairScore(
    data.concept_accuracy, 'concept_accuracy', errors, warnings
  );
  const exampleResult = validateAndRepairScore(
    data.example_usage, 'example_usage', errors, warnings
  );
  const edgeResult = validateAndRepairScore(
    data.edge_cases, 'edge_cases', errors, warnings
  );
  const clarityResult = validateAndRepairScore(
    data.clarity, 'clarity', errors, warnings
  );

  wasRepaired = wasRepaired || 
    conceptResult.wasRepaired || 
    exampleResult.wasRepaired || 
    edgeResult.wasRepaired || 
    clarityResult.wasRepaired;

  // Calculate expected final score
  const calculatedFinalScore = 
    conceptResult.score + 
    exampleResult.score + 
    edgeResult.score + 
    clarityResult.score;

  // Validate final_score
  let finalScore = calculatedFinalScore;
  if (data.final_score !== undefined) {
    const providedFinal = Number(data.final_score);
    if (!isNaN(providedFinal) && providedFinal !== calculatedFinalScore) {
      warnings.push({
        field: 'final_score',
        message: `Provided final_score doesn't match sum of individual scores`,
        action: `Corrected from ${providedFinal} to ${calculatedFinalScore}`,
      });
      wasRepaired = true;
    }
  }

  // Validate string fields
  const feedbackResult = validateStringField(
    data.overall_feedback, 'overall_feedback', 1000, errors, warnings
  );
  const tipsResult = validateStringField(
    data.improvement_tips, 'improvement_tips', 1000, errors, warnings
  );

  wasRepaired = wasRepaired || feedbackResult.wasRepaired || tipsResult.wasRepaired;

  // Build validated result
  const validatedResult: EvaluationResult = {
    concept_accuracy: conceptResult.score,
    example_usage: exampleResult.score,
    edge_cases: edgeResult.score,
    clarity: clarityResult.score,
    final_score: finalScore,
    overall_feedback: feedbackResult.text,
    improvement_tips: tipsResult.text,
  };

  // Determine if result is valid (no critical errors, only warnings/repairs)
  const hasCriticalErrors = errors.some(e => 
    ['concept_accuracy', 'example_usage', 'edge_cases', 'clarity'].includes(e.field)
  );

  return {
    isValid: !hasCriticalErrors,
    data: validatedResult,
    errors,
    warnings,
    wasRepaired,
  };
}

// =============================================================================
// QUICK VALIDATION (for pre-checks)
// =============================================================================

export function quickValidate(rawResponse: string): boolean {
  const parseResult = parseEvaluationResponse(rawResponse);
  if (!parseResult.success || !parseResult.data) return false;

  const data = parseResult.data;
  const requiredFields = [
    'concept_accuracy',
    'example_usage', 
    'edge_cases',
    'clarity',
    'final_score',
    'overall_feedback',
    'improvement_tips'
  ];

  return requiredFields.every(field => field in data);
}

// =============================================================================
// ERROR RECOVERY STRATEGIES
// =============================================================================

export const RecoveryStrategy = {
  RETRY_SAME_PROMPT: 'retry_same_prompt',
  RETRY_SIMPLIFIED: 'retry_simplified',
  USE_DEFAULT_SCORES: 'use_default_scores',
  FAIL: 'fail',
} as const;

export type RecoveryStrategy = typeof RecoveryStrategy[keyof typeof RecoveryStrategy];

export function determineRecoveryStrategy(
  validationResult: ValidationResult,
  retryCount: number
): RecoveryStrategy {
  const maxRetries = 2;

  // If valid (even with repairs), accept it
  if (validationResult.isValid) {
    return RecoveryStrategy.RETRY_SAME_PROMPT; // Actually means "success, use result"
  }

  // If JSON parsing completely failed
  if (validationResult.errors.some(e => e.field === 'response')) {
    if (retryCount < maxRetries) {
      return retryCount === 0 
        ? RecoveryStrategy.RETRY_SAME_PROMPT 
        : RecoveryStrategy.RETRY_SIMPLIFIED;
    }
    return RecoveryStrategy.USE_DEFAULT_SCORES;
  }

  // If individual field errors
  if (retryCount < maxRetries) {
    return RecoveryStrategy.RETRY_SIMPLIFIED;
  }

  return RecoveryStrategy.USE_DEFAULT_SCORES;
}

// =============================================================================
// DEFAULT/FALLBACK RESULT
// =============================================================================

export function getDefaultEvaluationResult(reason: string): EvaluationResult {
  return {
    concept_accuracy: 0,
    example_usage: 0,
    edge_cases: 0,
    clarity: 0,
    final_score: 0,
    overall_feedback: `Evaluation could not be completed: ${reason}. Please try again or contact support.`,
    improvement_tips: 'Unable to provide specific improvement tips at this time.',
  };
}
