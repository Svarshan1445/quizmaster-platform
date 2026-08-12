const { GoogleGenerativeAI } = require('@google/generative-ai');

// Built-in intelligent topic templates for instant guaranteed fallback
const TOPIC_TEMPLATES = {
  javascript: [
    { q: "What is the result of typeof NaN in JavaScript?", options: ["number", "undefined", "object", "string"], correct: 0, exp: "In JavaScript, NaN is a numeric value representing Not-a-Number, so typeof NaN is 'number'." },
    { q: "Which keyword is used to declare a block-scoped variable in JavaScript?", options: ["let", "var", "global", "def"], correct: 0, exp: "'let' and 'const' declare block-scoped variables, whereas 'var' is function-scoped." },
    { q: "What does Array.prototype.map() return?", options: ["A new array with modified elements", "The original array modified", "A boolean value", "An integer length"], correct: 0, exp: "map() creates a new array populated with the results of calling a provided function on every element." },
    { q: "What is the closure in JavaScript?", options: ["A function bundled with references to its surrounding state", "A method to close browser windows", "A tool for memory garbage collection", "A type of loop"], correct: 0, exp: "A closure gives you access to an outer function's scope from an inner function." },
    { q: "Which operator checks both value and type equality in JavaScript?", options: ["===", "==", "=", "!="], correct: 0, exp: "=== is the strict equality operator that compares both value and data type." },
    { q: "What will Promise.all() do if one of the input promises rejects?", options: ["Immediately reject with that error", "Wait for all to finish anyway", "Return null", "Ignore the rejected promise"], correct: 0, exp: "Promise.all rejects immediately upon any of the input promises rejecting." },
    { q: "What is event bubbling in the DOM?", options: ["Event propagates from target element up to parent nodes", "Event propagates from top window down to target", "Event triggers multiple times automatically", "Event cancels itself"], correct: 0, exp: "Event bubbling moves up the DOM tree from the target element to ancestors." },
    { q: "Which method converts a JSON string into a JavaScript object?", options: ["JSON.parse()", "JSON.stringify()", "JSON.toObject()", "JSON.convert()"], correct: 0, exp: "JSON.parse() parses a JSON string and constructs the JavaScript value or object." }
  ],
  java: [
    { q: "Which keyword is used to prevent method overriding in Java?", options: ["final", "static", "abstract", "protected"], correct: 0, exp: "Declaring a method as 'final' prevents it from being overridden by subclasses." },
    { q: "What is the root class of the Java class hierarchy?", options: ["java.lang.Object", "java.lang.Class", "java.util.Root", "java.lang.System"], correct: 0, exp: "Every class in Java directly or indirectly inherits from java.lang.Object." },
    { q: "Which memory area in Java storing objects is managed by Garbage Collector?", options: ["Heap Memory", "Stack Memory", "Method Area", "Program Counter Register"], correct: 0, exp: "All instantiated objects in Java reside in the Heap memory." },
    { q: "What is the default value of a boolean variable in Java class?", options: ["false", "true", "null", "0"], correct: 0, exp: "Uninitialized instance boolean variables default to false." },
    { q: "Which collection interface allows duplicate elements and maintains insertion order?", options: ["List", "Set", "Map", "Queue"], correct: 0, exp: "List interface maintains ordered collections and permits duplicate values." },
    { q: "What is method overloading in Java?", options: ["Same method name with different parameters in same class", "Redefining superclass method in subclass", "Deleting a method at runtime", "Creating static methods"], correct: 0, exp: "Overloading occurs when multiple methods in the same class share the same name with distinct parameter signatures." }
  ],
  python: [
    { q: "Which data structure in Python is immutable?", options: ["Tuple", "List", "Dictionary", "Set"], correct: 0, exp: "Tuples cannot be altered after creation, making them immutable." },
    { q: "What is the output of print(2 ** 3) in Python?", options: ["8", "6", "9", "5"], correct: 0, exp: "** is the exponentiation operator in Python, 2^3 = 8." },
    { q: "Which keyword is used to define a function in Python?", options: ["def", "function", "func", "define"], correct: 0, exp: "'def' is used to define user-defined functions in Python." },
    { q: "What does the list comprehension [x for x in range(5) if x % 2 == 0] produce?", options: ["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "[2, 4]"], correct: 0, exp: "It filters even numbers from range(5): 0, 2, and 4." }
  ]
};

function generateFallbackQuestions(topic, count, difficulty) {
  const normTopic = (topic || '').toLowerCase().trim();
  let baseQuestions = [];

  for (const key of Object.keys(TOPIC_TEMPLATES)) {
    if (normTopic.includes(key)) {
      baseQuestions = TOPIC_TEMPLATES[key];
      break;
    }
  }

  // If topic is generic, build contextual questions dynamically
  const list = [];
  const total = Math.min(count, 20);

  for (let i = 0; i < total; i++) {
    if (baseQuestions[i]) {
      const b = baseQuestions[i];
      const opts = b.options.map((optText, idx) => ({
        option_text: optText,
        is_correct: idx === b.correct
      }));
      list.push({
        question_text: b.q,
        explanation: b.exp,
        difficulty,
        marks: 2,
        question_type: 'MCQ',
        options: opts
      });
    } else {
      // Dynamic topic template generator
      const correctText = `Core principle ${i + 1} of ${topic}`;
      const opts = [
        { option_text: correctText, is_correct: true },
        { option_text: `Deprecated method ${i + 1} in ${topic}`, is_correct: false },
        { option_text: `Unrelated syntax pattern in ${topic}`, is_correct: false },
        { option_text: `Syntax error in ${topic} definition`, is_correct: false }
      ];
      // Shuffle option order
      const shuffledOpts = opts.sort(() => Math.random() - 0.5);

      list.push({
        question_text: `Which statement accurately describes fundamental concept #${i + 1} in ${topic}?`,
        explanation: `In ${topic}, this concept is a core requirement for proper execution and performance.`,
        difficulty,
        marks: 2,
        question_type: 'MCQ',
        options: shuffledOpts
      });
    }
  }
  return list;
}

const generateQuestions = async (req, res) => {
  const { topic, count = 5, difficulty = 'Intermediate', language = 'English' } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Generate exactly ${count} multiple choice questions (MCQ) about "${topic}" at ${difficulty} difficulty level.
${language !== 'English' ? `Write the questions in ${language}.` : ''}

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question_text": "Question here?",
    "explanation": "Brief explanation of the correct answer",
    "options": [
      { "option_text": "Correct answer", "is_correct": true },
      { "option_text": "Wrong answer 1", "is_correct": false },
      { "option_text": "Wrong answer 2", "is_correct": false },
      { "option_text": "Wrong answer 3", "is_correct": false }
    ]
  }
]

Rules:
- Exactly 4 options per question
- Exactly 1 correct answer per question
- Questions must be clear and unambiguous
- Vary the position of the correct answer randomly
- Return ONLY the JSON array, nothing else`;

      const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
      let result;

      for (const modelName of modelNames) {
        try {
          const model = genAI.getGenerativeModel({ model: modelName });
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
          const questions = JSON.parse(jsonMatch[0]);
          const validated = questions.map((q, i) => ({
            question_text: q.question_text || `Question ${i + 1}`,
            explanation: q.explanation || '',
            difficulty,
            marks: 2,
            question_type: 'MCQ',
            options: (q.options || []).map(opt => ({
              option_text: opt.option_text || '',
              is_correct: opt.is_correct === true
            }))
          }));

          return res.json({ questions: validated, count: validated.length });
        }
      }
    } catch (err) {
      console.error('Gemini API Error, switching to intelligent fallback generator:', err.message);
    }
  }

  // Guaranteed fallback generator if Gemini API fails or key is invalid
  const fallbackQuestions = generateFallbackQuestions(topic, count, difficulty);
  return res.json({ questions: fallbackQuestions, count: fallbackQuestions.length, fallback: true });
};

module.exports = { generateQuestions };
