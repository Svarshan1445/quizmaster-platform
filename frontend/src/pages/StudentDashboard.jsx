import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Award, CheckCircle, XCircle, BarChart2, Zap, 
  ArrowRight, Clock, Trophy, BookOpen, Sparkles, RefreshCw, TrendingUp
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';

const SCORE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

export default function StudentDashboard({ setActivePage, onSelectQuiz, onSelectAttempt }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [perf, setPerf] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, perfRes] = await Promise.all([
        api.get('/users/student/dashboard'),
        api.get('/users/student/performance')
      ]);
      setStats(dashRes.data);
      setPerf(perfRes.data);
    } catch (err) {
      console.error('Error loading student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Student Performance Dashboard...</span>
        </div>
      </div>
    );
  }

  const scoreHistory = (perf?.attempts || []).map((a, i) => ({
    name: `#${i + 1}`,
    score: parseFloat(a.percentage.toFixed(1)),
    quiz: a.quiz_title,
    status: a.status
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 overflow-hidden shadow-2xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-3">
              <Sparkles className="w-3.5 h-3.5" /> STUDENT DASHBOARD
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-xl">
              Track your quiz attempts, view score statistics, and test your knowledge across multiple categories.
            </p>
          </div>
          <button
            onClick={() => setActivePage('quiz-discovery')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold shadow-lg shadow-indigo-500/25 transition transform hover:-translate-y-0.5"
          >
            <BookOpen className="w-5 h-5" />
            <span>Explore Quizzes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Attempted</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats?.total_attempts || 0}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Score</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats?.avg_score || 0}%</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Passed</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats?.passed_attempts || 0}</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mastery</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats?.best_score || 0}%</p>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-amber-500/30 bg-gradient-to-tr from-amber-500/10 via-slate-900 to-amber-900/10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-bounce">
            <span className="text-xl">🔥</span>
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">Study Streak</p>
            <p className="text-xl font-extrabold text-white mt-0.5">
              {stats?.streak_days || 0} Day{stats?.streak_days === 1 ? '' : 's'} 🔥
            </p>
          </div>
        </div>
      </div>

      {/* Gamification Achievements & Badges */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Student Achievements & Badges
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Unlock rewards as you attempt quizzes and improve your scores</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {/* Badge 1: First Step */}
          {(() => {
            const isUnlocked = (stats?.total_attempts || 0) >= 1;
            return (
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                isUnlocked
                  ? 'bg-gradient-to-b from-indigo-900/40 to-slate-900 border-indigo-500/40 text-white shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}>
                <div className="text-2xl mb-2">{isUnlocked ? '🚀' : '🔒'}</div>
                <h4 className="text-xs font-bold">{isUnlocked ? 'First Step' : 'Locked'}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Complete 1st Quiz</p>
                <span className={`mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })()}

          {/* Badge 2: Pass Master */}
          {(() => {
            const isUnlocked = (stats?.passed_count || 0) >= 3;
            return (
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                isUnlocked
                  ? 'bg-gradient-to-b from-emerald-900/40 to-slate-900 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}>
                <div className="text-2xl mb-2">{isUnlocked ? '🎓' : '🔒'}</div>
                <h4 className="text-xs font-bold">{isUnlocked ? 'Pass Master' : 'Locked'}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Pass 3 Quizzes</p>
                <span className={`mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })()}

          {/* Badge 3: Perfect 100 */}
          {(() => {
            const isUnlocked = (stats?.highest_score || 0) === 100;
            return (
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                isUnlocked
                  ? 'bg-gradient-to-b from-amber-900/40 to-slate-900 border-amber-500/40 text-white shadow-lg shadow-amber-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}>
                <div className="text-2xl mb-2">{isUnlocked ? '🎯' : '🔒'}</div>
                <h4 className="text-xs font-bold">{isUnlocked ? 'Perfect 100%' : 'Locked'}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Score 100% in a quiz</p>
                <span className={`mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'}`}>
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })()}

          {/* Badge 4: High Performer */}
          {(() => {
            const isUnlocked = (stats?.avg_score || 0) >= 80;
            return (
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                isUnlocked
                  ? 'bg-gradient-to-b from-purple-900/40 to-slate-900 border-purple-500/40 text-white shadow-lg shadow-purple-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}>
                <div className="text-2xl mb-2">{isUnlocked ? '⚡' : '🔒'}</div>
                <h4 className="text-xs font-bold">{isUnlocked ? 'High Performer' : 'Locked'}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Avg Score ≥ 80%</p>
                <span className={`mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-500'}`}>
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })()}

          {/* Badge 5: Knowledge Seeker */}
          {(() => {
            const isUnlocked = (stats?.total_attempts || 0) >= 5;
            return (
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center transition ${
                isUnlocked
                  ? 'bg-gradient-to-b from-pink-900/40 to-slate-900 border-pink-500/40 text-white shadow-lg shadow-pink-500/10'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60'
              }`}>
                <div className="text-2xl mb-2">{isUnlocked ? '📚' : '🔒'}</div>
                <h4 className="text-xs font-bold">{isUnlocked ? 'Scholar' : 'Locked'}</h4>
                <p className="text-[10px] text-slate-400 mt-1">Attempt 5+ Quizzes</p>
                <span className={`mt-2 text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isUnlocked ? 'bg-pink-500/20 text-pink-300' : 'bg-slate-800 text-slate-500'}`}>
                  {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Score Over Time Line Chart */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Score Progress Over Time
          </h3>
          {scoreHistory.length > 0 ? (
            <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={scoreHistory}>
                      <defs>
                        <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                        formatter={(val, name, props) => [`${val}%`, props.payload.quiz]}
                      />
                      <Line type="monotone" dataKey="score" stroke="#818cf8" strokeWidth={3} dot={{ r: 5, fill: '#6366f1', stroke: '#818cf8', strokeWidth: 2 }} name="Score" />
                    </LineChart>
                  </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-slate-500">
              Complete some quizzes to see your score progress!
            </div>
          )}
        </div>

        {/* Category Performance Bar Chart */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-purple-400" /> Avg Score by Category
          </h3>
          {perf?.category_stats && perf.category_stats.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perf.category_stats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="category" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} formatter={(v) => [`${v}%`, 'Avg Score']} />
                  <Bar dataKey="avg_score" radius={[8, 8, 0, 0]} name="Avg Score">
                    {perf.category_stats.map((_, i) => (
                      <Cell key={i} fill={SCORE_COLORS[i % SCORE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-xs text-slate-500">
              Complete quizzes in different categories to see performance!
            </div>
          )}
        </div>

      </div>

      {/* Recent Attempts Section */}
      <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" /> Recent Quiz Attempts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Your latest completed assessments</p>
          </div>
          <button
            onClick={() => setActivePage('history')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All History <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!stats?.recent_attempts || stats.recent_attempts.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/50 rounded-2xl border border-dashed border-slate-800">
            <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-300">No quiz attempts yet</p>
            <p className="text-xs text-slate-500 mt-1 mb-4">Start your first assessment to track your progress!</p>
            <button
              onClick={() => setActivePage('quiz-discovery')}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500"
            >
              Browse Available Quizzes
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">Quiz Title</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-center">Date</th>
                  <th className="pb-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {stats.recent_attempts.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-semibold text-white">{attempt.quiz_title}</td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                        {attempt.category_name || 'General'}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-white">
                      {attempt.percentage}%
                      <span className="text-xs font-normal text-slate-400 block">
                        ({attempt.score}/{attempt.total_marks})
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {attempt.status === 'PASSED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" /> Passed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                          <XCircle className="w-3.5 h-3.5" /> Failed
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-400">
                      {new Date(attempt.completed_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => onSelectAttempt(attempt.id)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition"
                      >
                        View Result
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
