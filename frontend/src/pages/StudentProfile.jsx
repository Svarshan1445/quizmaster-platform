import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { User, Lock, Save, CheckCircle, AlertCircle, Eye, EyeOff, RefreshCw, Sparkles, Award, ShieldCheck, Zap, Target } from 'lucide-react';

export default function StudentProfile() {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [institutionName, setInstitutionName] = useState(user?.institution_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || 'coder');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [targetRole, setTargetRole] = useState(user?.target_role || '');

  const [profileMsg, setProfileMsg] = useState('');
  const [profileErr, setProfileErr] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  const avatarPresets = [
    { id: 'coder', emoji: '🧑‍💻', name: 'Developer Coder' },
    { id: 'scholar', emoji: '🎓', name: 'Academic Scholar' },
    { id: 'ninja', emoji: '🥷', name: 'Code Ninja' },
    { id: 'scientist', emoji: '🔬', name: 'Data Scientist' },
    { id: 'explorer', emoji: '🚀', name: 'Tech Explorer' }
  ];

  const getAvatarEmoji = (avId) => {
    const found = avatarPresets.find(a => a.id === avId);
    return found ? found.emoji : '🧑‍💻';
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhoneNumber(user.phone_number || '');
      setInstitutionName(user.institution_name || '');
      setDepartment(user.department || '');
      setAvatarUrl(user.avatar_url || 'coder');
      setGithubUrl(user.github_url || '');
      setLinkedinUrl(user.linkedin_url || '');
      setTargetRole(user.target_role || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg(''); setProfileErr('');
    setProfileLoading(true);
    try {
      const res = await api.put('/users/profile', {
        name,
        phone_number: phoneNumber,
        institution_name: institutionName,
        department,
        avatar_url: avatarUrl,
        github_url: githubUrl,
        linkedin_url: linkedinUrl,
        target_role: targetRole
      });
      setProfileMsg('Profile and Academic details updated successfully!');
      const updated = res.data.user;
      sessionStorage.setItem('quiz_user', JSON.stringify(updated));
      if (setUser) setUser(updated);
    } catch (err) {
      setProfileErr(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwdMsg(''); setPwdErr('');
    if (newPwd !== confirmPwd) {
      return setPwdErr('New passwords do not match');
    }
    if (newPwd.length < 6) {
      return setPwdErr('New password must be at least 6 characters');
    }
    setPwdLoading(true);
    try {
      await api.put('/users/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      setPwdMsg('Password changed successfully!');
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err) {
      setPwdErr(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  const [masteryData, setMasteryData] = useState([]);
  const [activeTheme, setActiveTheme] = useState(localStorage.getItem('app_theme') || 'indigo');

  React.useEffect(() => {
    const fetchMastery = async () => {
      try {
        const res = await api.get('/attempts/mastery');
        setMasteryData(res.data);
      } catch (e) {
        console.error('Error fetching mastery:', e);
      }
    };
    fetchMastery();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

      {/* Profile Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/70 via-purple-900/50 to-slate-900 border border-indigo-500/30 p-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-slate-950/80 border border-indigo-500/40 flex items-center justify-center text-4xl shadow-lg shrink-0">
            {getAvatarEmoji(user?.avatar_url)}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {user?.role === 'ADMIN' ? '🛡️ Administrator' : '🎓 Student'}
              </span>
              {user?.target_role && (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  🎯 {user.target_role}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
            <p className="text-sm text-slate-400">{user?.email}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 pt-1">
              {user?.institution_name && (
                <span className="font-semibold text-indigo-300">🏛️ {user.institution_name}</span>
              )}
              {user?.department && (
                <span className="text-slate-400">🎓 {user.department}</span>
              )}
              {user?.phone_number && (
                <span className="text-slate-400">📞 {user.phone_number}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" /> Academic & Personal Profile
        </h2>

        {profileMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {profileMsg}
          </div>
        )}
        {profileErr && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {profileErr}
          </div>
        )}

        <form onSubmit={handleUpdateProfile} className="space-y-5 text-left">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Choose Profile Avatar</label>
            <div className="grid grid-cols-5 gap-2">
              {avatarPresets.map(av => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarUrl(av.id)}
                  className={`p-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
                    avatarUrl === av.id
                      ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-[10px] truncate max-w-full font-semibold">{av.id}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Institution & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">College / Institution Name</label>
              <input
                type="text"
                value={institutionName}
                onChange={e => setInstitutionName(e.target.value)}
                placeholder="e.g. Anna University / PSG Tech"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Department / Branch</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                placeholder="e.g. B.E. Computer Science"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Target Career Role Bio */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Target Career Goal / Bio</label>
            <input
              type="text"
              value={targetRole}
              onChange={e => setTargetRole(e.target.value)}
              placeholder="e.g. Aspiring Full-Stack Web Developer / Data Scientist"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">GitHub Profile URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={e => setGithubUrl(e.target.value)}
                placeholder="https://github.com/yourusername"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">LinkedIn Profile URL</label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourusername"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full bg-slate-950/30 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-500 cursor-not-allowed"
            />
            <p className="text-[11px] text-slate-500 mt-1">Email address is permanently locked to your account</p>
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition disabled:opacity-50 shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {profileLoading ? 'Saving Profile...' : 'Save Academic Profile ✨'}
          </button>
        </form>
      </div>

      {/* Skill Mastery Radar Chart */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" /> Category Skill Mastery Radar
        </h2>
        <p className="text-xs text-slate-400">Spider web radar breakdown of your skill mastery % across subject categories</p>

        {masteryData.length > 0 ? (
          <div className="h-64 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={masteryData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="category" stroke="#cbd5e1" fontSize={11} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={10} />
                <Radar name="Mastery %" dataKey="mastery" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center">
            <p className="text-xs text-slate-400">Complete quizzes across different categories to generate your Skill Radar!</p>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" /> Change Password
        </h2>

        {pwdMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" /> {pwdMsg}
          </div>
        )}
        {pwdErr && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {pwdErr}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                required
                value={currentPwd}
                onChange={e => setCurrentPwd(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <button type="button" onClick={() => setShowCurrent(p => !p)} className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white">
                {showCurrent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                required
                value={newPwd}
                onChange={e => setNewPwd(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 pr-11 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
              />
              <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3.5 top-2.5 text-slate-500 hover:text-white">
                {showNew ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input
              type="password"
              required
              value={confirmPwd}
              onChange={e => setConfirmPwd(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
          <button
            type="submit"
            disabled={pwdLoading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold text-sm transition disabled:opacity-50 shadow-lg shadow-purple-600/20"
          >
            {pwdLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {pwdLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>

      {/* Theme Accent Customizer */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" /> Platform Theme & Accent Glow
        </h2>
        <p className="text-xs text-slate-400">Customize your workspace visual theme accent</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleApplyTheme('indigo')}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
              activeTheme === 'indigo'
                ? 'bg-indigo-600/30 border-2 border-indigo-400 text-indigo-200 shadow-lg shadow-indigo-500/20'
                : 'bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/20'
            }`}
          >
            <span>Deep Indigo</span>
            <span className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white">
              {activeTheme === 'indigo' ? '✓' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTheme('emerald')}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
              activeTheme === 'emerald'
                ? 'bg-emerald-600/30 border-2 border-emerald-400 text-emerald-200 shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/20'
            }`}
          >
            <span>Emerald Forest</span>
            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white">
              {activeTheme === 'emerald' ? '✓' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTheme('violet')}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
              activeTheme === 'violet'
                ? 'bg-purple-600/30 border-2 border-purple-400 text-purple-200 shadow-lg shadow-purple-500/20'
                : 'bg-purple-600/10 border border-purple-500/30 text-purple-400 hover:bg-purple-600/20'
            }`}
          >
            <span>Royal Violet</span>
            <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[10px] text-white">
              {activeTheme === 'violet' ? '✓' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyTheme('rose')}
            className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
              activeTheme === 'rose'
                ? 'bg-rose-600/30 border-2 border-rose-400 text-rose-200 shadow-lg shadow-rose-500/20'
                : 'bg-rose-600/10 border border-rose-500/30 text-rose-400 hover:bg-rose-600/20'
            }`}
          >
            <span>Crimson Rose</span>
            <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[10px] text-white">
              {activeTheme === 'rose' ? '✓' : ''}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
