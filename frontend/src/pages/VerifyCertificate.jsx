import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { ShieldCheck, ShieldAlert, Award, Calendar, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VerifyCertificate() {
  const { code } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verify = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/certificates/verify/${code}`);
        setResult(res.data);
      } catch (err) {
        setResult(err.response?.data || { valid: false, message: 'Invalid certificate code' });
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [code]);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full glass-card border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl">
        
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        {loading ? (
          <div className="py-12 space-y-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-300">Verifying Certificate Authenticity...</p>
          </div>
        ) : result?.valid ? (
          <div className="space-y-6">
            <div className="w-16 h-16 bg-emerald-500/10 border-2 border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <ShieldCheck className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30 inline-block mb-2">
                AUTHENTIC VERIFIED CERTIFICATE
              </span>
              <h2 className="text-2xl font-extrabold text-white">{result.certificate.student_name}</h2>
              <p className="text-xs text-slate-400">Certified Student</p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-left space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Assessment:</span>
                <span className="font-bold text-white text-right">{result.certificate.quiz_title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Category:</span>
                <span className="font-semibold text-indigo-400">{result.certificate.category_name}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Achieved Score:</span>
                <span className="font-extrabold text-emerald-400">{result.certificate.percentage}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Issued On:</span>
                <span className="font-medium text-slate-300">
                  {new Date(result.certificate.issued_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic">
              Verification Code: {result.certificate.certificate_code}
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-6">
            <div className="w-16 h-16 bg-rose-500/10 border-2 border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <ShieldAlert className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Invalid Certificate</h2>
            <p className="text-xs text-slate-400">{result?.message || 'No certificate matching this code exists in our official records.'}</p>
          </div>
        )}

      </div>
    </div>
  );
}
