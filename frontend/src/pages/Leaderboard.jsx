import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Trophy, Medal, Crown, Sparkles, Filter, RefreshCw } from 'lucide-react';

export default function Leaderboard() {
  const [rankings, setRankings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const [lRes, cRes] = await Promise.all([
        api.get('/leaderboard', {
          params: {
            categoryId: selectedCategory || undefined,
            timeframe: timeframe
          }
        }),
        api.get('/categories')
      ]);
      setRankings(lRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory, timeframe]);

  const top3 = rankings.slice(0, 3);
  const remainingRankings = rankings.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <Trophy className="w-4 h-4" /> GLOBAL STUDENT RANKINGS
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Leaderboard</h1>
        <p className="text-sm text-slate-400">
          Top performing students ranked by average score, passed quizzes, and total points.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Filter Leaderboard</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            className="bg-slate-950/60 border border-slate-700/80 text-xs font-medium text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="">All Categories</option>
            {categories.map((c) => (
              <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Timeframe Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeframe === 'all' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                timeframe === 'month' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Last 30 Days
            </button>
          </div>

        </div>

      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-amber-400 font-semibold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading Rankings...</span>
          </div>
        </div>
      ) : rankings.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Leaderboard Data Yet</h3>
          <p className="text-xs text-slate-500 mt-1">Complete quizzes to get ranked on the leaderboard!</p>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top 3 Podium Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              
              {/* Rank 2 - Silver */}
              {top3[1] && (
                <div className="glass-card rounded-3xl border border-slate-700/60 p-6 text-center space-y-3 relative overflow-hidden order-2 md:order-1">
                  <div className="w-12 h-12 rounded-2xl bg-slate-700 text-slate-200 flex items-center justify-center mx-auto shadow-lg font-extrabold text-lg">
                    #2
                  </div>
                  <h3 className="text-lg font-bold text-white">{top3[1].student_name}</h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="font-extrabold text-2xl text-slate-200">{top3[1].avg_score}%</p>
                    <p>Avg Score across {top3[1].total_attempts} attempt(s)</p>
                  </div>
                </div>
              )}

              {/* Rank 1 - Gold Champion */}
              {top3[0] && (
                <div className="glass-card rounded-3xl border border-amber-500/60 p-8 text-center space-y-3 relative overflow-hidden order-1 md:order-2 bg-gradient-to-b from-amber-950/30 to-slate-900 shadow-2xl shadow-amber-500/10 transform md:-translate-y-4">
                  <div className="absolute top-2 right-2">
                    <Crown className="w-8 h-8 text-amber-400" />
                  </div>
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center mx-auto shadow-xl font-extrabold text-2xl">
                    #1
                  </div>
                  <h3 className="text-xl font-extrabold text-amber-300">{top3[0].student_name}</h3>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-extrabold text-3xl text-amber-400">{top3[0].avg_score}%</p>
                    <p>Avg Score across {top3[0].total_attempts} attempt(s)</p>
                  </div>
                </div>
              )}

              {/* Rank 3 - Bronze */}
              {top3[2] && (
                <div className="glass-card rounded-3xl border border-amber-900/40 p-6 text-center space-y-3 relative overflow-hidden order-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-900/60 text-amber-300 flex items-center justify-center mx-auto shadow-lg font-extrabold text-lg">
                    #3
                  </div>
                  <h3 className="text-lg font-bold text-white">{top3[2].student_name}</h3>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="font-extrabold text-2xl text-amber-500">{top3[2].avg_score}%</p>
                    <p>Avg Score across {top3[2].total_attempts} attempt(s)</p>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Full Rankings Table */}
          <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 px-4 text-center">Rank</th>
                    <th className="pb-3 px-4">Student Name</th>
                    <th className="pb-3 px-4 text-center">Quizzes Attempted</th>
                    <th className="pb-3 px-4 text-center">Passed</th>
                    <th className="pb-3 px-4 text-center">Average Score</th>
                    <th className="pb-3 px-4 text-center">Highest Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {rankings.map((user) => (
                    <tr key={user.user_id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-4 text-center font-extrabold">
                        {user.rank === 1 ? <span className="text-amber-400 font-bold">🥇 #1</span> :
                         user.rank === 2 ? <span className="text-slate-300 font-bold">🥈 #2</span> :
                         user.rank === 3 ? <span className="text-amber-600 font-bold">🥉 #3</span> :
                         <span className="text-slate-500">#{user.rank}</span>}
                      </td>
                      <td className="py-4 px-4 font-bold text-white">
                        {user.student_name}
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-slate-300">
                        {user.total_attempts}
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-emerald-400 font-semibold">
                        {user.passed_quizzes}
                      </td>
                      <td className="py-4 px-4 text-center font-extrabold text-amber-400">
                        {user.avg_score}%
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-semibold text-slate-200">
                        {user.highest_score}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
