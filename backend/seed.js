const bcrypt = require('bcryptjs');
const db = require('./config/database');

console.log('Seeding Database...');

// 1. Seed Users
const adminPass = bcrypt.hashSync('Admin@123', 10);
const studentPass = bcrypt.hashSync('Student@123', 10);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, email, password, role, status)
  VALUES (?, ?, ?, ?, ?)
`);

insertUser.run('Admin User', 'admin@quizmaster.com', adminPass, 'ADMIN', 'ACTIVE');
insertUser.run('Rahul Sharma', 'rahul@student.com', studentPass, 'STUDENT', 'ACTIVE');
insertUser.run('Priya Patel', 'priya@student.com', studentPass, 'STUDENT', 'ACTIVE');
insertUser.run('Amit Verma', 'amit@student.com', studentPass, 'STUDENT', 'ACTIVE');
insertUser.run('Sneha Roy', 'sneha@student.com', studentPass, 'STUDENT', 'ACTIVE');

console.log('✓ Users seeded.');

// 2. Seed Categories
const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)');
insertCat.run('JavaScript', 'Core JS concepts, ES6+, async programming, and scope', 'Code');
insertCat.run('React.js', 'Components, hooks, state management, and virtual DOM', 'Atom');
insertCat.run('Python', 'Python syntax, data structures, OOP, and modules', 'Terminal');
insertCat.run('Database Systems', 'SQL queries, relational modeling, indexes, and transactions', 'Database');
insertCat.run('Computer Networks', 'OSI model, TCP/IP, HTTP/HTTPS, DNS, and IP routing', 'Network');
insertCat.run('Cyber Security', 'Web security, XSS, CSRF, authentication, and encryption', 'ShieldCheck');

console.log('✓ Categories seeded.');

// Get Category IDs
const jsCat = db.prepare("SELECT id FROM categories WHERE name = 'JavaScript'").get().id;
const reactCat = db.prepare("SELECT id FROM categories WHERE name = 'React.js'").get().id;
const pyCat = db.prepare("SELECT id FROM categories WHERE name = 'Python'").get().id;
const dbCat = db.prepare("SELECT id FROM categories WHERE name = 'Database Systems'").get().id;

// 3. Seed Quizzes
const insertQuiz = db.prepare(`
  INSERT OR IGNORE INTO quizzes (title, description, category_id, difficulty, duration, passing_score, max_attempts, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const q1 = insertQuiz.run(
  'JavaScript Fundamentals',
  'Test your knowledge of essential JavaScript concepts including data types, closures, promises, and array methods.',
  jsCat,
  'Intermediate',
  15,
  60,
  3,
  'Published'
).lastInsertRowid;

const q2 = insertQuiz.run(
  'React Hooks & State Architecture',
  'Comprehensive evaluation of useState, useEffect, useMemo, custom hooks, and component lifecycle.',
  reactCat,
  'Hard',
  20,
  70,
  2,
  'Published'
).lastInsertRowid;

const q3 = insertQuiz.run(
  'Python Basics & OOP',
  'Assessment covering Python list comprehensions, decorators, class inheritance, and file I/O.',
  pyCat,
  'Easy',
  10,
  50,
  5,
  'Published'
).lastInsertRowid;

const q4 = insertQuiz.run(
  'SQL & Relational Database Design',
  'Master JOINs, aggregate functions, foreign keys, normalization, and ACID properties.',
  dbCat,
  'Intermediate',
  15,
  65,
  3,
  'Published'
).lastInsertRowid;

const q5 = insertQuiz.run(
  'Advanced Web Security & Penetration Testing',
  'Deep dive into OWASP Top 10 vulnerabilities, JWT security, CSRF mitigation, and CORS header configuration.',
  jsCat,
  'Hard',
  30,
  80,
  1,
  'Draft'
).lastInsertRowid;

console.log('✓ Quizzes seeded.');

// 4. Seed Questions & Options
const insertQuestion = db.prepare('INSERT INTO questions (quiz_id, question_text, marks, explanation, difficulty) VALUES (?, ?, ?, ?, ?)');
const insertOption = db.prepare('INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)');

// Quiz 1: JavaScript Fundamentals Questions
const jsQuestions = [
  {
    text: 'Which method converts a JSON string into a JavaScript object?',
    marks: 2,
    explanation: 'JSON.parse() parses a JSON string, constructing the JavaScript value or object described by the string.',
    difficulty: 'Easy',
    options: [
      { text: 'JSON.stringify()', is_correct: 0 },
      { text: 'JSON.parse()', is_correct: 1 },
      { text: 'JSON.convert()', is_correct: 0 },
      { text: 'JSON.toObject()', is_correct: 0 }
    ]
  },
  {
    text: 'What keyword is used to declare a block-scoped variable that cannot be re-assigned?',
    marks: 2,
    explanation: 'const creates block-scoped variables that cannot be reassigned after initialization.',
    difficulty: 'Easy',
    options: [
      { text: 'var', is_correct: 0 },
      { text: 'let', is_correct: 0 },
      { text: 'const', is_correct: 1 },
      { text: 'static', is_correct: 0 }
    ]
  },
  {
    text: 'What will be the output of typeof NaN in JavaScript?',
    marks: 2,
    explanation: 'Despite meaning "Not a Number", NaN is actually a primitive numeric type value in IEEE 754 float representation.',
    difficulty: 'Intermediate',
    options: [
      { text: '"number"', is_correct: 1 },
      { text: '"nan"', is_correct: 0 },
      { text: '"undefined"', is_correct: 0 },
      { text: '"object"', is_correct: 0 }
    ]
  },
  {
    text: 'Which array method executes a provided function once for each array element without returning a new array?',
    marks: 2,
    explanation: 'forEach() executes a provided function for each element; map() returns a new array.',
    difficulty: 'Intermediate',
    options: [
      { text: 'map()', is_correct: 0 },
      { text: 'filter()', is_correct: 0 },
      { text: 'forEach()', is_correct: 1 },
      { text: 'reduce()', is_correct: 0 }
    ]
  },
  {
    text: 'What is a Closure in JavaScript?',
    marks: 2,
    explanation: 'A closure gives a function access to its outer lexical environment even after the outer function has executed.',
    difficulty: 'Hard',
    options: [
      { text: 'A function that returns a DOM element', is_correct: 0 },
      { text: 'A function bundled with references to its surrounding state (lexical environment)', is_correct: 1 },
      { text: 'An object method that locks properties', is_correct: 0 },
      { text: 'A recursive loop structure', is_correct: 0 }
    ]
  }
];

jsQuestions.forEach(q => {
  const qId = insertQuestion.run(q1, q.text, q.marks, q.explanation, q.difficulty).lastInsertRowid;
  q.options.forEach(opt => insertOption.run(qId, opt.text, opt.is_correct));
});

// Quiz 2: React Questions
const reactQuestions = [
  {
    text: 'Which React hook should be used to perform side effects in functional components?',
    marks: 2,
    explanation: 'useEffect accepts a function that contains imperative, side-effect producing code.',
    difficulty: 'Intermediate',
    options: [
      { text: 'useState', is_correct: 0 },
      { text: 'useEffect', is_correct: 1 },
      { text: 'useContext', is_correct: 0 },
      { text: 'useReducer', is_correct: 0 }
    ]
  },
  {
    text: 'What is the purpose of keys in React list rendering?',
    marks: 2,
    explanation: 'Keys help React identify which items have changed, been added, or been removed for optimal DOM re-rendering.',
    difficulty: 'Intermediate',
    options: [
      { text: 'Keys encrypt list elements for security', is_correct: 0 },
      { text: 'Keys uniquely identify items to help React reconcile DOM updates efficiently', is_correct: 1 },
      { text: 'Keys bind CSS rules to list elements', is_correct: 0 },
      { text: 'Keys trigger automatic sorting of array items', is_correct: 0 }
    ]
  },
  {
    text: 'How can you memoize a expensive calculation result between re-renders in React?',
    marks: 3,
    explanation: 'useMemo returns a memoized value that only recalculates when its dependencies change.',
    difficulty: 'Hard',
    options: [
      { text: 'useCallback', is_correct: 0 },
      { text: 'useMemo', is_correct: 1 },
      { text: 'useRef', is_correct: 0 },
      { text: 'useImperativeHandle', is_correct: 0 }
    ]
  }
];

reactQuestions.forEach(q => {
  const qId = insertQuestion.run(q2, q.text, q.marks, q.explanation, q.difficulty).lastInsertRowid;
  q.options.forEach(opt => insertOption.run(qId, opt.text, opt.is_correct));
});

// Quiz 3: Python Questions
const pyQuestions = [
  {
    text: 'Which built-in Python function returns the number of items in a list or string?',
    marks: 2,
    explanation: 'len() returns the length of an object (sequence or collection).',
    difficulty: 'Easy',
    options: [
      { text: 'count()', is_correct: 0 },
      { text: 'size()', is_correct: 0 },
      { text: 'len()', is_correct: 1 },
      { text: 'length()', is_correct: 0 }
    ]
  },
  {
    text: 'Which symbol is used for single-line comments in Python?',
    marks: 2,
    explanation: '# is used to start single-line comments in Python.',
    difficulty: 'Easy',
    options: [
      { text: '//', is_correct: 0 },
      { text: '/*', is_correct: 0 },
      { text: '#', is_correct: 1 },
      { text: '--', is_correct: 0 }
    ]
  }
];

pyQuestions.forEach(q => {
  const qId = insertQuestion.run(q3, q.text, q.marks, q.explanation, q.difficulty).lastInsertRowid;
  q.options.forEach(opt => insertOption.run(qId, opt.text, opt.is_correct));
});

// Quiz 4: SQL Questions
const sqlQuestions = [
  {
    text: 'Which SQL clause is used to filter records after aggregation with GROUP BY?',
    marks: 2,
    explanation: 'HAVING was added to SQL because WHERE keyword could not be used with aggregate functions.',
    difficulty: 'Intermediate',
    options: [
      { text: 'WHERE', is_correct: 0 },
      { text: 'HAVING', is_correct: 1 },
      { text: 'ORDER BY', is_correct: 0 },
      { text: 'FILTER BY', is_correct: 0 }
    ]
  },
  {
    text: 'Which constraint ensures all values in a database column are distinct?',
    marks: 2,
    explanation: 'UNIQUE constraint ensures that all values in a column are different.',
    difficulty: 'Easy',
    options: [
      { text: 'PRIMARY KEY', is_correct: 0 },
      { text: 'FOREIGN KEY', is_correct: 0 },
      { text: 'UNIQUE', is_correct: 1 },
      { text: 'CHECK', is_correct: 0 }
    ]
  }
];

sqlQuestions.forEach(q => {
  const qId = insertQuestion.run(q4, q.text, q.marks, q.explanation, q.difficulty).lastInsertRowid;
  q.options.forEach(opt => insertOption.run(qId, opt.text, opt.is_correct));
});

console.log('✓ Questions and options seeded.');

// 5. Seed Sample Attempts for Leaderboard and Dashboard Analytics
const rahulId = db.prepare("SELECT id FROM users WHERE email = 'rahul@student.com'").get().id;
const priyaId = db.prepare("SELECT id FROM users WHERE email = 'priya@student.com'").get().id;
const amitId = db.prepare("SELECT id FROM users WHERE email = 'amit@student.com'").get().id;

const insertAttempt = db.prepare(`
  INSERT INTO attempts (quiz_id, user_id, score, total_marks, percentage, correct_answers, incorrect_answers, unanswered, total_questions, time_taken, status, started_at, completed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATETIME('now', '-2 days'), DATETIME('now', '-2 days'))
`);

insertAttempt.run(q1, rahulId, 8, 10, 80.0, 4, 1, 0, 5, 420, 'PASSED');
insertAttempt.run(q2, rahulId, 7, 7, 100.0, 3, 0, 0, 3, 510, 'PASSED');
insertAttempt.run(q1, priyaId, 10, 10, 100.0, 5, 0, 0, 5, 380, 'PASSED');
insertAttempt.run(q4, priyaId, 4, 4, 100.0, 2, 0, 0, 2, 290, 'PASSED');
insertAttempt.run(q1, amitId, 4, 10, 40.0, 2, 3, 0, 5, 600, 'FAILED');
insertAttempt.run(q3, amitId, 4, 4, 100.0, 2, 0, 0, 2, 180, 'PASSED');

console.log('✓ Sample quiz attempts seeded.');
console.log('=== SEEDING COMPLETED SUCCESSFULLY ===');
