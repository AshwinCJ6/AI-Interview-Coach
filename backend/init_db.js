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

    await conn.query(createResumesTableSql);
    console.log('Table `resumes` ensured.');
    await conn.query(createProfilesTableSql);
    console.log('Table `student_profiles` ensured.');
    await conn.query(createQuestionsTableSql);
    console.log('Table `questions` ensured.');
    await conn.query(createInterviewConfigsTableSql);
    console.log('Table `interview_configs` ensured.');

    await conn.end();
    console.log('Init finished successfully.');
  } catch (err) {
    console.error('Init DB error:', err.message || err);
    process.exit(1);
  }
}

init();
