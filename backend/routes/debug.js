const express = require('express');
const pool = require('../db');
const router = express.Router();

router.get('/users', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, role FROM users');
    res.json({ users: rows });
  } catch (err) {
    console.error('Debug users error:', err.message || err);
    res.status(500).json({ message: 'Unable to read users.' });
  }
});

module.exports = router;
