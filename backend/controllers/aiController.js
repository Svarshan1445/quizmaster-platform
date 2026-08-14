const { GoogleGenerativeAI } = require('@google/generative-ai');

// Rich non-repeating fallback question generator calibrated to exact difficulty benchmarks
function generateFallbackQuestions(topic, count, difficulty, requestedType = 'MIXED') {
  const normTopic = (topic || 'Programming').trim();
  const list = [];
  const total = Math.min(Math.max(1, parseInt(count, 10) || 5), 50);

  const types = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'];
  const isPython = normTopic.toLowerCase().includes('python');
  const isJS = normTopic.toLowerCase().includes('javascript') || normTopic.toLowerCase().includes('js');

  // Benchmark 1: EASY (Basic arithmetic, simple variables, 1-line syntax)
  const easyQuestions = [
    {
      type: 'MCQ',
      text: `Which operator is used to perform addition in ${normTopic}?`,
      ans: `+ (Plus operator)`,
      distractors: [`* (Asterisk operator)`, `% (Modulo operator)`, `& (Bitwise AND)`],
      exp: `The '+' operator adds numerical values in ${normTopic}.`
    },
    {
      type: 'FILL_BLANK',
      text: `In ${normTopic}, the command/keyword used to output text to the console screen is _______.`,
      ans: isPython ? `print` : (isJS ? `console.log` : `print`),
      exp: `Outputting text to the console is done using ${isPython ? 'print()' : 'console.log()'}.`
    },
    {
      type: 'TRUE_FALSE',
      text: `In ${normTopic}, variables must be created before they can be used in expressions.`,
      isTrue: true,
      exp: `Variables store values in memory and must be assigned/declared prior to usage.`
    },
    {
      type: 'MCQ',
      text: `Which symbol is used for writing single-line comments in ${normTopic}?`,
      ans: isPython ? `# (Hash symbol)` : `// (Double forward slash)`,
      distractors: [`<!-- comment -->`, `$$ (Double dollar)`, `** (Double star)`],
      exp: `Comments allow documentation without executing code.`
    },
    {
      type: 'FILL_BLANK',
      text: `The data type used to store textual data surrounded by quotes in ${normTopic} is called _______.`,
      ans: `string`,
      exp: `Text enclosed in single or double quotes is a string data type.`
    }
  ];

  // Benchmark 2: INTERMEDIATE (String reversal logic, loops, string manipulation, conditionals)
  const intermediateQuestions = [
    {
      type: 'MCQ',
      text: `In ${normTopic}, what is the time complexity of reversing a string of length N using a loop?`,
      ans: `O(N) linear time`,
      distractors: [`O(1) constant time`, `O(N^2) quadratic time`, `O(log N) logarithmic time`],
      exp: `Iterating over N characters in a string takes O(N) linear time.`
    },
    {
      type: 'FILL_BLANK',
      text: `In ${normTopic}, the method/function used to convert all letters in a string to uppercase is _______.`,
      ans: isPython ? `upper` : `toUpperCase`,
      exp: `Converting strings to uppercase uses ${isPython ? '.upper()' : '.toUpperCase()'}.`
    },
    {
      type: 'TRUE_FALSE',
      text: `In ${normTopic}, strings are immutable, meaning modifying a string creates a new string in memory.`,
      isTrue: true,
      exp: `String operations return a new string instance rather than mutating the original in place.`
    },
    {
      type: 'MCQ',
      text: `How can you iterate through each element of an array/list in ${normTopic}?`,
      ans: `Using a for loop or for-each iterator`,
      distractors: [`Using a try-catch block`, `Using a class constructor`, `Using a database transaction`],
      exp: `Loops iterate sequentially through collection elements.`
    }
  ];

  // Benchmark 3: HARD (Find first character appearing only once, HashMaps, algorithm efficiency, optimization)
  const hardQuestions = [
    {
      type: 'MCQ',
      text: `What is the optimal time & space complexity for finding the first non-repeating character in a string of length N?`,
      ans: `O(N) Time complexity and O(K) Space complexity (where K is alphabet size)`,
      distractors: [`O(N^2) Time complexity with O(1) Space`, `O(log N) Time complexity with O(N) Space`, `O(N!) Time complexity with O(N) Space`],
      exp: `Using a hash table frequency map allows O(N) linear time pass with bounded alphabet space.`
    },
    {
      type: 'FILL_BLANK',
      text: `In algorithm design, the optimization technique of caching function evaluation results to avoid redundant recursive calls is called _______.`,
      ans: `memoization`,
      exp: `Memoization stores previous results in a hash table or array to turn exponential recursion into linear/polynomial time.`
    },
    {
      type: 'TRUE_FALSE',
      text: `A Hash Map lookup in ${normTopic} achieves O(1) average time complexity, but degrades to O(N) worst-case if all keys hash to the same bucket.`,
      isTrue: true,
      exp: `Hash collisions can degrade hash table lookups from O(1) average to O(N) linear time.`
    }
  ];

  let bank = difficulty === 'Easy' ? easyQuestions : (difficulty === 'Hard' ? hardQuestions : intermediateQuestions);
  const seenTexts = new Set();

  for (let i = 0; i < total; i++) {
    let qType = requestedType === 'MIXED' ? types[i % 3] : requestedType;
    let template = bank[i % bank.length];

    let qText = template.text;
    if (seenTexts.has(qText)) {
      qText = `${qText} (Variation #${Math.floor(i / bank.length) + 1})`;
    }
    seenTexts.add(qText);

    if (qType === 'TRUE_FALSE' || template.type === 'TRUE_FALSE') {
      const isT = template.isTrue !== undefined ? template.isTrue : (i % 2 === 0);
      list.push({
        question_text: qText,
        explanation: template.exp || `In ${normTopic}, this statement is ${isT ? 'True' : 'False'}.`,
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
        explanation: template.exp || `The correct keyword is "${template.ans}".`,
        difficulty,
        marks: 2,
        question_type: 'FILL_BLANK',
        options: [{ option_text: template.ans, is_correct: true }]
      });
    } else {
      // MCQ
      const correctOpt = template.ans;
      const distractors = template.distractors || [`Incorrect Option A`, `Incorrect Option B`, `Incorrect Option C`];
      const opts = [
        { option_text: correctOpt, is_correct: true },
        ...distractors.map(d => ({ option_text: d, is_correct: false }))
      ].sort(() => Math.random() - 0.5);

      list.push({
        question_text: qText,
        explanation: template.exp || `Explanation for ${normTopic} ${difficulty} question.`,
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
        Easy: `STRICT EASY LEVEL REQUIREMENTS (MUST BE ULTRA BASIC & BEGINNER):
- Target Audience: Absolute beginners
- BENCHMARK EASY MCQ EXAMPLES:
  * "Which operator is used for addition in Python?"
  * "What is the file extension for JavaScript source files?"
- BENCHMARK EASY FILL_BLANK EXAMPLES:
  * "The keyword used to define a function in JavaScript is _______."
- BENCHMARK EASY TRUE_FALSE EXAMPLES:
  * "Python is a case-sensitive programming language. (True/False)"
- MANDATE: NO complex loops, NO recursion, NO algorithms, NO data structure optimization. Every question MUST be super simple for beginners.`,

        Intermediate: `STRICT INTERMEDIATE LEVEL REQUIREMENTS (MUST REQUIRE MODERATE LOGIC & CONTROL FLOW):
- Target Audience: Developers with 1-2 years experience
- BENCHMARK INTERMEDIATE MCQ EXAMPLES:
  * "What is the output of [1, 2, 3].reduce((acc, curr) => acc + curr, 0)?"
  * "How does scope hoisting work with 'var' vs 'let'?"
- BENCHMARK INTERMEDIATE FILL_BLANK EXAMPLES:
  * "The method used to convert a JSON string into an object in JS is _______."
- BENCHMARK INTERMEDIATE TRUE_FALSE EXAMPLES:
  * "In Python, tuples are immutable while lists are mutable. (True/False)"
- MANDATE: Requires applied logic, string manipulation, loops, array methods, or standard function signatures.`,

        Hard: `STRICT HARD LEVEL REQUIREMENTS (MUST BE EXPERT ALGORITHMIC & COMPLEX PROBLEMS):
- Target Audience: Senior developers & computer science algorithms students
- BENCHMARK HARD MCQ EXAMPLES:
  * "What is the worst-case time complexity of QuickSort and how does randomized pivot selection prevent it?"
  * "Explain the Event Loop call stack vs microtask queue vs macrotask execution order."
- BENCHMARK HARD FILL_BLANK EXAMPLES:
  * "The optimization technique of caching function evaluation results to avoid redundant recursive calls is called _______."
- BENCHMARK HARD TRUE_FALSE EXAMPLES:
  * "A Hash Map lookup has an average time complexity of O(1) but degrades to O(N) worst-case under hash collisions. (True/False)"
- MANDATE: Must require algorithmic thinking, time/space complexity analysis (O(N) space/time), HashMaps/Dictionaries, recursion, or edge-case handling.`
      };

      const diffInstruction = difficultyGuidelines[difficulty] || difficultyGuidelines['Intermediate'];
      const randomSeed = `${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

      const prompt = `You are a senior computer science examiner generating an official assessment paper about "${topic}".

STRICT DIFFICULTY MANDATE:
All ${numCount} questions MUST BE EXACTLY AT THE ${difficulty.toUpperCase()} LEVEL.
Do NOT generate easy questions if ${difficulty.toUpperCase()} is requested!
Do NOT generate hard questions if EASY is requested!

FOLLOW THESE EXACT DIFFICULTY BENCHMARKS:
${diffInstruction}

EXACT QUESTION TYPE REQUESTED: ${questionType} (if MIXED, generate a balanced distribution of MCQ, TRUE_FALSE, and FILL_BLANK questions only. DO NOT generate coding questions).

STRICT ANTI-REPETITION MANDATE:
- Every question must test a COMPLETELY DIFFERENT concept.
- Do NOT repeat question phrasing or sentence structures.
- All ${numCount} questions must be 100% unique.
- Dynamic Random Seed: ${randomSeed}

${language !== 'English' ? `Write all questions in ${language}.` : ''}

RETURN ONLY A VALID JSON ARRAY (no markdown, no extra text):
[
  {
    "question_text": "Clear, distinct, non-repeating question text matching ${difficulty.toUpperCase()} level",
    "question_type": "MCQ", // MUST be "MCQ" or "TRUE_FALSE" or "FILL_BLANK" ONLY
    "explanation": "Detailed step-by-step explanation of the correct answer",
    "options": [
      { "option_text": "Option text", "is_correct": true }
    ]
  }
]

RULES FOR OPTIONS BY TYPE:
- MCQ: Exactly 4 options, exactly 1 option with "is_correct": true
- TRUE_FALSE: Exactly 2 options [ { "option_text": "True", "is_correct": boolean }, { "option_text": "False", "is_correct": boolean } ]
- FILL_BLANK: Exactly 1 option [ { "option_text": "Exact Answer Text", "is_correct": true } ]`;

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
            if (!normText || seen.has(normText)) continue;
            seen.add(normText);

            const type = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'].includes(q.question_type)
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
            } else if (type === 'FILL_BLANK' && opts.length < 1) {
              opts = [{ option_text: 'Answer', is_correct: true }];
            }

            validated.push({
              question_text: q.question_text,
              explanation: q.explanation || '',
              difficulty,
              marks: 2,
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
