const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), 'quiz.db');
const backupPath = path.resolve(process.cwd(), 'data_store.json');
const db = new Database(dbPath);

// Enable Foreign Keys
db.pragma('foreign_keys = ON');

// Initialize database tables
function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'STUDENT',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'Code',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      difficulty TEXT NOT NULL DEFAULT 'Intermediate',
      duration INTEGER NOT NULL DEFAULT 15,
      passing_score INTEGER NOT NULL DEFAULT 60,
      max_attempts INTEGER NOT NULL DEFAULT 3,
      status TEXT NOT NULL DEFAULT 'Draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      marks INTEGER NOT NULL DEFAULT 1,
      explanation TEXT,
      difficulty TEXT DEFAULT 'Intermediate',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      is_correct INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      total_marks INTEGER NOT NULL DEFAULT 0,
      percentage REAL NOT NULL DEFAULT 0,
      correct_answers INTEGER NOT NULL DEFAULT 0,
      incorrect_answers INTEGER NOT NULL DEFAULT 0,
      unanswered INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 0,
      time_taken INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'FAILED',
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      selected_option_id INTEGER,
      is_correct INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
      FOREIGN KEY (selected_option_id) REFERENCES options(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      certificate_code TEXT UNIQUE NOT NULL,
      attempt_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS user_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_key TEXT NOT NULL,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, badge_key),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, quiz_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for new columns
  const migrations = [
    `ALTER TABLE quizzes ADD COLUMN shuffle_questions INTEGER DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN shuffle_options INTEGER DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN negative_marks REAL DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN image_url TEXT`,
    `ALTER TABLE questions ADD COLUMN question_type TEXT DEFAULT 'MCQ'`,
    `ALTER TABLE answers ADD COLUMN user_text_answer TEXT`,
    `ALTER TABLE attempts ADD COLUMN tab_switches INTEGER DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN phone_number TEXT`,
    `UPDATE attempts SET time_taken = CASE WHEN time_taken >= 19800 THEN time_taken - 19800 ELSE time_taken END WHERE time_taken >= 19800`,
    `DELETE FROM attempts WHERE completed_at IS NULL`
  ];
  migrations.forEach(sql => {
    try { db.exec(sql); } catch (e) { /* Handled */ }
  });

  // Check if backup file exists and restore data
  if (fs.existsSync(backupPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
      if (data.categories && data.categories.length > 0) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO categories (id, name, description, icon, created_at) VALUES (?, ?, ?, ?, ?)`);
        data.categories.forEach(c => stmt.run(c.id, c.name, c.description, c.icon, c.created_at));
      }
      if (data.quizzes && data.quizzes.length > 0) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO quizzes (id, title, description, category_id, difficulty, duration, passing_score, max_attempts, status, shuffle_questions, shuffle_options, negative_marks, image_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.quizzes.forEach(q => stmt.run(q.id, q.title, q.description, q.category_id, q.difficulty, q.duration, q.passing_score, q.max_attempts, q.status, q.shuffle_questions || 0, q.shuffle_options || 0, q.negative_marks || 0, q.image_url || null, q.created_at, q.updated_at));
      }
      if (data.questions && data.questions.length > 0) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO questions (id, quiz_id, question_text, marks, explanation, difficulty, question_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        data.questions.forEach(q => stmt.run(q.id, q.quiz_id, q.question_text, q.marks, q.explanation, q.difficulty, q.question_type || 'MCQ', q.created_at));
      }
      if (data.options && data.options.length > 0) {
        const stmt = db.prepare(`INSERT OR REPLACE INTO options (id, question_id, option_text, is_correct) VALUES (?, ?, ?, ?)`);
        data.options.forEach(o => stmt.run(o.id, o.question_id, o.option_text, o.is_correct));
      }
      if (data.users && data.users.length > 0) {
        try { db.prepare('DELETE FROM users').run(); } catch (e) {}
        const stmt = db.prepare(`INSERT OR REPLACE INTO users (id, name, email, password, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
        data.users.forEach(u => stmt.run(u.id, u.name, u.email, u.password, u.role, u.status, u.created_at));
      }
      if (data.attempts && data.attempts.length > 0) {
        try { db.prepare('DELETE FROM attempts').run(); } catch (e) {}
        const stmt = db.prepare(`INSERT OR REPLACE INTO attempts (id, user_id, quiz_id, score, total_marks, percentage, status, time_taken, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        data.attempts.forEach(a => stmt.run(a.id, a.user_id, a.quiz_id, a.score, a.total_marks, a.percentage, a.status, a.time_taken || 0, a.completed_at));
      }
      console.log('✓ Restored database state from backup JSON.');
    } catch (e) {
      console.warn('Backup restore warning:', e.message);
    }
  }

  // Automatic persistent seeding for default categories & admin account
  try {
    const bcrypt = require('bcryptjs');
    const adminPass = bcrypt.hashSync('admin123', 10);
    
    db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`)
      .run('System Administrator', 'admin@quiz.com', adminPass);
    db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`)
      .run('System Administrator', 'admin@quizmaster.com', adminPass);
    db.prepare(`INSERT OR IGNORE INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`)
      .run('QuizMaster Admin', 'quizplatform27@gmail.com', adminPass);

    const defaultCats = [
      ['JavaScript', 'Core JS concepts, ES6+, async programming, and scope', 'Code'],
      ['React.js', 'Components, hooks, state management, and virtual DOM', 'Atom'],
      ['Python', 'Python syntax, data structures, OOP, and modules', 'Terminal'],
      ['Java', 'Core Java, OOP, collections, threads, and JVM', 'Coffee'],
      ['C++', 'C++ pointers, memory management, OOP, and STL', 'Code2'],
      ['Database Systems', 'SQL queries, relational modeling, indexes, and transactions', 'Database'],
      ['Data Structures & Algorithms', 'Arrays, linked lists, trees, graphs, sorting, and dynamic programming', 'Cpu'],
      ['Computer Networks', 'OSI model, TCP/IP, HTTP/HTTPS, DNS, and IP routing', 'Network'],
      ['Cyber Security', 'Web security, XSS, CSRF, authentication, and encryption', 'ShieldCheck'],
      ['Web Development', 'HTML5, CSS3, Flexbox, Grid, and responsive web design', 'Globe']
    ];

    const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)`);
    defaultCats.forEach(([name, desc, icon]) => insertCat.run(name, desc, icon));
  } catch (err) {
    console.warn('Default seed warning:', err.message);
  }

  // Trigger initial backup sync
  saveBackup();
}

function saveBackup() {
  try {
    const categories = db.prepare('SELECT * FROM categories').all();
    const quizzes = db.prepare('SELECT * FROM quizzes').all();
    const questions = db.prepare('SELECT * FROM questions').all();
    const options = db.prepare('SELECT * FROM options').all();
    const users = db.prepare('SELECT * FROM users').all();
    const attempts = db.prepare('SELECT * FROM attempts').all();

    const dump = { categories, quizzes, questions, options, users, attempts, updated_at: new Date().toISOString() };
    fs.writeFileSync(backupPath, JSON.stringify(dump, null, 2), 'utf8');
  } catch (e) {
    console.warn('Save backup warning:', e.message);
  }
}

initDb();

// Export helper to allow controllers to trigger backup save when modifying data
db.saveBackup = saveBackup;

module.exports = db;
