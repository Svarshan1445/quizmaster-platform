const { GoogleGenerativeAI } = require('@google/generative-ai');

const generateQuestions = async (req, res) => {
  try {
    const { topic, count = 5, difficulty = 'Intermediate', language = 'English' } = req.body;

    if (!topic) {
      return res.status(400).json({ message: 'Topic is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    let result;
    const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(prompt);
        if (result && result.response) break;
      } catch (err) {
        lastError = err;
        console.warn(`Model ${modelName} failed, trying next model:`, err.message);
      }
    }

    if (!result || !result.response) {
      throw lastError || new Error('All Gemini model generation attempts failed.');
    }

    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return res.status(500).json({ message: 'Failed to parse AI response. Please try again.' });
    }

    const questions = JSON.parse(jsonMatch[0]);

    // Validate structure
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

    res.json({ questions: validated, count: validated.length });
  } catch (err) {
    console.error('AI Generate Error:', err);
    res.status(500).json({ message: 'AI generation failed. Please try again.' });
  }
};

module.exports = { generateQuestions };
