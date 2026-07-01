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

    // users table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE,
        password VARCHAR(255),
        role ENUM('student','admin'),
        last_login TIMESTAMP NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table \`users\` ensured.');

    // Add last_login column if it doesn't exist yet
    const [lastLoginCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login'`,
      [DB_NAME]
    );
    if (lastLoginCols.length === 0) {
      await conn.query(`ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL`);
      console.log('Column last_login added to users.');
    }

    // resumes
    await conn.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        resume_path VARCHAR(255) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_student_id (student_id),
        FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table \`resumes\` ensured.');

    // student_profiles
    await conn.query(`
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
    `);
    console.log('Table \`student_profiles\` ensured.');

    // questions
    await conn.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_text TEXT NOT NULL,
        platform VARCHAR(100) NOT NULL,
        language VARCHAR(100) NOT NULL,
        difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
        category VARCHAR(100) NOT NULL,
        question_type ENUM('Objective','Subjective','Coding','Scenario Based') DEFAULT 'Subjective',
        keywords TEXT,
        marks INT DEFAULT 10,
        expected_answer TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table \`questions\` ensured.');

    // Add question_type column if missing
    const [qtCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'question_type'`,
      [DB_NAME]
    );
    if (qtCols.length === 0) {
      await conn.query(`ALTER TABLE questions ADD COLUMN question_type ENUM('Objective','Subjective','Coding','Scenario Based') DEFAULT 'Subjective'`);
      console.log('Column question_type added to questions.');
    }

    const [kwCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'keywords'`,
      [DB_NAME]
    );
    if (kwCols.length === 0) {
      await conn.query(`ALTER TABLE questions ADD COLUMN keywords TEXT`);
      console.log('Column keywords added to questions.');
    }

    const [marksCols] = await conn.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'questions' AND COLUMN_NAME = 'marks'`,
      [DB_NAME]
    );
    if (marksCols.length === 0) {
      await conn.query(`ALTER TABLE questions ADD COLUMN marks INT DEFAULT 10`);
      console.log('Column marks added to questions.');
    }

    // categories
    await conn.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table \`categories\` ensured.');

    // Seed default categories
    const defaultCategories = [
      'Frontend Development', 'Backend Development', 'Full Stack Development',
      'Java', 'Python', 'JavaScript', 'C Programming',
      'Data Structures', 'Machine Learning', 'Artificial Intelligence',
      'HR Interview', 'Communication Skills'
    ];
    for (const cat of defaultCategories) {
      await conn.query(`INSERT IGNORE INTO categories (name) VALUES (?)`, [cat]);
    }
    console.log('Default categories seeded.');

    // ai_settings
    await conn.query(`
      CREATE TABLE IF NOT EXISTS ai_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('Table \`ai_settings\` ensured.');

    // Seed default AI settings
    const defaultSettings = [
      ['ai_enabled', 'true'],
      ['coverage_threshold', '70'],
      ['max_sub_questions', '3'],
      ['default_difficulty', 'Medium']
    ];
    for (const [key, value] of defaultSettings) {
      await conn.query(`INSERT IGNORE INTO ai_settings (setting_key, setting_value) VALUES (?, ?)`, [key, value]);
    }
    console.log('Default AI settings seeded.');

    // interview_configs
    await conn.query(`
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
    `);
    console.log('Table \`interview_configs\` ensured.');

    // company_documents
    await conn.query(`
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
    `);
    console.log('Table \`company_documents\` ensured.');

    // interviews
    await conn.query(`
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
    `);
    console.log('Table \`interviews\` ensured.');

    // responses
    await conn.query(`
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
    `);
    console.log('Table \`responses\` ensured.');

    // evaluation_reports
    await conn.query(`
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
    `);
    console.log('Table \`evaluation_reports\` ensured.');

    // performance_metrics
    await conn.query(`
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
    `);
    console.log('Table \`performance_metrics\` ensured.');

    await conn.end();
    console.log('Init finished successfully.');
  } catch (err) {
    console.error('Init DB error:', err.message || err);
    process.exit(1);
  }
}

init();
