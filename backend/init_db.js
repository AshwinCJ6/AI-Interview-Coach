require('dotenv').config();
const mysql = require('mysql2/promise');

async function init() {
  const {
    DB_HOST = 'localhost',
    DB_USER = 'root',
    DB_PASSWORD = '',
    DB_NAME = 'interview_prep'
  } = process.env;

  try {
    const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASSWORD });
    console.log('Connected to MySQL server.');

    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database '${DB_NAME}' ensured.`);

    await conn.changeUser({ database: DB_NAME });

    const createTableSql = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('student','admin')
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await conn.query(createTableSql);
    console.log('Table `users` ensured.');

    const createResumesTableSql = `
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        resume_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createProfilesTableSql = `
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL UNIQUE,
        skills TEXT,
        education TEXT,
        projects TEXT,
        experience TEXT,
        certifications TEXT,
        summary TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createQuestionsTableSql = `
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        platform VARCHAR(100) NOT NULL,
        language VARCHAR(100) NOT NULL,
        difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
        category VARCHAR(100) NOT NULL,
        expected_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createInterviewConfigsTableSql = `
      CREATE TABLE IF NOT EXISTS interview_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(100) NOT NULL,
        language VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        question_count INT NOT NULL,
        interview_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createCompanyDocumentsTableSql = `
      CREATE TABLE IF NOT EXISTS company_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(100) NOT NULL,
        extracted_text TEXT,
        company_description TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await conn.query(createResumesTableSql);
    console.log('Table `resumes` ensured.');
    await conn.query(createProfilesTableSql);
    console.log('Table `student_profiles` ensured.');
    await conn.query(createQuestionsTableSql);
    console.log('Table `questions` ensured.');
    await conn.query(createInterviewConfigsTableSql);
    console.log('Table `interview_configs` ensured.');
    await conn.query(createCompanyDocumentsTableSql);
    console.log('Table `company_documents` ensured.');

    const createInterviewsTableSql = `
      CREATE TABLE IF NOT EXISTS interviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        platform VARCHAR(100) NOT NULL,
        language VARCHAR(100) NOT NULL,
        difficulty VARCHAR(20) NOT NULL,
        interview_type VARCHAR(50) NOT NULL,
        status ENUM('started', 'completed') DEFAULT 'started',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createResponsesTableSql = `
      CREATE TABLE IF NOT EXISTS responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        interview_id INT NOT NULL,
        question_text TEXT NOT NULL,
        expected_answer TEXT,
        user_answer TEXT,
        is_sub_question BOOLEAN DEFAULT FALSE,
        parent_response_id INT NULL,
        coverage DECIMAL(5,2) DEFAULT 0.00,
        score DECIMAL(4,2) DEFAULT 0.00,
        feedback TEXT,
        sub_question_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_response_id) REFERENCES responses(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createEvaluationReportsTableSql = `
      CREATE TABLE IF NOT EXISTS evaluation_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        interview_id INT NOT NULL UNIQUE,
        overall_score DECIMAL(5,2) DEFAULT 0.00,
        technical_score DECIMAL(5,2) DEFAULT 0.00,
        communication_score DECIMAL(5,2) DEFAULT 0.00,
        problem_solving_score DECIMAL(5,2) DEFAULT 0.00,
        confidence_score DECIMAL(5,2) DEFAULT 0.00,
        average_coverage DECIMAL(5,2) DEFAULT 0.00,
        questions_attempted INT DEFAULT 0,
        questions_answered INT DEFAULT 0,
        sub_questions_asked INT DEFAULT 0,
        duration_minutes INT DEFAULT 0,
        strengths TEXT,
        improvements TEXT,
        recommendations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    const createPerformanceMetricsTableSql = `
      CREATE TABLE IF NOT EXISTS performance_metrics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        interview_id INT NOT NULL,
        metric_name VARCHAR(100) NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;

    await conn.query(createInterviewsTableSql);
    console.log('Table `interviews` ensured.');
    await conn.query(createResponsesTableSql);
    console.log('Table `responses` ensured.');
    await conn.query(createEvaluationReportsTableSql);
    console.log('Table `evaluation_reports` ensured.');
    await conn.query(createPerformanceMetricsTableSql);
    console.log('Table `performance_metrics` ensured.');

    await conn.end();
    console.log('Init finished successfully.');
  } catch (err) {
    console.error('Init DB error:', err.message || err);
    process.exit(1);
  }
}

init();
