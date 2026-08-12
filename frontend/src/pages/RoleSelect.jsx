import React from 'react';
import { ShieldCheck, GraduationCap, Award, Zap, BookOpen, Trophy } from 'lucide-react';

export default function RoleSelect({ onSelectAdmin, onSelectStudent }) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-900/10 rounded-full blur-3xl pointer-events-none" />

      {/* Logo & Title */}
      <div className="relative text-center mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white tracking-tight" style={{ fontFamily: 'Times New Roman, serif' }}>
          QuizMaster
        </h1>
        <p className="text-slate-400 mt-2 text-base" style={{ fontFamily: 'Times New Roman, serif' }}>
          Assessment & Certification Platform
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="h-px w-16 bg-gradient-to-r from-transparent to-indigo-500/50" />
          <span className="text-xs text-slate-500 uppercase tracking-widest" style={{ fontFamily: 'Times New Roman, serif' }}>Choose Your Role</span>
          <div className="h-px w-16 bg-gradient-to-l from-transparent to-indigo-500/50" />
        </div>
      </div>

      {/* Role Cards */}
      <div className="relative flex flex-col sm:flex-row gap-6 w-full max-w-2xl">

        {/* Admin Card */}
        <button
          onClick={onSelectAdmin}
          className="group flex-1 relative bg-slate-900/60 border border-slate-700/50 hover:border-indigo-500/70 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 backdrop-blur-xl overflow-hidden"
        >
          {/* Card glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/0 to-violet-600/0 group-hover:from-indigo-600/10 group-hover:to-violet-600/10 transition-all duration-300 rounded-3xl" />

          {/* Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>

          {/* Text */}
          <h2 className="relative text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            Admin Portal
          </h2>
          <p className="relative text-slate-400 text-sm leading-relaxed mb-6" style={{ fontFamily: 'Times New Roman, serif' }}>
            Manage quizzes, users, view results and analytics. Full administrative control.
          </p>

          {/* Features */}
          <div className="relative space-y-2">
            {['Manage Quizzes & Questions', 'View All Attempts', 'User Management', 'Analytics Dashboard'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span className="text-xs text-slate-400" style={{ fontFamily: 'Times New Roman, serif' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="relative mt-6 flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
            <span className="text-sm font-semibold" style={{ fontFamily: 'Times New Roman, serif' }}>Login as Admin</span>
            <Zap className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </div>

          {/* Badge */}
          <div className="absolute top-4 right-4 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs px-2.5 py-1 rounded-full font-medium" style={{ fontFamily: 'Times New Roman, serif' }}>
            Admin
          </div>
        </button>

        {/* Student Card */}
        <button
          onClick={onSelectStudent}
          className="group flex-1 relative bg-slate-900/60 border border-slate-700/50 hover:border-emerald-500/70 rounded-3xl p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/20 hover:-translate-y-1 backdrop-blur-xl overflow-hidden"
        >
          {/* Card glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 to-teal-600/0 group-hover:from-emerald-600/10 group-hover:to-teal-600/10 transition-all duration-300 rounded-3xl" />

          {/* Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all duration-300">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>

          {/* Text */}
          <h2 className="relative text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Times New Roman, serif' }}>
            Student Portal
          </h2>
          <p className="relative text-slate-400 text-sm leading-relaxed mb-6" style={{ fontFamily: 'Times New Roman, serif' }}>
            Take quizzes, earn certificates, and track your learning progress.
          </p>

          {/* Features */}
          <div className="relative space-y-2">
            {['Take Quizzes & Earn Marks', 'Download Certificates', 'View Leaderboard', 'Track Progress'].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400" style={{ fontFamily: 'Times New Roman, serif' }}>{f}</span>
              </div>
            ))}
          </div>

          {/* Arrow */}
          <div className="relative mt-6 flex items-center gap-2 text-emerald-400 group-hover:text-emerald-300 transition-colors">
            <span className="text-sm font-semibold" style={{ fontFamily: 'Times New Roman, serif' }}>Login as Student</span>
            <BookOpen className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
          </div>

          {/* Badge */}
          <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs px-2.5 py-1 rounded-full font-medium" style={{ fontFamily: 'Times New Roman, serif' }}>
            Student
          </div>
        </button>
      </div>

      {/* Footer */}
      <p className="relative mt-10 text-slate-600 text-xs text-center" style={{ fontFamily: 'Times New Roman, serif' }}>
        QuizMaster Assessment Platform &copy; 2024 — Secure &amp; Certified Learning
      </p>
    </div>
  );
}
