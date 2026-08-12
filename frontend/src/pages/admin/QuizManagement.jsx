import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { 
  BookOpen, Plus, Edit, Trash2, Eye, EyeOff, 
  HelpCircle, Clock, Award, CheckCircle, AlertCircle, RefreshCw 
} from 'lucide-react';

export default function QuizManagement({ onManageQuestions }) {
  const [quizzes, setQuizzes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [duration, setDuration] = useState(15);
  const [passingScore, setPassingScore] = useState(60);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [status, setStatus] = useState('Draft');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [negativeMarks, setNegativeMarks] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [imgLoadErr, setImgLoadErr] = useState(false);

  const fetchQuizzesAndCategories = async () => {
    setLoading(true);
    try {
      const [qRes, cRes] = await Promise.all([
        api.get('/quizzes'),
        api.get('/categories')
      ]);
      setQuizzes(qRes.data);
      setCategories(cRes.data);
    } catch (err) {
      console.error('Error fetching admin quizzes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzesAndCategories();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingQuiz(null);
    setTitle('');
    setDescription('');
    setCategoryId(categories[0]?.id || '');
    setDifficulty('Intermediate');
    setDuration(15);
    setPassingScore(60);
    setMaxAttempts(3);
    setStatus('Draft');
    setShuffleQuestions(false);
    setShuffleOptions(false);
    setNegativeMarks(0);
    setImageUrl('');
    setShowModal(true);
  };

  const handleOpenEditModal = (quiz) => {
    setEditingQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description || '');
    setCategoryId(quiz.category_id || '');
    setDifficulty(quiz.difficulty || 'Intermediate');
    setDuration(quiz.duration || 15);
    setPassingScore(quiz.passing_score || 60);
    setMaxAttempts(quiz.max_attempts || 3);
    setStatus(quiz.status || 'Draft');
    setShuffleQuestions(!!quiz.shuffle_questions);
    setShuffleOptions(!!quiz.shuffle_options);
    setNegativeMarks(quiz.negative_marks || 0);
    setImageUrl(quiz.image_url || '');
    setShowModal(true);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title,
        description,
        category_id: categoryId ? parseInt(categoryId, 10) : null,
        difficulty,
        duration: parseInt(duration, 10),
        passing_score: parseInt(passingScore, 10),
        max_attempts: parseInt(maxAttempts, 10),
        status,
        shuffle_questions: shuffleQuestions,
        shuffle_options: shuffleOptions,
        negative_marks: parseFloat(negativeMarks) || 0,
        image_url: imageUrl || null
      };

      if (editingQuiz) {
        await api.put(`/quizzes/${editingQuiz.id}`, payload);
      } else {
        await api.post('/quizzes', payload);
      }

      setShowModal(false);
      fetchQuizzesAndCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving quiz');
    }
  };

  const handleTogglePublish = async (quizId) => {
    try {
      await api.patch(`/quizzes/${quizId}/status`);
      fetchQuizzesAndCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error toggling publish status');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? All associated questions and student attempt data will be deleted.')) {
      return;
    }
    try {
      await api.delete(`/quizzes/${quizId}`);
      fetchQuizzesAndCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting quiz');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-indigo-400" /> Quiz Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">Create, edit, publish, or configure assessments and question sets</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Quiz</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>Loading Quizzes...</span>
          </div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Quizzes Created</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Get started by creating your first quiz assessment!</p>
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
          >
            Create Quiz
          </button>
        </div>
      ) : (
        <div className="bg-slate-900/80 rounded-3xl border border-slate-800 p-6 shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-4">Quiz Title & Category</th>
                  <th className="pb-3 px-4 text-center">Difficulty</th>
                  <th className="pb-3 px-4 text-center">Duration</th>
                  <th className="pb-3 px-4 text-center">Pass %</th>
                  <th className="pb-3 px-4 text-center">Questions</th>
                  <th className="pb-3 px-4 text-center">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4">
                      <p className="font-bold text-white">{quiz.title}</p>
                      <p className="text-xs text-indigo-400 font-medium">{quiz.category_name || 'Uncategorized'}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-xs text-slate-300 font-medium">
                      {quiz.duration} mins
                    </td>
                    <td className="py-4 px-4 text-center text-xs font-extrabold text-emerald-400">
                      {quiz.passing_score}%
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => onManageQuestions(quiz.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-bold hover:bg-indigo-500/35 transition cursor-pointer shadow-md shadow-indigo-500/10"
                        title="Click to add or manage questions for this quiz"
                      >
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span>{quiz.question_count || 0} Questions (Add / Edit)</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => handleTogglePublish(quiz.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition ${
                          quiz.status === 'Published'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                      >
                        {quiz.status === 'Published' ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>{quiz.status}</span>
                      </button>
                    </td>
                    <td className="py-4 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(quiz)}
                        className="p-2 rounded-lg text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                        title="Edit Quiz"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="p-2 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Quiz Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingQuiz ? 'Edit Quiz' : 'Create New Quiz'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Quiz Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. JavaScript Fundamentals"
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of quiz contents and objectives..."
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    required
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Passing %</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Max Attempts</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Unpublished">Unpublished</option>
                </select>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Negative Marks per Wrong Answer</label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  step={0.25}
                  value={negativeMarks}
                  onChange={(e) => setNegativeMarks(e.target.value)}
                  placeholder="0 = no penalty"
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-500 mt-1">Enter 0 to disable negative marking</p>
              </div>

              {/* Shuffle Options */}
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-700 cursor-pointer hover:border-indigo-500/50 transition flex-1">
                  <input
                    type="checkbox"
                    checked={shuffleQuestions}
                    onChange={e => setShuffleQuestions(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Shuffle Questions</p>
                    <p className="text-xs text-slate-400">Random order each attempt</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-950/60 border border-slate-700 cursor-pointer hover:border-indigo-500/50 transition flex-1">
                  <input
                    type="checkbox"
                    checked={shuffleOptions}
                    onChange={e => setShuffleOptions(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500"
                  />
                  <div>
                    <p className="text-xs font-semibold text-white">Shuffle Options</p>
                    <p className="text-xs text-slate-400">Random answer choices</p>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
                >
                  Save Quiz
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
