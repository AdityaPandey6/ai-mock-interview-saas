/**
 * LLM Client Service
 * Interview Preparation SaaS
 * 
 * Abstraction layer for LLM providers with support for model swapping,
 * retry logic, and cost optimization.
 */

import type { 
  EvaluationInput, 
  EvaluationResponse,
  LLMConfig,
  TokenUsage,
} from '../types/evaluation.types';
import { DEFAULT_LLM_CONFIG } from '../types/evaluation.types';
import { 
  buildEvaluationPrompt, 
  buildFallbackPrompt, 
  EVALUATION_SYSTEM_PROMPT 
} from './llm-prompts';
import { 
  validateEvaluationResult, 
  determineRecoveryStrategy,
  RecoveryStrategy,
  getDefaultEvaluationResult
} from '../validation/evaluation-validator';

// =============================================================================
// LLM PROVIDER INTERFACE
// =============================================================================

export interface LLMProvider {
  name: string;
  call(
    systemPrompt: string,
    userPrompt: string,
    config: LLMConfig
  ): Promise<LLMProviderResponse>;
}

export interface LLMProviderResponse {
  content: string;
  usage?: TokenUsage;
  finishReason?: string;
}

// =============================================================================
// OPENAI PROVIDER
// =============================================================================

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private baseUrl = 'https://api.openai.com/v1';

  async call(
    systemPrompt: string,
    userPrompt: string,
    config: LLMConfig
  ): Promise<LLMProviderResponse> {
    const apiKey = this.getApiKey();

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: config.temperature,
        max_tokens: config.max_tokens,
        top_p: config.top_p,
        frequency_penalty: config.frequency_penalty,
        presence_penalty: config.presence_penalty,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0].message.content,
      usage: data.usage ? {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completion_tokens,
        total_tokens: data.usage.total_tokens,
      } : undefined,
      finishReason: data.choices[0].finish_reason,
    };
  }

  private getApiKey(): string {
    // In browser, get from environment or configuration
    const key = import.meta.env?.VITE_OPENAI_API_KEY;
    if (!key) {
      throw new Error('OpenAI API key not configured');
    }
    return key;
  }
}

// =============================================================================
// ANTHROPIC PROVIDER
// =============================================================================

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic';
  private baseUrl = 'https://api.anthropic.com/v1';

  async call(
    systemPrompt: string,
    userPrompt: string,
    config: LLMConfig
  ): Promise<LLMProviderResponse> {
    const apiKey = this.getApiKey();

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.max_tokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json();

    return {
      content: data.content[0].text,
      usage: data.usage ? {
        prompt_tokens: data.usage.input_tokens,
        completion_tokens: data.usage.output_tokens,
        total_tokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      finishReason: data.stop_reason,
    };
  }

  private getApiKey(): string {
    const key = import.meta.env?.VITE_ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('Anthropic API key not configured');
    }
    return key;
  }
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

const providers: Record<string, LLMProvider> = {
  openai: new OpenAIProvider(),
  anthropic: new AnthropicProvider(),
};

export function registerProvider(provider: LLMProvider): void {
  providers[provider.name] = provider;
}

export function getProvider(name: string): LLMProvider {
  const provider = providers[name];
  if (!provider) {
    throw new Error(`Unknown LLM provider: ${name}`);
  }
  return provider;
}

// =============================================================================
// MAIN EVALUATION CLIENT
// =============================================================================

export interface EvaluationClientOptions {
  config?: Partial<LLMConfig>;
  maxRetries?: number;
  timeoutMs?: number;
}

export class EvaluationClient {
  private config: LLMConfig;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(options: EvaluationClientOptions = {}) {
    this.config = {
      ...DEFAULT_LLM_CONFIG,
      ...options.config,
    } as LLMConfig;
    this.maxRetries = options.maxRetries ?? 2;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  /**
   * Evaluate a user's answer against the question and rubric
   */
  async evaluate(input: EvaluationInput): Promise<EvaluationResponse> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: string | undefined;
    let tokenUsage: TokenUsage | undefined;

    const provider = getProvider(this.config.provider);

    while (retryCount <= this.maxRetries) {
      try {
        // Build prompt (use fallback on retry)
        const userPrompt = retryCount === 0
          ? buildEvaluationPrompt(input)
          : buildFallbackPrompt(input);

        // Call LLM with timeout
        const llmResponse = await this.callWithTimeout(
          provider.call(EVALUATION_SYSTEM_PROMPT, userPrompt, this.config)
        );

        tokenUsage = llmResponse.usage;

        // Validate response
        const validation = validateEvaluationResult(llmResponse.content);

        if (validation.isValid && validation.data) {
          return {
            success: true,
            data: validation.data,
            metadata: {
              model_used: this.config.provider,
              model_version: this.config.model,
              evaluation_timestamp: new Date().toISOString(),
              processing_time_ms: Date.now() - startTime,
              token_usage: tokenUsage,
              retry_count: retryCount,
            },
          };
        }

        // Determine recovery strategy
        const strategy = determineRecoveryStrategy(validation, retryCount);
        
        if (strategy === RecoveryStrategy.USE_DEFAULT_SCORES) {
          break;
        }

        lastError = validation.errors[0]?.message || 'Validation failed';
        retryCount++;

      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        retryCount++;
      }
    }

    // All retries exhausted - return default result
    return {
      success: false,
      data: getDefaultEvaluationResult(lastError || 'Evaluation failed'),
      metadata: {
        model_used: this.config.provider,
        model_version: this.config.model,
        evaluation_timestamp: new Date().toISOString(),
        processing_time_ms: Date.now() - startTime,
        token_usage: tokenUsage,
        retry_count: retryCount,
      },
      error: {
        code: 'EVALUATION_FAILED',
        message: lastError || 'Failed to evaluate answer after retries',
      },
    };
  }

  /**
   * Wrap promise with timeout
   */
  private async callWithTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Switch to a different LLM model
   */
  setModel(provider: LLMConfig['provider'], model: string): void {
    this.config.provider = provider;
    this.config.model = model;
  }

  /**
   * Get current configuration
   */
  getConfig(): LLMConfig {
    return { ...this.config };
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let defaultClient: EvaluationClient | null = null;

export function getEvaluationClient(options?: EvaluationClientOptions): EvaluationClient {
  if (!defaultClient || options) {
    defaultClient = new EvaluationClient(options);
  }
  return defaultClient;
}

// =============================================================================
// UTILITY: COST ESTIMATION
// =============================================================================

export interface CostEstimate {
  provider: string;
  model: string;
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  estimatedCostUSD: number;
}

const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o-mini': { input: 0.15, output: 0.60 },       // per 1M tokens
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4-turbo': { input: 10.00, output: 30.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  'claude-3-sonnet-20240229': { input: 3.00, output: 15.00 },
};

export function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const pricing = MODEL_PRICING[model];
  if (!pricing) return 0;

  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;

  return inputCost + outputCost;
}
