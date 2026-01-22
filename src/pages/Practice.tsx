import type { FC } from 'react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

interface Question {
  id: string;
  question_text: string;
  topic: string;
  difficulty: string;
  answer: string;
}

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

/* ================= TIMER BAR ================= */

const TimerBar: FC<{ time: number }> = ({ time }) => {
  const percent = (time / 60) * 100;

  const color = useMemo(() => {
    if (time > 20) return 'from-cyan-500 to-blue-600';
    if (time > 10) return 'from-amber-400 to-orange-500';
    return 'from-red-500 to-rose-600';
  }, [time]);

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-gray-600">
        <span>Time Remaining</span>
        <span className="font-semibold">{time}s</span>
      </div>

      <div className="h-3.5 bg-gray-200 rounded-full overflow-hidden shadow-inner">
        <div
          className={`h-full bg-gradient-to-r ${color} transition-all duration-500 ease-linear`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

/* ================= QUESTION PANEL ================= */

const QuestionPanel: FC<{
  question: Question;
  index: number;
  total: number;
  timeRemaining: number;
}> = ({ question, index, total, timeRemaining }) => {
  return (
    <div
      className="
      bg-white rounded-3xl p-10
      shadow-xl hover:shadow-2xl
      border border-gray-100
      space-y-6
      transition-all duration-300
      hover:-translate-y-1
    "
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className="
            w-11 h-11 rounded-xl
            bg-gradient-to-br from-cyan-500 to-blue-600
            flex items-center justify-center
            text-white font-bold
            shadow-lg shadow-cyan-500/30
            hover:scale-105 transition-all
          "
          >
            {index + 1}
          </div>

          <div>
            <p className="text-xs text-gray-500">Question</p>
            <p className="font-semibold text-gray-900">
              {index + 1} / {total}
            </p>
          </div>
        </div>

        <span className="px-3 py-1 text-xs font-semibold bg-purple-100 text-purple-700 rounded-full">
          Practice Mode
        </span>
      </div>

      {/* Timer */}
      <TimerBar time={timeRemaining} />

      {/* Tags */}
      <div className="flex gap-2">
        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-semibold">
          {question.topic}
        </span>

        <span
          className={`px-3 py-1 text-xs rounded-full font-semibold ${
            question.difficulty === 'easy'
              ? 'bg-green-100 text-green-700'
              : question.difficulty === 'medium'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {question.difficulty}
        </span>
      </div>

      {/* Question */}
      <h2 className="text-xl lg:text-2xl font-bold text-gray-900 leading-relaxed">
        {question.question_text}
      </h2>
    </div>
  );
};

/* ================= ANSWER PANEL ================= */

const AnswerPanel: FC<any> = ({
  userAnswer,
  onChange,
  onSubmit,
  onSkip,
  listening,
  speechSupported,
  onStartListening,
  onStopListening,
  submitting,
  feedback,
}) => {
  return (
    <div
      className="
      bg-white rounded-3xl p-10
      shadow-xl hover:shadow-2xl
      border border-gray-100
      flex flex-col h-full
      transition-all duration-300
      hover:-translate-y-1
    "
    >
      <label className="font-semibold mb-2">Your Answer</label>

      <textarea
        value={userAnswer}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer or speak..."
        className="
        flex-1 p-5 border-2 rounded-2xl resize-none
        focus:outline-none
        focus:ring-4 focus:ring-cyan-500/20
        focus:border-cyan-500
        transition-all duration-200
        shadow-inner
      "
      />

      {/* Voice Controls */}
      {speechSupported && (
        <div className="mt-4">
          {!listening ? (
            <button
              onClick={onStartListening}
              disabled={submitting}
              className="
              px-4 py-2
              bg-emerald-500 hover:bg-emerald-600
              text-white rounded-xl font-semibold
              transition-all duration-200
              hover:scale-[1.02]
              active:scale-[0.97]
              shadow-md hover:shadow-lg
            "
            >
              🎤 Start Speaking
            </button>
          ) : (
            <button
              onClick={onStopListening}
              className="
              px-4 py-2
              bg-red-500 text-white
              rounded-xl font-semibold
              animate-pulse
              shadow-md
            "
            >
              ⏹ Stop Recording
            </button>
          )}
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          {feedback}
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={onSubmit}
          disabled={submitting || !userAnswer.trim()}
          className="
          flex-1 py-4
          bg-gradient-to-r from-cyan-500 to-blue-600
          text-white rounded-xl font-bold
          hover:opacity-95
          hover:scale-[1.02]
          active:scale-[0.98]
          disabled:opacity-50
          transition-all duration-200
          shadow-lg hover:shadow-xl
        "
        >
          Submit Answer
        </button>

        <button
          onClick={onSkip}
          disabled={submitting}
          className="
          px-6 py-4
          border rounded-xl font-semibold
          hover:bg-gray-50
          hover:scale-[1.02]
          active:scale-[0.97]
          transition-all duration-200
          shadow-sm hover:shadow-md
        "
        >
          Skip
        </button>
      </div>
    </div>
  );
};

/* ================= MAIN PRACTICE ================= */

const Practice: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  const [timeRemaining, setTimeRemaining] = useState(60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* Fetch Questions */
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('questions').select('*');
      setQuestions(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  /* Timer */
  useEffect(() => {
    if (!questions.length) return;

    setTimeRemaining(60);

    timerRef.current = setInterval(() => {
      setTimeRemaining((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, questions.length]);

  /* Speech API */
  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return setSpeechSupported(false);

    recognitionRef.current = new SR();
    const rec = recognitionRef.current;

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e: any) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) text += e.results[i][0].transcript;
      }
      if (text) setUserAnswer((p) => (p + ' ' + text).trim());
    };

    return () => rec.abort();
  }, []);

  /* Submit */
  const handleSubmit = async () => {
    if (!user) return;

    const q = questions[currentIndex];

    setSubmitting(true);

    const correct =
      q.answer &&
      userAnswer.toLowerCase().includes(q.answer.toLowerCase().split(' ')[0]);

    await supabase.from('attempts').insert({
      user_id: user.id,
      question_id: q.id,
      is_correct: correct,
      answer_text: userAnswer,
      time_taken: 0,
    });

    setFeedback(correct ? '✅ Correct Answer' : `❌ Correct: ${q.answer}`);

    setTimeout(() => {
      setFeedback('');
      setUserAnswer('');
      setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
    }, 1200);

    setSubmitting(false);
  };

  const handleSkip = () => {
    setUserAnswer('');
    setFeedback('');
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white border-b p-4 flex justify-between items-center shadow-sm">
        <h1 className="font-bold text-lg">📚 Practice Mode</h1>
        <button onClick={() => navigate('/dashboard')}>✖</button>
      </div>

      {/* Layout */}
      <div className="max-w-[1800px] mx-auto p-8 grid lg:grid-cols-2 gap-8">

        <QuestionPanel
          question={currentQuestion}
          index={currentIndex}
          total={questions.length}
          timeRemaining={timeRemaining}
        />

        <AnswerPanel
          userAnswer={userAnswer}
          onChange={setUserAnswer}
          onSubmit={handleSubmit}
          onSkip={handleSkip}
          listening={listening}
          speechSupported={speechSupported}
          onStartListening={() => recognitionRef.current?.start()}
          onStopListening={() => recognitionRef.current?.stop()}
          submitting={submitting}
          feedback={feedback}
        />

      </div>
    </div>
  );
};

export default Practice;
