/**
 * Evaluation Service
 * Interview Preparation SaaS
 * 
 * High-level service for submitting answers and getting evaluations.
 * Handles Supabase integration and Edge Function calls.
 */

import { supabase } from '../../services/supabase';
import type { EvaluationResult, EvaluationMetadata } from '../types/evaluation.types';
import type { Answer, AnswerInsert } from '../types/database.types';

// =============================================================================
// SERVICE TYPES
// =============================================================================

export interface SubmitAnswerRequest {
  sessionId: string;
  questionId: string;
  userAnswer: string;
  timeTakenSeconds?: number;
}

export interface SubmitAnswerResponse {
  success: boolean;
  answerId: string;
  evaluation?: EvaluationResult;
  metadata?: Partial<EvaluationMetadata>;
  error?: string;
}

export interface GetAnswerHistoryOptions {
  limit?: number;
  offset?: number;
  sessionId?: string;
  questionId?: string;
}

// =============================================================================
// EVALUATION SERVICE CLASS
// =============================================================================

export class EvaluationService {
  /**
   * Submit an answer and trigger evaluation
   */
  async submitAnswer(request: SubmitAnswerRequest): Promise<SubmitAnswerResponse> {
    const { sessionId, questionId, userAnswer, timeTakenSeconds } = request;

    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return { success: false, answerId: '', error: 'Not authenticated' };
      }

      // Insert answer record
      const answerInsert: AnswerInsert = {
        session_id: sessionId,
        question_id: questionId,
        user_id: user.id,
        user_answer: userAnswer,
        time_taken_seconds: timeTakenSeconds ?? null,
        evaluation_result: null,
        evaluation_metadata: null,
        is_flagged: false,
      };

      const { data: answer, error: insertError } = await supabase
        .from('answers')
        .insert(answerInsert)
        .select('id')
        .single();

      if (insertError || !answer) {
        console.error('Failed to insert answer:', insertError);
        return { 
          success: false, 
          answerId: '', 
          error: insertError?.message || 'Failed to save answer' 
        };
      }

      // Call Edge Function for evaluation
      const evaluationResponse = await this.triggerEvaluation(
        answer.id,
        questionId,
        userAnswer
      );

      return {
        success: evaluationResponse.success,
        answerId: answer.id,
        evaluation: evaluationResponse.data,
        metadata: evaluationResponse.metadata,
        error: evaluationResponse.error,
      };

    } catch (error) {
      console.error('Submit answer error:', error);
      return {
        success: false,
        answerId: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Trigger evaluation via Edge Function
   */
  private async triggerEvaluation(
    answerId: string,
    questionId: string,
    userAnswer: string
  ): Promise<{
    success: boolean;
    data?: EvaluationResult;
    metadata?: Partial<EvaluationMetadata>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-answer', {
        body: {
          answer_id: answerId,
          question_id: questionId,
          user_answer: userAnswer,
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        return { success: false, error: error.message };
      }

      return {
        success: data.success,
        data: data.data,
        metadata: data.metadata,
        error: data.error?.message,
      };

    } catch (error) {
      console.error('Evaluation trigger error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to trigger evaluation',
      };
    }
  }

  /**
   * Get evaluation result for a specific answer
   */
  async getEvaluation(answerId: string): Promise<{
    success: boolean;
    data?: Answer;
    error?: string;
  }> {
    const { data, error } = await supabase
      .from('answers')
      .select('*')
      .eq('id', answerId)
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data as Answer };
  }

  /**
   * Get answer history for current user
   */
  async getAnswerHistory(options: GetAnswerHistoryOptions = {}): Promise<{
    success: boolean;
    data?: Answer[];
    count?: number;
    error?: string;
  }> {
    const { limit = 20, offset = 0, sessionId, questionId } = options;

    let query = supabase
      .from('answers')
      .select('*, questions(title, category, difficulty)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    if (questionId) {
      query = query.eq('question_id', questionId);
    }

    const { data, count, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { 
      success: true, 
      data: data as Answer[], 
      count: count ?? undefined 
    };
  }

  /**
   * Flag an answer for review
   */
  async flagAnswer(answerId: string, flagged: boolean = true): Promise<{
    success: boolean;
    error?: string;
  }> {
    const { error } = await supabase
      .from('answers')
      .update({ is_flagged: flagged })
      .eq('id', answerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  /**
   * Get user's evaluation statistics
   */
  async getUserStats(): Promise<{
    success: boolean;
    data?: {
      totalAnswers: number;
      averageScore: number;
      categoryScores: Record<string, number>;
      recentTrend: number[];
    };
    error?: string;
  }> {
    try {
      // Get all answers with evaluation results
      const { data: answers, error } = await supabase
        .from('answers')
        .select(`
          evaluation_result,
          questions(category)
        `)
        .not('evaluation_result', 'is', null);

      if (error) {
        return { success: false, error: error.message };
      }

      if (!answers || answers.length === 0) {
        return {
          success: true,
          data: {
            totalAnswers: 0,
            averageScore: 0,
            categoryScores: {},
            recentTrend: [],
          },
        };
      }

      // Calculate statistics
      const scores = answers.map(a => 
        (a.evaluation_result as EvaluationResult)?.final_score ?? 0
      );

      const totalAnswers = answers.length;
      const averageScore = scores.reduce((a, b) => a + b, 0) / totalAnswers;

      // Category breakdown
      const categoryScores: Record<string, { total: number; count: number }> = {};
      answers.forEach(a => {
        const questions = a.questions as { category: string } | { category: string }[] | null;
        const category = Array.isArray(questions) ? questions[0]?.category : questions?.category;
        const score = (a.evaluation_result as EvaluationResult)?.final_score ?? 0;
        if (category) {
          if (!categoryScores[category]) {
            categoryScores[category] = { total: 0, count: 0 };
          }
          categoryScores[category].total += score;
          categoryScores[category].count += 1;
        }
      });

      const categoryAverages: Record<string, number> = {};
      Object.entries(categoryScores).forEach(([cat, { total, count }]) => {
        categoryAverages[cat] = Math.round((total / count) * 10) / 10;
      });

      // Recent trend (last 10 scores)
      const recentTrend = scores.slice(-10);

      return {
        success: true,
        data: {
          totalAnswers,
          averageScore: Math.round(averageScore * 10) / 10,
          categoryScores: categoryAverages,
          recentTrend,
        },
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get stats',
      };
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const evaluationService = new EvaluationService();
