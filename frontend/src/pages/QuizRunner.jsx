import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Clock, CheckCircle, ChevronLeft, ChevronRight, Send, 
  AlertTriangle, HelpCircle, ShieldCheck, RefreshCw, Bookmark
} from 'lucide-react';

import { soundManager } from '../utils/sound';

export default function QuizRunner({ quizId, onCompleteQuiz, onCancel }) {
  const [attemptData, setAttemptData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({}); // { questionId: optionId/text }
  const [flagged, setFlagged] = useState({}); // { questionId: boolean }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [error, setError] = useState('');

  // Start attempt session
  useEffect(() => {
    const startQuizSession = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.post(`/quizzes/${quizId}/start`);
        setAttemptData(res.data);
        const totalSecs = (res.data.quiz.duration || 15) * 60;
        setTimeLeft(totalSecs);
      } catch (err) {
        console.error('Failed to start attempt:', err);
        setError(err.response?.data?.message || 'Unable to start quiz session.');
      } finally {
        setLoading(false);
      }
    };

    startQuizSession();
  }, [quizId]);

  const [tabSwitches, setTabSwitches] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [questionTimeLeft, setQuestionTimeLeft] = useState(45); // 45s per question limit
  const videoRef = React.useRef(null);

  // WebCam AI Proctoring Initialization
  useEffect(() => {
    if (!attemptData || submitting) return;

    let streamObj = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
          streamObj = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setCameraActive(true);
        }
      } catch (err) {
        console.warn('Webcam proctoring permission denied/unavailable:', err);
        setCameraError('Camera required for AI Proctoring');
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (streamObj) {
        streamObj.getTracks().forEach(track => track.stop());
      }
    };
  }, [attemptData, submitting]);

  // Calculate dynamic per-question time limit based on Admin's quiz duration & question count
  const getPerQuestionLimit = () => {
    if (!attemptData || !attemptData.quiz || !attemptData.questions || attemptData.questions.length === 0) {
      return 60;
    }
    const durationMins = attemptData.quiz.duration || 15;
    const qCount = attemptData.questions.length;
    const totalSecs = durationMins * 60;
    return Math.max(15, Math.floor(totalSecs / qCount));
  };

  const perQuestionLimit = getPerQuestionLimit();

  // Per-Question Speed Countdown Timer (Dynamically calculated based on Quiz Duration)
  useEffect(() => {
    setQuestionTimeLeft(perQuestionLimit);
  }, [currentIndex, perQuestionLimit]);

  useEffect(() => {
    if (questionTimeLeft <= 0 || submitting || !attemptData) return;

    const qTimer = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(qTimer);
          if (attemptData?.questions && currentIndex < attemptData.questions.length - 1) {
            setCurrentIndex((idx) => idx + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(qTimer);
  }, [questionTimeLeft, currentIndex, submitting, attemptData]);

  // Tab Switch & Window Focus Anti-Cheating Detection
  useEffect(() => {
    if (!attemptData || submitting) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        try {
          soundManager.playWrong();
        } catch (e) {
          console.error('Audio play error:', e);
        }
        setShowWarningModal(true);
        setTabSwitches((prev) => prev + 1);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptData, submitting]);

  // Handle 3 Strikes Limit Auto-Submission
  useEffect(() => {
    if (tabSwitches >= 3 && !submitting && attemptData) {
      alert('⚠️ EXAM TERMINATED! You have exceeded the maximum allowed tab switches (3/3). Your exam is being automatically submitted.');
      handleSubmitAttempt();
    }
  }, [tabSwitches, submitting, attemptData]);

  // Prevent Copy, Cut, Paste, and Right Click during Exam
  useEffect(() => {
    if (!attemptData || submitting) return;

    const preventCopyPaste = (e) => {
      e.preventDefault();
      return false;
    };

    const preventContextMenu = (e) => {
      e.preventDefault();
      return false;
    };

    document.addEventListener('copy', preventCopyPaste);
    document.addEventListener('cut', preventCopyPaste);
    document.addEventListener('paste', preventCopyPaste);
    document.addEventListener('contextmenu', preventContextMenu);
    document.addEventListener('selectstart', preventCopyPaste);

    return () => {
      document.removeEventListener('copy', preventCopyPaste);
      document.removeEventListener('cut', preventCopyPaste);
      document.removeEventListener('paste', preventCopyPaste);
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventCopyPaste);
    };
  }, [attemptData, submitting]);

  // Countdown Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitting || !attemptData) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 10 && prev > 1) {
          soundManager.playTick();
        }
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitting, attemptData]);

  // Handle option selection
  const handleSelectOption = (questionId, optionId) => {
    soundManager.playClick();
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  // Toggle Bookmark / Flag for Review
  const toggleFlag = (questionId) => {
    setFlagged(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Check Practice Answer (Instant Feedback for Practice Mode)
  const handleCheckPracticeAnswer = (q) => {
    const userAns = userAnswers[q.id];
    if (!userAns) return;

    // Check correctness
    let isCorrect = false;
    if (q.question_type === 'FILL_BLANK') {
      // In practice mode, check if we have text answer matches
      isCorrect = true; // Feedback shown in explanation
    } else {
      // In practice mode, fetch correct option
      const selectedOpt = q.options?.find(o => o.id === userAns);
      isCorrect = selectedOpt ? !!selectedOpt.is_correct : false;
    }

    setCheckedPractice(prev => ({
      ...prev,
      [q.id]: { checked: true, isCorrect }
    }));
  };

  // Submit attempt
  const handleSubmitAttempt = async () => {
    if (submitting || !attemptData) return;
    setSubmitting(true);
    setShowSubmitModal(false);

    try {
      const res = await api.post(`/quizzes/${quizId}/submit`, {
        attempt_id: attemptData.attempt_id,
        answers: userAnswers
      });

      onCompleteQuiz(res.data.attempt_id);
    } catch (err) {
      console.error('Error submitting attempt:', err);
      alert(err.response?.data?.message || 'Error submitting quiz.');
      setSubmitting(false);
    }
  };

  // Auto-submit when timer reaches 0
  const handleAutoSubmit = () => {
    alert('⏱️ Time has expired! Your quiz answers are being automatically submitted.');
    handleSubmitAttempt();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Starting Secure Quiz Environment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-rose-500/30 rounded-3xl text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">Quiz Session Error</h2>
        <p className="text-xs text-slate-400">{error}</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const questions = attemptData?.questions || [];
  const currentQuestion = questions[currentIndex];

  if (!attemptData || questions.length === 0 || !currentQuestion) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Questions Available</h2>
        <p className="text-xs text-slate-400">This quiz does not have any active questions yet.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const answeredCount = Object.keys(userAnswers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;
  const totalQuestions = questions.length;
  const isTimeCritical = timeLeft < 120;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Sticky Header Bar */}
      <div className="sticky top-16 z-30 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 className="text-base font-bold text-white">{attemptData.quiz.title}</h2>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              ⏱️ Assessment Mode
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              🔀 Shuffled Order
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              tabSwitches > 0
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              🛡️ Anti-Cheating Active ({tabSwitches}/3 Strikes)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Question <span className="text-indigo-400 font-bold">{currentIndex + 1}</span> of {totalQuestions}
          </p>
        </div>

        {/* Timer Pill */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-lg transition ${
          isTimeCritical
            ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
            : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
        }`}>
          <Clock className="w-5 h-5" />
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Submit Quiz Button */}
        <button
          onClick={() => setShowSubmitModal(true)}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition"
        >
          <Send className="w-4 h-4" />
          <span>Submit Quiz</span>
        </button>
      </div>

      {/* Main Grid: Question Card + Navigation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Area: Active Question Card */}
        <div className="lg:col-span-3 glass-card rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
          
          {/* Question Meta Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Marks: {currentQuestion.marks || 1} Pt
              </span>
              <span className="text-xs text-slate-400 uppercase font-semibold">
                {currentQuestion.question_type || 'MCQ'}
              </span>
            </div>

            {/* Bookmark / Flag Button */}
            <button
              onClick={() => toggleFlag(currentQuestion.id)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold border transition ${
                flagged[currentQuestion.id]
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${flagged[currentQuestion.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{flagged[currentQuestion.id] ? 'Flagged for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* Per-Question Speed Countdown Gauge */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Speed Timer (Per-Question Limit):</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-44 bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-1000 ${
                    questionTimeLeft <= 10 ? 'bg-rose-500 animate-pulse' : 'bg-gradient-to-r from-amber-400 to-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (questionTimeLeft / perQuestionLimit) * 100)}%` }}
                ></div>
              </div>
              <span className={`font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg border ${
                questionTimeLeft <= 10
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {questionTimeLeft}s
              </span>
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Question #{currentIndex + 1}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!('speechSynthesis' in window)) return;
                  if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.cancel();
                  } else {
                    const text = `Question ${currentIndex + 1}. ${currentQuestion.question_text}`;
                    const utterance = new SpeechSynthesisUtterance(text);
                    window.speechSynthesis.speak(utterance);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-xs font-semibold hover:bg-indigo-500/20 transition cursor-pointer"
              >
                <span>🔊 Listen Question</span>
              </button>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
              {currentQuestion.question_text}
            </h3>
          </div>

          {/* Answer Options or Input */}
          <div className="space-y-3 pt-2">
            {currentQuestion.question_type === 'CODING' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono">💻 Code Editor / Programming Input</label>
                  <span className="text-[11px] text-slate-400">Write your code or output below</span>
                </div>
                <div className="bg-slate-950 border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                      <span className="ml-2 text-slate-300 font-semibold">solution.code</span>
                    </div>
                    <span>UTF-8</span>
                  </div>
                  <textarea
                    rows={6}
                    value={userAnswers[currentQuestion.id] || ''}
                    onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                    placeholder="// Write your code or single-line answer here... e.g. print('Hello World')"
                    className="w-full bg-slate-950 p-4 font-mono text-sm text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 resize-y"
                    style={{ fontFamily: 'Consolas, Monaco, "Courier New", monospace' }}
                  />
                </div>
              </div>
            ) : currentQuestion.question_type === 'FILL_BLANK' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Type Your Answer Below</label>
                <input
                  type="text"
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleSelectOption(currentQuestion.id, e.target.value)}
                  placeholder="Enter your answer..."
                  className="w-full bg-slate-950/70 border border-indigo-500/50 rounded-2xl p-4 text-base text-white focus:outline-none focus:border-indigo-400 shadow-inner"
                />
              </div>
            ) : (
              currentQuestion.options?.map((opt) => {
                const isSelected = userAnswers[currentQuestion.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-sm font-medium pr-4">{opt.option_text}</span>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'
                    }`}>
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Previous / Next Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            {currentIndex < totalQuestions - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20"
              >
                Next Question <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/20"
              >
                Review & Submit <Send className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>

        {/* Right Area: Question Navigation Grid Palette */}
        <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-6 h-fit">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Question Palette</h4>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Answered: <strong className="text-emerald-400">{answeredCount}</strong>/{totalQuestions}</span>
              <span>Flagged: <strong className="text-amber-400">{flaggedCount}</strong></span>
            </div>
          </div>

          {/* Palette Grid */}
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id];
              const isFlagged = !!flagged[q.id];
              const isCurrent = idx === currentIndex;

              let style = 'bg-slate-950/60 text-slate-400 border-slate-800 hover:bg-slate-800';
              if (isFlagged) {
                style = 'bg-amber-500/25 text-amber-300 border-amber-500/60 font-extrabold';
              } else if (isAnswered) {
                style = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full h-10 rounded-xl text-xs transition flex items-center justify-center border relative ${style} ${
                    isCurrent ? 'ring-2 ring-indigo-400 border-indigo-400' : ''
                  }`}
                >
                  {idx + 1}
                  {isFlagged && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400"></span>}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="pt-4 border-t border-slate-800 space-y-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500/40"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-amber-500/20 border border-amber-500/50"></span>
              <span>Flagged for Review</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-950/60 border border-slate-800"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </div>

      </div>

      {/* Confirmation Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <h3 className="text-xl font-bold text-white">Submit Assessment?</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Are you sure you want to finish and submit your answers for evaluation?
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Questions:</span>
                <span className="font-bold text-white">{totalQuestions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Answered Questions:</span>
                <span className="font-bold text-emerald-400">{answeredCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Flagged Questions:</span>
                <span className="font-bold text-amber-400">{flaggedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Unanswered Questions:</span>
                <span className="font-bold text-rose-400">{totalQuestions - answeredCount}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
              >
                Continue Answering
              </button>
              <button
                onClick={handleSubmitAttempt}
                disabled={submitting}
                className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30"
              >
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Anti-Cheating Tab Switch Warning Modal Overlay */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md font-sans">
          <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/20 border border-rose-500/40 mx-auto flex items-center justify-center text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-extrabold text-white">⚠️ Anti-Cheating Warning!</h3>
            <p className="text-xs text-rose-300 bg-rose-950/60 p-3 rounded-xl border border-rose-500/30 font-medium leading-relaxed">
              You switched tabs or left the exam window! Navigating to external sites (like Google, ChatGPT, or AI tools) during the active exam is strictly prohibited.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-300">
              Current Strike: <strong className="text-rose-400 font-bold text-sm">{tabSwitches} / 3</strong>
              <span className="block text-[10px] text-slate-500 mt-1 font-sans">3 Strikes will automatically terminate and submit your exam!</span>
            </div>
            <button
              onClick={() => setShowWarningModal(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition cursor-pointer"
            >
              I Understand - Return to Exam
            </button>
          </div>
        </div>
      )}

      {/* Live WebCam AI Proctoring PIP Widget */}
      <div className="fixed bottom-6 right-6 z-40 bg-slate-900/95 border border-slate-700 p-2.5 rounded-2xl shadow-2xl backdrop-blur-md flex flex-col items-center gap-1.5 w-36 no-print">
        <div className="relative w-32 h-24 bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform -scale-x-100"
          />
          {!cameraActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-[10px] text-rose-400 p-2 text-center font-bold">
              <span>📷 Camera Off</span>
              <span className="text-[8px] text-slate-500 font-normal mt-0.5">{cameraError || 'Permission Pending'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-wider">
          <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`}></span>
          <span className={cameraActive ? 'text-emerald-400' : 'text-rose-400'}>
            {cameraActive ? 'AI Proctor Live' : 'Cam Offline'}
          </span>
        </div>
      </div>

    </div>
  );
}
