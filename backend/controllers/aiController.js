const { GoogleGenerativeAI } = require('@google/generative-ai');

// Rich non-repeating fallback question generator
function generateFallbackQuestions(topic, count, difficulty, requestedType = 'MIXED') {
  const normTopic = (topic || 'Programming').trim();
  const list = [];
  const total = Math.min(Math.max(1, parseInt(count, 10) || 5), 50);

  const types = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'CODING'];

  const easyQuestions = [
    { type: 'MCQ', text: `What is the primary usage of ${normTopic}?`, ans: `Core functionality of ${normTopic}`, distractors: [`Unrelated graphics rendering`, `Hardware CPU overclocking`, `Database backup storage`] },
    { type: 'TRUE_FALSE', text: `In ${normTopic}, basic syntax must be followed for successful execution.`, isTrue: true },
    { type: 'FILL_BLANK', text: `The basic command or keyword in ${normTopic} to output text is _______.`, ans: normTopic.toLowerCase().includes('python') ? 'print' : 'console.log' },
    { type: 'CODING', text: `Write a simple line of code in ${normTopic} to print "Hello World".`, ans: normTopic.toLowerCase().includes('python') ? 'print("Hello World")' : 'console.log("Hello World");' },
    { type: 'MCQ', text: `Which symbol or format is commonly used in ${normTopic} for comments?`, ans: normTopic.toLowerCase().includes('python') ? '# (hash)' : '// (double slash)', distractors: ['$$', '<comment>', '@@'] },
    { type: 'TRUE_FALSE', text: `Variables in ${normTopic} store values in memory for later use.`, isTrue: true },
    { type: 'FILL_BLANK', text: `In ${normTopic}, a block of reusable code is called a _______.`, ans: 'function' }
  ];

  const intermediateQuestions = [
    { type: 'MCQ', text: `How does scope management work in ${normTopic}?`, ans: `Controls variable visibility within execution contexts`, distractors: [`Deletes files from hard drive`, `Enforces network encryption`, `Restarts CPU threads`] },
    { type: 'TRUE_FALSE', text: `In ${normTopic}, asynchronous operations run without blocking the main event thread.`, isTrue: true },
    { type: 'FILL_BLANK', text: `The method used to loop through items in an array/list in ${normTopic} is _______.`, ans: normTopic.toLowerCase().includes('python') ? 'for' : 'map' },
    { type: 'CODING', text: `Write code in ${normTopic} to check if a number x is even (divisible by 2).`, ans: normTopic.toLowerCase().includes('python') ? 'x % 2 == 0' : 'x % 2 === 0' },
    { type: 'MCQ', text: `What is the output of standard conditional logic when checking equality in ${normTopic}?`, ans: `Boolean result (True or False)`, distractors: [`String error message`, `Null pointer exception`, `Floating point array`] }
  ];

  const hardQuestions = [
    { type: 'MCQ', text: `What is the time complexity and memory overhead of deep operations in ${normTopic}?`, ans: `O(N) time with stack frame allocation`, distractors: [`O(1) instant time without memory`, `O(N^3) cubic slowdown`, `O(2^N) exponential lockout`] },
    { type: 'TRUE_FALSE', text: `In ${normTopic}, closure or inner functions retain references to outer scope variables even after execution finishes.`, isTrue: true },
    { type: 'FILL_BLANK', text: `In advanced ${normTopic}, the technique of optimizing recursive calls by caching intermediate results is called _______.`, ans: 'memoization' },
    { type: 'CODING', text: `Write a recursive function or expression in ${normTopic} to calculate factorial of n.`, ans: normTopic.toLowerCase().includes('python') ? 'def fact(n):\n    return 1 if n <= 1 else n * fact(n - 1)' : 'const fact = n => n <= 1 ? 1 : n * fact(n - 1);' },
    { type: 'MCQ', text: `Which concurrency or memory optimization pattern is recommended for high-load ${normTopic} systems?`, ans: `Event-driven non-blocking I/O or pool workers`, distractors: [`Blocking synchronous lock`, `Infinite spin-lock loop`, `Manual garbage deletion`] }
  ];

  let bank = difficulty === 'Easy' ? easyQuestions : difficulty === 'Hard' ? hardQuestions : intermediateQuestions;

  const seenTexts = new Set();

  for (let i = 0; i < total; i++) {
    let qType = requestedType === 'MIXED' ? types[i % 4] : requestedType;
    let template = bank[i % bank.length];

    // Guarantee unique question text by appending variation index if repeated
    let qText = template.text;
    if (seenTexts.has(qText)) {
      qText = `${qText} (Variation #${Math.floor(i / bank.length) + 1})`;
    }
    seenTexts.add(qText);

    if (qType === 'CODING' || template.type === 'CODING') {
      list.push({
        question_text: qText,
        explanation: `Expected code solution or pattern for ${normTopic} (${difficulty} difficulty).`,
        difficulty,
        marks: 3,
        question_type: 'CODING',
        options: [{ option_text: template.ans || `console.log("${normTopic}");`, is_correct: true }]
      });
    } else if (qType === 'TRUE_FALSE' || template.type === 'TRUE_FALSE') {
      const isT = template.isTrue !== undefined ? template.isTrue : (i % 2 === 0);
      list.push({
        question_text: qText,
        explanation: `In ${normTopic}, this statement is ${isT ? 'True' : 'False'}.`,
        difficulty,
        marks: 2,
        question_type: 'TRUE_FALSE',
        options: [
          { option_text: 'True', is_correct: isT },
          { option_text: 'False', is_correct: !isT }
        ]
      });
    } else if (qType === 'FILL_BLANK' || template.type === 'FILL_BLANK') {
      list.push({
        question_text: qText,
        explanation: `The exact keyword answer is "${template.ans}".`,
        difficulty,
        marks: 2,
        question_type: 'FILL_BLANK',
        options: [{ option_text: template.ans || 'function', is_correct: true }]
      });
    } else {
      // MCQ
      const correctOpt = template.ans || `Standard feature of ${normTopic}`;
      const distractors = template.distractors || [`Incorrect Option A`, `Incorrect Option B`, `Incorrect Option C`];
      const opts = [
        { option_text: correctOpt, is_correct: true },
        ...distractors.map(d => ({ option_text: d, is_correct: false }))
      ].sort(() => Math.random() - 0.5);

      list.push({
        question_text: qText,
        explanation: `Detailed explanation for ${normTopic} ${difficulty} level concept.`,
        difficulty,
        marks: 2,
        question_type: 'MCQ',
        options: opts
      });
    }
  }

  return list;
}

const generateQuestions = async (req, res) => {
  const { topic, count = 5, difficulty = 'Intermediate', questionType = 'MIXED', language = 'English' } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const numCount = Math.min(Math.max(1, parseInt(count, 10) || 5), 50);

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);

      const difficultyGuidelines = {
        Easy: `STRICT EASY LEVEL REQUIREMENTS:
- Target Audience: Absolute beginners
- Vocabulary: Basic, plain English, no complex terminology
- Concepts: Fundamental definitions, 1-line syntax, basic usage
- MCQ Distractors: Simple and easily distinguishable
- CODING questions: Extremely basic 1-liner code (e.g., print statement, basic variable assignment)
- EXAMPLE EASY QUESTION: "What keyword is used to declare a function in JavaScript?" or "Write code to print 'Hello World' in Python."`,

        Intermediate: `STRICT INTERMEDIATE LEVEL REQUIREMENTS:
- Target Audience: Developers with 1-2 years experience
- Vocabulary: Standard technical terminology
- Concepts: Applied understanding, scope, array methods, conditional loops, error handling
- MCQ Distractors: Plausible options requiring careful reading
- CODING questions: Multi-step logic, loops, conditional statements, or array manipulation
- EXAMPLE INTERMEDIATE QUESTION: "How does closure work in JavaScript?" or "Write a function to filter even numbers from an array."`,

        Hard: `STRICT HARD LEVEL REQUIREMENTS:
- Target Audience: Senior developers & architects
- Vocabulary: Advanced technical terms, performance, time/space complexity, memory model
- Concepts: Edge cases, asynchronous race conditions, memory leaks, algorithm optimization, deep OOP/FP concepts
- MCQ Distractors: Subtle, highly realistic options where only one is 100% correct
- CODING questions: Algorithmic problems, recursion, data structure implementation, or complex logic
- EXAMPLE HARD QUESTION: "What is the worst-case time complexity of QuickSort and how can it be avoided?" or "Write a recursive function for memoized Fibonacci."`
      };

      const diffInstruction = difficultyGuidelines[difficulty] || difficultyGuidelines['Intermediate'];
      const randomSeed = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      const prompt = `You are an expert examiner creating an official assessment quiz.

CRITICAL INSTRUCTIONS:
1. TOPIC: "${topic}"
2. REQUIRED DIFFICULTY: ${difficulty.toUpperCase()}
3. NUMBER OF QUESTIONS: ${numCount}
4. QUESTION TYPE: ${questionType} (if MIXED, create a balanced mix of MCQ, TRUE_FALSE, FILL_BLANK, and CODING)
5. RANDOM SEED FOR DIVERSITY: ${randomSeed}

DIFFICULTY RULES (MUST BE FOLLOWED STRICTLY):
${diffInstruction}

ANTI-REPETITION RULES (VERY IMPORTANT):
- DO NOT repeat any question. Every single question must test a COMPLETELY DIFFERENT concept.
- DO NOT repeat question phrasing or templates.
- Ensure all ${numCount} questions are 100% unique.

${language !== 'English' ? `Write all questions in ${language}.` : ''}

RETURN ONLY A VALID JSON ARRAY (no markdown fences, no extra text):
[
  {
    "question_text": "Unique, non-repeating question text here",
    "question_type": "MCQ", // MUST be "MCQ" or "TRUE_FALSE" or "FILL_BLANK" or "CODING"
    "explanation": "Clear explanation of why the correct answer is right",
    "options": [
      { "option_text": "Option text", "is_correct": true }
    ]
  }
]

RULES FOR OPTIONS BY TYPE:
- MCQ: Exactly 4 options, exactly 1 option with "is_correct": true
- TRUE_FALSE: Exactly 2 options [ { "option_text": "True", "is_correct": boolean }, { "option_text": "False", "is_correct": boolean } ]
- FILL_BLANK: Exactly 1 option [ { "option_text": "Exact Answer Text", "is_correct": true } ]
- CODING: Exactly 1 option [ { "option_text": "Expected Code Solution or Output", "is_correct": true } ]`;

      const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let result;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { temperature: 0.95, topP: 0.95 }
          });
          result = await model.generateContent(prompt);
          if (result && result.response) break;
        } catch (err) {
          console.warn(`Model ${modelName} failed:`, err.message);
        }
      }

      if (result && result.response) {
        const text = result.response.text().trim();
        const jsonMatch = text.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          const rawQuestions = JSON.parse(jsonMatch[0]);
          
          // Anti-repetition & Validation filter
          const seen = new Set();
          const validated = [];

          for (const q of rawQuestions) {
            const normText = (q.question_text || '').toLowerCase().replace(/\s+/g, ' ').trim();
            if (!normText || seen.has(normText)) continue; // Skip duplicates!
            seen.add(normText);

            const type = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'CODING'].includes(q.question_type)
              ? q.question_type
              : 'MCQ';

            let opts = (q.options || []).map(opt => ({
              option_text: opt.option_text || '',
              is_correct: opt.is_correct === true
            }));

            if (type === 'TRUE_FALSE' && opts.length < 2) {
              opts = [
                { option_text: 'True', is_correct: true },
                { option_text: 'False', is_correct: false }
              ];
            } else if ((type === 'FILL_BLANK' || type === 'CODING') && opts.length < 1) {
              opts = [{ option_text: 'Answer', is_correct: true }];
            }

            validated.push({
              question_text: q.question_text,
              explanation: q.explanation || '',
              difficulty,
              marks: type === 'CODING' ? 3 : 2,
              question_type: type,
              options: opts
            });
          }

          if (validated.length > 0) {
            return res.json({ questions: validated, count: validated.length });
          }
        }
      }
    } catch (err) {
      console.error('Gemini API error, switching to fallback generator:', err.message);
    }
  }

  // Guaranteed fallback generator if Gemini API key is missing or failed
  const fallbackQuestions = generateFallbackQuestions(topic, numCount, difficulty, questionType);
  return res.json({ questions: fallbackQuestions, count: fallbackQuestions.length, fallback: true });
};

module.exports = { generateQuestions };
