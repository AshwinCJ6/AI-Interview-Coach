import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      logout();
      navigate('/login');
    }
  };

  return (
    <nav className="nav-bar">
      <div className="nav-brand">Interview Prep AI</div>
      <div className="nav-links">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/resume">Resume</NavLink>
        <NavLink to="/interview-setup">Interview Setup</NavLink>
        <NavLink to="/history">History</NavLink>
        <NavLink to="/improvements">Improvements</NavLink>
        {user?.role === 'admin' && (
          <>
            <NavLink to="/admin-dashboard">Admin</NavLink>
            <NavLink to="/question-management">Questions</NavLink>
          </>
        )}
      </div>
      <div className="nav-user">
        <span>{user?.name} ({user?.role})</span>
        <button type="button" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
