const OpenAI = require('openai');

const apiKey = process.env.GROK_API_KEY || process.env.OPENAI_API_KEY;
const client = apiKey ? new OpenAI({ apiKey }) : null;

const buildPrompt = ({ platform, language, difficulty, interviewType, profile, count }) => {
  const profileParts = [];
  if (profile.skills) profileParts.push(`Skills: ${profile.skills}`);
  if (profile.education) profileParts.push(`Education: ${profile.education}`);
  if (profile.projects) profileParts.push(`Projects: ${profile.projects}`);
  if (profile.experience) profileParts.push(`Experience: ${profile.experience}`);
  if (profile.certifications) profileParts.push(`Certifications: ${profile.certifications}`);
  if (profile.summary) profileParts.push(`Summary: ${profile.summary}`);

  return `You are an AI interviewer that generates personalized interview questions for the candidate.
Candidate background:
- Platform: ${platform}
- Language: ${language}
- Difficulty: ${difficulty}
- Interview Type: ${interviewType}
${profileParts.length ? `Resume details:\n${profileParts.join('\n')}` : ''}

Use the candidate's resume details to tailor the questions. Focus on skills, projects, experience, certifications, and education wherever possible.

Create ${count} unique interview questions. Use a mix of technical and conceptual language. If the interview type is HR, include soft-skill or fit questions. Do not include answers. Return the questions as a JSON array of strings only.
`;
};

const parseAiResponse = (text) => {
  try {
    const jsonStart = text.indexOf('[');
    if (jsonStart >= 0) {
      const jsonText = text.slice(jsonStart);
      const parsed = JSON.parse(jsonText);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (error) {
    // fall back to line splitting
  }

  return text
    .split(/\n+/)
    .map((line) => line.replace(/^\d+\.?\s*/, '').trim())
    .filter((line) => line.length > 0);
};

const generateFallbackQuestions = ({ platform, language, difficulty, interviewType, profile, count }) => {
  const templates = [
    `Describe a common challenge faced by ${platform} candidates working with ${language}.`,
    `Explain how ${language} is used in ${platform} projects and why it matters.`,
    `What are the key differences between beginner and advanced ${language} work in a ${platform} role?`,
    `How would you approach debugging a ${language} issue in a ${platform} codebase?`,
    `Describe how ${platform} best practices change when using ${language}.`
  ];

  return Array.from({ length: count }, (_, index) => {
    const base = templates[index % templates.length];
    const difficultyText = difficulty === 'Hard'
      ? 'Give a detailed response showing deeper understanding.'
      : difficulty === 'Medium'
      ? 'Explain with moderate depth and examples.'
      : 'Keep the answer simple and practical.';

    return {
      id: `fallback-${Date.now()}-${index + 1}`,
      question: `${base} ${difficultyText}`,
      source: 'fallback'
    };
  });
};

async function generateGrokQuestions({ platform, language, difficulty, interviewType, profile, count }) {
  if (!count || count < 1) return [];

  const prompt = buildPrompt({ platform, language, difficulty, interviewType, profile, count });

  if (!client) {
    console.warn('No Grok/OpenAI API key configured; using fallback question generator.');
    return generateFallbackQuestions({ platform, language, difficulty, interviewType, profile, count });
  }

  try {
    const response = await client.responses.create({
      model: 'grok-1.5',
      input: prompt,
      max_output_tokens: 400,
      temperature: 0.8
    });

    const text = response.output?.[0]?.content?.find((item) => item.type === 'output_text')?.text || '';
    const questions = parseAiResponse(text).slice(0, count);

    if (questions.length === 0) {
      return generateFallbackQuestions({ platform, language, difficulty, interviewType, profile, count });
    }

    return questions.map((question, index) => ({ id: `grok-${Date.now()}-${index + 1}`, question, source: 'grok' }));
  } catch (error) {
    console.error('Grok generation failed:', error.message || error);
    return generateFallbackQuestions({ platform, language, difficulty, interviewType, profile, count });
  }
}

module.exports = { generateGrokQuestions };
