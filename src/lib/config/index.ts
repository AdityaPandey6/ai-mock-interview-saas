/**
 * Application Configuration
 * Interview Preparation SaaS
 * 
 * Centralized configuration for the application.
 */

// =============================================================================
// ENVIRONMENT DETECTION
// =============================================================================

export const IS_DEVELOPMENT = import.meta.env?.DEV ?? false;
export const IS_PRODUCTION = import.meta.env?.PROD ?? true;

// =============================================================================
// SUPABASE CONFIGURATION
// =============================================================================

export const SUPABASE_CONFIG = {
  url: import.meta.env?.VITE_SUPABASE_URL ?? '',
  anonKey: import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '',
} as const;

// =============================================================================
// LLM CONFIGURATION
// =============================================================================

export const LLM_CONFIG = {
  // Default provider (can be overridden per-request)
  defaultProvider: (import.meta.env?.VITE_LLM_PROVIDER ?? 'openai') as 'openai' | 'anthropic',
  
  // Model defaults by provider
  models: {
    openai: {
      default: 'gpt-4o-mini',        // Cost-effective, fast
      premium: 'gpt-4o',              // Higher quality
    },
    anthropic: {
      default: 'claude-3-haiku-20240307',    // Fast, cost-effective
      premium: 'claude-3-sonnet-20240229',   // Higher quality
    },
  },

  // Generation parameters
  generation: {
    temperature: 0.1,    // Low for deterministic output
    maxTokens: 1024,     // Sufficient for evaluation responses
    topP: 0.95,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },

  // Retry configuration
  retry: {
    maxRetries: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
  },

  // Timeout configuration
  timeout: {
    requestMs: 30000,    // 30 seconds per request
    totalMs: 90000,      // 90 seconds total with retries
  },
} as const;

// =============================================================================
// EVALUATION CONFIGURATION
// =============================================================================

export const EVALUATION_CONFIG = {
  // Rubric weights (must sum to 10)
  rubricWeights: {
    concept_accuracy: 4,
    example_usage: 3,
    edge_cases: 2,
    clarity: 1,
  },

  // Score bounds for validation
  scoreBounds: {
    concept_accuracy: { min: 0, max: 4 },
    example_usage: { min: 0, max: 3 },
    edge_cases: { min: 0, max: 2 },
    clarity: { min: 0, max: 1 },
    final_score: { min: 0, max: 10 },
  },

  // Response validation
  validation: {
    maxFeedbackLength: 1000,
    maxTipsLength: 1000,
  },
} as const;

// =============================================================================
// RATE LIMITING CONFIGURATION
// =============================================================================

export const RATE_LIMIT_CONFIG = {
  // Daily evaluation limits by tier
  dailyLimits: {
    free: 5,
    pro: 50,
    enterprise: -1,  // unlimited
  },

  // Reset time (UTC midnight)
  resetHour: 0,
} as const;

// =============================================================================
// QUESTION CONFIGURATION
// =============================================================================

export const QUESTION_CONFIG = {
  categories: [
    'frontend',
    'backend',
    'system_design',
    'data_structures',
    'algorithms',
    'databases',
    'devops',
    'behavioral',
  ] as const,

  difficulties: ['easy', 'medium', 'hard'] as const,

  // Time limits by difficulty (minutes)
  timeLimits: {
    easy: 5,
    medium: 10,
    hard: 15,
  },
} as const;

// =============================================================================
// SESSION CONFIGURATION
// =============================================================================

export const SESSION_CONFIG = {
  types: ['practice', 'mock_interview', 'timed_test'] as const,
  
  statuses: ['in_progress', 'completed', 'abandoned'] as const,

  // Default questions per session type
  defaultQuestionCount: {
    practice: 1,
    mock_interview: 5,
    timed_test: 10,
  },
} as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURE_FLAGS = {
  // Enable/disable features
  enableAnthropicProvider: true,
  enablePremiumModels: true,
  enableAnswerFlagging: true,
  enableDetailedStats: true,
  
  // Debug features (only in development)
  enableDebugLogs: IS_DEVELOPMENT,
  enableMockEvaluation: false,  // Use mock evaluation for testing
} as const;

// =============================================================================
// COST OPTIMIZATION
// =============================================================================

export const COST_CONFIG = {
  // Token pricing (per 1M tokens, USD)
  pricing: {
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gpt-4o': { input: 2.50, output: 10.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
  },

  // Budget alerts (USD per day)
  budgetAlerts: {
    warning: 10,
    critical: 50,
  },

  // Token estimation
  avgTokensPerEvaluation: {
    input: 800,
    output: 300,
  },
} as const;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check Supabase config
  if (!SUPABASE_CONFIG.url) {
    errors.push('VITE_SUPABASE_URL is not set');
  }
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set');
  }

  // Check rubric weights sum to 10
  const rubricSum = Object.values(EVALUATION_CONFIG.rubricWeights).reduce((a, b) => a + b, 0);
  if (rubricSum !== 10) {
    errors.push(`Rubric weights must sum to 10, got ${rubricSum}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
