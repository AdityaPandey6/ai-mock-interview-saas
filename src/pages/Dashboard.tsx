import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

interface QuestionDetails {
  question_text: string;
  topic: string;
  difficulty: string;
}

interface Attempt {
  id: string;
  user_id: string;
  question_id: string;
  is_correct: boolean;
  time_taken: number;
  answer_text: string;
  created_at: string;
  questions: QuestionDetails | null;
}

const Dashboard: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Fetch user attempts on component mount
  useEffect(() => {
    if (user) {
      fetchUserAttempts();
    }
  }, [user]);

  const fetchUserAttempts = async () => {
    try {
      const { data, error } = await supabase
      .from("mock_answers")
      .select(`
        id,
        session_id,
        question_id,
        user_answer,
        final_score,
        created_at,
        questions (
          question_text,
          topic,
          difficulty
        ),
        mock_sessions (
          user_id
        )
      `)
      .eq("mock_sessions.user_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(50);    

      if (error) throw error;
      setAttempts(data || []);
    } catch (err) {
      console.error('Error fetching attempts:', err);
      setAttempts([]);
    }
  };

  // Calculate statistics
  const calculateStats = () => {
    // Total practice count
    const totalAttempts = attempts.length;

    // Today's practice count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttempts = attempts.filter((attempt) => {
      const attemptDate = new Date(attempt.created_at);
      attemptDate.setHours(0, 0, 0, 0);
      return attemptDate.getTime() === today.getTime();
    }).length;

    // Voice answer count (where answer_text is not empty)
    const voiceAnswers = attempts.filter(
      (attempt) => attempt.answer_text && attempt.answer_text.trim() !== ''
    ).length;

    // Accuracy percentage
    const correctAnswers = attempts.filter((attempt) => attempt.is_correct).length;
    const accuracy = totalAttempts > 0 
      ? Math.round((correctAnswers / totalAttempts) * 100)
      : 0;

    // Practice streak (unique days practiced)
    const uniqueDates = new Set<string>();
    attempts.forEach((attempt) => {
      const date = new Date(attempt.created_at);
      const dateString = date.toISOString().split('T')[0];
      uniqueDates.add(dateString);
    });
    const practiceStreak = uniqueDates.size;

    return {
      totalAttempts,
      todayAttempts,
      voiceAnswers,
      correctAnswers,
      accuracy,
      practiceStreak,
    };
  };

  const stats = calculateStats();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { icon: '📊', label: 'Dashboard', active: true },
    { icon: '📥', label: 'Inbox', active: false },
    { icon: '📚', label: 'Practice', active: false, onClick: () => navigate('/practice') },
    { icon: '🎯', label: 'Mock Interview', active: false, onClick: () => navigate('/mock-interview') },
    { icon: '📈', label: 'Analytics', active: false },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 fixed h-full z-20`}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <div className="grid grid-cols-2 gap-0.5">
                <span className="h-2 w-2 rounded-full bg-white/90" />
                <span className="h-2 w-2 rounded-full bg-white/50" />
                <span className="h-2 w-2 rounded-full bg-white/50" />
                <span className="h-2 w-2 rounded-full bg-white/50" />
              </div>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-gray-900 text-lg">InterviewPro</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'Overview' : '•••'}
          </p>
          <ul className="space-y-2">
            {navItems.map((item, idx) => (
              <li key={idx}>
                <button
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? 'bg-gradient-to-r from-cyan-50 to-blue-50 text-blue-600 font-semibold border border-blue-100' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Settings & Logout */}
        <div className="p-4 border-t border-gray-100">
          <p className={`text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'Settings' : '•••'}
          </p>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <span className="text-xl">🚪</span>
            {sidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-80 pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors relative">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.email?.split('@')[0] || 'User'}</p>
                  <p className="text-xs text-gray-500">Pro Member</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Hero Banner */}
          <div className="relative rounded-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-blue-700" />
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            
            <div className="relative px-8 py-10 md:px-12">
              <p className="text-cyan-100 text-sm font-medium tracking-wider uppercase mb-2">Welcome Back</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
                Master Your Interview Skills
              </h1>
              <p className="text-blue-100 text-base max-w-xl mb-6">
                Practice with AI-powered mock interviews and track your progress to ace your next interview.
              </p>
              <button
                onClick={() => navigate('/practice')}
                className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
              >
                Start Practice
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total Practice', value: stats.totalAttempts, sublabel: 'questions', icon: '📝', color: 'from-cyan-500 to-blue-500' },
              { label: "Today's Practice", value: stats.todayAttempts, sublabel: 'today', icon: '📅', color: 'from-emerald-500 to-teal-500' },
              { label: 'Voice Attempts', value: stats.voiceAnswers, sublabel: 'spoken', icon: '🎤', color: 'from-purple-500 to-indigo-500' },
              { label: 'Accuracy', value: `${stats.accuracy}%`, sublabel: 'correct', icon: '🎯', color: 'from-amber-500 to-orange-500' },
              { label: 'Practice Days', value: stats.practiceStreak, sublabel: 'streak', icon: '🔥', color: 'from-rose-500 to-pink-500' },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} text-white text-lg`}>
                    {stat.icon}
                  </span>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Quick Actions */}
            <div className="lg:col-span-2 space-y-6">
              {/* Practice Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-blue-100 flex items-center justify-center text-2xl">
                      📚
                    </div>
                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full">Practice</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Practice Questions</h3>
                  <p className="text-gray-600 text-sm mb-4">Test your interview skills with curated questions across topics.</p>
                  <button
                    onClick={() => navigate('/practice')}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30"
                  >
                    Start Practice
                  </button>
                </div>

                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center text-2xl">
                      🎯
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">Mock</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Mock Interview</h3>
                  <p className="text-gray-600 text-sm mb-4">Experience a complete timed mock interview with 5 questions.</p>
                  <button
                    onClick={() => navigate('/mock-interview')}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/30"
                  >
                    Start Mock Interview
                  </button>
                </div>
              </div>

              {/* Recent Attempts */}
              {attempts.length > 0 && (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-gray-900">Recent Attempts</h3>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-700">See all</button>
                  </div>
                  <div className="space-y-3">
                    {attempts.slice(0, 5).map((attempt) => {
                      const questionText = attempt.questions?.question_text || 'Question unavailable';
                      const topic = attempt.questions?.topic;
                      const difficulty = attempt.questions?.difficulty;
                      
                      return (
                        <div 
                          key={attempt.id} 
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-md ${
                            attempt.is_correct 
                              ? 'bg-emerald-50/50 border-emerald-100 hover:bg-emerald-50' 
                              : 'bg-red-50/50 border-red-100 hover:bg-red-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                              attempt.is_correct 
                                ? 'bg-emerald-100 text-emerald-600' 
                                : 'bg-red-100 text-red-600'
                            }`}>
                              {attempt.is_correct ? '✓' : '✗'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 line-clamp-2 mb-1">
                                {questionText}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs text-gray-500">
                                  {new Date(attempt.created_at).toLocaleDateString()} at {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                                {topic && (
                                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                                    {topic}
                                  </span>
                                )}
                                {difficulty && (
                                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                    difficulty === 'easy' 
                                      ? 'bg-green-100 text-green-700' 
                                      : difficulty === 'medium'
                                      ? 'bg-amber-100 text-amber-700'
                                      : 'bg-red-100 text-red-700'
                                  }`}>
                                    {difficulty}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 ml-3 ${
                            attempt.is_correct 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {attempt.is_correct ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-6">
              {/* Statistics Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-bold text-gray-900">Statistics</h3>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </div>
                
                {/* Circular Progress */}
                <div className="flex justify-center mb-6">
                  <div className="relative w-32 h-32">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#e5e7eb"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="url(#gradient)"
                        strokeWidth="12"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(stats.accuracy / 100) * 352} 352`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-900">{stats.accuracy}%</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-gray-600 text-sm">
                  Great progress! Keep practicing to improve your accuracy.
                </p>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">💡</span>
                  <h3 className="font-bold text-lg">Quick Tip</h3>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  Practice speaking your answers out loud. This helps with articulation and builds confidence for real interviews.
                </p>
              </div>

              {/* Goals Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Goal</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Questions Practiced</span>
                      <span className="font-semibold text-gray-900">{stats.todayAttempts}/10</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((stats.todayAttempts / 10) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
