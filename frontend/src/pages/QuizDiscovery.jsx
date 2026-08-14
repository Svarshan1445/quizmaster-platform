import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Search, Filter, Clock, BookOpen, Award, 
  ChevronRight, Sparkles, CheckCircle2, AlertCircle, Play 
} from 'lucide-react';

import BookmarkIcon from 'lucide-react/dist/esm/icons/bookmark';

export default function QuizDiscovery({ onStartQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);

  // Quiz Detail Modal state
  const [activeQuizModal, setActiveQuizModal] = useState(null);

  const fetchBookmarks = async () => {
    try {
      const res = await api.get('/bookmarks/my-bookmarks');
      setBookmarkedIds(res.data.bookmarked_ids || []);
    } catch (err) {}
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        api.get('/quizzes', {
          params: {
            search: search || undefined,
            category: selectedCategory || undefined,
            difficulty: selectedDifficulty || undefined
          }
        }),
        api.get('/categories')
      ]);
      setQuizzes(qRes.data);
      setCategories(cRes.data);
      fetchBookmarks();
    } catch (err) {
      console.error('Error loading quiz catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, selectedDifficulty]);

  const handleToggleBookmark = async (e, quizId) => {
    e.stopPropagation();
    try {
      const res = await api.post('/bookmarks/toggle', { quizId });
      if (res.data.bookmarked) {
        setBookmarkedIds(prev => [...prev, quizId]);
      } else {
        setBookmarkedIds(prev => prev.filter(id => id !== quizId));
      }
    } catch (err) {}
  };

  const handleOpenDetails = async (quizId) => {
    try {
      const res = await api.get(`/quizzes/${quizId}`);
      setActiveQuizModal(res.data);
    } catch (err) {
      console.error('Error fetching quiz details:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header Banner */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
          <Sparkles className="w-4 h-4" /> DISCOVER & TEST YOUR SKILLS
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Explore Available Assessments
        </h1>
        <p className="text-sm text-slate-400">
          Choose from interactive quizzes in web development, database design, cybersecurity, and programming languages.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-800 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between md:gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quizzes by title or keyword..."
            className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            className="bg-slate-950/60 border border-slate-700/80 text-xs font-medium text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="">All Categories</option>
            {categories.map((c) => (
              <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Difficulty Dropdown */}
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            style={{ fontFamily: "'Times New Roman', Times, serif" }}
            className="bg-slate-950/60 border border-slate-700/80 text-xs font-medium text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="">All Difficulties</option>
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="Beginner">Beginner</option>
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="Intermediate">Intermediate</option>
            <option style={{ fontFamily: "'Times New Roman', Times, serif", backgroundColor: '#0f172a' }} value="Advanced">Advanced</option>
          </select>

          {(selectedCategory || selectedDifficulty || search) && (
            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedDifficulty('');
                setSearch('');
              }}
              className="text-xs text-rose-400 hover:underline px-2 cursor-pointer"
            >
              Reset Filters
            </button>
          )}

        </div>

      </div>

      {/* Interactive Category Pills Bar */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              selectedCategory === ''
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
            }`}
          >
            ✨ All Categories
          </button>
          {categories.map((cat) => {
            const isSelected = String(selectedCategory) === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(isSelected ? '' : cat.id)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-2 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <span>{cat.name}</span>
                {cat.quiz_count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${isSelected ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                    {cat.quiz_count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Quiz Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Quizzes Found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="glass-card rounded-3xl border border-slate-800 hover:border-indigo-500/40 transition-all duration-300 p-6 flex flex-col justify-between group shadow-xl hover:-translate-y-1"
            >
              <div>
                {/* Header Tag & Bookmark Toggle */}
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                    {quiz.category_name || 'General'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => handleToggleBookmark(e, quiz.id)}
                      className={`p-1.5 rounded-lg border transition ${
                        bookmarkedIds.includes(quiz.id)
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-white'
                      }`}
                      title={bookmarkedIds.includes(quiz.id) ? 'Remove Bookmark' : 'Bookmark Quiz'}
                    >
                      <BookmarkIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                      quiz.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                      quiz.difficulty === 'Hard' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition mb-2">
                  {quiz.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-6">
                  {quiz.description}
                </p>
              </div>

              {/* Card Footer Info */}
              <div className="pt-4 border-t border-slate-800/80 space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Duration</p>
                    <p className="font-bold text-slate-200 mt-0.5">{quiz.duration} mins</p>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Questions</p>
                    <p className="font-bold text-slate-200 mt-0.5">{quiz.question_count || 0}</p>
                  </div>
                  <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase font-semibold">Pass Score</p>
                    <p className="font-bold text-emerald-400 mt-0.5">{quiz.passing_score}%</p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenDetails(quiz.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>View Details & Start Quiz</span>
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Quiz Details Modal */}
      {activeQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {activeQuizModal.category_name}
              </span>
              <button
                onClick={() => setActiveQuizModal(null)}
                className="text-slate-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-white mb-2">{activeQuizModal.title}</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{activeQuizModal.description}</p>
            </div>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              <div>
                <p className="text-slate-500">Duration Limit:</p>
                <p className="font-bold text-white">{activeQuizModal.duration} Minutes</p>
              </div>
              <div>
                <p className="text-slate-500">Passing Threshold:</p>
                <p className="font-bold text-emerald-400">{activeQuizModal.passing_score}% Score</p>
              </div>
              <div>
                <p className="text-slate-500">Total Questions:</p>
                <p className="font-bold text-white">{activeQuizModal.question_count}</p>
              </div>
              <div>
                <p className="text-slate-500">Max Allowed Attempts:</p>
                <p className="font-bold text-white">{activeQuizModal.max_attempts} Attempts</p>
              </div>
              <div>
                <p className="text-slate-500">Difficulty Level:</p>
                <p className="font-bold text-amber-400">{activeQuizModal.difficulty}</p>
              </div>
              <div>
                <p className="text-slate-500">Your Attempts Used:</p>
                <p className="font-bold text-indigo-400">{activeQuizModal.user_attempts_count || 0} / {activeQuizModal.max_attempts}</p>
              </div>
            </div>

            {/* Instruction Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>
                Timer starts as soon as you click "Begin Assessment". Ensure you have a stable internet connection.
              </span>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActiveQuizModal(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700"
              >
                Cancel
              </button>
              
              <button
                disabled={activeQuizModal.can_attempt === false}
                onClick={() => {
                  const qId = activeQuizModal.id;
                  setActiveQuizModal(null);
                  onStartQuiz(qId);
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/30 disabled:opacity-40 transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{activeQuizModal.can_attempt === false ? 'Attempt Limit Reached' : 'Begin Assessment'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
