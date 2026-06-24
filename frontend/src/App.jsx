import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ResumePage from './pages/ResumePage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ResultPage from './pages/ResultPage';
import HistoryPage from './pages/HistoryPage';
import ImprovementsPage from './pages/ImprovementsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import QuestionManagementPage from './pages/QuestionManagementPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import NavBar from './components/NavBar';

function App() {
  const { user } = useAuth();

  return (
    <div className="app-shell">
      {user && <NavBar />}
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/resume" element={<ResumePage />} />
          <Route path="/interview-setup" element={<InterviewSetupPage />} />
          <Route path="/interview-room" element={<InterviewRoomPage />} />
          <Route path="/result" element={<ResultPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/improvements" element={<ImprovementsPage />} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin-dashboard" element={<AdminDashboardPage />} />
          <Route path="/question-management" element={<QuestionManagementPage />} />
        </Route>

        <Route path="*" element={<div className="container"><h2>Page not found</h2></div>} />
      </Routes>
    </div>
  );
}

export default App;
