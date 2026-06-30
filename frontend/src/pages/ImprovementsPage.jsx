import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ImprovementsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/interview/performance-analysis');
        setAnalysis(response.data);
      } catch (error) {
        console.error('Fetch analysis error:', error);
        setErrorMessage(error?.response?.data?.message || 'Unable to retrieve performance analysis.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, []);

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
        <h3>Analyzing Historical Data…</h3>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container page-shell">
        <div className="error-card text-center" style={{ padding: '40px 20px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Analysis Load Failed</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{errorMessage}</p>
          <button type="button" className="primary-button" onClick={() => navigate('/dashboard')} style={{ borderRadius: '999px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!analysis || !analysis.hasData) {
    return (
      <div className="container page-shell text-center" style={{ padding: '80px 20px' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '20px' }}>📊</div>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '12px' }}>AI Feedback Dashboard</h2>
        <p style={{ color: 'var(--muted)', maxWidth: '480px', margin: '0 auto 24px', lineHeight: '1.6' }}>
          You have not completed any AI practice interviews yet. Complete your first interview session to unlock historical analysis, strengths discovery, and trend tracking.
        </p>
        <button 
          type="button" 
          className="primary-button" 
          onClick={() => navigate('/interview-setup')}
          style={{ padding: '14px 28px', borderRadius: '999px', fontWeight: '700' }}
        >
          Start Setup Now
        </button>
      </div>
    );
  }

  const { aggregates, historyTrend, strengths, improvements } = analysis;

  // Render SVG Chart for History Trend
  const renderTrendChart = () => {
    if (historyTrend.length < 2) {
      return (
        <div style={{
          height: '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(15,23,42,0.4)',
          borderRadius: '16px',
          border: '1px dashed var(--border)',
          color: 'var(--muted)',
          fontSize: '0.9rem'
        }}>
          Need at least 2 completed interviews to plot progress trend.
        </div>
      );
    }

    const chartWidth = 500;
    const chartHeight = 220;
    const padding = 30;

    const minX = 0;
    const maxX = historyTrend.length - 1;
    const minY = 0;
    const maxY = 100;

    const points = historyTrend.map((t, idx) => {
      const x = padding + (idx / maxX) * (chartWidth - padding * 2);
      const y = chartHeight - padding - (t.overallScore / maxY) * (chartHeight - padding * 2);
      return { x, y, score: t.overallScore, label: t.platform };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div style={{ width: '100%', overflowX: 'auto', background: 'rgba(15,23,42,0.3)', padding: '20px', borderRadius: '20px', border: '1px solid var(--border)' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', minWidth: '400px' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(yVal => {
            const y = chartHeight - padding - (yVal / maxY) * (chartHeight - padding * 2);
            return (
              <g key={yVal}>
                <line x1={padding} y1={y} x2={chartWidth - padding} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3" />
                <text x={padding - 10} y={y + 4} fill="var(--muted)" fontSize="9" textAnchor="end">{yVal}%</text>
              </g>
            );
          })}

          {/* Line */}
          <path d={linePath} fill="none" stroke="url(#line-grad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots */}
          {points.map((p, idx) => (
            <g key={idx}>
              <circle cx={p.x} cy={p.y} r="5" fill="#6366f1" stroke="#fff" strokeWidth="2" />
              <text x={p.x} y={p.y - 12} fill="#fff" fontSize="9" fontWeight="700" textAnchor="middle">{p.score}%</text>
              <text x={p.x} y={chartHeight - padding + 14} fill="var(--muted)" fontSize="8" textAnchor="middle">
                Int {idx + 1}
              </text>
            </g>
          ))}

          {/* Gradients */}
          <defs>
            <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#38bdf8" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="container page-shell">
      <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '20px', marginBottom: '32px' }}>
        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>
          Analytics Center
        </span>
        <h2 style={{ margin: '4px 0 0 0', fontSize: '2.2rem', fontWeight: '800' }}>AI Feedback Dashboard</h2>
        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>Track core technical skill evolution and target weak areas recursively.</p>
      </div>

      {/* Numerical aggregate widgets */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {[
          { label: 'Interviews Completed', val: aggregates.interviewsCompleted, color: '#6366f1' },
          { label: 'Avg Overall Score', val: `${aggregates.overallScore}%`, color: '#22c55e' },
          { label: 'Avg Concept Coverage', val: `${aggregates.averageCoverage}%`, color: '#38bdf8' },
          { label: 'Follow-ups Resolved', val: aggregates.subQuestionsAsked, color: '#fbbf24' }
        ].map((item, idx) => (
          <div key={idx} style={{
            background: 'rgba(30,41,59,0.3)',
            border: '1px solid var(--border)',
            padding: '24px',
            borderRadius: '20px',
            display: 'grid',
            gap: '8px'
          }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.85rem', fontWeight: '600' }}>{item.label}</span>
            <strong style={{ fontSize: '1.8rem', color: item.color, fontWeight: '800' }}>{item.val}</strong>
          </div>
        ))}
      </div>

      {/* Grid: Trend Chart on left, Core Vectors on right */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        marginBottom: '40px'
      }}>
        <div>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.25rem', fontWeight: '800' }}>Performance Progress Trend</h3>
          {renderTrendChart()}
        </div>

        <div style={{
          background: 'rgba(30, 41, 59, 0.3)',
          border: '1px solid var(--border)',
          borderRadius: '24px',
          padding: '32px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '800' }}>Aggregate Core Strengths</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            {[
              { name: 'Technical Knowledge', value: aggregates.technicalKnowledge },
              { name: 'Communication Quality', value: aggregates.communication },
              { name: 'Problem Solving Ability', value: aggregates.problemSolving },
              { name: 'Confidence Vector', value: aggregates.confidence }
            ].map((v, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                  <span style={{ color: '#cbd5e1', fontWeight: '600' }}>{v.name}</span>
                  <span style={{ fontWeight: '700', color: '#6366f1' }}>{v.value}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${v.value}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
                    borderRadius: '4px'
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate Strengths and Improvements lists */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        marginBottom: '40px'
      }}>
        {/* Left List */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.25)',
          border: '1px solid var(--border)',
          padding: '32px',
          borderRadius: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '800', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✔ Verified Strong Subjects
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7' }}>
            {strengths.length > 0 ? strengths.map((s, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{s}</li>
            )) : (
              <li style={{ color: 'var(--muted)', listStyle: 'none', marginLeft: '-20px' }}>No verified strong subjects saved yet.</li>
            )}
          </ul>
        </div>

        {/* Right List */}
        <div style={{
          background: 'rgba(30, 41, 59, 0.25)',
          border: '1px solid var(--border)',
          padding: '32px',
          borderRadius: '20px'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: '800', color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Targeted Practice Focus
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.7' }}>
            {improvements.length > 0 ? improvements.map((i, idx) => (
              <li key={idx} style={{ marginBottom: '6px' }}>{i}</li>
            )) : (
              <li style={{ color: 'var(--muted)', listStyle: 'none', marginLeft: '-20px' }}>No practice points identified yet. Great work!</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}