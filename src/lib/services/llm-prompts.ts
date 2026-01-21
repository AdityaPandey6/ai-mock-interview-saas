/**
 * LLM Prompt Templates
 * Interview Preparation SaaS - Evaluation Prompts
 * 
 * Optimized for:
 * - Deterministic output (low temperature)
 * - Strict JSON compliance
 * - Rubric weight enforcement
 * - Anti-hallucination guardrails
 */

import type { EvaluationInput } from '../types/evaluation.types';

// =============================================================================
// SYSTEM PROMPT
// =============================================================================

export const EVALUATION_SYSTEM_PROMPT = `You are an expert technical interviewer and answer evaluator. Your task is to evaluate interview answers against a rubric with STRICT scoring rules.

CRITICAL RULES:
1. You MUST return ONLY valid JSON - no markdown, no explanations outside JSON
2. You MUST NOT exceed the max_score for any criterion
3. You MUST be objective and consistent
4. You MUST base scores ONLY on what the candidate wrote, not assumptions
5. final_score MUST equal the sum of all individual scores
6. Scores MUST be integers (whole numbers only)

SCORING PHILOSOPHY:
- Score based on demonstrated knowledge, not assumed knowledge
- Partial credit is encouraged when concepts are partially correct
- Missing information should reduce scores proportionally
- Incorrect information should significantly reduce scores
- Do not infer or assume the candidate knows more than what they wrote`;

// =============================================================================
// USER PROMPT TEMPLATE
// =============================================================================

export function buildEvaluationPrompt(input: EvaluationInput): string {
  const { question_text, ideal_answer, rubric, user_answer } = input;
  
  return `Evaluate the following interview answer.

## QUESTION
${question_text}

## IDEAL ANSWER (Reference - Do not share with candidate)
${ideal_answer}

## EVALUATION RUBRIC (STRICT SCORING LIMITS)
1. concept_accuracy (0-${rubric.concept_accuracy.max_score}): ${rubric.concept_accuracy.weight_description}
2. example_usage (0-${rubric.example_usage.max_score}): ${rubric.example_usage.weight_description}
3. edge_cases (0-${rubric.edge_cases.max_score}): ${rubric.edge_cases.weight_description}
4. clarity (0-${rubric.clarity.max_score}): ${rubric.clarity.weight_description}

TOTAL MAX SCORE: ${rubric.concept_accuracy.max_score + rubric.example_usage.max_score + rubric.edge_cases.max_score + rubric.clarity.max_score}

## CANDIDATE'S ANSWER
${user_answer}

## REQUIRED OUTPUT FORMAT
Return ONLY this JSON structure (no other text):
{
  "concept_accuracy": <integer 0-${rubric.concept_accuracy.max_score}>,
  "example_usage": <integer 0-${rubric.example_usage.max_score}>,
  "edge_cases": <integer 0-${rubric.edge_cases.max_score}>,
  "clarity": <integer 0-${rubric.clarity.max_score}>,
  "final_score": <integer, must equal sum of above>,
  "overall_feedback": "<2-3 sentences summarizing performance>",
  "improvement_tips": "<2-3 specific actionable improvements>"
}

VALIDATION CHECKLIST (self-verify before responding):
- [ ] concept_accuracy is between 0 and ${rubric.concept_accuracy.max_score}
- [ ] example_usage is between 0 and ${rubric.example_usage.max_score}
- [ ] edge_cases is between 0 and ${rubric.edge_cases.max_score}
- [ ] clarity is between 0 and ${rubric.clarity.max_score}
- [ ] final_score equals concept_accuracy + example_usage + edge_cases + clarity
- [ ] All scores are integers
- [ ] Output is valid JSON only`;
}

// =============================================================================
// FALLBACK PROMPT (Simpler format for retry)
// =============================================================================

export function buildFallbackPrompt(input: EvaluationInput): string {
  const { question_text, ideal_answer, rubric, user_answer } = input;
  const maxTotal = rubric.concept_accuracy.max_score + 
                   rubric.example_usage.max_score + 
                   rubric.edge_cases.max_score + 
                   rubric.clarity.max_score;
  
  return `Rate this interview answer on a scale of 0-${maxTotal}.

Question: ${question_text}

Ideal Answer Summary: ${ideal_answer.substring(0, 500)}...

Candidate Answer: ${user_answer}

Scoring:
- concept_accuracy: max ${rubric.concept_accuracy.max_score}
- example_usage: max ${rubric.example_usage.max_score}
- edge_cases: max ${rubric.edge_cases.max_score}
- clarity: max ${rubric.clarity.max_score}

Return JSON only:
{"concept_accuracy":0,"example_usage":0,"edge_cases":0,"clarity":0,"final_score":0,"overall_feedback":"","improvement_tips":""}`;
}

// =============================================================================
// TOKEN ESTIMATION (for cost optimization)
// =============================================================================

export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  // This is conservative; actual may be lower
  return Math.ceil(text.length / 4);
}

export function estimatePromptCost(input: EvaluationInput): {
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
} {
  const prompt = buildEvaluationPrompt(input);
  const systemPrompt = EVALUATION_SYSTEM_PROMPT;
  
  const inputTokens = estimateTokenCount(systemPrompt + prompt);
  const outputTokens = 300; // Typical response size
  
  // GPT-4o-mini pricing (as of 2024): $0.15/1M input, $0.60/1M output
  const inputCost = (inputTokens / 1_000_000) * 0.15;
  const outputCost = (outputTokens / 1_000_000) * 0.60;
  
  return {
    estimatedInputTokens: inputTokens,
    estimatedOutputTokens: outputTokens,
    estimatedCostUSD: inputCost + outputCost,
  };
}
