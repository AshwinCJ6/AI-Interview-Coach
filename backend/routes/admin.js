const express = require('express');
const pool = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

// ─── GET /api/admin/dashboard ─────────────────────────────────────────────
router.get('/dashboard', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [[{ total_students }]] = await pool.query(
      `SELECT COUNT(*) AS total_students FROM users WHERE role = 'student'`
    );
    const [[{ total_interviews }]] = await pool.query(
      `SELECT COUNT(*) AS total_interviews FROM interviews WHERE status = 'completed'`
    );
    const [[{ avg_score }]] = await pool.query(
      `SELECT ROUND(AVG(overall_score), 1) AS avg_score FROM evaluation_reports`
    );
    const [[topDomain]] = await pool.query(
      `SELECT platform AS domain, COUNT(*) AS cnt FROM interviews
       WHERE status = 'completed' GROUP BY platform ORDER BY cnt DESC LIMIT 1`
    );
    const [[hardestTopic]] = await pool.query(
      `SELECT r.question_text, ROUND(AVG(r.score), 1) AS avg_score
       FROM responses r
       WHERE r.is_sub_question = 0
       GROUP BY r.question_text ORDER BY avg_score ASC LIMIT 1`
    );
    const [[{ today_interviews }]] = await pool.query(
      `SELECT COUNT(*) AS today_interviews FROM interviews
       WHERE DATE(created_at) = CURDATE() AND status = 'completed'`
    );
    const [[{ active_students }]] = await pool.query(
      `SELECT COUNT(DISTINCT user_id) AS active_students FROM interviews
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`
    );

    return res.json({
      total_students: total_students || 0,
      total_interviews: total_interviews || 0,
      avg_score: avg_score || 0,
      most_selected_domain: topDomain?.domain || 'N/A',
      most_difficult_topic: hardestTopic?.question_text
        ? hardestTopic.question_text.substring(0, 60) + '...'
        : 'N/A',
      today_interviews: today_interviews || 0,
      active_students: active_students || 0
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    return res.status(500).json({ message: 'Failed to load dashboard.' });
  }
});

// ─── GET /api/admin/students ──────────────────────────────────────────────
router.get('/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [students] = await pool.query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.last_login,
        NULL AS registered_at,
        COUNT(DISTINCT i.id) AS interview_count,
        ROUND(AVG(er.overall_score), 1) AS avg_score,
        (SELECT er2.overall_score FROM evaluation_reports er2
         JOIN interviews i2 ON er2.interview_id = i2.id
         WHERE i2.user_id = u.id ORDER BY er2.created_at DESC LIMIT 1) AS latest_score,
        (SELECT COUNT(*) FROM resumes r WHERE r.student_id = u.id) AS has_resume
      FROM users u
      LEFT JOIN interviews i ON i.user_id = u.id AND i.status = 'completed'
      LEFT JOIN evaluation_reports er ON er.interview_id = i.id
      WHERE u.role = 'student'
      GROUP BY u.id
      ORDER BY u.id DESC
    `);
    return res.json({ students });
  } catch (error) {
    console.error('Admin students error:', error);
    return res.status(500).json({ message: 'Failed to load students.' });
  }
});

// ─── GET /api/admin/statistics ────────────────────────────────────────────
router.get('/statistics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(er.id) AS total_interviews,
        ROUND(AVG(er.overall_score), 1) AS avg_score,
        ROUND(AVG(er.average_coverage), 1) AS avg_coverage,
        ROUND(AVG(er.duration_minutes), 1) AS avg_duration,
        ROUND(AVG(er.questions_attempted), 1) AS avg_questions_attempted,
        SUM(CASE WHEN er.overall_score >= 60 THEN 1 ELSE 0 END) AS pass_count,
        SUM(CASE WHEN er.overall_score < 60 THEN 1 ELSE 0 END) AS fail_count
      FROM evaluation_reports er
    `);

    const total = stats.total_interviews || 0;
    const passPercent = total > 0 ? Math.round((stats.pass_count / total) * 100) : 0;
    const failPercent = total > 0 ? 100 - passPercent : 0;

    return res.json({
      total_interviews: total,
      avg_score: stats.avg_score || 0,
      avg_coverage: stats.avg_coverage || 0,
      avg_duration: stats.avg_duration || 0,
      avg_questions_attempted: stats.avg_questions_attempted || 0,
      pass_percent: passPercent,
      fail_percent: failPercent
    });
  } catch (error) {
    console.error('Admin statistics error:', error);
    return res.status(500).json({ message: 'Failed to load statistics.' });
  }
});

// ─── GET /api/admin/analytics ─────────────────────────────────────────────
router.get('/analytics', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [mostDifficult] = await pool.query(`
      SELECT question_text, ROUND(AVG(score), 1) AS avg_score, COUNT(*) AS attempts
      FROM responses
      WHERE is_sub_question = 0 AND user_answer IS NOT NULL AND user_answer != ''
      GROUP BY question_text
      HAVING attempts >= 1
      ORDER BY avg_score ASC
      LIMIT 5
    `);

    const [frequentlyAsked] = await pool.query(`
      SELECT question_text, COUNT(*) AS attempt_count
      FROM responses
      WHERE is_sub_question = 0
      GROUP BY question_text
      ORDER BY attempt_count DESC
      LIMIT 5
    `);

    const [weakTopics] = await pool.query(`
      SELECT i.platform AS topic, ROUND(AVG(er.overall_score), 1) AS avg_score
      FROM evaluation_reports er
      JOIN interviews i ON i.id = er.interview_id
      GROUP BY i.platform
      ORDER BY avg_score ASC
      LIMIT 5
    `);

    const [strongTopics] = await pool.query(`
      SELECT i.platform AS topic, ROUND(AVG(er.overall_score), 1) AS avg_score
      FROM evaluation_reports er
      JOIN interviews i ON i.id = er.interview_id
      GROUP BY i.platform
      ORDER BY avg_score DESC
      LIMIT 5
    `);

    return res.json({ mostDifficult, frequentlyAsked, weakTopics, strongTopics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    return res.status(500).json({ message: 'Failed to load analytics.' });
  }
});

// ─── GET /api/admin/ai-config ─────────────────────────────────────────────
router.get('/ai-config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT setting_key, setting_value FROM ai_settings`);
    const config = {};
    rows.forEach(r => { config[r.setting_key] = r.setting_value; });
    return res.json(config);
  } catch (error) {
    console.error('AI config get error:', error);
    return res.status(500).json({ message: 'Failed to load AI config.' });
  }
});

// ─── PUT /api/admin/ai-config ─────────────────────────────────────────────
router.put('/ai-config', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO ai_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = ?`,
        [key, String(value), String(value)]
      );
    }
    return res.json({ message: 'AI configuration saved.' });
  } catch (error) {
    console.error('AI config save error:', error);
    return res.status(500).json({ message: 'Failed to save AI config.' });
  }
});

// ─── GET /api/admin/categories ────────────────────────────────────────────
router.get('/categories', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const [categories] = await pool.query(`SELECT * FROM categories ORDER BY name ASC`);
    return res.json({ categories });
  } catch (error) {
    console.error('Categories get error:', error);
    return res.status(500).json({ message: 'Failed to load categories.' });
  }
});

// ─── POST /api/admin/categories ───────────────────────────────────────────
router.post('/categories', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    const [result] = await pool.query(`INSERT INTO categories (name) VALUES (?)`, [name.trim()]);
    return res.status(201).json({ message: 'Category added.', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Category already exists.' });
    }
    console.error('Category add error:', error);
    return res.status(500).json({ message: 'Failed to add category.' });
  }
});

// ─── PUT /api/admin/categories/:id ───────────────────────────────────────
router.put('/categories/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Category name is required.' });
  }
  try {
    await pool.query(`UPDATE categories SET name = ? WHERE id = ?`, [name.trim(), id]);
    return res.json({ message: 'Category updated.' });
  } catch (error) {
    console.error('Category update error:', error);
    return res.status(500).json({ message: 'Failed to update category.' });
  }
});

// ─── DELETE /api/admin/categories/:id ────────────────────────────────────
router.delete('/categories/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`DELETE FROM categories WHERE id = ?`, [id]);
    return res.json({ message: 'Category deleted.' });
  } catch (error) {
    console.error('Category delete error:', error);
    return res.status(500).json({ message: 'Failed to delete category.' });
  }
});

module.exports = router;
