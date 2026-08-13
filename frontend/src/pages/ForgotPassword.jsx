import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, Loader2, KeyRound } from 'lucide-react';
import api from '../services/api';

export default function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
            <KeyRound className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Forgot Password?</h1>
          <p className="text-slate-400 text-sm mt-1">QuizMaster Assessment Platform</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-500/10 rounded-full mb-4">
                <CheckCircle className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Check Your Email!</h2>
              <p className="text-slate-400 text-sm mb-2">
                We've sent a password reset link to:
              </p>
              <p className="text-indigo-400 font-semibold text-sm mb-6">{email}</p>
              <div className="bg-slate-800 rounded-xl p-4 mb-6 text-left space-y-2">
                <p className="text-slate-300 text-xs font-medium">Next steps:</p>
                <p className="text-slate-400 text-xs">1. Open your email inbox</p>
                <p className="text-slate-400 text-xs">2. Click the <strong className="text-white">"Reset My Password"</strong> button</p>
                <p className="text-slate-400 text-xs">3. Set your new password ⏰ Link expires in 1 hour</p>
              </div>
              <button
                onClick={() => { setSent(false); setEmail(''); }}
                className="text-indigo-400 hover:text-indigo-300 text-sm underline"
              >
                Didn't receive? Send again
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-white mb-1">Reset Your Password</h2>
              <p className="text-slate-400 text-sm mb-6">
                Enter your registered email address and we'll send you a secure reset link.
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 pl-10 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold transition-all flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending Reset Link...</>
                    : <><Mail className="w-4 h-4" /> Send Reset Link</>
                  }
                </button>
              </form>

              <button
                onClick={onBack}
                className="mt-4 w-full flex items-center justify-center gap-2 text-slate-400 hover:text-white text-sm transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
