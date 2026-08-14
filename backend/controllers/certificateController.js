const db = require('../config/database');
const crypto = require('crypto');

// Generate certificate code helper
function generateCertCode(userId, attemptId) {
  const raw = `QM-CERT-${userId}-${attemptId}-${Date.now()}`;
  const hash = crypto.createHash('md5').update(raw).digest('hex').substring(0, 8).toUpperCase();
  return `QM-CERT-${hash}`;
}

// Get or Issue Certificate for passed attempt
exports.getCertificateByAttempt = (req, res) => {
  try {
    const attemptId = parseInt(req.params.attemptId, 10);
    const userId = req.user.id;

    const attempt = db.prepare(`
      SELECT a.*, q.title as quiz_title, q.passing_score, c.name as category_name, u.name as student_name, u.email as student_email
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND (a.user_id = ? OR req_user_role = 'ADMIN')
    `).get(attemptId, userId);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    if (attempt.status !== 'PASSED' && attempt.percentage < (attempt.passing_score || 60)) {
      return res.status(400).json({ message: 'Certificate is only available for passed assessments' });
    }

    // Check if certificate already exists for this attempt
    let cert = db.prepare('SELECT * FROM certificates WHERE attempt_id = ?').get(attemptId);
    if (!cert) {
      const code = generateCertCode(attempt.user_id, attemptId);
      db.prepare(`
        INSERT INTO certificates (certificate_code, attempt_id, user_id)
        VALUES (?, ?, ?)
      `).run(code, attemptId, attempt.user_id);
      if (db.saveBackup) db.saveBackup();
      cert = db.prepare('SELECT * FROM certificates WHERE attempt_id = ?').get(attemptId);
    }

    res.json({
      certificate_code: cert.certificate_code,
      issued_at: cert.issued_at,
      student_name: attempt.student_name,
      student_email: attempt.student_email,
      quiz_title: attempt.quiz_title,
      category_name: attempt.category_name || 'General Knowledge',
      percentage: attempt.percentage,
      score: attempt.score,
      total_marks: attempt.total_marks,
      completed_at: attempt.completed_at
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    res.status(500).json({ message: 'Error generating certificate' });
  }
};

// Public QR Code Certificate Verification (No Auth Required)
exports.verifyCertificate = (req, res) => {
  try {
    const { code } = req.params;
    const cert = db.prepare(`
      SELECT cert.certificate_code, cert.issued_at,
             u.name as student_name, u.email as student_email,
             q.title as quiz_title, c.name as category_name,
             a.percentage, a.score, a.total_marks, a.completed_at
      FROM certificates cert
      JOIN users u ON cert.user_id = u.id
      JOIN attempts a ON cert.attempt_id = a.id
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE cert.certificate_code = ?
    `).get(code);

    if (!cert) {
      return res.status(404).json({
        valid: false,
        message: 'Invalid certificate verification code. No matching assessment record found.'
      });
    }

    res.json({
      valid: true,
      message: 'Authentic QuizMaster Certificate Verified',
      certificate: cert
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ valid: false, message: 'Error processing certificate verification' });
  }
};
