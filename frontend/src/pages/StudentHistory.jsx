import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Award, CheckCircle, XCircle, Clock, Calendar, ArrowRight, RefreshCw, Copy, Check } from 'lucide-react';

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
      className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-300 bg-slate-950/90 hover:bg-slate-900 hover:border-emerald-400 px-2.5 py-0.5 rounded-lg border border-emerald-500/40 tracking-tight cursor-pointer transition shadow-md group"
      title="Click to copy Certificate ID"
    >
      <span>{code}</span>
      {copied ? (
        <span className="text-emerald-400 font-sans font-extrabold text-[9px] flex items-center gap-0.5">
          <Check className="w-3 h-3 text-emerald-400" /> Copied!
        </span>
      ) : (
        <Copy className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition" />
      )}
    </button>
  );
}

export default function StudentHistory({ onSelectAttempt }) {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await api.get('/attempts');
        setAttempts(res.data);
      } catch (err) {
        console.error('Error loading attempt history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Quiz Attempt History...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Award className="w-8 h-8 text-indigo-400" /> Quiz Attempt History
        </h1>
        <p className="text-sm text-slate-400 mt-1">Review all your previous quiz scores, dates, and detailed performance breakdown</p>
      </div>

      {attempts.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Award className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Quiz History Found</h3>
          <p className="text-xs text-slate-500 mt-1">Take a quiz from the discovery catalog to build your history!</p>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">Assessment Title</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4 text-center">Score %</th>
                  <th className="pb-3 px-4 text-center">Time Taken</th>
                  <th className="pb-3 px-4 text-center">Status & Certificate ID</th>
                  <th className="pb-3 px-4 text-center">Date</th>
                  <th className="pb-3 px-4 text-right">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {attempts.map((att) => {
                  const certCode = `CERT-QM-${att.id}-${att.user_id}`;
                  return (
                    <tr key={att.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 font-bold text-white">
                        {att.quiz_title}
                      </td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        <span className="px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                          {att.category_name || 'General'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-white">
                        {att.percentage}%
                        <span className="text-xs font-normal text-slate-400 block">
                          ({att.score}/{att.total_marks})
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-slate-300">
                        {formatTime(att.time_taken)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {att.status === 'PASSED' ? (
                          <div className="flex flex-col items-center gap-1.5">
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
                        {new Date(att.completed_at).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => onSelectAttempt(att.id)}
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
