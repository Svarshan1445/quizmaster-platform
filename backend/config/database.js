const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'quiz.db');
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
  `);

  console.log('Database tables initialized successfully.');

  // Safe migrations for new columns
  const migrations = [
    `ALTER TABLE quizzes ADD COLUMN shuffle_questions INTEGER DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN shuffle_options INTEGER DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN negative_marks REAL DEFAULT 0`,
    `ALTER TABLE quizzes ADD COLUMN image_url TEXT`,
    `ALTER TABLE questions ADD COLUMN question_type TEXT DEFAULT 'MCQ'`,
    `ALTER TABLE answers ADD COLUMN user_text_answer TEXT`,
    `UPDATE attempts SET time_taken = CASE WHEN time_taken >= 19800 THEN time_taken - 19800 ELSE time_taken END WHERE time_taken >= 19800`,
    `DELETE FROM attempts WHERE completed_at IS NULL`
  ];
  migrations.forEach(sql => {
    try { db.exec(sql); } catch (e) { /* Column already exists or handled */ }
  });
}

initDb();

module.exports = db;

