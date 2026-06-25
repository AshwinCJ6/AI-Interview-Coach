# 🚀 AI Interview Preparation Assistant

<div align="center">

### 🎯 Smart AI-Powered Interview Preparation Platform

Built with modern web technologies to help students prepare for technical and HR interviews through AI-driven mock interviews, resume analysis, performance tracking, and personalized improvement suggestions.

<br>

![React](https://img.shields.io/badge/React-Frontend-61DAFB?logo=react\&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=node.js\&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-API-000000?logo=express\&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql\&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens\&logoColor=white)

</div>

---

# 🌟 Key Features

| Feature                    | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| 👤 Student Portal          | Register, login and access interview preparation tools |
| 🛡️ Admin Portal           | Manage users, questions and platform content           |
| 📄 Resume Analysis         | Upload and review resumes                              |
| 🤖 AI Interview Setup      | Configure interview type and difficulty                |
| 🎤 Mock Interview Room     | Real-time interview simulation                         |
| 📊 Performance Analytics   | Detailed score and feedback                            |
| 📜 Interview History       | View previous interview attempts                       |
| 🚀 Improvement Suggestions | AI-generated recommendations                           |
| 📋 Question Management     | Admin controls interview question bank                 |
| 🔐 Secure Authentication   | JWT-based login and authorization                      |

---

# 🏗️ System Architecture

```text
┌─────────────┐
│ React Frontend │
└──────┬──────┘
       │ REST API
       ▼
┌─────────────┐
│ Express API │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   MySQL DB  │
└─────────────┘
```

---

# 📱 Application Screens

## 🎓 Student Module

1. 🔑 Login
2. 📊 Dashboard
3. 📄 Resume Upload
4. ⚙️ Interview Setup
5. 🎤 Interview Room
6. 📈 Result Page
7. 📜 History Page
8. 🚀 Improvements Page

---

## 👨‍💼 Admin Module

1. 📊 Admin Dashboard
2. ❓ Question Management

---

# ⚙️ Backend Setup

## 📁 Navigate to Backend

```bash
cd backend
```

## 🔐 Create .env File

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=interview_prep
JWT_SECRET=your_jwt_secret
PORT=5000
```

## 📦 Install Dependencies

```bash
npm install
```

## 🗄️ Create Database

```sql
CREATE DATABASE IF NOT EXISTS interview_prep;

USE interview_prep;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('student','admin')
);
```

## ▶️ Start Backend

```bash
npm run dev
```

---

# 🎨 Frontend Setup

## 📁 Navigate to Frontend

```bash
cd frontend
```

## 📦 Install Dependencies

```bash
npm install
```

## ▶️ Run Application

```bash
npm run dev
```

---

# 🛠️ Technology Stack

| Layer            | Technology            |
| ---------------- | --------------------- |
| Frontend         | React.js ⚛️           |
| Styling          | CSS / Tailwind CSS 🎨 |
| Backend          | Node.js 🟢            |
| API              | Express.js 🚀         |
| Database         | MySQL 🗄️             |
| Authentication   | JWT 🔐                |
| State Management | Context API / Redux   |
| AI Integration   | OpenAI / Gemini 🤖    |

---

# 🎯 Future Enhancements

* 🤖 AI Voice Interviews
* 🎥 Video-Based Interview Practice
* 📄 Advanced Resume Scoring
* 🧠 Personalized Learning Paths
* 🏆 Leaderboards & Gamification
* 📱 Mobile Application
* 🌐 Multi-language Support

---

# 🔒 Security Features

✅ Password Hashing (bcrypt)

✅ JWT Authentication

✅ Role-Based Access Control

✅ Protected Routes

✅ Secure API Communication

---

# 📸 Suggested Dashboard Icons

| Module              | Icon  |
| ------------------- | ----- |
| Dashboard           | 📊    |
| Resume              | 📄    |
| Interview Setup     | ⚙️    |
| Interview Room      | 🎤    |
| Results             | 📈    |
| History             | 📜    |
| Improvements        | 🚀    |
| Admin Dashboard     | 👨‍💼 |
| Question Management | ❓     |
| Authentication      | 🔐    |

---

### ⭐ AI Interview Preparation Assistant

### Helping students crack interviews with confidence.
