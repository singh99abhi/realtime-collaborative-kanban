import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trello, ArrowRight, UserCheck, Shield, Sparkles } from 'lucide-react';

export function AuthPage() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'Password123!');
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/40">
      <div className="w-full max-w-md">
        
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-blue-600/20 rounded-2xl border border-blue-500/30 text-blue-400 mb-4 shadow-inner">
            <Trello className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            SyncBoard
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Real-Time Collaborative Kanban Board
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex border-b border-slate-800 mb-6 pb-2">
            <button
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 text-center pb-2 text-sm font-semibold transition border-b-2 -mb-2 ${
                !isRegister
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 text-center pb-2 text-sm font-semibold transition border-b-2 -mb-2 ${
                isRegister
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Alex Johnson"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isRegister ? 'Register & Enter Workspace' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Switcher Section */}
          <div className="mt-8 pt-6 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Quick Demo Accounts (1-Click Login)
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('alice@example.com')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-semibold text-slate-200">Alice Engineer</span>
                  <span className="text-slate-400 text-[11px]">(Owner of Sprint Board)</span>
                </div>
                <span className="text-blue-400 font-medium">Use &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('bob@example.com')}
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 text-left text-xs transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                  <span className="font-semibold text-slate-200">Bob Product</span>
                  <span className="text-slate-400 text-[11px]">(Collaborator)</span>
                </div>
                <span className="text-blue-400 font-medium">Use &rarr;</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 text-center">
              Open an incognito window with Bob to test real-time collaboration with Alice!
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
