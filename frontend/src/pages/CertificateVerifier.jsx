import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldCheck, Search, Award, CheckCircle, AlertTriangle, RefreshCw, Download, Share2 } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function CertificateVerifier() {
  const [certId, setCertId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  // Auto-verify if ID is in URL query ?id=CERT-QM-42-13
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idFromUrl = urlParams.get('id');
    if (idFromUrl) {
      setCertId(idFromUrl);
      setLoading(true);
      api.get(`/attempts/verify-certificate/${idFromUrl.trim()}`)
        .then(res => setResult(res.data))
        .catch(err => setError(err.response?.data?.message || 'Certificate ID not found or invalid.'))
        .finally(() => setLoading(false));
    }
  }, []);

  // Generate QR Code data URL when result is loaded (using Wi-Fi network IP for mobile scanning)
  useEffect(() => {
    if (result && result.certificate_code) {
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '10.23.215.125'
        : window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const verifyUrl = `${window.location.protocol}//${host}${port}/verify-cert?id=${result.certificate_code}`;

      QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: '#f59e0b', light: '#030712' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [result]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const res = await api.get(`/attempts/verify-certificate/${certId.trim()}`);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Certificate ID not found or invalid.');
    } finally {
      setLoading(false);
    }
  };

  const handleLinkedInShare = () => {
    if (!result) return;
    const certName = encodeURIComponent(`Certificate of Proficiency in ${result.quiz_title}`);
    const certIdCode = encodeURIComponent(result.certificate_code);
    const certUrl = encodeURIComponent(`${window.location.origin}/verify-cert?id=${result.certificate_code}`);
    
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=QuizMaster%20Global%20Academy&certId=${certIdCode}&certUrl=${certUrl}`;
    window.open(linkedInUrl, '_blank');
  };

  const handleDownloadPDF = async () => {
    if (!result) return;
    setDownloading(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 3200; // 4K Ultra HD Resolution
      canvas.height = 2260;
      const ctx = canvas.getContext('2d');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, 3200, 2260);

      // Outer Double Gold Border
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 28;
      ctx.strokeRect(60, 60, 3080, 2140);
      ctx.lineWidth = 8;
      ctx.strokeRect(96, 96, 3008, 2068);

      // Top Bar Text - Times New Roman
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 40px "Times New Roman", Times, serif';
      ctx.textAlign = 'left';
      ctx.fillText('QUIZMASTER GLOBAL ACADEMY', 180, 210);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '28px "Times New Roman", Times, serif';
      ctx.fillText('ISO 9001:2015 CERTIFIED ASSESSMENT BOARD', 180, 260);

      // Top Right Authentication Status & QR Security Badge
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 32px "Times New Roman", Times, serif';
      ctx.textAlign = 'right';
      ctx.fillText('✓ AUTHENTICATED RECORD', 2860, 210);

      // Draw QR Code & SCAN ME Label in Top Right Security Badge
      if (qrCodeDataUrl) {
        const qrImg = new Image();
        qrImg.src = qrCodeDataUrl;
        await new Promise((resolve) => {
          qrImg.onload = () => {
            ctx.drawImage(qrImg, 2870, 130, 140, 140);
            ctx.fillStyle = '#fcd34d';
            ctx.font = 'bold 16px "Times New Roman", Times, serif';
            ctx.textAlign = 'center';
            ctx.fillText('SCAN ME', 2940, 290);
            resolve();
          };
          qrImg.onerror = () => resolve();
        });
      }

      // Divider Line
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(180, 310);
      ctx.lineTo(3020, 310);
      ctx.stroke();

      // Certificate Header Title
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 108px "Times New Roman", Times, serif';
      ctx.textAlign = 'center';
      ctx.fillText('CERTIFICATE OF PROFICIENCY', 1600, 500);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '36px "Times New Roman", Times, serif';
      ctx.fillText('& TECHNICAL DOMAIN MASTERY', 1600, 580);

      // Recipient Citation
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'italic 44px "Times New Roman", Times, serif';
      ctx.fillText('This is to officially acknowledge and certify that', 1600, 720);

      // Student Name
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 116px "Times New Roman", Times, serif';
      ctx.fillText(result.student_name, 1600, 880);

      // Underline
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(1000, 920);
      ctx.lineTo(2200, 920);
      ctx.stroke();

      // Citation text
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '40px "Times New Roman", Times, serif';
      ctx.fillText('has successfully demonstrated outstanding theoretical knowledge, analytical problem-solving,', 1600, 1050);
      ctx.fillText('and subject proficiency by completing the standardized online examination in', 1600, 1120);

      // Quiz Box
      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 5;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(1000, 1200, 1200, 150, 40);
      else ctx.rect(1000, 1200, 1200, 150);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#a5b4fc';
      ctx.font = 'bold 64px "Times New Roman", Times, serif';
      ctx.fillText(result.quiz_title, 1600, 1296);

      // Metrics Boxes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;

      // Box 1 Score
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(640, 1440, 560, 180, 32); else ctx.rect(640, 1440, 560, 180); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '28px "Times New Roman", Times, serif'; ctx.fillText('PERFORMANCE SCORE', 920, 1504);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 68px "Times New Roman", Times, serif'; ctx.fillText(`${result.score_percentage}%`, 920, 1584);

      // Box 2 Status
      const scorePct = Number(result.score_percentage) || 0;
      let gradeLabel = 'PASSED';
      if (scorePct >= 85) gradeLabel = 'DISTINCTION PASS';
      else if (scorePct >= 75) gradeLabel = 'FIRST CLASS';

      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(1320, 1440, 560, 180, 32); else ctx.rect(1320, 1440, 560, 180); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '28px "Times New Roman", Times, serif'; ctx.fillText('ASSESSMENT STATUS', 1600, 1504);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 40px "Times New Roman", Times, serif'; ctx.fillText(`✓ ${gradeLabel}`, 1600, 1580);

      // Box 3 Credential
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(2000, 1440, 560, 180, 32); else ctx.rect(2000, 1440, 560, 180); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '28px "Times New Roman", Times, serif'; ctx.fillText('CREDENTIAL ID', 2280, 1504);
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 36px "Times New Roman", Times, serif'; ctx.fillText(result.certificate_code, 2280, 1580);

      // Bottom Divider
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(180, 1700); ctx.lineTo(3020, 1700); ctx.stroke();

      // Left Signature
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold italic 48px "Times New Roman", Times, serif'; ctx.textAlign = 'left';
      ctx.fillText('Srivarshan K', 200, 1840);
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 28px "Times New Roman", Times, serif';
      ctx.fillText('FOUNDER & HEAD OF ASSESSMENT', 200, 1900);
      ctx.fillStyle = '#64748b'; ctx.font = '24px "Times New Roman", Times, serif';
      ctx.fillText('QuizMaster Academic Board', 200, 1950);

      // Right Signature
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold italic 48px "Times New Roman", Times, serif'; ctx.textAlign = 'right';
      ctx.fillText('Prof. S. N. Iyer', 3000, 1840);
      ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 28px "Times New Roman", Times, serif';
      ctx.fillText('DIRECTOR OF EXAMINATIONS', 3000, 1900);
      ctx.fillStyle = '#64748b'; ctx.font = '24px "Times New Roman", Times, serif';
      ctx.fillText('Academic Governing Board', 3000, 1950);

      // Center Seal with 4K Aesthetic Crown Symbol
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(1600, 1860, 120, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#030712';
      ctx.beginPath(); ctx.arc(1600, 1860, 104, 0, Math.PI * 2); ctx.fill();
      
      // Golden Crown Symbol inside Seal
      ctx.fillStyle = '#fbbf24'; ctx.font = '48px "Times New Roman", Times, serif'; ctx.textAlign = 'center';
      ctx.fillText('👑', 1600, 1824);
      
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 18px "Times New Roman", Times, serif';
      ctx.fillText('OFFICIAL SEAL', 1600, 1856);
      const certYear = result.completed_at ? new Date(result.completed_at).getFullYear() : new Date().getFullYear();
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 15px "Times New Roman", Times, serif';
      ctx.fillText(`★ VERIFIED ${certYear} ★`, 1600, 1880);
      ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace';
      ctx.fillText(`DATE: ${new Date(result.completed_at).toLocaleDateString()}`, 1600, 1906);

      // Create 4K Ultra HD PDF via jsPDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`QuizMaster-Certificate-${result.certificate_code}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Error generating PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3 no-print">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" /> OFFICIAL VERIFICATION PORTAL
        </span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Verify Student Certificate</h1>
        <p className="text-sm text-slate-400">
          Enter any QuizMaster Certificate ID (e.g. <code className="text-emerald-300 font-mono bg-slate-900 px-2 py-0.5 rounded cursor-pointer" onClick={() => setCertId('CERT-QM-42-13')}>CERT-QM-42-13</code>) to verify its authenticity.
        </p>
      </div>

      {/* Search Bar */}
      <div className="glass-card rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4 max-w-xl mx-auto no-print">
        <form onSubmit={handleVerify} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              placeholder="Paste Certificate Code (e.g. CERT-QM-42-13)"
              className="w-full bg-slate-950/60 border border-slate-700/80 rounded-xl pl-11 pr-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-semibold text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>{loading ? 'Verifying...' : 'Verify'}</span>
          </button>
        </form>
      </div>

      {/* Verification Result Display */}
      {error && (
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center space-y-2 no-print">
          <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
          <p className="font-bold text-sm">Verification Failed</p>
          <p>{error}</p>
        </div>
      )}

      {/* Visual Verified Certificate Display */}
      {result && (
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 no-print">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>Official Verification Status: <strong>VERIFIED AUTHENTIC</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleLinkedInShare}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Add to LinkedIn</span>
              </button>
              <button
                onClick={handleDownloadPDF}
                disabled={downloading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 text-xs font-extrabold shadow-xl shadow-amber-500/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{downloading ? 'Generating Ultra HD PDF...' : '📥 Download Official Certificate (PDF)'}</span>
              </button>
            </div>
          </div>

          {/* Pro Enterprise A4 Visual Certificate Document Card */}
          <div className="relative bg-slate-950 border-8 border-double border-amber-500/70 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-3.5 text-center overflow-hidden printable-cert-card">
            
            {/* Background Luxury Ambient Accents */}
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Accreditation & Verification Ribbon Bar */}
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400 block font-serif">QUIZMASTER GLOBAL ACADEMY</span>
                <span className="text-[9px] font-mono text-slate-400">ISO 9001:2015 CERTIFIED ASSESSMENT BOARD</span>
              </div>
              <div className="flex items-center gap-2">
                {qrCodeDataUrl && (
                  <div className="flex flex-col items-center">
                    <img src={qrCodeDataUrl} alt="Security QR Badge" className="w-10 h-10 rounded border border-amber-500/40 p-0.5 bg-slate-950 shadow-md" />
                    <span className="text-[7px] font-mono font-bold text-amber-300 block tracking-tighter">SCAN ME</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-serif">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> AUTHENTICATED RECORD
                </div>
              </div>
            </div>

            {/* Certificate Header */}
            <div className="space-y-1 pt-1">
              <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-gradient-to-tr from-amber-500/20 to-amber-300/10 border border-amber-500/40 text-amber-400 shadow-xl shadow-amber-500/10">
                <Award className="w-9 h-9" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-wider uppercase font-serif">
                Certificate of Proficiency
              </h2>
              <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest font-serif">
                &amp; Technical Domain Mastery
              </p>
            </div>

            {/* Recipient Citation */}
            <div className="space-y-1 py-1 max-w-2xl mx-auto">
              <p className="text-[11px] text-slate-400 italic font-serif">This is to officially acknowledge and certify that</p>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wide underline decoration-amber-500/50 underline-offset-4 py-0.5 font-serif">
                {result.student_name}
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed pt-1 font-serif">
                has successfully demonstrated outstanding theoretical knowledge, analytical problem-solving, and subject proficiency by completing the standardized online examination in
              </p>
              <div className="inline-block bg-indigo-950/60 border border-indigo-500/40 px-4 py-1 rounded-xl my-1">
                <span className="text-base sm:text-lg font-extrabold text-indigo-300 tracking-wide font-serif">{result.quiz_title}</span>
                <span className="text-[10px] text-slate-400 block font-normal font-serif">Subject Category: {result.category_name || 'General Computer Science'}</span>
              </div>
            </div>

            {/* Performance & Competency Summary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto py-1 font-serif">
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Performance Score</span>
                <span className="text-lg font-extrabold text-emerald-400">{result.score_percentage}%</span>
              </div>
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Assessment Status</span>
                <span className="text-[11px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle className="w-3 h-3" />
                  {(() => {
                    const score = Number(result.score_percentage) || 0;
                    if (score >= 85) return 'DISTINCTION PASS';
                    if (score >= 75) return 'FIRST CLASS';
                    return 'PASSED';
                  })()}
                </span>
              </div>
              <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-center">
                <span className="text-[9px] text-slate-400 uppercase font-semibold block">Credential ID</span>
                <span className="text-[11px] font-mono font-bold text-amber-300 block mt-0.5">{result.certificate_code}</span>
              </div>
            </div>

            {/* Bottom Footer Details, Royal 3D Gold Emblem Seal & Signatures */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs items-end font-serif">
              <div className="text-left space-y-0.5">
                <p className="font-serif italic text-amber-300 text-xs sm:text-sm border-b border-amber-500/30 pb-0.5 inline-block font-bold">Srivarshan K</p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Founder &amp; Head of Assessment</p>
                <p className="text-[8px] text-slate-500">QuizMaster Academic Board</p>
              </div>

              {/* Royal 3D Gold Emblem Seal with Crown Symbol */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-300 shadow-xl shadow-amber-500/30 animate-pulse"></div>
                  <div className="absolute inset-1 rounded-full bg-slate-950 border-2 border-dashed border-amber-400 flex flex-col items-center justify-center text-amber-300 text-center leading-none p-1 shadow-inner font-serif">
                    <span className="text-base leading-none my-0.5">👑</span>
                    <span className="text-white text-[7px] font-black uppercase tracking-tighter">OFFICIAL SEAL</span>
                    <span className="text-[5px] text-amber-300 font-bold">★ {result.completed_at ? new Date(result.completed_at).getFullYear() : '2026'} ★</span>
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 mt-1 font-mono font-bold">DATE: {new Date(result.completed_at).toLocaleDateString()}</span>
              </div>

              <div className="text-right space-y-0.5">
                <p className="font-serif italic text-amber-300 text-xs sm:text-sm border-b border-amber-500/30 pb-0.5 inline-block font-bold">Prof. S. N. Iyer</p>
                <p className="text-[9px] text-slate-300 font-bold uppercase tracking-wider">Director of Examinations</p>
                <p className="text-[8px] text-slate-500">Academic Governing Board</p>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
