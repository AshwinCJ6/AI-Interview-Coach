# Interview Preparation Assistant

## Overview
Simple interview preparation assistant with frontend React app and backend Express auth API.

## Backend Setup
1. Open `backend` folder
2. Create `.env` with:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=interview_prep
JWT_SECRET=your_jwt_secret
PORT=5000
```

3. Install packages:
```
npm install
```
4. Create the `users` table using MySQL:

```
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

5. Start backend:
```
npm run dev
```

## Frontend Setup
1. Open `frontend` folder
2. Install packages:
```
npm install
```
3. Start frontend:
```
npm run dev
```

## Notes
- Login and registration use role-based auth.
- Admin-only pages can be extended from `AdminDashboardPage.jsx` and `QuestionManagementPage.jsx`.
- The frontend currently stores token in localStorage for demo purposes.
