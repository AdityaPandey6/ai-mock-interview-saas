import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Card from '../components/Card';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If user is logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const stats = [
    { label: 'Total Users', value: '10K+', icon: '👥' },
    { label: 'Mock Interviews', value: '50K+', icon: '🎯' },
    { label: 'Practice Sessions', value: '100K+', icon: '🎤' },
    { label: 'Success Rate', value: '87%', icon: '⭐' },
  ];

  const features = [
    {
      icon: '🎤',
      title: 'Voice Answer Practice',
      description: 'Practice speaking answers with our AI-powered speech recognition technology.',
    },
    {
      icon: '⏱️',
      title: 'Real-time Mock Interviews',
      description: 'Experience timed mock interviews that simulate real interview conditions.',
    },
    {
      icon: '📊',
      title: 'Progress Analytics',
      description: 'Track your performance with detailed analytics and improvement areas.',
    },
    {
      icon: '🏷️',
      title: 'Topic-wise Practice',
      description: 'Practice specific topics and build expertise in your weak areas.',
    },
    {
      icon: '🔄',
      title: 'Unlimited Retakes',
      description: 'Practice as many times as you want with no limits.',
    },
    {
      icon: '📈',
      title: 'Performance Insights',
      description: 'Get actionable insights to improve your interview skills.',
    },
  ];

  const benefits = [
    {
      title: 'Improve Communication Skills',
      description: 'Perfect your ability to articulate ideas clearly and concisely under pressure.',
      icon: '💬',
    },
    {
      title: 'Practice Under Interview Pressure',
      description: 'Get comfortable with timed questions and real-world interview scenarios.',
      icon: '⚡',
    },
    {
      title: 'Track Weak Areas',
      description: 'Identify topics where you need improvement and focus your practice.',
      icon: '🎯',
    },
    {
      title: 'Build Confidence',
      description: 'Gain confidence through repeated practice and measurable progress.',
      icon: '💪',
    },
  ];

  const pricingPlans = [
    {
      name: 'FREE',
      price: '$0',
      description: 'Perfect for getting started',
      features: ['5 Practice Questions', 'Limited Mock Interviews', 'Basic Progress Tracking'],
      highlight: false,
    },
    {
      name: 'PRO',
      price: '$9.99',
      period: '/month',
      description: 'Best for serious learners',
      features: [
        'Unlimited Mock Interviews',
        'Voice Answer Analytics',
        'Advanced Progress Tracking',
        'Topic-wise Reports',
        'Priority Support',
      ],
      highlight: true,
    },
    {
      name: 'ENTERPRISE',
      price: 'Custom',
      description: 'For teams and organizations',
      features: [
        'Everything in Pro',
        'Team Analytics',
        'Custom Questions',
        'Dedicated Support',
        'API Access',
      ],
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 backdrop-blur-md bg-opacity-90">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white shadow-sm border border-gray-200 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-500" />
                <span className="h-2 w-2 rounded-full bg-gray-900" />
                <span className="h-2 w-2 rounded-full bg-gray-900" />
                <span className="h-2 w-2 rounded-full bg-gray-900" />
              </div>
            </div>
            <div className="text-lg font-semibold text-gray-900">InterviewPro</div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-gray-900 transition-colors">Solutions</a>
            <a href="#resources" className="hover:text-gray-900 transition-colors">Resources</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="hidden sm:inline-flex text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
            >
              Get demo
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gray-100">
        {/* <div className="max-w-7xl mx-auto px-6 py-10 md:spy-14"> */}
        <div className="max-w-[1700px] mx-auto px-8 py-20 md:py-18">

          {/* <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"> */}
          <div className="rounded-[28px] border border-gray-200 bg-white shadow-xl overflow-hidden">

            <div className="relative">
              {/* dotted/pattern background + bright blur accents */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    'radial-gradient(rgba(17,24,39,0.08) 1px, transparent 1px)',
                  backgroundSize: '14px 14px',
                }}
              />
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-cyan-400 opacity-25 blur-3xl" />
                <div className="absolute -right-24 top-10 h-64 w-64 rounded-full bg-fuchsia-400 opacity-25 blur-3xl" />
                <div className="absolute left-1/2 bottom-0 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-300 opacity-20 blur-3xl" />
              </div>

              {/* <div className="relative px-6 py-14 md:px-12 md:py-20 lg:px-16"> */}
              <div className="relative px-10 py-24 md:px-20 md:py-28 lg:px-28">

                {/* Center logo mark */}
                <div className="mx-auto mb-10 h-16 w-16 rounded-2xl bg-white shadow-md border border-gray-200 flex items-center justify-center anim-fade-up">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="h-3 w-3 rounded-full bg-cyan-500" />
                    <span className="h-3 w-3 rounded-full bg-gray-900" />
                    <span className="h-3 w-3 rounded-full bg-gray-900" />
                    <span className="h-3 w-3 rounded-full bg-gray-900" />
                  </div>
                </div>

                {/* Headline */}
                <div className="max-w-3xl mx-auto text-center">
                  {/* <h1 className="text-4xl md:text-6xl font-semibold tracking-tight text-gray-900"> */}
                  <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-tight">

                    Think, practice, and improve
                    {/* <span className="block text-gray-300 font-semibold"> */}
                    <span className="block text-gray-400 font-medium">

                      all in one place
                    </span>
                  </h1>
                  <p className="mt-6 text-base md:text-lg text-gray-600 anim-fade-up-delayed-1">
                    Efficiently train with curated questions, timed mocks, and voice practice to boost your interview confidence.
                  </p>

                  {/* <div className="mt-10 flex justify-center anim-fade-up-delayed-2"> */}
                  <div className="mt-14 flex justify-center anim-fade-up-delayed-2">

                    <button
                      type="button"
                      onClick={() => navigate('/register')}
                      // className="rounded-xl bg-blue-600 px-6 py-3 text-white font-medium shadow-sm hover:bg-blue-700 transition-colors hover:shadow-md"
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-white font-semibold shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:shadow-xl"

                    >
                      Get free demo
                    </button>
                  </div>
                </div>

                {/* Floating UI cards (inspired layout) */}
                <div className="hidden md:block">
                  {/* Left sticky note */}
                  <div className="absolute left-8 top-16 w-56 rotate-[-6deg] anim-float-slowest">
                    <div className="rounded-2xl bg-amber-200/70 border border-amber-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <p className="text-sm text-gray-900 font-medium">
                        Take notes to keep track of crucial details, and practice with ease.
                      </p>
                    </div>
                  </div>

                  {/* Left bottom card */}
                  <div className="absolute left-8 bottom-8 w-72 anim-float-slower">
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-900 mb-3">Today’s practice</p>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-red-50 text-red-600 text-xs font-bold">8</span>
                            <span className="text-sm text-gray-700">Behavioral: STAR answers</span>
                          </div>
                          <span className="text-xs text-gray-500">60%</span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full w-[60%] bg-gradient-to-r from-cyan-500 to-blue-600" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right reminders card */}
                  <div className="absolute right-10 top-14 w-60 rotate-[4deg] anim-float-slowest">
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-900 mb-2">Reminders</p>
                      <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                        <p className="text-xs font-semibold text-gray-700">Today’s mock</p>
                        <p className="text-xs text-gray-500 mt-1">System design • 60 minutes</p>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100 px-3 py-1 text-xs">
                          ⏱ 13:00 - 13:45
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right bottom integrations card */}
                  <div className="absolute right-10 bottom-8 w-72 rotate-[2deg] anim-float-slow">
                    <div className="rounded-2xl bg-white border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                      <p className="text-sm font-semibold text-gray-900 mb-3">100+ Integrations</p>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 shadow-sm grid place-items-center">
                          <span className="text-xl">📩</span>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 shadow-sm grid place-items-center">
                          <span className="text-xl">💬</span>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-white border border-gray-200 shadow-sm grid place-items-center">
                          <span className="text-xl">📅</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* Stats Section */}
      <section className="bg-white" id="solutions">
        <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <Card key={idx} className="relative overflow-hidden">
                <div
                  className={`absolute inset-x-0 top-0 h-1 ${
                    idx % 4 === 0
                      ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500'
                      : idx % 4 === 1
                        ? 'bg-gradient-to-r from-cyan-500 to-sky-500'
                        : idx % 4 === 2
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                />
                <div className="flex flex-col items-center text-center pt-2">
                  <div className="text-3xl mb-3">{stat.icon}</div>
                  <p className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-gray-600 text-xs md:text-sm mt-2">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* Features Section */}
      <section className="bg-gradient-to-b from-gray-50 via-white to-gray-50" id="features">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Better Results
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Everything you need to simulate real interviews and build repeatable confidence.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <Card key={idx} className="hover:shadow-xl">
                <div
                  className={`inline-flex items-center justify-center rounded-2xl px-4 py-3 mb-4 border ${
                    idx % 3 === 0
                      ? 'bg-fuchsia-50 border-fuchsia-100 text-fuchsia-700'
                      : idx % 3 === 1
                        ? 'bg-cyan-50 border-cyan-100 text-cyan-700'
                        : 'bg-amber-50 border-amber-100 text-amber-700'
                  }`}
                >
                  <span className="text-3xl leading-none">{feature.icon}</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm md:text-base">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* Benefits Section */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white" id="resources">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Candidates Choose InterviewPro
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Go beyond question banks with a practice loop that mimics real interview pressure.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, idx) => (
              <div
                key={idx}
                className="flex gap-4 bg-gray-800/60 rounded-2xl p-6 border border-gray-700 hover:border-emerald-500 transition-colors"
              >
                <div className="text-3xl flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">{benefit.title}</h3>
                  <p className="text-gray-300 text-sm md:text-base">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gray-200" />

      {/* Pricing Section */}
      <section className="bg-white" id="pricing">
        <div className="max-w-7xl mx-auto px-6 py-24">
          <div className="mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-center text-gray-600 text-lg">
              Start free and upgrade only when you&apos;re ready.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, idx) => (
              <Card key={idx} highlight={plan.highlight}>
                {plan.highlight && (
                  <div className="mb-4">
                    <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  {plan.period && <span className="text-gray-600 ml-2">{plan.period}</span>}
                </div>
                <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                <Button
                  variant={plan.highlight ? 'secondary' : 'outline'}
                  className="w-full mb-6"
                  onClick={() => navigate('/register')}
                >
                  Get Started
                </Button>
                <ul className="space-y-3">
                  {plan.features.map((feature, fidx) => (
                    <li key={fidx} className="flex items-center text-gray-700 text-sm">
                      <span className="text-emerald-500 mr-3">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-b from-white via-gray-50 to-gray-100 relative overflow-hidden">
        {/* Subtle gradient overlay accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-cyan-400 opacity-15 blur-3xl" />
          <div className="absolute -right-20 top-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-blue-400 opacity-15 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 py-20 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Ready to Excel in Your Interviews?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join InterviewPro today and turn practice into consistent, repeatable success.
          </p>
          <Button
            variant="primary"
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-600 hover:to-blue-700 border-0"
            onClick={() => navigate('/register')}
          >
            Start Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-xl font-bold text-white mb-4">InterviewPro</div>
              <p className="text-sm">
                Master interview skills with AI-powered practice and real-time feedback.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm">&copy; 2026 InterviewPro. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-sm hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-sm hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-sm hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 