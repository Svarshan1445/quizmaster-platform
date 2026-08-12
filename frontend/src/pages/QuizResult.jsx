import React, { useState, useEffect } from 'react';
import api from '../services/api';
import confetti from 'canvas-confetti';
import CertificateModal from '../components/CertificateModal';
import { 
  Award, CheckCircle, XCircle, Clock, AlertCircle, 
  HelpCircle, ArrowLeft, Download, Sparkles, RefreshCw, Printer, AlertTriangle 
} from 'lucide-react';
import { soundManager } from '../utils/sound';

export default function QuizResult({ attemptId, onBackToQuizzes, onRetakeQuiz }) {
  const [resultData, setResultData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    const fetchResult = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await api.get(`/attempts/${attemptId}`);
        setResultData(res.data);

        // Safe Audio and Celebration Confetti Execution
        try {
          if (res.data?.attempt?.status === 'PASSED') {
            try { soundManager.playVictory(); } catch (e) {}
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
              });
            } catch (e) {}
          } else {
            try { soundManager.playFail(); } catch (e) {}
          }
        } catch (audioErr) {
          console.error('Audio/Confetti error:', audioErr);
        }
      } catch (err) {
        console.error('Error fetching quiz result:', err);
        setErrorMsg(err.response?.data?.message || 'Unable to load attempt details.');
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchResult();
    }
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center gap-3 text-indigo-400 font-semibold animate-pulse">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>Calculating Scores & Grading Breakdown...</span>
        </div>
      </div>
    );
  }

  if (errorMsg || !resultData || !resultData.attempt) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-4 shadow-2xl">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Result Not Available</h3>
        <p className="text-xs text-slate-400">{errorMsg || 'Attempt details could not be loaded.'}</p>
        <button
          onClick={onBackToQuizzes}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition cursor-pointer"
        >
          Return to Quizzes
        </button>
      </div>
    );
  }

  const { attempt, review } = resultData;
  const isPassed = attempt.status === 'PASSED';

  const formatTime = (secs) => {
    if (!secs) return 'N/A';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Top Navigation */}
      <button
        onClick={onBackToQuizzes}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Quizzes
      </button>

      {/* Main Result Card Banner */}
      <div className={`relative rounded-3xl border p-8 text-center space-y-6 overflow-hidden shadow-2xl ${
        isPassed
          ? 'bg-gradient-to-b from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40'
          : 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-900 border-rose-500/40'
      }`}>
        
        {/* Glow */}
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 rounded-full blur-3xl pointer-events-none ${
          isPassed ? 'bg-emerald-500/20' : 'bg-rose-500/20'
        }`}></div>

        {/* Pass/Fail Icon */}
        <div className="relative z-10">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-2xl mb-4 ${
            isPassed
              ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-emerald-500/30'
              : 'bg-gradient-to-tr from-rose-500 to-pink-500 text-white shadow-rose-500/30'
          }`}>
            {isPassed ? <CheckCircle className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
          </div>

          <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase border mb-2 ${
            isPassed
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
          }`}>
            {isPassed ? 'STATUS: PASSED' : 'STATUS: FAILED'}
          </span>

          <h1 className="text-3xl font-extrabold text-white tracking-tight">{attempt.quiz_title}</h1>
          <p className="text-xs text-slate-400 mt-1">Passing threshold: {attempt.passing_score}%</p>
        </div>

        {/* Score Radial Metric */}
        <div className="max-w-md mx-auto bg-slate-950/80 rounded-2xl border border-slate-800 p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Your Score</p>
            <p className={`text-2xl font-extrabold mt-0.5 ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.percentage}%
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Correct</p>
            <p className="text-2xl font-extrabold text-emerald-400 mt-0.5">{attempt.correct_answers}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Incorrect</p>
            <p className="text-2xl font-extrabold text-rose-400 mt-0.5">{attempt.incorrect_answers}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-semibold">Time Taken</p>
            <p className="text-sm font-bold text-slate-200 mt-2">{formatTime(attempt.time_taken)}</p>
          </div>
        </div>

        {/* Certificate ID Banner */}
        {isPassed && (
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-4 max-w-md mx-auto flex items-center justify-between text-left shadow-lg shadow-emerald-500/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400">Official Certificate ID</span>
              <p className="text-sm font-mono font-bold text-white">CERT-QM-{attempt.id}-{attempt.user_id}</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 px-2.5 py-1 rounded-lg border border-emerald-500/30">
              Verified Authentic
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {isPassed && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>👁️ View Official Certificate</span>
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>

          {onRetakeQuiz && (
            <button
              onClick={() => onRetakeQuiz(attempt.quiz_id)}
              className="px-5 py-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition cursor-pointer"
            >
              Retake Quiz
            </button>
          )}
        </div>

      </div>

      {/* Question Itemized Review */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-400" /> Answer Key & Review Breakdown
        </h2>

        <div className="space-y-4">
          {review?.map((q, idx) => {
            const isUserCorrect = q.is_correct;
            const isUnanswered = (q.question_type === 'FILL_BLANK' || q.question_type === 'CODING')
              ? (!q.user_text_answer || q.user_text_answer.trim() === '')
              : !q.selected_option_id;

            return (
              <div key={q.id || idx} className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
                
                {/* Question title header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                      isUnanswered
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : isUserCorrect
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {idx + 1}
                    </span>
                    <h3 className="text-base font-bold text-white leading-relaxed">{q.question_text}</h3>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold shrink-0 border ${
                    isUnanswered
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : isUserCorrect
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}>
                    {isUnanswered ? '⚠️ Unanswered' : isUserCorrect ? '✓ Correct' : '✕ Incorrect'}
                  </span>
                </div>

                {/* Options / Text Answer List */}
                <div className="space-y-2 pl-10">
                  {isUnanswered && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>You did not answer this question during the exam.</span>
                    </div>
                  )}

                  {q.question_type === 'CODING' ? (
                    <div className="space-y-2">
                      <div className={`p-4 rounded-xl border text-xs font-mono ${
                        isUnanswered
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : isUserCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      }`}>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-700/50">
                          <strong className="text-white font-sans text-xs">Your Code Answer:</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-sans ${
                            isUnanswered
                              ? 'bg-amber-500/20 text-amber-300'
                              : isUserCorrect
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                          }`}>
                            {isUnanswered ? 'Unanswered' : isUserCorrect ? 'Correct Code' : 'Incorrect Code'}
                          </span>
                        </div>
                        <pre className="whitespace-pre-wrap font-mono text-xs">{q.user_text_answer || '(No code submitted)'}</pre>
                      </div>
                      {!isUserCorrect && q.options && q.options.length > 0 && (
                        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300 font-mono">
                          <strong className="text-white font-sans text-xs block mb-1">Expected Code Solution / Output:</strong>
                          <pre className="whitespace-pre-wrap">{q.options[0]?.option_text}</pre>
                        </div>
                      )}
                    </div>
                  ) : q.question_type === 'FILL_BLANK' ? (
                    <div className="space-y-2">
                      <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                        isUnanswered
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                          : isUserCorrect
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                      }`}>
                        <span>
                          <strong className="text-white">Your Answer: </strong>
                          {q.user_text_answer ? `"${q.user_text_answer}"` : '(Unanswered / Left Blank)'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          isUnanswered
                            ? 'bg-amber-500/20 text-amber-300'
                            : isUserCorrect
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {isUnanswered ? 'Unanswered' : isUserCorrect ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      {!isUserCorrect && q.options && q.options.length > 0 && (
                        <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs text-emerald-300">
                          <strong className="text-white">Accepted Correct Answer: </strong>
                          "{q.options[0]?.option_text}"
                        </div>
                      )}
                    </div>
                  ) : (
                    q.options?.map((opt) => {
                      const isSelected = q.selected_option_id === opt.id;
                      const isCorrectOpt = opt.is_correct === 1;

                      let optBg = 'bg-slate-950/40 border-slate-800/80 text-slate-400';
                      if (isCorrectOpt) {
                        optBg = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold';
                      } else if (isSelected && !isCorrectOpt) {
                        optBg = 'bg-rose-500/15 border-rose-500/50 text-rose-300 line-through';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition ${optBg}`}
                        >
                          <span>{opt.option_text}</span>
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-medium">
                                Your Pick
                              </span>
                            )}
                            {isCorrectOpt && (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold border border-emerald-500/30">
                                Correct Answer
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Explanation Box */}
                {q.explanation && (
                  <div className="ml-10 p-3.5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
                    <div>
                      <span className="font-bold block mb-0.5 text-indigo-200">Explanation:</span>
                      <span>{q.explanation}</span>
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <CertificateModal attempt={attempt} onClose={() => setShowCertificate(false)} />
      )}

    </div>
  );
}
