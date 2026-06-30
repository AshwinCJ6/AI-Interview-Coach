import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const stateData = location.state || {};
  const [interviewId, setInterviewId] = useState(stateData.interviewId || null);

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // Extract interviewId from query parameters if not present in state (e.g. from history page redirect)
  useEffect(() => {
    if (!interviewId) {
      const params = new URLSearchParams(location.search);
      const id = params.get('interviewId');
      if (id) {
        setInterviewId(id);
      } else {
        setErrorMessage('No interview ID provided. Unable to load report.');
        setLoading(false);
      }
    }
  }, [interviewId, location.search]);

  useEffect(() => {
    if (!interviewId) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/interview/interview-report', {
          params: { interviewId }
        });
        setReportData(response.data);
      } catch (error) {
        console.error('Fetch report error:', error);
        setErrorMessage(error?.response?.data?.message || 'Unable to retrieve interview performance report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [interviewId]);

  const toggleExpandQuestion = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
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
        <h3>Generating Final AI Performance Report…</h3>
        <p style={{ color: 'var(--muted)' }}>Analyzing answers, evaluating communication quality, and gathering performance aggregates.</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="container page-shell">
        <div className="error-card text-center" style={{ padding: '40px 20px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Report Load Failed</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{errorMessage}</p>
          <button type="button" className="primary-button" onClick={() => navigate('/dashboard')} style={{ borderRadius: '999px' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { interview, report, questions } = reportData || {};

  const getMeterColor = (val) => {
    if (val >= 80) return '#22c55e'; // Green
    if (val >= 70) return '#38bdf8'; // Blue/Sky
    if (val >= 50) return '#fbbf24'; // Yellow
    return '#ef4444'; // Red
  };

  return (
    <div className="container page-shell">
      {/* Header section */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-strong))',
            color: 'white',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Performance Report
          </span>
          <h2 style={{ margin: '8px 0 4px 0', fontSize: '2.2rem', fontWeight: '800' }}>
            {interview?.platform} Assessment
          </h2>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>
            Topic: {interview?.language} • Difficulty: {interview?.difficulty} • Mode: {interview?.interview_type}
          </p>
        </div>
        <button 
          type="button" 
          onClick={() => navigate('/dashboard')}
          className="secondary-button"
          style={{
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.05)',
            color: '#e2e8f0',
            padding: '10px 20px',
            borderRadius: '12px',
            fontWeight: '600'
          }}
        >
          Return to Dashboard
        </button>
      </div>

      {/* Grid Layout: Left Column = Overall Score + Metrics, Right Column = Completion stats + Strengths */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px',
        marginBottom: '40px'
      }}>
        {/* Left Column */}
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Overall score card */}
          {(() => {
            const score = parseFloat(report?.overallScore) || 0;
            const size = 120;
            const strokeWidth = 9;
            const radius = (size - strokeWidth) / 2;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (score / 100) * circumference;
            const scoreColor = score >= 80 ? '#22c55e' : score >= 70 ? '#38bdf8' : score >= 50 ? '#fbbf24' : '#ef4444';
            return (
              <div style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(56, 189, 248, 0.15) 100%)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '24px',
                padding: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px'
              }}>
                {/* SVG circular progress ring */}
                <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
                  <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                    {/* Track */}
                    <circle
                      cx={size / 2} cy={size / 2} r={radius}
                      fill="rgba(15,23,42,0.8)"
                      stroke="rgba(255,255,255,0.07)"
                      strokeWidth={strokeWidth}
                    />
                    {/* Progress arc */}
                    <circle
                      cx={size / 2} cy={size / 2} r={radius}
                      fill="none"
                      stroke={scoreColor}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1), stroke 0.4s ease', filter: `drop-shadow(0 0 6px ${scoreColor}99)` }}
                    />
                  </svg>
                  {/* Centered label */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '1.35rem', fontWeight: '800', color: '#fff', lineHeight: 1 }}>
                      {score % 1 === 0 ? score : score.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div>
                  <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: '#fff' }}>Overall Score</h3>
                  <p style={{ margin: '4px 0 0 0', color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.5' }}>
                    {score >= 80
                      ? 'Excellent result! You demonstrated stable knowledge of core concepts.'
                      : score >= 60
                        ? 'Good effort! Keep practising to sharpen your skills.'
                        : 'Keep going — every session builds your skills.'}
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Performance Metrics List */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '800' }}>Interview Metrics</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              {[
                { name: 'Technical Knowledge', value: report?.technicalScore, desc: 'Concept understanding & subject correctness' },
                { name: 'Average Answer Coverage', value: report?.averageCoverage, desc: 'Coverage of required topics' },
                { name: 'Communication', value: report?.communicationScore, desc: 'Grammar, sentence logic & tone' },
                { name: 'Problem Solving', value: report?.problemSolvingScore, desc: 'Logical flow & edge case approach' },
                { name: 'Confidence Indicator', value: report?.confidenceScore, desc: 'Independence from follow-up hints' }
              ].map((m, idx) => (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
                    <span style={{ fontWeight: '600', color: '#e2e8f0' }}>{m.name}</span>
                    <span style={{ fontWeight: '700', color: getMeterColor(m.value) }}>{m.value}%</span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '5px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      width: `${m.value}%`,
                      height: '100%',
                      background: getMeterColor(m.value),
                      borderRadius: '5px',
                      transition: 'width 0.8s ease'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginTop: '3px' }}>{m.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'grid', gap: '32px' }}>
          {/* Completion Statistics */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '800' }}>Assessment Stats</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '20px'
            }}>
              {[
                { label: 'Attempted', val: report?.questionsAttempted, icon: '📋' },
                { label: 'Answered', val: report?.questionsAnswered, icon: '✔' },
                { label: 'Sub-questions', val: report?.subQuestionsAsked, icon: '💡' },
                { label: 'Duration', val: `${report?.durationMinutes} Mins`, icon: '⏱️' }
              ].map((s, idx) => (
                <div key={idx} style={{
                  background: 'rgba(15,23,42,0.4)',
                  padding: '16px',
                  borderRadius: '16px',
                  border: '1px solid rgba(148,163,184,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span style={{ fontSize: '1.8rem' }}>{s.icon}</span>
                  <div>
                    <span style={{ display: 'block', color: 'var(--muted)', fontSize: '0.8rem' }}>{s.label}</span>
                    <strong style={{ fontSize: '1.1rem', color: '#fff' }}>{s.val}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div style={{
            background: 'rgba(30, 41, 59, 0.3)',
            border: '1px solid var(--border)',
            borderRadius: '24px',
            padding: '32px'
          }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '1.25rem', fontWeight: '800' }}>Strengths & Improvements</h3>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              <div>
                <span style={{ color: '#22c55e', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  ✔ Key Strengths
                </span>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {report?.strengths.map((str, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{str}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span style={{ color: '#f87171', fontWeight: '700', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  • Areas for Improvement
                </span>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  {report?.improvements.map((imp, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>{imp}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendation Box */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        borderLeft: '4px solid #6366f1',
        borderRadius: '0 20px 20px 0',
        padding: '24px 32px',
        marginBottom: '48px'
      }}>
        <h3 style={{ margin: '0 0 8px 0', color: '#c7d2fe', fontSize: '1.2rem', fontWeight: '800' }}>🤖 AI Recommendation</h3>
        <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.6' }}>
          {report?.recommendations}
        </p>
      </div>

      {/* Detailed Question Review */}
      <div>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', fontWeight: '800' }}>Detailed Question-by-Question Breakdown</h3>
        <p style={{ color: 'var(--muted)', marginTop: '-12px', marginBottom: '24px' }}>
          Click any question below to expand and view candidate responses, follow-up answers, coverage, score, and AI evaluations.
        </p>

        <div style={{ display: 'grid', gap: '20px' }}>
          {questions?.map((q, idx) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div key={q.id} style={{
                background: 'rgba(30, 41, 59, 0.25)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                {/* Header block (clickable) */}
                <div 
                  onClick={() => toggleExpandQuestion(q.id)}
                  style={{
                    padding: '20px 24px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: isExpanded ? 'rgba(255,255,255,0.02)' : 'transparent',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: q.score >= 8 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(251, 191, 36, 0.15)',
                      border: `1px solid ${q.score >= 8 ? '#22c55e' : '#eab308'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      color: q.score >= 8 ? '#22c55e' : '#fbbf24'
                    }}>
                      Q{idx + 1}
                    </div>
                    <span style={{ fontWeight: '600', color: '#f8fafc', fontSize: '1.05rem', flex: 1, paddingRight: '12px' }}>
                      {q.questionText}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <span style={{
                      background: 'rgba(255,255,255,0.05)',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#cbd5e1'
                    }}>
                      Coverage: {q.coverage}%
                    </span>
                    <span style={{
                      fontWeight: '700',
                      color: q.score >= 8 ? '#22c55e' : '#fbbf24',
                      fontSize: '1.05rem'
                    }}>
                      {q.score}/10
                    </span>
                    <span style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>
                      {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div style={{
                    padding: '24px',
                    borderTop: '1px solid var(--border)',
                    background: 'rgba(15, 23, 42, 0.5)',
                    display: 'grid',
                    gap: '20px'
                  }}>
                    {/* Candidate's initial response */}
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', color: 'var(--muted)', fontSize: '0.9rem' }}>Initial Candidate Answer</h4>
                      <p style={{
                        margin: 0,
                        background: 'rgba(15,23,42,0.4)',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        border: '1px solid rgba(148,163,184,0.05)',
                        fontSize: '0.95rem',
                        lineHeight: '1.6',
                        color: '#f3f4f6'
                      }}>
                        {q.userAnswer || 'No answer submitted.'}
                      </p>
                    </div>

                    {/* Sub questions conversation */}
                    {q.subQuestions && q.subQuestions.length > 0 && (
                      <div>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--muted)', fontSize: '0.9rem' }}>Adaptive Conversation Follow-ups</h4>
                        <div style={{ display: 'grid', gap: '14px' }}>
                          {q.subQuestions.map((sub, sIdx) => (
                            <div key={sub.id} style={{
                              background: 'rgba(251, 191, 36, 0.03)',
                              borderLeft: '3px solid #eab308',
                              borderRadius: '0 12px 12px 0',
                              padding: '12px 16px'
                            }}>
                              <strong style={{ color: '#fbbf24', fontSize: '0.85rem', display: 'block', marginBottom: '4px' }}>
                                Follow-up {sIdx + 1}: {sub.questionText}
                              </strong>
                              <span style={{ color: '#e2e8f0', fontSize: '0.95rem', fontStyle: 'italic' }}>
                                Answer: "{sub.userAnswer || 'No answer submitted.'}"
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Feedback */}
                    <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px', marginTop: '4px' }}>
                      <h4 style={{ margin: '0 0 6px 0', color: '#c7d2fe', fontSize: '0.9rem' }}>AI Detailed Feedback</h4>
                      <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.95rem', lineHeight: '1.6' }}>
                        {q.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
