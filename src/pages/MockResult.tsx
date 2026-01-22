import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

/* ==================== TYPES ==================== */

interface MockSession {
  id: string;
  user_id: string;
  total_score: number;
  total_questions: number;
  status: string;
  started_at: string;
  ended_at: string | null;
  created_at: string;
  behavior_summary?: {
    face_presence: number;
    attention_score: number;
    stability_score: number;
  } | null;
  confidence_score?: number;
}

interface MockAnswer {
  id: string;
  session_id: string;
  question_id: string;
  user_answer: string;
  final_score: number;
  feedback: string;
  llm_score: {
    concept_accuracy: number;
    clarity: number;
    example_usage: number;
    edge_cases: number;
  };
  created_at: string;
}

interface QuestionDetail {
  id: string;
  question_text: string;
  topic: string;
  difficulty: string;
}

interface AnswerWithQuestion extends MockAnswer {
  question: QuestionDetail;
}

/* ==================== COMPONENT ==================== */

export default function MockResult() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<MockSession | null>(null);
  const [answers, setAnswers] = useState<AnswerWithQuestion[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  /* ==================== DATA FETCHING ==================== */

  useEffect(() => {
    if (sessionId && user) {
      fetchResults();
    }
  }, [sessionId, user]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!sessionId) {
        setError('Session ID is missing');
        return;
      }

      // Fetch session and answers in parallel
      const [sessionResult, answersResult] = await Promise.all([
        supabase
          .from('mock_sessions')
          .select('id, user_id, total_score, total_questions, status, started_at, ended_at, created_at, behavior_summary, confidence_score')
          .eq('id', sessionId)
          .single(),
        supabase
          .from('mock_answers')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }),
      ]);

      if (sessionResult.error) throw sessionResult.error;
      if (!sessionResult.data) {
        setError('Session not found');
        return;
      }

      setSession(sessionResult.data);

      if (answersResult.error) throw answersResult.error;

      // Fetch question details for all answers
      const questionIds = answersResult.data?.map((a) => a.question_id) || [];
      
      if (questionIds.length > 0) {
        const { data: questions, error: questionsError } = await supabase
          .from('questions')
          .select('id, question_text, topic, difficulty')
          .in('id', questionIds);

        if (questionsError) throw questionsError;

        // Map questions to answers
        const questionsMap = new Map(
          questions?.map((q) => [q.id, q]) || []
        );

        const answersWithQuestions: AnswerWithQuestion[] =
          answersResult.data?.map((answer) => ({
            ...answer,
            question: questionsMap.get(answer.question_id) || {
              id: answer.question_id,
              question_text: 'Question not found',
              topic: 'Unknown',
              difficulty: 'Unknown',
            },
          })) || [];

        setAnswers(answersWithQuestions);
      }
    } catch (err) {
      console.error('Error fetching results:', err);
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  /* ==================== COMPUTED STATS ==================== */

  const stats = useMemo(() => {
    if (!session || answers.length === 0) {
      return {
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        performance: 'N/A',
        percentage: 0,
        duration: 'N/A',
      };
    }

    const scores = answers.map((a) => a.final_score);
    const totalPossible = session.total_questions * 10;
    const percentage = (session.total_score / totalPossible) * 100;

    let performance = 'Needs Improvement';
    if (percentage >= 80) performance = 'Excellent';
    else if (percentage >= 60) performance = 'Good';

    // Calculate duration
    let duration = 'N/A';
    if (session.started_at && session.ended_at) {
      const start = new Date(session.started_at);
      const end = new Date(session.ended_at);
      const diffMs = end.getTime() - start.getTime();
      const minutes = Math.floor(diffMs / 60000);
      const seconds = Math.floor((diffMs % 60000) / 1000);
      duration = `${minutes}m ${seconds}s`;
    }

    return {
      averageScore: (session.total_score / answers.length).toFixed(1),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      performance,
      percentage: Math.round(percentage),
      duration,
    };
  }, [session, answers]);

  /* ==================== HELPERS ==================== */

  const toggleCard = (id: string) => {
    setExpandedCards((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return 'from-emerald-500 to-teal-600';
    if (score >= 6) return 'from-blue-500 to-cyan-600';
    if (score >= 4) return 'from-amber-500 to-orange-500';
    return 'from-red-500 to-rose-600';
  };

  const getScoreBadgeClasses = (score: number): string => {
    if (score >= 8) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score >= 6) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (score >= 4) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getPerformanceBadgeClasses = (performance: string): string => {
    if (performance === 'Excellent') return 'bg-emerald-100 text-emerald-700';
    if (performance === 'Good') return 'bg-blue-100 text-blue-700';
    return 'bg-amber-100 text-amber-700';
  };

  const getConfidenceScoreColor = (score: number): { bg: string; text: string; label: string } => {
    if (score > 80) {
      return {
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200',
        text: 'text-emerald-700',
        label: 'Excellent Presence',
      };
    } else if (score >= 60) {
      return {
        bg: 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200',
        text: 'text-blue-700',
        label: 'Good Presence',
      };
    } else {
      return {
        bg: 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200',
        text: 'text-amber-700',
        label: 'Needs Improvement',
      };
    }
  };

  const getBehaviorFeedback = (behavior_summary: MockSession['behavior_summary']): { type: 'warning' | 'positive' | 'neutral'; message: string } | null => {
    if (!behavior_summary) return null;

    const { face_presence, attention_score, stability_score } = behavior_summary;

    if (face_presence < 60) {
      return {
        type: 'warning',
        message: '⚠️ Your face detection was low. Ensure your camera is properly positioned and your face is clearly visible. This affects interview presence.',
      };
    }

    if (attention_score >= 75) {
      return {
        type: 'positive',
        message: '✨ Excellent eye contact and face centering! You maintained strong focus throughout the interview.',
      };
    }

    if (stability_score < 50) {
      return {
        type: 'warning',
        message: '📍 Try to keep your head stable and minimize movement. This helps maintain professional presence during interviews.',
      };
    }

    return {
      type: 'neutral',
      message: '✓ Your behavior metrics show consistent performance. Focus on maintaining steady eye contact and minimizing head movements.',
    };
  };

  /* ==================== RENDER ==================== */

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 border border-gray-100 shadow-sm max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            <p className="text-lg font-semibold text-gray-900">Loading your results...</p>
            <p className="text-sm text-gray-500">Please wait while we fetch your interview data</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="bg-white rounded-2xl p-12 border border-red-100 shadow-sm max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Unable to Load Results</h2>
            <p className="text-gray-600 text-center">{error || 'Session not found'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Mock Interview Results</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left: Score Display */}
            <div className="flex flex-col justify-center items-center lg:border-r border-gray-100">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm font-medium mb-2">Your Total Score</p>
                <div className="text-6xl font-bold text-gray-900 mb-2">
                  {session.total_score}
                  <span className="text-3xl text-gray-400"> / {session.total_questions * 10}</span>
                </div>
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getPerformanceBadgeClasses(stats.performance)}`}>
                  {stats.performance} - {stats.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-sm">
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-gray-600 mb-1">Questions Attempted</p>
                <p className="text-3xl font-bold text-gray-900">{answers.length}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageScore}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
                <p className="text-sm text-gray-600 mb-1">Highest Score</p>
                <p className="text-3xl font-bold text-gray-900">{stats.highestScore}/10</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100">
                <p className="text-sm text-gray-600 mb-1">Duration</p>
                <p className="text-2xl font-bold text-gray-900">{stats.duration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Score Card - Only show if confidence_score exists */}
        {session.confidence_score !== undefined && session.confidence_score !== null && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Interview Confidence</h2>
            
            <div className="flex items-center justify-center">
              {(() => {
                const scoreColor = getConfidenceScoreColor(session.confidence_score);
                return (
                  <div className={`rounded-xl p-8 border-2 ${scoreColor.bg} max-w-md w-full`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Overall Confidence Score</p>
                        <p className={`text-5xl font-bold ${scoreColor.text} mb-2`}>{session.confidence_score}%</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${scoreColor.text} bg-white/60`}>
                          {scoreColor.label}
                        </span>
                      </div>
                      <div className={`w-24 h-24 rounded-full ${scoreColor.bg} flex items-center justify-center text-5xl border-4 border-white shadow-lg`}>
                        {session.confidence_score > 80 ? '🌟' : session.confidence_score >= 60 ? '👍' : '📈'}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-4">
                      Based on speaking engagement, camera presence, attention, and stability
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Behavior Summary Card - Only show if behavior_summary exists */}
        {session.behavior_summary && (
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Interview Behavior Summary</h2>
            
            {/* Metrics Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {/* Face Presence */}
              <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Face Presence</p>
                    <p className="text-4xl font-bold text-gray-900">{session.behavior_summary.face_presence}%</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-2xl">
                    📷
                  </div>
                </div>
                <p className="text-xs text-gray-600">Time user remained visible on camera</p>
              </div>

              {/* Attention Score */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Attention Score</p>
                    <p className="text-4xl font-bold text-gray-900">{session.behavior_summary.attention_score}%</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-2xl">
                    👁️
                  </div>
                </div>
                <p className="text-xs text-gray-600">Eye alignment and face centering</p>
              </div>

              {/* Stability Score */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Stability Score</p>
                    <p className="text-4xl font-bold text-gray-900">{session.behavior_summary.stability_score}%</p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-indigo-500 flex items-center justify-center text-white text-2xl">
                    ⚖️
                  </div>
                </div>
                <p className="text-xs text-gray-600">Head movement consistency</p>
              </div>
            </div>

            {/* AI Feedback Section */}
            {(() => {
              const feedback = getBehaviorFeedback(session.behavior_summary);
              if (!feedback) return null;

              const bgColor = feedback.type === 'warning' 
                ? 'bg-amber-50 border-amber-200' 
                : feedback.type === 'positive' 
                ? 'bg-emerald-50 border-emerald-200' 
                : 'bg-blue-50 border-blue-200';

              return (
                <div className={`rounded-xl p-4 border-2 ${bgColor}`}>
                  <p className="text-gray-700 leading-relaxed">{feedback.message}</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* Detailed Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Question-by-Question Breakdown</h2>
          <div className="space-y-4">
            {answers.map((answer, index) => (
              <div
                key={answer.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Card Header */}
                <div
                  className="p-6 cursor-pointer"
                  onClick={() => toggleCard(answer.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold flex items-center justify-center text-sm">
                          {index + 1}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-600 text-xs font-semibold rounded-full">
                          {answer.question.topic}
                        </span>
                        <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full">
                          {answer.question.difficulty}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {answer.question.question_text}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-2 rounded-xl text-lg font-bold border ${getScoreBadgeClasses(answer.final_score)}`}>
                        {answer.final_score}/10
                      </span>
                      <svg
                        className={`w-6 h-6 text-gray-400 transition-transform ${expandedCards.has(answer.id) ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedCards.has(answer.id) && (
                  <div className="px-6 pb-6 border-t border-gray-100 pt-6">
                    {/* Your Answer */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Answer:</h4>
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {answer.user_answer}
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Score Breakdown:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Concept', value: answer.llm_score.concept_accuracy, max: 1 },
                          { label: 'Clarity', value: answer.llm_score.clarity, max: 1 },
                          { label: 'Examples', value: answer.llm_score.example_usage, max: 1 },
                          { label: 'Edge Cases', value: answer.llm_score.edge_cases, max: 1 },
                        ].map((item) => (
                          <div key={item.label} className="bg-white rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                            <p className="text-lg font-bold text-gray-900">
                              {item.value.toFixed(1)}
                              <span className="text-sm text-gray-400">/{item.max}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Feedback */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">AI Feedback:</h4>
                      <div className={`rounded-xl p-4 border-2 bg-gradient-to-br ${getScoreColor(answer.final_score).replace('to', 'via').replace(/\d+/g, '50')}`}>
                        <div className="bg-white rounded-lg p-4">
                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {answer.feedback}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">What's Next?</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold rounded-xl transition-all"
            >
              <span className="text-2xl mb-2 block">📊</span>
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/mock-interview')}
              className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              <span className="text-2xl mb-2 block">🎯</span>
              Start New Mock Interview
            </button>
            <button
              onClick={() => navigate('/practice')}
              className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold rounded-xl transition-all shadow-lg"
            >
              <span className="text-2xl mb-2 block">📚</span>
              Practice More Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
