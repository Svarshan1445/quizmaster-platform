import React, { useState, useEffect } from 'react';
import { Award, Download, X, Sparkles, RefreshCw, Share2, ShieldCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export default function CertificateModal({ attempt, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');

  const certCode = attempt ? `CERT-QM-${attempt.id || attempt.attempt_id}-${attempt.user_id}` : '';

  useEffect(() => {
    if (certCode) {
      const host = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? '10.23.215.125'
        : window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const verifyUrl = `${window.location.protocol}//${host}${port}/verify-cert?id=${certCode}`;

      QRCode.toDataURL(verifyUrl, { margin: 1, color: { dark: '#f59e0b', light: '#030712' } })
        .then(url => setQrCodeDataUrl(url))
        .catch(err => console.error('QR code error:', err));
    }
  }, [certCode]);

  if (!attempt) return null;

  const dateStr = attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : new Date().toLocaleDateString('en-US');

  const handleLinkedInShare = () => {
    const certName = encodeURIComponent(`Certificate of Proficiency in ${attempt.quiz_title || 'Assessment'}`);
    const certIdCode = encodeURIComponent(certCode);
    const certUrl = encodeURIComponent(`${window.location.origin}/verify-cert?id=${certCode}`);
    
    const linkedInUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${certName}&organizationName=QuizMaster%20Global%20Academy&certId=${certIdCode}&certUrl=${certUrl}`;
    window.open(linkedInUrl, '_blank');
  };

  const handleDownloadPDF = async () => {
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
      ctx.fillText(attempt.student_name || 'Valued Student', 1600, 880);

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
      ctx.fillText(attempt.quiz_title || 'Assessment', 1600, 1296);

      // Metrics Boxes
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;

      // Box 1 Score
      ctx.fillStyle = '#0f172a';
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(640, 1440, 560, 180, 32); else ctx.rect(640, 1440, 560, 180); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#94a3b8'; ctx.font = '28px "Times New Roman", Times, serif'; ctx.fillText('PERFORMANCE SCORE', 920, 1504);
      ctx.fillStyle = '#34d399'; ctx.font = 'bold 68px "Times New Roman", Times, serif'; ctx.fillText(`${attempt.percentage}%`, 920, 1584);

      // Box 2 Status
      const scorePct = Number(attempt.percentage) || 0;
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
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 36px "Times New Roman", Times, serif'; ctx.fillText(certCode, 2280, 1580);

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
      const certYear = attempt.completed_at ? new Date(attempt.completed_at).getFullYear() : new Date().getFullYear();
      ctx.fillStyle = '#fcd34d'; ctx.font = 'bold 15px "Times New Roman", Times, serif';
      ctx.fillText(`★ VERIFIED ${certYear} ★`, 1600, 1880);
      ctx.fillStyle = '#94a3b8'; ctx.font = '14px monospace';
      ctx.fillText(`DATE: ${dateStr}`, 1600, 1906);

      // Create 4K Ultra HD PDF via jsPDF
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`QuizMaster-Certificate-${attempt.id || attempt.attempt_id}.pdf`);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Error generating PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-serif">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl p-6 sm:p-10 text-center overflow-hidden font-serif">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Certificate Border Container */}
        <div className="border-4 border-double border-amber-500/30 rounded-xl p-6 sm:p-10 bg-slate-950 relative space-y-4 printable-modal-cert font-serif">
          
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-amber-400" />
              </div>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 font-serif">
            <Sparkles className="w-3.5 h-3.5" /> OFFICIAL CERTIFICATE OF ACHIEVEMENT
          </span>

          <h1 className="text-2xl sm:text-3xl font-serif font-extrabold text-white tracking-wide">
            CERTIFICATE OF PROFICIENCY
          </h1>
          <p className="text-xs text-slate-400 italic font-serif">This certificate is officially awarded to</p>

          <div className="py-1 px-6 inline-block border-b-2 border-amber-400">
            <h2 className="text-xl sm:text-2xl font-bold text-amber-300 tracking-wider font-serif">
              {attempt.student_name || 'Valued Student'}
            </h2>
          </div>

          <p className="text-xs text-slate-300 max-w-xl mx-auto leading-relaxed font-serif">
            for successfully passing the assessment in <strong className="text-indigo-300">{attempt.quiz_title || 'Assessment'}</strong> with a distinction score of <strong className="text-emerald-400">{attempt.percentage}%</strong>.
          </p>

          {/* Footer Badges */}
          <div className="flex justify-between items-end text-left pt-4 border-t border-slate-800 text-xs font-serif">
            <div>
              <p className="text-emerald-400 font-mono font-bold text-xs">{certCode}</p>
              <p className="text-[10px] text-slate-500">Date: {dateStr}</p>
            </div>
            {qrCodeDataUrl && (
              <div className="flex flex-col items-center">
                <img src={qrCodeDataUrl} alt="Security QR Badge" className="w-10 h-10 rounded border border-amber-500/40 p-0.5 bg-slate-950 shadow-md" />
                <span className="text-[7px] font-mono font-bold text-amber-300 block tracking-tighter">SCAN ME</span>
              </div>
            )}
            <div className="text-right">
              <p className="font-serif italic text-amber-300 font-bold text-xs">Srivarshan K</p>
              <p className="text-[9px] text-slate-500">Founder &amp; Head of Assessment</p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleLinkedInShare}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-500/20 cursor-pointer font-serif"
          >
            <Share2 className="w-4 h-4" /> Add to LinkedIn
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 font-serif"
          >
            {downloading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{downloading ? 'Generating Ultra HD PDF...' : '📥 Download Official Certificate (PDF)'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
