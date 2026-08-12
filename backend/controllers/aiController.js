const { GoogleGenerativeAI } = require('@google/generative-ai');

function generateFallbackQuestions(topic, count, difficulty, requestedType = 'MIXED') {
  const normTopic = (topic || '').trim();
  const list = [];
  const total = Math.min(count, 20);

  const types = ['MCQ', 'TRUE_FALSE', 'FILL_BLANK'];

  for (let i = 0; i < total; i++) {
    let qType = requestedType;
    if (requestedType === 'MIXED') {
      qType = types[i % 3];
    }

    if (qType === 'TRUE_FALSE') {
      const isTrue = i % 2 === 0;
      list.push({
        question_text: `In ${normTopic}, statement #${i + 1} regarding syntax and behavior is standard core behavior.`,
        explanation: `In ${normTopic}, this statement is considered ${isTrue ? 'True' : 'False'} according to standard specifications.`,
        difficulty,
        marks: 2,
        question_type: 'TRUE_FALSE',
        options: [
          { option_text: 'True', is_correct: isTrue },
          { option_text: 'False', is_correct: !isTrue }
        ]
      });
    } else if (qType === 'FILL_BLANK') {
      const ans = `Concept_${i + 1}`;
      list.push({
        question_text: `In ${normTopic}, the primary keyword/method used for core execution is ______.`,
        explanation: `The correct answer is ${ans}.`,
        difficulty,
        marks: 2,
        question_type: 'FILL_BLANK',
        options: [
          { option_text: ans, is_correct: true }
        ]
      });
    } else {
      // MCQ
      const correctOpt = `Correct Option for ${normTopic} topic #${i + 1}`;
      const opts = [
        { option_text: correctOpt, is_correct: true },
        { option_text: `Incorrect Alternative A for ${normTopic}`, is_correct: false },
        { option_text: `Incorrect Alternative B for ${normTopic}`, is_correct: false },
        { option_text: `Incorrect Alternative C for ${normTopic}`, is_correct: false }
      ].sort(() => Math.random() - 0.5);

      list.push({
        question_text: `Which of the following is the accurate statement regarding ${normTopic} concept #${i + 1}?`,
        explanation: `Detailed explanation for ${normTopic} concept #${i + 1}.`,
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

  if (apiKey) {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `Generate exactly ${count} quiz questions about "${topic}" at ${difficulty} difficulty level.
Question Type Requested: ${questionType} (if MIXED, create a balanced mix of MCQ, TRUE_FALSE, and FILL_BLANK questions).
${language !== 'English' ? `Write the questions in ${language}.` : ''}

Return ONLY a valid JSON array with this exact structure (no markdown, no extra text):
[
  {
    "question_text": "Question text here?",
    "question_type": "MCQ", // MUST be "MCQ" or "TRUE_FALSE" or "FILL_BLANK"
    "explanation": "Brief explanation of the correct answer",
    "options": [
      { "option_text": "Option text", "is_correct": true }
    ]
  }
]

Rules for options by question_type:
- For "MCQ": Exactly 4 options, exactly 1 option has "is_correct": true
- For "TRUE_FALSE": Exactly 2 options [ { "option_text": "True", "is_correct": boolean }, { "option_text": "False", "is_correct": boolean } ]
- For "FILL_BLANK": Exactly 1 option [ { "option_text": "Exact Answer Text", "is_correct": true } ]
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
          const validated = questions.map((q, i) => {
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

            return {
              question_text: q.question_text || `Question ${i + 1}`,
              explanation: q.explanation || '',
              difficulty,
              marks: 2,
              question_type: type,
              options: opts
            };
          });

          return res.json({ questions: validated, count: validated.length });
        }
      }
    } catch (err) {
      console.error('Gemini API Error, switching to intelligent fallback generator:', err.message);
    }
  }

  // Guaranteed fallback generator if Gemini API fails or key is invalid
  const fallbackQuestions = generateFallbackQuestions(topic, count, difficulty, questionType);
  return res.json({ questions: fallbackQuestions, count: fallbackQuestions.length, fallback: true });
};

module.exports = { generateQuestions };
