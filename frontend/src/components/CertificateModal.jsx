import React, { useRef } from 'react';
import { Award, Download, Printer, CheckCircle, ShieldCheck, X } from 'lucide-react';

export default function CertificateModal({ attempt, certData: propCertData, onClose }) {
  const certRef = useRef();

  const certData = propCertData || (attempt ? {
    certificate_code: attempt.certificate_code || `QM-CERT-${attempt.id}`,
    student_name: attempt.student_name || attempt.user_name || 'Student Achiever',
    student_email: attempt.student_email || '',
    quiz_title: attempt.quiz_title || 'Quiz Assessment',
    category_name: attempt.category_name || 'General Knowledge',
    percentage: attempt.percentage || 0,
    score: attempt.score || 0,
    total_marks: attempt.total_marks || 0,
    completed_at: attempt.completed_at || new Date().toISOString()
  } : null);

  if (!certData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = certData.completed_at 
    ? new Date(certData.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const verifyUrl = `${window.location.origin}/verify-certificate/${certData.certificate_code}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 shadow-2xl relative space-y-6">
        
        {/* Modal Controls */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Official Certificate of Achievement</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
            >
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Framing Printable Area */}
        <div
          ref={certRef}
          className="bg-white text-slate-900 rounded-2xl p-8 sm:p-12 border-8 border-double border-amber-500 shadow-xl relative overflow-hidden text-center space-y-6 font-serif"
          style={{ backgroundImage: 'radial-gradient(#f8fafc 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        >
          {/* Top Decorative Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-50 border-2 border-amber-400 text-amber-600 mb-2">
              <Award className="w-10 h-10" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold uppercase tracking-widest text-amber-700">
              Certificate of Completion
            </h1>
            <p className="text-xs tracking-wider text-slate-500 uppercase font-sans font-semibold">
              QuizMaster Official Assessment & Certification
            </p>
          </div>

          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 via-amber-600 to-amber-400 mx-auto rounded-full"></div>

          {/* Certificate Body */}
          <div className="space-y-4 py-4">
            <p className="text-sm font-sans text-slate-600 italic">This is to certify that</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 underline decoration-amber-400 decoration-2 underline-offset-8">
              {certData.student_name}
            </h2>
            <p className="text-sm font-sans text-slate-600 max-w-lg mx-auto leading-relaxed">
              has successfully passed the comprehensive assessment for <br />
              <strong className="text-base text-slate-900 font-serif font-bold">{certData.quiz_title}</strong> ({certData.category_name})
              with an outstanding score of <strong className="text-amber-600 font-extrabold">{certData.percentage}%</strong>.
            </p>
          </div>

          {/* Bottom Footer & QR Verification Code */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end font-sans text-left">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Date Issued</p>
              <p className="text-sm font-bold text-slate-800">{formattedDate}</p>
              <p className="text-[10px] text-slate-400 mt-1">ID: {certData.certificate_code}</p>
            </div>

            <div className="text-center">
              <div className="inline-block p-2 bg-slate-50 border border-slate-300 rounded-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(verifyUrl)}`}
                  alt="Certificate Verification QR Code"
                  className="w-16 h-16 mx-auto"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> QR Verified Authenticity
              </p>
            </div>

            <div className="text-right">
              <div className="w-32 border-b-2 border-slate-800 ml-auto mb-1"></div>
              <p className="text-xs font-bold text-slate-800">QuizMaster Director</p>
              <p className="text-[10px] text-slate-400">Authorized Signature</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
