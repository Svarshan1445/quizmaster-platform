import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Award, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle, ArrowLeft } from 'lucide-react';

export default function Login({ onSwitchToRegister, onBack, role, onForgotPassword }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Google Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('quizmaster_google_accounts');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) {}

    // Check for Google OAuth redirect token in URL hash
    if (window.location.hash && window.location.hash.includes('access_token')) {
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      if (accessToken) {
        setLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
          .then(r => r.json())
          .then(async info => {
            if (info.email) {
              const res = await api.post('/auth/google-login', { email: info.email, name: info.name || info.email.split('@')[0] });
              saveAccountToDevice(info.email);
              localStorage.setItem('auth_token', res.data.token);
              localStorage.setItem('quiz_token', res.data.token);
              sessionStorage.setItem('quiz_token', res.data.token);
              window.history.replaceState({}, document.title, window.location.pathname);
              window.location.reload();
            }
          })
          .catch(err => console.error('OAuth userinfo error:', err))
          .finally(() => setLoading(false));
      }
    }
  }, []);

  const handleGoogleAuthPopup = () => {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const clientId = '562875979363-l4laoa0hagrn28kadun6cvofn4tcfnd8.apps.googleusercontent.com';
    const redirectUri = window.location.origin;

    const googlePopupUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${encodeURIComponent('email profile')}&` +
      `prompt=select_account`;

    const popup = window.open(
      googlePopupUrl,
      'GoogleSignInPopup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes`
    );

    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      setShowGoogleModal(true);
    }
  };

  const saveAccountToDevice = (accEmail) => {
    try {
      let updated = [...savedAccounts];
      if (!updated.includes(accEmail)) {
        updated.unshift(accEmail);
        if (updated.length > 5) updated = updated.slice(0, 5);
        setSavedAccounts(updated);
        localStorage.setItem('quizmaster_google_accounts', JSON.stringify(updated));
      }
    } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e, customEmail = null) => {
    if (e) e.preventDefault();
    const targetEmail = customEmail || googleEmailInput.trim();
    if (!targetEmail) return;

    setGoogleLoading(true);
    try {
      const res = await api.post('/auth/google-login', {
        email: targetEmail,
        name: targetEmail.split('@')[0]
      });
      saveAccountToDevice(targetEmail);
      localStorage.setItem('auth_token', res.data.token);
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.message || 'Google Authentication Failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  // ---- FORGOT PASSWORD FORM ----


  // ---- LOGIN FORM ----
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-md bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl">

        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Role Selection
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${
            role === 'admin'
              ? 'bg-gradient-to-tr from-indigo-500 to-violet-600 shadow-indigo-500/30'
              : 'bg-gradient-to-tr from-emerald-500 to-teal-600 shadow-emerald-500/30'
          }`}>
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-3 ${
            role === 'admin'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
          }`}>
            {role === 'admin' ? <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> : <UserCheck className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{role === 'admin' ? 'Administrator Authentication' : 'Student Portal Login'}</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome Back</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to access your quizzes and certificates</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Password</label>
              <button
                type="button"
                onClick={() => onForgotPassword ? onForgotPassword() : null}
                className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span>Signing In...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-indigo-400 font-semibold hover:underline cursor-pointer"
          >
            Register Student Account
          </button>
        </div>

      </div>
    </div>
  );
}
