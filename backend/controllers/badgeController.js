const db = require('../config/database');

// Available Badges System Registry
const BADGE_REGISTRY = [
  {
    key: 'FIRST_VICTORY',
    name: 'First Victory',
    description: 'Passed your first quiz assessment',
    icon: 'Trophy',
    color: 'amber'
  },
  {
    key: 'PERFECT_SCORE',
    name: 'Perfect 100%',
    description: 'Achieved a perfect 100% score on a quiz',
    icon: 'Crown',
    color: 'yellow'
  },
  {
    key: 'QUIZ_STREAK',
    name: '3-Day Quiz Streak',
    description: 'Attempted quizzes on 3 consecutive days',
    icon: 'Flame',
    color: 'rose'
  },
  {
    key: 'CODE_NINJA',
    name: 'Code Ninja',
    description: 'Successfully solved a programming coding challenge',
    icon: 'Code2',
    color: 'indigo'
  },
  {
    key: 'QUIZ_MASTER',
    name: 'Quiz Master',
    description: 'Passed 5 or more quiz assessments',
    icon: 'Award',
    color: 'emerald'
  }
];

// Calculate and unlock badges for a student
function evaluateUserBadges(userId) {
  try {
    const attempts = db.prepare(`
      SELECT a.*, q.title as quiz_title
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
    `).all(userId);

    const passedCount = attempts.filter(a => a.status === 'PASSED').length;
    const hasPerfect = attempts.some(a => a.percentage === 100);

    // Check if user solved any coding question correctly
    const solvedCoding = db.prepare(`
      SELECT ans.id
      FROM answers ans
      JOIN attempts a ON ans.attempt_id = a.id
      JOIN questions q ON ans.question_id = q.id
      WHERE a.user_id = ? AND q.question_type = 'CODING' AND ans.is_correct = 1
      LIMIT 1
    `).get(userId);

    const insertBadge = db.prepare(`
      INSERT OR IGNORE INTO user_badges (user_id, badge_key) VALUES (?, ?)
    `);

    if (passedCount >= 1) insertBadge.run(userId, 'FIRST_VICTORY');
    if (hasPerfect) insertBadge.run(userId, 'PERFECT_SCORE');
    if (solvedCoding) insertBadge.run(userId, 'CODE_NINJA');
    if (passedCount >= 5) insertBadge.run(userId, 'QUIZ_MASTER');

    if (db.saveBackup) db.saveBackup();
  } catch (e) {
    console.warn('Error evaluating badges:', e.message);
  }
}

// Get user unlocked badges
exports.getUserBadges = (req, res) => {
  try {
    const userId = req.user.id;

    // Trigger evaluation to ensure up to date
    evaluateUserBadges(userId);

    const unlocked = db.prepare('SELECT badge_key, unlocked_at FROM user_badges WHERE user_id = ?').all(userId);
    const unlockedKeys = new Set(unlocked.map(b => b.badge_key));

    const badges = BADGE_REGISTRY.map(b => ({
      ...b,
      unlocked: unlockedKeys.has(b.key),
      unlocked_at: unlocked.find(u => u.badge_key === b.key)?.unlocked_at || null
    }));

    res.json(badges);
  } catch (error) {
    console.error('Error fetching user badges:', error);
    res.status(500).json({ message: 'Error fetching badges' });
  }
};

exports.evaluateUserBadges = evaluateUserBadges;
