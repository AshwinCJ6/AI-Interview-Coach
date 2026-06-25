const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateGrokQuestions } = require('../services/aiService');

const router = express.Router();

const parseKeywords = (text) => {
  if (!text) return [];
  return text
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 5);
};

router.post('/setup', authenticateToken, async (req, res) => {
  const { platform, language, difficulty, questionCount, interviewType } = req.body;
  if (!platform || !language || !difficulty || !questionCount || !interviewType) {
    return res.status(400).json({ message: 'All interview setup fields are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO interview_configs (user_id, platform, language, difficulty, question_count, interview_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, platform, language, difficulty, questionCount, interviewType]
    );
    return res.status(201).json({ message: 'Interview setup saved.', configId: result.insertId });
  } catch (error) {
    console.error('Setup save error:', error);
    return res.status(500).json({ message: 'Unable to save interview setup.' });
  }
});

router.post('/generate', authenticateToken, async (req, res) => {
  const { platform, language, difficulty, questionCount, interviewType } = req.body;
  if (!platform || !language || !difficulty || !questionCount) {
    return res.status(400).json({ message: 'Platform, language, difficulty, and questionCount are required.' });
  }

  try {
    const wantedCount = Number(questionCount);
    const dbLimit = Math.max(1, Math.ceil(wantedCount / 2));

    const [rows] = await pool.query(
      `SELECT id, question_text FROM questions
       WHERE platform = ? AND language = ? AND difficulty = ?
       LIMIT ?`,
      [platform, language, difficulty, dbLimit]
    );

    const [profileRows] = await pool.query(
      'SELECT skills, education, projects, experience, certifications, summary FROM student_profiles WHERE student_id = ?',
      [req.user.id]
    );
    const profile = profileRows[0] || {};

    const databaseQuestions = rows.map((row) => ({ id: row.id, question: row.question_text, source: 'database' }));
    const aiCount = Math.max(0, wantedCount - databaseQuestions.length);
    const aiQuestions = await generateGrokQuestions({
      platform,
      language,
      difficulty,
      interviewType: interviewType || 'Technical',
      profile,
      count: aiCount
    });

    const questions = [...databaseQuestions, ...aiQuestions].slice(0, wantedCount);
    return res.json({ questions });
  } catch (error) {
    console.error('Generate questions error:', error);
    const errorMessage = error?.response?.data?.error?.message || error?.message || 'Unable to generate questions.';
    return res.status(500).json({ message: errorMessage });
  }
});

module.exports = router;
