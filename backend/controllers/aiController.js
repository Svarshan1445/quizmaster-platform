const { GoogleGenerativeAI } = require('@google/generative-ai');

// Rich non-repeating fallback question generator calibrated to exact difficulty benchmarks
function generateFallbackQuestions(topic, count, difficulty, requestedType = 'MIXED') {
  const normTopic = (topic || 'Programming').trim();
  const list = [];
  const total = Math.min(Math.max(1, parseInt(count, 10) || 5), 50);

  const types = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK', 'CODING'];
  const isPython = normTopic.toLowerCase().includes('python');
  const isJS = normTopic.toLowerCase().includes('javascript') || normTopic.toLowerCase().includes('js');

  // Benchmark 1: EASY (Basic arithmetic, simple variables, 1-line syntax)
  const easyQuestions = [
    {
      type: 'CODING',
      text: `Write a ${normTopic} program to add two numbers 'a' and 'b' and return their sum.`,
      ans: isPython ? `a = 5\nb = 10\nprint(a + b)` : `function add(a, b) {\n  return a + b;\n}`,
      exp: `Addition in ${normTopic} uses the '+' arithmetic operator to sum numbers.`
    },
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
      type: 'CODING',
      text: `Write a code snippet in ${normTopic} to check if a number 'num' is positive (greater than 0).`,
      ans: isPython ? `if num > 0:\n    print("Positive")` : `if (num > 0) {\n  console.log("Positive");\n}`,
      exp: `Simple conditional 'if' statement checks if 'num > 0'.`
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

  // Benchmark 2: INTERMEDIATE (String reversal without [::-1], loops, string manipulation, conditionals)
  const intermediateQuestions = [
    {
      type: 'CODING',
      text: `Write a ${normTopic} program to reverse a string without using the built-in shortcut [::-1].`,
      ans: isPython 
        ? `def reverse_string(s):\n    rev = ""\n    for char in s:\n        rev = char + rev\n    return rev`
        : `function reverseString(str) {\n  let rev = "";\n  for (let i = str.length - 1; i >= 0; i--) {\n    rev += str[i];\n  }\n  return rev;\n}`,
      exp: `Reversing a string manually requires iterating backward or accumulating characters in reverse loop.`
    },
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
      type: 'CODING',
      text: `Write a function in ${normTopic} to check whether a string 's' is a palindrome (reads same forward and backward).`,
      ans: isPython
        ? `def is_palindrome(s):\n    clean = s.lower()\n    return clean == clean[::-1]`
        : `function isPalindrome(s) {\n  const clean = s.toLowerCase();\n  return clean === clean.split("").reverse().join("");\n}`,
      exp: `A palindrome remains identical when reversed.`
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
      type: 'CODING',
      text: `Given a string in ${normTopic}, find the first character that appears only once (first non-repeating character).`,
      ans: isPython
        ? `def first_unique_char(s):\n    counts = {}\n    for char in s:\n        counts[char] = counts.get(char, 0) + 1\n    for char in s:\n        if counts[char] == 1:\n            return char\n    return None`
        : `function firstUniqueChar(s) {\n  const counts = {};\n  for (let char of s) {\n    counts[char] = (counts[char] || 0) + 1;\n  }\n  for (let char of s) {\n    if (counts[char] === 1) return char;\n  }\n  return null;\n}`,
      exp: `Finding the first non-repeating character requires building a frequency map in O(N) time and a second pass to find count === 1.`
    },
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
    },
    {
      type: 'CODING',
      text: `Write an efficient function in ${normTopic} to find the length of the longest substring without repeating characters.`,
      ans: isPython
        ? `def length_of_longest_substring(s):\n    char_map = {}\n    max_len = start = 0\n    for i, char in enumerate(s):\n        if char in char_map and char_map[char] >= start:\n            start = char_map[char] + 1\n        char_map[char] = i\n        max_len = max(max_len, i - start + 1)\n    return max_len`
        : `function lengthOfLongestSubstring(s) {\n  let charMap = {}, maxLen = 0, start = 0;\n  for (let i = 0; i < s.length; i++) {\n    const char = s[i];\n    if (charMap[char] >= start) start = charMap[char] + 1;\n    charMap[char] = i;\n    maxLen = Math.max(maxLen, i - start + 1);\n  }\n  return maxLen;\n}`,
      exp: `The sliding window technique with a hash map tracks character indices in O(N) linear time.`
    }
  ];

  let bank = difficulty === 'Easy' ? easyQuestions : (difficulty === 'Hard' ? hardQuestions : intermediateQuestions);
  const seenTexts = new Set();

  for (let i = 0; i < total; i++) {
    let qType = requestedType === 'MIXED' ? types[i % 4] : requestedType;
    let template = bank[i % bank.length];

    let qText = template.text;
    if (seenTexts.has(qText)) {
      qText = `${qText} (Variation #${Math.floor(i / bank.length) + 1})`;
    }
    seenTexts.add(qText);

    if (qType === 'CODING' || template.type === 'CODING') {
      list.push({
        question_text: qText,
        explanation: template.exp || `Expected code solution for ${normTopic} (${difficulty} level).`,
        difficulty,
        marks: 3,
        question_type: 'CODING',
        options: [{ option_text: template.ans, is_correct: true }]
      });
    } else if (qType === 'TRUE_FALSE' || template.type === 'TRUE_FALSE') {
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
- BENCHMARK EASY CODING EXAMPLES:
  * "Write a program to add two numbers 'a' and 'b' and print their sum."
  * "Write a program to check if a number is positive or negative."
  * "Write code to calculate the area of a rectangle given length and width."
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
- BENCHMARK INTERMEDIATE CODING EXAMPLES:
  * "Write a Python program to reverse a string without using [::-1]."
  * "Write a function to check if a string is a palindrome."
  * "Write code to find the second largest number in an array."
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
- BENCHMARK HARD CODING EXAMPLES:
  * "Given a string, find the first character that appears only once (first non-repeating character)."
  * "Write an efficient function to find the length of the longest substring without repeating characters."
  * "Implement a binary search algorithm on a sorted array in O(log N) time."
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

EXACT QUESTION TYPE REQUESTED: ${questionType} (if MIXED, generate a balanced distribution of MCQ, TRUE_FALSE, FILL_BLANK, and CODING programming questions).

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
    "question_type": "MCQ", // MUST be "MCQ" or "TRUE_FALSE" or "FILL_BLANK" or "CODING"
    "explanation": "Detailed step-by-step explanation of the correct answer",
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
            if (!normText || seen.has(normText)) continue;
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
