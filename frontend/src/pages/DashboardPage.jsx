import { useAuth } from '../contexts/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container page-shell">
      <h2>{user?.role === 'admin' ? 'Admin Dashboard' : 'Student Dashboard'}</h2>
      <p>Welcome back, {user?.name}. Use the navigation menu to access your interview preparation workflow.</p>
    </div>
  );
}
