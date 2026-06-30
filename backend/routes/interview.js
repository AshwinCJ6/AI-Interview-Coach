const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const pool = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { generateGrokQuestions } = require('../services/aiService');

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
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain',
      'image/png',
      'image/jpeg'
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only PDF, DOC, DOCX, TXT, PNG, and JPG files are allowed.'));
    }
    cb(null, true);
  }
});

const normalizeText = (text) => text.replace(/\r\n/g, '\n').replace(/\n+/g, '\n').replace(/\s+/g, ' ').trim();

const extractTextFromFile = async (filePath, mimetype) => {
  const buffer = fs.readFileSync(filePath);
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return normalizeText(data.text);
  }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimetype === 'application/msword') {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeText(result.value || '');
  }
  if (mimetype === 'text/plain') {
    return normalizeText(buffer.toString('utf8'));
  }
  if (mimetype.startsWith('image/')) {
    return `Uploaded image file. Text extraction unavailable for images.`;
  }
  return normalizeText(buffer.toString('utf8'));
};

const summarizeText = (text) => {
  if (!text) return '';
  return text.length > 2000 ? `${text.slice(0, 2000)}...` : text;
};

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

router.post('/company-doc/upload', authenticateToken, upload.single('companyDoc'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Company document file is required.' });
  }

  try {
    const { filename, mimetype } = req.file;
    const studentId = req.user.id;
    const companyDescription = req.body.companyDescription || '';
    const rawText = await extractTextFromFile(req.file.path, mimetype);
    const extractedText = summarizeText(rawText);

    await pool.query(
      `INSERT INTO company_documents (student_id, filename, file_type, extracted_text, company_description)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, filename, mimetype, extractedText, companyDescription]
    );

    return res.json({
      message: 'Company document uploaded successfully.',
      fileName: filename,
      summary: extractedText || companyDescription
    });
  } catch (error) {
    console.error('Company document upload error:', error);
    return res.status(500).json({ message: 'Unable to process company document.' });
  }
});

router.post('/company-doc/text', authenticateToken, async (req, res) => {
  const { companyText, companyDescription } = req.body;
  if (!companyText || !companyText.trim()) {
    return res.status(400).json({ message: 'Company text is required.' });
  }

  try {
    const studentId = req.user.id;
    const normalizedText = normalizeText(companyText);
    const extractedText = summarizeText(normalizedText);
    const description = companyDescription || '';

    await pool.query(
      `INSERT INTO company_documents (student_id, filename, file_type, extracted_text, company_description)
       VALUES (?, ?, ?, ?, ?)`,
      [studentId, 'text-entry', 'text/plain', extractedText, description]
    );

    return res.json({
      message: 'Company text saved successfully.',
      summary: extractedText || description
    });
  } catch (error) {
    console.error('Company text save error:', error);
    return res.status(500).json({ message: 'Unable to save company text.' });
  }
});

router.get('/company-doc', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const [rows] = await pool.query(
      `SELECT filename, file_type, extracted_text, company_description
       FROM company_documents WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1`,
      [studentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'No company document found.' });
    }

    const doc = rows[0];
    return res.json({
      fileName: doc.filename,
      fileType: doc.file_type,
      summary: doc.extracted_text,
      companyDescription: doc.company_description
    });
  } catch (error) {
    console.error('Fetch company document error:', error);
    return res.status(500).json({ message: 'Unable to fetch company document.' });
  }
});

const getLatestCompanyDocument = async (studentId) => {
  try {
    const [companyRows] = await pool.query(
      `SELECT filename, file_type, extracted_text, company_description
       FROM company_documents WHERE student_id = ? ORDER BY uploaded_at DESC LIMIT 1`,
      [studentId]
    );
    return companyRows[0] || {};
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.warn('company_documents table does not exist; continuing without company document context.');
      return {};
    }
    throw error;
  }
};

router.post('/generate', authenticateToken, async (req, res) => {
  const { platform, language, difficulty, questionCount, interviewType, companyDescription } = req.body;
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

    const companyDoc = await getLatestCompanyDocument(req.user.id);
    const companyDetails = [
      companyDescription?.trim(),
      companyDoc.company_description,
      companyDoc.extracted_text
    ]
      .filter(Boolean)
      .join('\n');

    const databaseQuestions = rows.map((row) => ({ id: row.id, question: row.question_text, source: 'database' }));
    const aiCount = Math.max(0, wantedCount - databaseQuestions.length);
    const aiQuestions = await generateGrokQuestions({
      platform,
      language,
      difficulty,
      interviewType: interviewType || 'Technical',
      profile,
      companyDetails,
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

const {
  evaluateAnswer,
  generateSubQuestion,
  generatePerformanceReport
} = require('../services/aiService');

router.post('/start', authenticateToken, async (req, res) => {
  const { platform, language, difficulty, questionCount, interviewType, companyDescription } = req.body;
  if (!platform || !language || !difficulty || !questionCount || !interviewType) {
    return res.status(400).json({ message: 'All interview setup fields are required.' });
  }

  try {
    // 1. Create interview entry
    const [interviewResult] = await pool.query(
      `INSERT INTO interviews (user_id, platform, language, difficulty, interview_type, status)
       VALUES (?, ?, ?, ?, ?, 'started')`,
      [req.user.id, platform, language, difficulty, interviewType]
    );
    const interviewId = interviewResult.insertId;

    // 2. Generate questions
    const wantedCount = Number(questionCount);
    const dbLimit = Math.max(1, Math.ceil(wantedCount / 2));

    const [rows] = await pool.query(
      `SELECT id, question_text, expected_answer FROM questions
       WHERE platform = ? AND language = ? AND difficulty = ?
       LIMIT ?`,
      [platform, language, difficulty, dbLimit]
    );

    const [profileRows] = await pool.query(
      'SELECT skills, education, projects, experience, certifications, summary FROM student_profiles WHERE student_id = ?',
      [req.user.id]
    );
    const profile = profileRows[0] || {};

    const companyDoc = await getLatestCompanyDocument(req.user.id);
    const companyDetails = [
      companyDescription?.trim(),
      companyDoc.company_description,
      companyDoc.extracted_text
    ]
      .filter(Boolean)
      .join('\n');

    const databaseQuestions = rows.map((row) => ({
      question: row.question_text,
      expected: row.expected_answer || 'Provide a detailed answer with syntax and examples if applicable.',
      source: 'database'
    }));

    const aiCount = Math.max(0, wantedCount - databaseQuestions.length);
    let aiQuestions = [];
    if (aiCount > 0) {
      const generated = await generateGrokQuestions({
        platform,
        language,
        difficulty,
        interviewType: interviewType || 'Technical',
        profile,
        companyDetails,
        count: aiCount
      });
      aiQuestions = generated.map(q => ({
        question: q.question,
        expected: 'Provide a detailed answer matching the concepts of the question.',
        source: 'grok'
      }));
    }

    const allQuestions = [...databaseQuestions, ...aiQuestions].slice(0, wantedCount);

    // 3. Save questions in responses table as placeholders
    const questionList = [];
    for (const q of allQuestions) {
      const [respResult] = await pool.query(
        `INSERT INTO responses (interview_id, question_text, expected_answer, is_sub_question, coverage, score)
         VALUES (?, ?, ?, FALSE, 0, 0)`,
        [interviewId, q.question, q.expected]
      );
      questionList.push({
        id: respResult.insertId,
        questionText: q.question
      });
    }

    return res.status(201).json({
      message: 'Interview started successfully.',
      interviewId,
      questions: questionList
    });
  } catch (error) {
    console.error('Start interview error:', error);
    return res.status(500).json({ message: 'Unable to start interview.' });
  }
});

router.post('/evaluate-answer', authenticateToken, async (req, res) => {
  const { interviewId, responseId, userAnswer, subQuestionId } = req.body;
  if (!interviewId || !responseId || userAnswer === undefined) {
    return res.status(400).json({ message: 'interviewId, responseId and userAnswer are required.' });
  }

  try {
    // 1. Fetch main question response
    const [mainRows] = await pool.query(
      'SELECT * FROM responses WHERE id = ? AND interview_id = ?',
      [responseId, interviewId]
    );
    if (mainRows.length === 0) {
      return res.status(404).json({ message: 'Main question response not found.' });
    }
    const mainResponse = mainRows[0];

    // 2. Fetch previous sub-questions and answers for this main question
    const [subRows] = await pool.query(
      'SELECT question_text, user_answer FROM responses WHERE parent_response_id = ? ORDER BY id ASC',
      [responseId]
    );

    let previousAnswers = [];
    if (subQuestionId) {
      // If student is answering a sub-question, we update that sub-question's response first
      await pool.query(
        'UPDATE responses SET user_answer = ? WHERE id = ?',
        [userAnswer, subQuestionId]
      );
      
      // Update subRows collection to include this newly saved answer
      const [updatedSubRows] = await pool.query(
        'SELECT question_text, user_answer FROM responses WHERE parent_response_id = ? ORDER BY id ASC',
        [responseId]
      );
      previousAnswers = updatedSubRows.map(r => r.user_answer).filter(Boolean);
    } else {
      // If student is answering the main question
      await pool.query(
        'UPDATE responses SET user_answer = ? WHERE id = ?',
        [userAnswer, responseId]
      );
      previousAnswers = subRows.map(r => r.user_answer).filter(Boolean);
    }

    // Combine answers to evaluate cumulative coverage
    const allAnswers = [subQuestionId ? mainResponse.user_answer : userAnswer, ...previousAnswers].filter(Boolean);

    // Call AI to evaluate cumulative response
    const evaluation = await evaluateAnswer({
      questionText: mainResponse.question_text,
      studentAnswer: subQuestionId ? userAnswer : userAnswer, // latest input
      expectedAnswer: mainResponse.expected_answer,
      previousAnswers: allAnswers
    });

    const finalCoverage = Number(evaluation.coverage || 0);

    // Determine sub-question count
    const [countRows] = await pool.query(
      'SELECT COUNT(*) as count FROM responses WHERE parent_response_id = ?',
      [responseId]
    );
    const subQuestionCount = countRows[0].count;

    // Check threshold (70%) and attempts
    if (finalCoverage < 70 && subQuestionCount < 3) {
      // Generate follow-up sub-question
      const subQuestionText = await generateSubQuestion({
        questionText: mainResponse.question_text,
        expectedAnswer: mainResponse.expected_answer,
        previousAnswers: allAnswers,
        missingConcepts: evaluation.missingConcepts
      });

      // Save sub-question in database
      const [insertSubResult] = await pool.query(
        `INSERT INTO responses (interview_id, question_text, is_sub_question, parent_response_id)
         VALUES (?, ?, TRUE, ?)`,
        [interviewId, subQuestionText, responseId]
      );

      // Increment sub-question count in main response
      await pool.query(
        'UPDATE responses SET sub_question_count = sub_question_count + 1, coverage = ? WHERE id = ?',
        [finalCoverage, responseId]
      );

      return res.json({
        completed: false,
        coverage: finalCoverage,
        missingConcepts: evaluation.missingConcepts,
        feedback: evaluation.feedback,
        subQuestion: {
          id: insertSubResult.insertId,
          questionText: subQuestionText
        }
      });
    } else {
      // Calculate score out of 10 marks
      let score = 3;
      if (finalCoverage >= 90) score = 10;
      else if (finalCoverage >= 80) score = 9;
      else if (finalCoverage >= 70) score = 8;
      else if (finalCoverage >= 60) score = 6;
      else if (finalCoverage >= 50) score = 5;

      // Update main question score, final coverage, and feedback
      await pool.query(
        'UPDATE responses SET coverage = ?, score = ?, feedback = ? WHERE id = ?',
        [finalCoverage, score, evaluation.feedback || 'Answer completed.', responseId]
      );

      return res.json({
        completed: true,
        coverage: finalCoverage,
        score,
        feedback: evaluation.feedback,
        missingConcepts: evaluation.missingConcepts
      });
    }
  } catch (error) {
    console.error('Evaluate answer error:', error);
    return res.status(500).json({ message: 'Unable to evaluate answer.' });
  }
});

router.post('/generate-sub-question', authenticateToken, async (req, res) => {
  const { responseId } = req.body;
  if (!responseId) {
    return res.status(400).json({ message: 'responseId is required.' });
  }

  try {
    const [rows] = await pool.query('SELECT * FROM responses WHERE id = ?', [responseId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    const response = rows[0];

    const [subRows] = await pool.query(
      'SELECT question_text, user_answer FROM responses WHERE parent_response_id = ? ORDER BY id ASC',
      [responseId]
    );

    const answers = [response.user_answer, ...subRows.map(r => r.user_answer)].filter(Boolean);

    // Call evaluate to find missing concepts
    const evalResult = await evaluateAnswer({
      questionText: response.question_text,
      studentAnswer: response.user_answer || '',
      expectedAnswer: response.expected_answer,
      previousAnswers: answers
    });

    const subQuestionText = await generateSubQuestion({
      questionText: response.question_text,
      expectedAnswer: response.expected_answer,
      previousAnswers: answers,
      missingConcepts: evalResult.missingConcepts
    });

    // Save subquestion
    const [insertResult] = await pool.query(
      `INSERT INTO responses (interview_id, question_text, is_sub_question, parent_response_id)
       VALUES (?, ?, TRUE, ?)`,
      [response.interview_id, subQuestionText, responseId]
    );

    await pool.query('UPDATE responses SET sub_question_count = sub_question_count + 1 WHERE id = ?', [responseId]);

    return res.json({
      subQuestion: {
        id: insertResult.insertId,
        questionText: subQuestionText
      }
    });
  } catch (error) {
    console.error('Manual sub-question generation error:', error);
    return res.status(500).json({ message: 'Unable to generate sub-question.' });
  }
});

router.get('/interview-report', authenticateToken, async (req, res) => {
  const { interviewId } = req.query;
  if (!interviewId) {
    return res.status(400).json({ message: 'interviewId query parameter is required.' });
  }

  try {
    // 1. Fetch interview details
    const [interviewRows] = await pool.query('SELECT * FROM interviews WHERE id = ?', [interviewId]);
    if (interviewRows.length === 0) {
      return res.status(404).json({ message: 'Interview not found.' });
    }
    const interview = interviewRows[0];

    // Mark completed if still started
    if (interview.status === 'started') {
      await pool.query(
        'UPDATE interviews SET status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?',
        [interviewId]
      );
      // Reload interview model to get completion date
      const [reloaded] = await pool.query('SELECT * FROM interviews WHERE id = ?', [interviewId]);
      Object.assign(interview, reloaded[0]);
    }

    // 2. Fetch all responses for the report
    const [responseRows] = await pool.query(
      'SELECT * FROM responses WHERE interview_id = ? ORDER BY id ASC',
      [interviewId]
    );

    // Calculate duration
    const start = new Date(interview.created_at);
    const end = interview.completed_at ? new Date(interview.completed_at) : new Date();
    const durationMinutes = Math.max(1, Math.round((end - start) / 60000));

    // Check if report already exists in evaluation_reports
    const [reportRows] = await pool.query('SELECT * FROM evaluation_reports WHERE interview_id = ?', [interviewId]);
    
    let report;
    if (reportRows.length > 0) {
      const row = reportRows[0];
      // Remap snake_case DB columns to camelCase so the frontend always gets consistent field names
      report = {
        overallScore:        row.overall_score,
        technicalScore:      row.technical_score,
        communicationScore:  row.communication_score,
        problemSolvingScore: row.problem_solving_score,
        confidenceScore:     row.confidence_score,
        averageCoverage:     row.average_coverage,
        questionsAttempted:  row.questions_attempted,
        questionsAnswered:   row.questions_answered,
        subQuestionsAsked:   row.sub_questions_asked,
        durationMinutes:     row.duration_minutes,
        strengths:           JSON.parse(row.strengths    || '[]'),
        improvements:        JSON.parse(row.improvements || '[]'),
        recommendations:     row.recommendations
      };
    } else {
      // Generate final report
      report = await generatePerformanceReport({
        platform: interview.platform,
        difficulty: interview.difficulty,
        durationMinutes,
        responses: responseRows
      });

      // Save report in DB
      await pool.query(
        `INSERT INTO evaluation_reports (
          interview_id, overall_score, technical_score, communication_score,
          problem_solving_score, confidence_score, average_coverage,
          questions_attempted, questions_answered, sub_questions_asked,
          duration_minutes, strengths, improvements, recommendations
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          interviewId, report.overallScore, report.technicalScore, report.communicationScore,
          report.problemSolvingScore, report.confidenceScore, report.averageCoverage,
          report.questionsAttempted, report.questionsAnswered, report.subQuestionsAsked,
          report.durationMinutes, JSON.stringify(report.strengths), JSON.stringify(report.improvements),
          report.recommendations
        ]
      );

      // Save metrics for analytics
      const metrics = [
        { name: 'Technical Knowledge', score: report.technicalScore },
        { name: 'Communication', score: report.communicationScore },
        { name: 'Problem Solving', score: report.problemSolvingScore },
        { name: 'Confidence', score: report.confidenceScore },
        { name: 'Answer Coverage', score: report.averageCoverage }
      ];

      for (const m of metrics) {
        await pool.query(
          `INSERT INTO performance_metrics (user_id, interview_id, metric_name, score)
           VALUES (?, ?, ?, ?)`,
          [req.user.id, interviewId, m.name, m.score]
        );
      }
    }

    // Structure responses with their sub-questions nested for the detailed view
    const mainResponses = responseRows.filter(r => !r.is_sub_question);
    const subResponses = responseRows.filter(r => r.is_sub_question);

    const questionsDetails = mainResponses.map(main => {
      const followUps = subResponses
        .filter(sub => sub.parent_response_id === main.id)
        .map(sub => ({
          id: sub.id,
          questionText: sub.question_text,
          userAnswer: sub.user_answer
        }));
      
      return {
        id: main.id,
        questionText: main.question_text,
        userAnswer: main.user_answer,
        coverage: main.coverage,
        score: main.score,
        feedback: main.feedback,
        subQuestions: followUps
      };
    });

    return res.json({
      interview,
      report,
      questions: questionsDetails
    });
  } catch (error) {
    console.error('Get interview report error:', error);
    return res.status(500).json({ message: 'Unable to load interview report.' });
  }
});

router.get('/performance-analysis', authenticateToken, async (req, res) => {
  try {
    const [reports] = await pool.query(
      `SELECT r.*, i.platform, i.difficulty, i.created_at
       FROM evaluation_reports r
       JOIN interviews i ON r.interview_id = i.id
       WHERE i.user_id = ?
       ORDER BY i.created_at ASC`,
      [req.user.id]
    );

    if (reports.length === 0) {
      return res.json({
        hasData: false,
        message: 'No practice interview data available yet.'
      });
    }

    // Calculate aggregated averages
    let sumOverall = 0;
    let sumTech = 0;
    let sumComm = 0;
    let sumProblem = 0;
    let sumConf = 0;
    let sumCoverage = 0;
    let totalAttempts = 0;
    let totalSubQuestions = 0;

    const historyTrend = reports.map(r => {
      sumOverall += Number(r.overall_score);
      sumTech += Number(r.technical_score);
      sumComm += Number(r.communication_score);
      sumProblem += Number(r.problem_solving_score);
      sumConf += Number(r.confidence_score);
      sumCoverage += Number(r.average_coverage);
      totalAttempts += r.questions_attempted;
      totalSubQuestions += r.sub_questions_asked;

      return {
        interviewId: r.interview_id,
        platform: r.platform,
        difficulty: r.difficulty,
        overallScore: r.overall_score,
        durationMinutes: r.duration_minutes,
        averageCoverage: r.average_coverage,
        questionsAttempted: r.questions_attempted,
        subQuestionsAsked: r.sub_questions_asked,
        date: r.created_at
      };
    });

    const count = reports.length;

    // Compile list of strengths and improvements from history
    const allStrengths = [];
    const allImprovements = [];
    reports.forEach(r => {
      try {
        const s = JSON.parse(r.strengths || '[]');
        const imp = JSON.parse(r.improvements || '[]');
        allStrengths.push(...s);
        allImprovements.push(...imp);
      } catch (e) {
        // ignore
      }
    });

    // Extract unique or top items
    const topStrengths = [...new Set(allStrengths)].slice(0, 5);
    const topImprovements = [...new Set(allImprovements)].slice(0, 5);

    return res.json({
      hasData: true,
      aggregates: {
        interviewsCompleted: count,
        overallScore: Math.round(sumOverall / count),
        technicalKnowledge: Math.round(sumTech / count),
        communication: Math.round(sumComm / count),
        problemSolving: Math.round(sumProblem / count),
        confidence: Math.round(sumConf / count),
        averageCoverage: Math.round(sumCoverage / count),
        questionsAttempted: totalAttempts,
        subQuestionsAsked: totalSubQuestions
      },
      historyTrend,
      strengths: topStrengths,
      improvements: topImprovements
    });
  } catch (error) {
    console.error('Fetch performance analysis error:', error);
    return res.status(500).json({ message: 'Unable to load performance analysis.' });
  }
});

module.exports = router;
