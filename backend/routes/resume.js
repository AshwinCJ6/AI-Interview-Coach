const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF and DOCX files are allowed.'));
    }
    cb(null, true);
  }
});

const normalizeText = (text) => text.replace(/\r\n/g, '\n').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim();

const extractSection = (text, labels) => {
  const labelGroup = labels.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(?:${labelGroup})\s*[:\-]?\s*([^\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const splitMatches = (text) => {
  return text
    .split(/[;,•\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const firstMatchingPhrase = (text, keywords) => {
  const regex = new RegExp(`(?:${keywords.join('|')})`, 'gi');
  const match = text.match(regex);
  return match ? match[0] : '';
};

const extractProfileFromText = (text) => {
  const normalized = normalizeText(text);
  const skills = splitMatches(extractSection(normalized, ['skills', 'technical skills', 'expertise']))
    .slice(0, 12)
    .join(', ');
  const education = extractSection(normalized, ['education', 'degree', 'qualification', 'academic']) || '';
  const projects = splitMatches(extractSection(normalized, ['projects', 'project experience', 'selected projects']))
    .slice(0, 10)
    .join(', ');
  const experience = extractSection(normalized, ['experience', 'work experience', 'professional experience', 'internship']) || '';
  const certifications = splitMatches(extractSection(normalized, ['certifications', 'certification', 'licenses']))
    .slice(0, 10)
    .join(', ');

  const name = (() => {
    const nameCandidate = extractSection(normalized, ['name']) || '';
    if (nameCandidate) {
      return nameCandidate;
    }

    const words = normalized.split(/\s+/).slice(0, 5);
    if (words.length >= 2 && !/skills|education|projects|experience|certifications/i.test(words.join(' '))) {
      return words.join(' ');
    }
    return '';
  })();

  const summaryParts = [];
  if (name) summaryParts.push(`Student Name: ${name}`);
  if (education) summaryParts.push(`Education: ${education}`);
  if (skills) summaryParts.push(`Skills: ${skills}`);
  if (projects) summaryParts.push(`Projects: ${projects}`);
  if (experience) summaryParts.push(`Experience: ${experience}`);
  if (certifications) summaryParts.push(`Certifications: ${certifications}`);

  return {
    name,
    skills,
    education,
    projects,
    experience,
    certifications,
    summary: summaryParts.join(' ')
  };
};

const extractTextFromFile = async (filePath, mimetype) => {
  const buffer = fs.readFileSync(filePath);
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  return buffer.toString('utf8');
};

router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Resume file is required.' });
  }

  try {
    const { filename, path: savedPath, mimetype } = req.file;
    const studentId = req.user.id;
    const text = await extractTextFromFile(savedPath, mimetype);
    const profile = extractProfileFromText(text);

    await pool.query(
      `INSERT INTO resumes (student_id, resume_path) VALUES (?, ?)`,
      [studentId, filename]
    );

    await pool.query(
      `INSERT INTO student_profiles (student_id, skills, education, projects, experience, certifications, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         skills = VALUES(skills),
         education = VALUES(education),
         projects = VALUES(projects),
         experience = VALUES(experience),
         certifications = VALUES(certifications),
         summary = VALUES(summary),
         updated_at = CURRENT_TIMESTAMP`,
      [studentId, profile.skills, profile.education, profile.projects, profile.experience, profile.certifications, profile.summary]
    );

    return res.json({ message: 'Resume uploaded successfully.', profile });
  } catch (error) {
    console.error('Resume upload error:', error);
    return res.status(500).json({ message: 'Unable to process resume.' });
  }
});

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const [rows] = await pool.query('SELECT skills, education, projects, experience, certifications, summary FROM student_profiles WHERE student_id = ?', [studentId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Profile not found.' });
    }
    return res.json({ profile: rows[0] });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ message: 'Unable to fetch profile.' });
  }
});

module.exports = router;
