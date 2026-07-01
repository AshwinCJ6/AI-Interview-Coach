const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

const platforms = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Java Developer',
  'Python Developer',
  'React Developer',
  'Node.js Developer',
  'AI Engineer',
  'Data Scientist',
  'HR Interview'
];

const languages = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'C',
  'C++',
  'SQL',
  'React',
  'Node.js'
];

const difficulties = ['Easy', 'Medium', 'Hard'];
const questionTypes = ['Objective', 'Subjective', 'Coding', 'Scenario Based'];

// ─── GET /api/questions ───────────────────────────────────────────────────
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { platform, language, difficulty, category, question_type, search } = req.query;
  const conditions = [];
  const values = [];

  if (platform) { conditions.push('platform = ?'); values.push(platform); }
  if (language) { conditions.push('language = ?'); values.push(language); }
  if (difficulty) { conditions.push('difficulty = ?'); values.push(difficulty); }
  if (category) { conditions.push('category = ?'); values.push(category); }
  if (question_type) { conditions.push('question_type = ?'); values.push(question_type); }
  if (search) {
    conditions.push('question_text LIKE ?');
    values.push(`%${search}%`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const query = `SELECT * FROM questions ${whereClause} ORDER BY created_at DESC`;

  try {
    const [rows] = await pool.query(query, values);
    return res.json({ questions: rows, platforms, languages, difficulties, questionTypes });
  } catch (error) {
    console.error('Fetch questions error:', error);
    return res.status(500).json({ message: 'Unable to fetch questions.' });
  }
});

// ─── POST /api/questions ──────────────────────────────────────────────────
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const {
    question_text, platform, language, difficulty, category,
    question_type = 'Subjective', keywords = '', marks = 10, expected_answer = ''
  } = req.body;

  if (!question_text || !platform || !language || !difficulty || !category) {
    return res.status(400).json({ message: 'Question text, platform, language, difficulty, and category are required.' });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO questions
         (question_text, platform, language, difficulty, category, question_type, keywords, marks, expected_answer)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [question_text, platform, language, difficulty, category, question_type, keywords, Number(marks), expected_answer]
    );
    return res.status(201).json({ message: 'Question added.', questionId: result.insertId });
  } catch (error) {
    console.error('Add question error:', error);
    return res.status(500).json({ message: 'Unable to save question.' });
  }
});

// ─── PUT /api/questions/:id ───────────────────────────────────────────────
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const {
    question_text, platform, language, difficulty, category,
    question_type = 'Subjective', keywords = '', marks = 10, expected_answer = ''
  } = req.body;

  if (!question_text || !platform || !language || !difficulty || !category) {
    return res.status(400).json({ message: 'Question text, platform, language, difficulty, and category are required.' });
  }

  try {
    await pool.query(
      `UPDATE questions
       SET question_text = ?, platform = ?, language = ?, difficulty = ?, category = ?,
           question_type = ?, keywords = ?, marks = ?, expected_answer = ?
       WHERE id = ?`,
      [question_text, platform, language, difficulty, category, question_type, keywords, Number(marks), expected_answer, id]
    );
    return res.json({ message: 'Question updated.' });
  } catch (error) {
    console.error('Update question error:', error);
    return res.status(500).json({ message: 'Unable to update question.' });
  }
});

// ─── DELETE /api/questions/:id ────────────────────────────────────────────
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);
    return res.json({ message: 'Question deleted.' });
  } catch (error) {
    console.error('Delete question error:', error);
    return res.status(500).json({ message: 'Unable to delete question.' });
  }
});

module.exports = router;
