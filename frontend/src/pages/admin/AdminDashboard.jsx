import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  Users, BookOpen, CheckCircle, XCircle, BarChart2, 
  HelpCircle, Zap, TrendingUp, Sparkles, RefreshCw 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid 
} from 'recharts';

export default function AdminDashboard({ setActivePage, onManageQuestions }) {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [sRes, aRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/charts')
      ]);
      setStats(sRes.data);
      setAnalytics(aRes.data);
    } catch (err) {
      console.error('Error fetching admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Executive Analytics Dashboard...</span>
        </div>
      </div>
    );
  }

  const passFailData = [
    { name: 'Passed', value: stats?.passed_attempts || 0, color: '#10b981' },
    { name: 'Failed', value: stats?.failed_attempts || 0, color: '#f43f5e' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> ADMIN CONTROL CENTER
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Platform Performance & Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time metrics, student attempts, score distributions, and content management</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('admin-quizzes')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20"
          >
            + Create New Quiz
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Students */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Students</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">{stats?.total_students || 0}</p>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quizzes (Pub / Draft)</p>
            <p className="text-2xl font-extrabold text-white mt-0.5">
              {stats?.published_quizzes || 0} <span className="text-xs font-normal text-slate-400">/ {stats?.draft_quizzes || 0}</span>
            </p>
          </div>
        </div>

        {/* Total Quiz Attempts */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Attempts</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{stats?.total_attempts || 0}</p>
          </div>
        </div>

        {/* Average Platform Score */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Avg Platform Score</p>
            <p className="text-2xl font-extrabold text-amber-400 mt-0.5">{stats?.avg_score || 0}%</p>
          </div>
        </div>

      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pass / Fail Distribution Pie Chart */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" /> Pass / Fail Ratio
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={passFailData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {passFailData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center items-center gap-6 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Passed ({stats?.passed_attempts || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-300">Failed ({stats?.failed_attempts || 0})</span>
            </div>
          </div>
        </div>

        {/* Most Popular Quizzes Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" /> Most Popular Quizzes by Attempt Volume
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.popular_quizzes || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="title" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="attempts" fill="#6366f1" radius={[8, 8, 0, 0]} name="Attempt Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Second Row: Line Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Attempts Over Time Line Chart */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" /> Quiz Attempts Over Time
          </h3>
          {analytics?.attempts_trend && analytics.attempts_trend.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.attempts_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 4, fill: '#a855f7' }} name="Attempts" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              No attempt data available yet. Students need to complete quizzes.
            </div>
          )}
        </div>

        {/* Student Registration Trend Line Chart */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Student Registration Trend
          </h3>
          {analytics?.registration_trend && analytics.registration_trend.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.registration_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#10b981' }} name="New Students" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center text-xs text-slate-500">
              No registration data available yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
