import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInterviews: 0,
    avgScore: 0,
    mostSelectedDomain: 'N/A'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/interview/performance-analysis');
        if (response.data && response.data.hasData) {
          const { aggregates, historyTrend } = response.data;
          
          let domainCounts = {};
          let maxDomain = 'N/A';
          let maxCount = 0;
          
          if (historyTrend && historyTrend.length > 0) {
            historyTrend.forEach(interview => {
              const domain = interview.platform || 'Unknown';
              domainCounts[domain] = (domainCounts[domain] || 0) + 1;
              if (domainCounts[domain] > maxCount) {
                maxCount = domainCounts[domain];
                maxDomain = domain;
              }
            });
          }

          setStats({
            totalInterviews: aggregates?.interviewsCompleted || 0,
            avgScore: aggregates?.overallScore || 0,
            mostSelectedDomain: maxDomain
          });
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container page-shell">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '32px' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '2.2rem', fontWeight: '800' }}>Student Dashboard</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem' }}>
          Welcome back, <span style={{ color: 'var(--primary)', fontWeight: '600' }}>{user?.name}</span>. Here's a summary of your interview preparation progress.
        </p>
      </div>

      {loading ? (
        <div className="text-center" style={{ padding: '40px' }}>
          <p style={{ color: 'var(--muted)' }}>Loading your statistics...</p>
        </div>
      ) : (
        <>
          <div className="dashboard-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            <div className="stat-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🎯</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Interviews</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{stats.totalInterviews}</div>
            </div>

            <div className="stat-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📈</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Average Score</div>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#fff' }}>{stats.avgScore}%</div>
            </div>

            <div className="stat-card" style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border)',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💼</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Most Selected Domain</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#fff', minHeight: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {stats.mostSelectedDomain}
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/interview-setup" className="primary-button" style={{ fontSize: '1.1rem', padding: '12px 32px', borderRadius: '999px', display: 'inline-flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
              Start New Interview 🚀
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
