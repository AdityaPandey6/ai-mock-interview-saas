import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import './Practice.css';

interface Question {
  id: string;
  question_text: string;
  topic: string;
  difficulty: string;
  answer: string;
}

// Type for Web Speech API
interface SpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  onresult: ((event: any) => void) | null;
}

const Practice: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [stats, setStats] = useState({ correct: 0, total: 0 });
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  // Fetch all questions on component mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  // Fetch stats when user changes
  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select('*');

      if (error) throw error;
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setFeedback('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('is_correct')
        .eq('user_id', user.id);

      if (error) throw error;
      const correct = data?.filter(d => d.is_correct).length || 0;
      setStats({ correct, total: data?.length || 0 });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Initialize Web Speech API
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        console.warn('Speech Recognition API not supported in this browser');
        setSpeechSupported(false);
        return;
      }

      console.log('Initializing Speech Recognition');
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      if (!recognition) {
        console.error('Failed to create recognition instance');
        setSpeechSupported(false);
        return;
      }

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setListening(true);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        const errorMsg = `🎤 Error: ${event.error}`;
        setFeedback(errorMsg);
        setListening(false);
        
        // Provide helpful error messages
        if (event.error === 'no-speech') {
          setFeedback('🎤 No speech detected. Please check your microphone and try again.');
        } else if (event.error === 'network') {
          setFeedback('🎤 Network error. Please check your connection.');
        } else if (event.error === 'permission-denied') {
          setFeedback('🎤 Microphone permission denied. Please allow access in browser settings.');
        }
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }

        if (finalTranscript) {
          setUserAnswer((prev) => (prev + finalTranscript).trim());
        }
      };

      setSpeechSupported(true);

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setSpeechSupported(false);
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !listening) {
      setUserAnswer('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !questions[currentIndex]) return;

    try {
      setSubmitting(true);
      setFeedback('');

      const currentQuestion = questions[currentIndex];
      const userAnswerLower = userAnswer.toLowerCase().trim();
      const correctAnswerLower = currentQuestion.answer.toLowerCase().trim();
      
      // Simple check: if user answer contains key words from correct answer
      const isCorrect = correctAnswerLower
        .split(' ')
        .some(word => word.length > 3 && userAnswerLower.includes(word));

      // Insert attempt
      const { error: insertError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          is_correct: isCorrect,
          time_taken: 0,
          answer_text: userAnswer,
        });

      if (insertError) throw insertError;

      // Show feedback
      setFeedback(
        isCorrect
          ? '✅ Correct! Great job!'
          : `❌ Not quite right. The answer was: ${currentQuestion.answer}`
      );

      // Update stats
      fetchUserStats();

      // Move to next question after 2 seconds
      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setUserAnswer('');
          setFeedback('');
        } else {
          setFeedback('🎉 You completed all questions! Great effort!');
        }
      }, 2000);
    } catch (err) {
      console.error('Error submitting attempt:', err);
      setFeedback('Error submitting your answer');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="practice-container">
        <div className="loading">Loading questions...</div>
      </div>
    );
  }

  if (!questions.length) {
    return (
      <div className="practice-container">
        <div className="error">No questions available</div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="practice-container">
      <div className="practice-header">
        <h1>Interview Practice</h1>
        <div className="practice-stats">
          <span>Correct: {stats.correct}/{stats.total}</span>
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>

      <div className="progress-text">
        Question {currentIndex + 1} of {questions.length}
      </div>

      <div className="practice-content">
        <div className="question-card">
          <div className="question-meta">
            <span className={`difficulty ${currentQuestion.difficulty.toLowerCase()}`}>
              {currentQuestion.difficulty}
            </span>
            <span className="topic">{currentQuestion.topic}</span>
          </div>

          <div className="question-text">
            <h2>{currentQuestion.question_text}</h2>
          </div>

          <form onSubmit={handleSubmit} className="answer-form">
            <div className="form-group">
              <label htmlFor="answer">Your Answer:</label>
              <div className="textarea-wrapper">
                <textarea
                  id="answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here or use speech recognition..."
                  rows={6}
                  disabled={submitting || currentIndex === questions.length - 1 && feedback.includes('🎉')}
                />
                {listening && <div className="listening-indicator">🎤 Listening...</div>}
              </div>
            </div>

            {speechSupported && (
              <div className="speech-buttons">
                <button
                  type="button"
                  onClick={startListening}
                  disabled={listening || submitting}
                  className="speech-btn start-speech-btn"
                >
                  🎤 Start Speaking
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  disabled={!listening}
                  className="speech-btn stop-speech-btn"
                >
                  ⏹️ Stop Speaking
                </button>
              </div>
            )}

            {!speechSupported && (
              <p className="no-speech-support">
                💡 Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
              </p>
            )}

            {feedback && (
              <div className={`feedback ${feedback.includes('✅') ? 'correct' : feedback.includes('❌') ? 'incorrect' : 'info'}`}>
                {feedback}
              </div>
            )}

            <button
              type="submit"
              disabled={!userAnswer.trim() || submitting}
              className="submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          </form>

          {currentIndex === questions.length - 1 && feedback.includes('🎉') && (
            <button
              onClick={() => {
                setCurrentIndex(0);
                setUserAnswer('');
                setFeedback('');
              }}
              className="restart-btn"
            >
              Start Over
            </button>
          )}
        </div>

        <div className="hint-box">
          <h3>💡 Hint:</h3>
          <p>Take your time and provide a clear, concise answer.</p>
          <p>The system will check your answer for key concepts.</p>
        </div>
      </div>
    </div>
  );
};

export default Practice;
