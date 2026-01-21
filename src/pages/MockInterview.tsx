import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import './MockInterview.css';



interface Question {
  id: string;
  question_text: string;
  topic: string;
  difficulty: string;
  answer: string;
  created_at: string;
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

export default function MockInterview() {
  
const [sessionId, setSessionId] = useState<string | null>(null);
  const { user , session } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const questionStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (user) {
      startMockSession();
    }
  }, [user]);
  
  const startMockSession = async () => {
    try {
      if (!user) return;
  
      const { data: sessionData, error: sessionError } = await supabase
        .from("mock_sessions")
        .insert({
          user_id: user.id,
          status: "active",
          total_score: 0,
          total_questions: 5,
        })
        .select()
        .single();
  
      if (sessionError) throw sessionError;
  
      setSessionId(sessionData.id);
  
      await fetchRandomQuestions();
  
    } catch (err) {
      console.error("Mock session error:", err);
      setError("Failed to start mock interview");
    }
  };
  
  
  

  // Initialize Web Speech API
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setSpeechSupported(false);
        return;
      }

      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;

      if (!recognition) {
        setSpeechSupported(false);
        return;
      }

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListening(true);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setListening(false);
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

  // Timer effect - runs for 60 seconds per question
  useEffect(() => {
    if (!loading && questions.length > 0) {
      setTimeRemaining(60);
      questionStartTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [currentQuestionIndex, loading, questions.length]);

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

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      stopListening();
    } else {
      navigate('/dashboard');
    }
  };

  const handleAutoSubmit = async () => {
    if (!sessionId) return;
  
    stopListening();
  
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/evaluate-answer`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            session_id: sessionId,
            question_id: questions[currentQuestionIndex].id,
            user_answer: userAnswer,
          }),
        }
      );
  
      const data = await res.json();
  
      console.log("Auto Evaluation:", data);
  
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer("");
      } else {
        await finishMockInterview();
      }
  
    } catch (err) {
      console.error(err);
    }
  };
  
  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !sessionId) return;
  
    setSubmitting(true);
    stopListening();
  
    try {
      const { data, error } = await supabase.functions.invoke("evaluate-answer", {
        body: {
          session_id: sessionId,
          question_id: questions[currentQuestionIndex].id,
          user_answer: userAnswer,
        },
      });
      
      if (error) {
        console.error("Function error:", error);
        setError("Evaluation failed");
        return;
      }
      
      alert(`Score: ${data.score}\n\n${data.feedback}`);
      
  
      // const data = await res.json();
  
      console.log("Evaluation Result:", data);
  
      // Show feedback (later modal UI)
      // alert(`Score: ${data.score}\n\n${data.feedback}`);
  
      // Move next
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setUserAnswer("");
      } else {
        await finishMockInterview();
      }
  
    } catch (err) {
      console.error(err);
      setError("Evaluation failed");
    }
  
    setSubmitting(false);
  };
  


  const finishMockInterview = async () => {
    try {
      if (!sessionId) return;
  
      await supabase
        .from("mock_sessions")
        .update({
          status: "completed",
          ended_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
  
      navigate(`/mock-result/${sessionId}`);
  
    } catch (err) {
      console.error(err);
    }
  };
  

  const fetchRandomQuestions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all questions
      const { data, error: fetchError } = await supabase
        .from('questions')
        .select('*');

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setError('No questions available');
        setQuestions([]);
        return;
      }

      // Get 5 random questions
      const shuffled = data.sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, Math.min(5, shuffled.length));

      setQuestions(selected);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mock-interview-container">
        <div className="loading">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mock-interview-container">
        <div className="error">
          <p>{error}</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="mock-interview-container">
        <div className="error">
          <p>No questions available for mock interview</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }



  return (
    <div className="mock-interview-container">
      <div className="mock-interview-header">
        <h1>Mock Interview</h1>
        <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>

      <div className="mock-interview-content">
        <div className="question-card">
          <div className="question-meta">
            <span className="topic">{questions[currentQuestionIndex].topic}</span>
            <span className="difficulty">{questions[currentQuestionIndex].difficulty}</span>
          </div>
          <h2>{questions[currentQuestionIndex].question_text}</h2>
        </div>

        <div className="timer-section">
          <div className={`timer ${timeRemaining <= 10 ? 'warning' : ''}`}>
            {timeRemaining}s
          </div>
        </div>

        <form onSubmit={handleSubmitAnswer} className="mock-answer-form">
          <div className="voice-controls">
            {speechSupported ? (
              <>
                <button
                  type="button"
                  onClick={startListening}
                  disabled={listening}
                  className="voice-btn start-btn"
                >
                  🎤 Start Listening
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  disabled={!listening}
                  className="voice-btn stop-btn"
                >
                  ⏹ Stop Listening
                </button>
                {listening && <span className="listening-indicator">🔴 Recording...</span>}
              </>
            ) : (
              <p className="no-speech">Voice input not supported in your browser</p>
            )}
          </div>

          <div className="textarea-section">
            <label htmlFor="answer">Your Answer:</label>
            <textarea
              id="answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type or speak your answer here..."
              rows={5}
              className="answer-textarea"
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              disabled={submitting}
              className="submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
            <button
              type="button"
              onClick={handleAutoSubmit}
              className="next-btn"
              disabled={submitting}
            >
              Skip Question →
            </button>
          </div>
        </form>

        <div className="question-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
              }}
            ></div>
          </div>
          <p className="progress-text">{currentQuestionIndex + 1} / {questions.length}</p>
        </div>
      </div>
    </div>
  );
}
