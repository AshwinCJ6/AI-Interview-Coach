import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [historyData, setHistoryData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/interview/performance-analysis');
        setHistoryData(response.data);
      } catch (error) {
        console.error('Fetch history error:', error);
        setErrorMessage(error?.response?.data?.message || 'Unable to retrieve interview history.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container page-shell text-center" style={{ padding: '60px 20px' }}>
        <div className="spinner" style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(255,255,255,0.1)',
          borderTop: '4px solid var(--primary)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <h3>Loading Interview History…</h3>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container page-shell">
        <div className="error-card text-center" style={{ padding: '40px 20px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>History Load Failed</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{errorMessage}</p>
          <button type="button" className="primary-button" onClick={() => navigate('/dashboard')} style={{ borderRadius: '999px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const hasHistory = historyData && historyData.hasData && historyData.historyTrend && historyData.historyTrend.length > 0;
  const historyList = hasHistory ? [...historyData.historyTrend].reverse() : []; // show newest first

  return (
    <div className="container page-shell">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '32px' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
          Practice Records
        </span>
        <h2 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: '800' }}>Interview History</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>Review past AI assessment logs, check overall progress, and check detailed feedback.</p>
      </div>

      {!hasHistory ? (
        <div className="text-center" style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📝</div>
          <h3>No practice records found</h3>
          <p style={{ color: 'var(--muted)', maxWidth: '440px', margin: '8px auto 24px', lineHeight: '1.6' }}>
            You haven't taken any practice interviews yet. Set up a profile or company requirements to run your first simulation!
          </p>
          <button
            type="button"
            className="primary-button"
            onClick={() => navigate('/interview-setup')}
            style={{ borderRadius: '999px', padding: '12px 24px', fontWeight: '700' }}
          >
            Start Setup
          </button>
        </div>
      ) : (
        <div className="question-table-card" style={{ background: 'rgba(30, 41, 59, 0.25)', border: '1px solid var(--border)', borderRadius: '24px', padding: '24px 20px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Date & Time</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Role / Topic</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Difficulty</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Score</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Avg Coverage</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em' }}>Duration</th>
                <th style={{ color: '#94a3b8', padding: '16px', textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.05em', textAnchor: 'middle' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item) => (
                <tr key={item.interviewId} style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.1)', transition: 'background-color 0.2s ease' }} className="history-row">
                  <td style={{ padding: '16px', color: '#e2e8f0', fontSize: '0.95rem' }}>{formatDate(item.date)}</td>
                  <td style={{ padding: '16px', color: '#ffffff', fontWeight: '600', fontSize: '0.95rem' }}>{item.platform}</td>
                  <td style={{ padding: '16px', color: '#cbd5e1', fontSize: '0.95rem' }}>
                    <span style={{
                      background: item.difficulty === 'Hard' ? 'rgba(239, 68, 68, 0.15)' : item.difficulty === 'Medium' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                      color: item.difficulty === 'Hard' ? '#fca5a5' : item.difficulty === 'Medium' ? '#fde047' : '#bbf7d0',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: '700'
                    }}>
                      {item.difficulty}
                    </span>
                  </td>
                  <td style={{ padding: '16px', color: '#60a5fa', fontWeight: '800', fontSize: '1.1rem' }}>
                    {item.overallScore}%
                  </td>
                  <td style={{ padding: '16px', color: '#22c55e', fontWeight: '700', fontSize: '0.95rem' }}>
                    {item.averageCoverage}%
                  </td>
                  <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.95rem' }}>
                    {item.durationMinutes} mins
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => navigate(`/result?interviewId=${item.interviewId}`, { state: { interviewId: item.interviewId } })}
                      className="primary-button"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-strong))',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 10px rgba(99, 102, 241, 0.15)'
                      }}
                    >
                      View Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <style>{`
            .history-row:hover {
              background-color: rgba(255, 255, 255, 0.02);
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
