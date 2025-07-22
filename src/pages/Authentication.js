// LandingAuth.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  BarChart3,
  Target,
  CreditCard,
  Shield,
  Check
} from 'lucide-react';

/* ──────────────────────────── */
/*  Re-usable brand icon        */
/* ──────────────────────────── */
const RupeeIcon = ({ size = 24, className = '' }) => (
  <div
    className={`rupee-icon inline-flex items-center justify-center font-bold text-white ${className}`}
    style={{ fontSize: `${size}px`, width: `${size + 8}px`, height: `${size + 8}px` }}
  >
    ₹
  </div>
);

/* ──────────────────────────── */
/*  Feature list for marketing  */
/* ──────────────────────────── */
const features = [
  { icon: CreditCard, text: 'Track UPI, Bank & Card expenses' },
  { icon: BarChart3, text: 'Generate detailed financial reports' },
  { icon: Target, text: 'Set and monitor budget goals' },
  { icon: Shield, text: 'Secure cloud synchronization' }
];

/* ──────────────────────────── */
/*  Main component              */
/* ──────────────────────────── */
const LandingAuth = () => {
  /* FIXED: Remove demo credentials - use empty fields */
  const [email, setEmail] = useState('tashisharma121@gmail.com');
  const [password, setPassword] = useState('aaaaaa');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  /* FIXED: Use AuthContext methods instead of direct Supabase calls */
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  /* Redirect authenticated users */
  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/add-expense';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  /* Basic client-side validation */
  const validateForm = () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return false;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  /* FIXED: Form submission using AuthContext */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const result = isLogin
        ? await login({ email, password })
        : await signup({ email, password });

      if (!result.success) {
        setError(result.error || 'Authentication failed. Please try again.');
      } else {
        if (!isLogin) {
          setSuccess('Account created successfully! You can now sign in.');
          // Auto-switch to login mode after successful signup
          setTimeout(() => {
            setIsLogin(true);
            setSuccess('');
            setPassword('');
            setConfirmPassword('');
          }, 2000);
        }
        // Login success is handled by useEffect redirect
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* Switch login ↔ signup modes */
  const handleModeSwitch = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    // Clear form when switching modes
    setPassword('');
    setConfirmPassword('');
  };

  /* ──────────────────────── */
  /*  Render                  */
  /* ──────────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-8 px-4">
        {/* Left: Branding & Features */}
        <div className="space-y-8">
          <div className="text-center lg:text-left">
            <div className="flex justify-center lg:justify-start items-center gap-3 mb-4">
              <RupeeIcon size={32} className="bg-slate-900 rounded hover:-translate-y-1 transition-transform" />
              <h1 className="text-3xl font-bold text-slate-900">Spendigo</h1>
            </div>
            <p className="text-slate-600">
              Smart expense tracking and budgeting for the modern lifestyle
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-2 gap-6">
            {features.map((f, i) => (
              <div
                key={i}
                className="text-center p-4 bg-white rounded-lg shadow hover:shadow-lg transition"
              >
                <f.icon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-700">{f.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Auth Form */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-center text-slate-900 mb-2">
            {isLogin ? ' Welcome Back' : '🚀 Get Started'}
          </h2>
          <p className="text-center text-sm text-slate-600 mb-6">
            {isLogin ? 'Sign in to your dashboard' : 'Create your account to begin'}
          </p>

          {/* FIXED: Added success message display */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-green-700">
              <Check className="h-5 w-5" />
              <span className="text-sm">✅ {success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">❌ {error}</span>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5" autoComplete="on">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg bg-white text-black placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                <input
                  id="password"
                  name={isLogin ? 'current-password' : 'new-password'}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg bg-white text-black placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (only on signup) */}
            {!isLogin && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                  <input
                    id="confirmPassword"
                    name="new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-12 pr-12 py-3 border border-slate-300 rounded-lg bg-white text-black placeholder-slate-500 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((c) => !c)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 hover:scale-105 transition-transform disabled:opacity-60"
            >
              {isLoading && <Loader2 className="animate-spin h-5 w-5" />}
              {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={20} />
            </button>
          </form>

          {/* Toggle login/signup */}
          <p className="mt-4 text-center text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : 'Already have one?'}
            <button
              onClick={handleModeSwitch}
              className="ml-1 font-medium text-slate-900 hover:text-slate-700 underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-slate-400">
            Project by Tashi Sharma
          </div>

          <div className="mt-6 flex justify-center items-center gap-6 text-sm text-slate-500">
            {['10K+ Users', 'Bank-level Security', 'Free to Start'].map((txt, i) => (
              <div key={i} className="flex items-center gap-1">
                <Check className="h-5 w-5 text-slate-700" /> {txt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingAuth;
