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

    await conn.end();
    console.log('Init finished successfully.');
  } catch (err) {
    console.error('Init DB error:', err.message || err);
    process.exit(1);
  }
}

init();
