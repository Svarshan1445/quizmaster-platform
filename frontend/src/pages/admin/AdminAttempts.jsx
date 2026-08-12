import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Award, CheckCircle, XCircle, Clock, ArrowRight, RefreshCw, Search, Filter, Copy, Check } from 'lucide-react';

function CopyCertBadge({ code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-slate-950/90 hover:bg-slate-900 hover:border-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40 tracking-tight cursor-pointer transition shadow-md group"
      title="Click to copy Certificate ID"
    >
      <span>{code}</span>
      {copied ? (
        <span className="text-emerald-400 font-sans font-extrabold text-[9px] flex items-center gap-0.5">
          <Check className="w-3 h-3 text-emerald-400" /> Copied!
        </span>
      ) : (
        <Copy className="w-2.5 h-2.5 text-emerald-400 group-hover:scale-110 transition" />
      )}
    </button>
  );
}

export default function AdminAttempts({ onSelectAttempt }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAllAttempts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const res = await api.get('/attempts', { params });
      setAttempts(res.data);
    } catch (err) {
      console.error('Error fetching all attempts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => { fetchAllAttempts(); }, 400);
    return () => clearTimeout(timer);
  }, [fetchAllAttempts]);

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Award className="w-8 h-8 text-indigo-400" /> Platform-Wide Quiz Attempts
          </h1>
          <p className="text-sm text-slate-400 mt-1">Audit log of all student test submissions and score outcomes</p>
        </div>
        <button onClick={fetchAllAttempts} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition cursor-pointer">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by student name, email, or quiz title..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>
        <div className="relative">
          <Filter className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-8 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer transition"
          >
            <option value="ALL">All Status</option>
            <option value="PASSED">Passed Only</option>
            <option value="FAILED">Failed Only</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading attempts...</span>
          </div>
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Attempts Found</h3>
          <p className="text-sm text-slate-400 mt-1">Try adjusting the search or filter criteria</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-slate-400 font-medium">{attempts.length} result{attempts.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">Student</th>
                  <th className="pb-3 px-4">Quiz</th>
                  <th className="pb-3 px-4 text-center">Score</th>
                  <th className="pb-3 px-4 text-center">Correct / Total</th>
                  <th className="pb-3 px-4 text-center">Time Taken</th>
                  <th className="pb-3 px-4 text-center">Status & Cert ID</th>
                  <th className="pb-3 px-4 text-center">Date</th>
                  <th className="pb-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {attempts.map((attempt) => {
                  const certCode = `CERT-QM-${attempt.id}-${attempt.user_id}`;
                  return (
                    <tr key={attempt.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4">
                        <p className="font-semibold text-white text-sm">{attempt.student_name}</p>
                        <p className="text-xs text-slate-500">{attempt.student_email}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-medium text-slate-200">{attempt.quiz_title}</p>
                        <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                          {attempt.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-white">
                        {attempt.percentage}%
                        <span className="block text-xs font-normal text-slate-400">({attempt.score}/{attempt.total_marks})</span>
                      </td>
                      <td className="py-4 px-4 text-center text-xs">
                        <span className="text-emerald-400 font-semibold">{attempt.correct_answers} ✓</span>
                        <span className="text-slate-500 mx-1">/</span>
                        <span className="text-slate-300 font-semibold">{attempt.total_questions}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-slate-400">
                        {formatTime(attempt.time_taken)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {attempt.status === 'PASSED' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle className="w-3.5 h-3.5" /> Passed
                            </span>
                            <CopyCertBadge code={certCode} />
                          </div>
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
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          Review <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
