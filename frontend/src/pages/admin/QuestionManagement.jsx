import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { 
  HelpCircle, Plus, Edit, Trash2, ArrowLeft, CheckCircle2, 
  Sparkles, AlertCircle, RefreshCw, Upload, Download, FileText, CheckSquare, Type,
  Wand2, Brain, X, Check, ChevronDown, Code
} from 'lucide-react';

export default function QuestionManagement({ quizId, onBack }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [csvMsg, setCsvMsg] = useState('');
  const [csvErr, setCsvErr] = useState('');
  const csvInputRef = useRef(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // AI Generate State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('Intermediate');
  const [aiQuestionType, setAiQuestionType] = useState('MIXED'); // 'MIXED' | 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK'
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiGenerated, setAiGenerated] = useState([]); // preview questions
  const [aiSaving, setAiSaving] = useState(false);
  const [aiSaveMsg, setAiSaveMsg] = useState('');

  // Form Fields
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('MCQ'); // 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANK'
  const [marks, setMarks] = useState(2);
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [options, setOptions] = useState([
    { option_text: '', is_correct: true },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false },
    { option_text: '', is_correct: false }
  ]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const [qRes, questRes] = await Promise.all([
        api.get(`/quizzes/${quizId}`),
        api.get(`/quizzes/${quizId}/questions`)
      ]);
      setQuiz(qRes.data);
      setQuestions(questRes.data);
    } catch (err) {
      console.error('Error fetching questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) {
      fetchQuestions();
    }
  }, [quizId]);

  const handleTypeChange = (newType) => {
    setQuestionType(newType);
    if (newType === 'TRUE_FALSE') {
      setOptions([
        { option_text: 'True', is_correct: true },
        { option_text: 'False', is_correct: false }
      ]);
    } else if (newType === 'FILL_BLANK' || newType === 'CODING') {
      setOptions([
        { option_text: '', is_correct: true }
      ]);
    } else if (newType === 'MCQ') {
      setOptions([
        { option_text: '', is_correct: true },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false },
        { option_text: '', is_correct: false }
      ]);
    }
  };

  const handleOpenCreate = () => {
    setEditingQuestion(null);
    setQuestionText('');
    setQuestionType('MCQ');
    setMarks(2);
    setExplanation('');
    setDifficulty('Intermediate');
    setOptions([
      { option_text: '', is_correct: true },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false },
      { option_text: '', is_correct: false }
    ]);
    setShowModal(true);
  };

  const handleOpenEdit = (question) => {
    setEditingQuestion(question);
    setQuestionText(question.question_text);
    const qType = question.question_type || 'MCQ';
    setQuestionType(qType);
    setMarks(question.marks || 2);
    setExplanation(question.explanation || '');
    setDifficulty(question.difficulty || 'Intermediate');

    if (question.options && question.options.length > 0) {
      setOptions(question.options.map(o => ({
        option_text: o.option_text,
        is_correct: o.is_correct === 1 || o.is_correct === true
      })));
    } else {
      setOptions([
        { option_text: '', is_correct: true }
      ]);
    }
    setShowModal(true);
  };

  const handleOptionTextChange = (idx, value) => {
    setOptions(prev => {
      const copy = [...prev];
      copy[idx].option_text = value;
      return copy;
    });
  };

  const handleSetCorrectOption = (targetIdx) => {
    setOptions(prev => prev.map((opt, idx) => ({
      ...opt,
      is_correct: idx === targetIdx
    })));
  };

  const handleAddOption = () => {
    if (options.length >= 6) return;
    setOptions(prev => [...prev, { option_text: '', is_correct: false }]);
  };

  const handleRemoveOption = (idx) => {
    if (options.length <= 2) {
      alert('A question must have at least 2 options');
      return;
    }
    setOptions(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      if (!filtered.some(o => o.is_correct)) {
        filtered[0].is_correct = true;
      }
      return filtered;
    });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!questionText.trim()) {
      alert('Question text is required');
      return;
    }

    if (questionType === 'MCQ') {
      const validOptions = options.filter(o => o.option_text.trim() !== '');
      if (validOptions.length < 2) {
        alert('Please fill in at least 2 options for Multiple Choice');
        return;
      }
    } else if (questionType === 'FILL_BLANK') {
      if (!options[0]?.option_text.trim()) {
        alert('Please enter the correct answer for Fill in the Blanks');
        return;
      }
    }

    const payload = {
      question_text: questionText.trim(),
      question_type: questionType,
      marks: parseInt(marks, 10),
      explanation: explanation.trim(),
      difficulty,
      options: options.filter(o => o.option_text.trim() !== '')
    };

    try {
      if (editingQuestion) {
        await api.put(`/questions/${editingQuestion.id}`, payload);
      } else {
        await api.post(`/quizzes/${quizId}/questions`, payload);
      }
      setShowModal(false);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving question');
    }
  };

  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${qId}`);
      fetchQuestions();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting question');
    }
  };

  // CSV Import handler
  const handleCSVImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvMsg(''); setCsvErr('');
    const text = await file.text();
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) { setCsvErr('CSV must have a header row and at least one question.'); return; }

    const parseCSVLine = (line) => {
      const result = [];
      let curr = '', inQ = false;
      for (let c of line) {
        if (c === '"') { inQ = !inQ; continue; }
        if (c === ',' && !inQ) { result.push(curr.trim()); curr = ''; continue; }
        curr += c;
      }
      result.push(curr.trim());
      return result;
    };

    let successCount = 0; let failCount = 0;
    for (let i = 1; i < lines.length; i++) {
      try {
        const cols = parseCSVLine(lines[i]);
        // Format: question_text, marks, explanation, difficulty, type(MCQ/TRUE_FALSE/FILL_BLANK), option1, option2, option3, option4, correct_index_or_answer
        const [question_text, marks, explanation, difficulty, typeCol, o1, o2, o3, o4, correct] = cols;
        if (!question_text) { failCount++; continue; }
        const qType = (typeCol || 'MCQ').toUpperCase();
        let opts = [];
        if (qType === 'FILL_BLANK') {
          opts = [{ option_text: (o1 || correct || '').trim(), is_correct: true }];
        } else if (qType === 'TRUE_FALSE') {
          const correctVal = (o1 || correct || 'True').trim().toLowerCase() === 'true';
          opts = [
            { option_text: 'True', is_correct: correctVal },
            { option_text: 'False', is_correct: !correctVal }
          ];
        } else {
          const rawOpts = [o1, o2, o3, o4].filter(Boolean);
          const correctIdx = (parseInt(correct, 10) || 1) - 1;
          opts = rawOpts.map((opt, idx) => ({ option_text: opt.trim(), is_correct: idx === correctIdx }));
        }

        const payload = {
          question_text: question_text.trim(),
          question_type: qType,
          marks: parseInt(marks, 10) || 1,
          explanation: explanation || '',
          difficulty: difficulty || 'Intermediate',
          options: opts
        };
        await api.post(`/quizzes/${quizId}/questions`, payload);
        successCount++;
      } catch { failCount++; }
    }
    e.target.value = '';
    if (successCount > 0) { setCsvMsg(`✅ ${successCount} question${successCount > 1 ? 's' : ''} imported successfully!`); fetchQuestions(); }
    if (failCount > 0) setCsvErr(`⚠️ ${failCount} row${failCount > 1 ? 's' : ''} failed to import.`);
  };

  const downloadTemplate = () => {
    const header = 'question_text,marks,explanation,difficulty,type,option1,option2,option3,option4,correct_option';
    const row1 = '"What is 2+2?",1,"Basic math",Easy,MCQ,"3","4","5","6",2';
    const row2 = '"HTML stands for HyperText Markup Language",1,"Web standard",Easy,TRUE_FALSE,True,False,"","",1';
    const row3 = '"The capital of France is ______.",1,"Geography",Intermediate,FILL_BLANK,Paris,"","","",Paris';
    const blob = new Blob([header + '\n' + row1 + '\n' + row2 + '\n' + row3], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'questions_template.csv'; a.click();
  };

  // ---- AI GENERATE ----
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) { setAiError('Please enter a topic'); return; }
    setAiError(''); setAiLoading(true); setAiGenerated([]);
    try {
      const res = await api.post('/ai/generate-questions', {
        topic: aiTopic.trim(),
        count: aiCount,
        difficulty: aiDifficulty,
        questionType: aiQuestionType
      });
      setAiGenerated(res.data.questions);
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI generation failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAISaveAll = async () => {
    setAiSaving(true); setAiSaveMsg('');
    let saved = 0;
    for (const q of aiGenerated) {
      try {
        await api.post(`/quizzes/${quizId}/questions`, {
          question_text: q.question_text,
          question_type: q.question_type || 'MCQ',
          marks: q.marks || 2,
          explanation: q.explanation || '',
          difficulty: q.difficulty || aiDifficulty,
          options: q.options
        });
        saved++;
      } catch (e) { console.error(e); }
    }
    await fetchQuestions();
    setAiSaveMsg(`✅ ${saved} question${saved > 1 ? 's' : ''} saved successfully!`);
    setAiSaving(false);
    setTimeout(() => { setShowAIModal(false); setAiGenerated([]); setAiTopic(''); setAiSaveMsg(''); }, 1500);
  };

  const updateAIQuestion = (idx, field, value) => {
    setAiGenerated(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateAIOption = (qIdx, oIdx, field, value) => {
    setAiGenerated(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = q.options.map((o, j) => {
        if (field === 'is_correct') return { ...o, is_correct: j === oIdx };
        return j === oIdx ? { ...o, [field]: value } : o;
      });
      return { ...q, options: opts };
    }));
  };

  const removeAIQuestion = (idx) => {
    setAiGenerated(prev => prev.filter((_, i) => i !== idx));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Loading Question Bank...</span>
        </div>
      </div>
    );
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'CODING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
            <Code className="w-3 h-3" /> Coding / Code Snippet
          </span>
        );
      case 'TRUE_FALSE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <CheckSquare className="w-3 h-3" /> True / False
          </span>
        );
      case 'FILL_BLANK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <Type className="w-3 h-3" /> Fill in the Blanks
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <FileText className="w-3 h-3" /> MCQ
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Header & Back Button */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Quizzes
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
              Quiz: {quiz?.title}
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-2">Manage Questions ({questions.length})</h1>
            <p className="text-xs text-slate-400">Supports MCQ, True/False, and Fill in the Blanks question types</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setShowAIModal(true); setAiGenerated([]); setAiError(''); setAiSaveMsg(''); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold text-xs shadow-lg shadow-violet-500/30 transition"
            >
              <Wand2 className="w-4 h-4" /> AI Generate
            </button>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-500/20 transition"
            >
              <Plus className="w-4 h-4" /> Add Question
            </button>
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition">
              <Download className="w-4 h-4" /> CSV Template
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-600/30 text-xs font-semibold cursor-pointer transition">
              <Upload className="w-4 h-4" /> Import CSV
              <input ref={csvInputRef} type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>
          </div>
        </div>

        {csvMsg && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">{csvMsg}</div>}
        {csvErr && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">{csvErr}</div>}
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800 space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Questions Found</h3>
          <p className="text-xs text-slate-500">Add questions to enable students to attempt this quiz.</p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
          >
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getTypeBadge(q.question_type)}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {q.marks} Mark{q.marks > 1 ? 's' : ''}
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {q.difficulty || 'Intermediate'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white leading-snug">{q.question_text}</h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenEdit(q)}
                    className="p-2 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                    title="Edit Question"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 rounded-lg text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Options Display */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 ml-10">
                {q.options && q.options.map((opt) => {
                  const isCorrect = opt.is_correct === 1 || opt.is_correct === true;
                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isCorrect
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400'
                      }`}
                    >
                      <span>{q.question_type === 'FILL_BLANK' ? `Answer: "${opt.option_text}"` : opt.option_text}</span>
                      {isCorrect && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded">
                          Correct Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="ml-10 p-3 bg-slate-950/60 rounded-xl text-xs text-slate-400 border border-slate-800">
                  <span className="font-bold text-slate-300">Explanation: </span>{q.explanation}
                </div>
              )}

            </div>
          ))}
        </div>
      )}

      {/* Question Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xl font-bold text-white">
                {editingQuestion ? 'Edit Question' : 'Add Question'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              
              {/* Question Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Question Type</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('MCQ')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      questionType === 'MCQ'
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <FileText className="w-4 h-4" /> Multiple Choice
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('TRUE_FALSE')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      questionType === 'TRUE_FALSE'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <CheckSquare className="w-4 h-4" /> True / False
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('FILL_BLANK')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      questionType === 'FILL_BLANK'
                        ? 'bg-purple-600/30 border-purple-500 text-purple-300 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Type className="w-4 h-4" /> Fill in Blank
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('CODING')}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition ${
                      questionType === 'CODING'
                        ? 'bg-emerald-600/30 border-emerald-500 text-emerald-300 shadow-md'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    <Code className="w-4 h-4" /> Coding
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Question</label>
                <textarea
                  rows={questionType === 'CODING' ? 4 : 3}
                  required
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={
                    questionType === 'FILL_BLANK'
                      ? 'e.g. The chemical symbol for Gold is ______.' 
                      : questionType === 'TRUE_FALSE'
                      ? 'e.g. JavaScript is a single-threaded language.'
                      : questionType === 'CODING'
                      ? 'e.g. Write a Python function to find the factorial of a number.'
                      : 'Which keyword is used to declare a constant in JS?'
                  }
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                {questionType === 'CODING' && (
                  <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                    <Code className="w-3 h-3" /> Students will write their code answer in a code editor. Enter the expected solution in the answer field below.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Marks / Points</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={marks}
                    onChange={(e) => setMarks(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
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

              {/* Answer Configuration depending on Question Type */}
              {questionType === 'CODING' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Code className="w-4 h-4" /> Expected Solution / Reference Code
                    </label>
                    <span className="text-[11px] text-slate-400">No character limit — short or long code allowed</span>
                  </div>
                  <div className="bg-slate-950 border border-emerald-500/50 rounded-2xl overflow-hidden shadow-inner">
                    <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                      <span className="text-emerald-400 font-semibold">solution.code</span>
                      <span>UTF-8 / Multi-line Supported</span>
                    </div>
                    <textarea
                      rows={6}
                      required
                      value={options[0]?.option_text || ''}
                      onChange={(e) => handleOptionTextChange(0, e.target.value)}
                      placeholder={`// Type expected code or output here (short 1-liner or full function)\n// Example:\ndef factorial(n):\n    return 1 if n <= 1 else n * factorial(n - 1)`}
                      className="w-full bg-slate-950 p-4 font-mono text-sm text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 resize-y"
                      style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    💡 The grading engine automatically normalizes spacing, quotes, semicolons, and code output so student submissions (short or long) are accurately evaluated.
                  </p>
                </div>
              ) : questionType === 'FILL_BLANK' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Correct Answer Text</label>
                  <input
                    type="text"
                    required
                    value={options[0]?.option_text || ''}
                    onChange={(e) => handleOptionTextChange(0, e.target.value)}
                    placeholder="Enter exact correct text (case-insensitive during grading)"
                    className="w-full bg-slate-950/60 border border-purple-500/60 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-400"
                  />
                  <p className="text-[11px] text-slate-400">Students will type their answer in a text box. Comparison will be case-insensitive.</p>
                </div>
              ) : questionType === 'TRUE_FALSE' ? (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Select Correct Truth Value</label>
                  <div className="grid grid-cols-2 gap-4">
                    {options.map((opt, idx) => (
                      <label
                        key={idx}
                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition ${
                          opt.is_correct
                            ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="tfOption"
                          checked={opt.is_correct}
                          onChange={() => handleSetCorrectOption(idx)}
                          className="w-4 h-4 text-emerald-600 accent-emerald-500"
                        />
                        <span className="text-sm">{opt.option_text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                /* MCQ Options */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Answer Options (Select Radio for Correct Answer)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="text-xs text-indigo-400 font-semibold hover:underline"
                    >
                      + Add Option
                    </button>
                  </div>

                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.is_correct}
                        onChange={() => handleSetCorrectOption(idx)}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <input
                        type="text"
                        required
                        value={opt.option_text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(idx)}
                          className="text-rose-400 hover:text-rose-300 font-bold px-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Explanation (Optional)</label>
                <textarea
                  rows={2}
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="Explain why the correct answer is right..."
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
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
                  Save Question
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ---- AI GENERATE MODAL ---- */}
      {showAIModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-violet-500/30 rounded-3xl shadow-2xl shadow-violet-500/20">

            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 px-8 py-5 flex items-center justify-between rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Question Generator</h2>
                  <p className="text-xs text-slate-400">Powered by Google Gemini AI</p>
                </div>
              </div>
              <button onClick={() => setShowAIModal(false)} className="text-slate-400 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8 space-y-6">

              {/* Input Section */}
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-violet-400" /> Configure AI Generation
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Topic / Subject *</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                    placeholder="e.g. Python Programming, World War II, Human Anatomy..."
                    className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                    onKeyDown={e => e.key === 'Enter' && handleAIGenerate()}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Question Type</label>
                    <select
                      value={aiQuestionType}
                      onChange={e => setAiQuestionType(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 font-medium"
                    >
                      <option value="MIXED">✨ Mixed (MCQ + T/F + Blank + Coding)</option>
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="TRUE_FALSE">True / False</option>
                      <option value="FILL_BLANK">Fill in the Blanks</option>
                      <option value="CODING">💻 Coding / Programming</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Number of Questions (Custom)</label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={aiCount}
                      onChange={e => setAiCount(Math.max(1, Math.min(50, parseInt(e.target.value, 10) || 1)))}
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-violet-500"
                      placeholder="Enter count (1-50)"
                    />
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">Presets:</span>
                      {[5, 10, 15, 25, 50].map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setAiCount(n)}
                          className={`text-[11px] px-2 py-0.5 rounded-md font-bold transition ${
                            aiCount === n
                              ? 'bg-violet-600 text-white'
                              : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Difficulty</label>
                    <select
                      value={aiDifficulty}
                      onChange={e => setAiDifficulty(e.target.value)}
                      className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500"
                    >
                      <option>Easy</option>
                      <option>Intermediate</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>

                {aiError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {aiError}
                  </div>
                )}

                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/30 transition disabled:opacity-50"
                >
                  {aiLoading ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Generating with AI...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Generate {aiCount} Questions</>
                  )}
                </button>
              </div>

              {/* Generated Questions Preview */}
              {aiGenerated.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {aiGenerated.length} Questions Generated — Review & Edit Before Saving
                    </h3>
                    <span className="text-xs text-slate-400">You can edit any question before saving</span>
                  </div>

                  {aiGenerated.map((q, qi) => (
                    <div key={qi} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full shrink-0">Q{qi + 1}</span>
                          {getTypeBadge(q.question_type)}
                        </div>
                        <button onClick={() => removeAIQuestion(qi)} className="text-slate-500 hover:text-rose-400 transition shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <textarea
                        value={q.question_text}
                        onChange={e => updateAIQuestion(qi, 'question_text', e.target.value)}
                        className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500 resize-none"
                        rows={2}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className={`flex items-center gap-2 rounded-xl border p-2.5 transition ${opt.is_correct ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-slate-700 bg-slate-900/40'}`}>
                            <button
                              onClick={() => updateAIOption(qi, oi, 'is_correct', true)}
                              className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${opt.is_correct ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}
                            >
                              {opt.is_correct && <Check className="w-3 h-3 text-white" />}
                            </button>
                            <input
                              value={opt.option_text}
                              onChange={e => updateAIOption(qi, oi, 'option_text', e.target.value)}
                              className="flex-1 bg-transparent text-xs text-white focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <p className="text-xs text-slate-400 italic border-l-2 border-violet-500/30 pl-3">{q.explanation}</p>
                      )}
                    </div>
                  ))}

                  {aiSaveMsg && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-bold text-center">{aiSaveMsg}</div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={handleAIGenerate}
                      disabled={aiLoading}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
                    >
                      <RefreshCw className="w-4 h-4" /> Regenerate
                    </button>
                    <button
                      onClick={handleAISaveAll}
                      disabled={aiSaving || aiGenerated.length === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition disabled:opacity-50"
                    >
                      {aiSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : <><Check className="w-4 h-4" /> Save All {aiGenerated.length} Questions</>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
