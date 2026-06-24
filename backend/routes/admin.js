const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/dashboard', authenticateToken, authorizeRoles('admin'), (req, res) => {
  res.json({ message: 'Admin dashboard data', user: req.user });
});

module.exports = router;
