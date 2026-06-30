import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function InterviewRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const stateData = location.state || {};
  const { interviewId: initialId, questions: initialQuestions } = stateData;

  const [interviewId, setInterviewId] = useState(initialId || null);
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [userAnswer, setUserAnswer] = useState('');
  const [currentSubQuestion, setCurrentSubQuestion] = useState(null);
  const [subQuestionsAsked, setSubQuestionsAsked] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  // Running timer for interview duration
  useEffect(() => {
    if (!interviewId || evaluation?.completed === false) return; // don't pause on eval, just standard interval
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [interviewId]);

  // Handle case where state is lost (refresh)
  useEffect(() => {
    if (!initialId || !initialQuestions || initialQuestions.length === 0) {
      setErrorMessage('No active interview session found. Please set up a new interview first.');
    }
  }, [initialId, initialQuestions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = async () => {
    if (!userAnswer.trim()) {
      alert('Please enter your answer before submitting.');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await axios.post('/api/interview/evaluate-answer', {
        interviewId,
        responseId: questions[currentIndex].id,
        userAnswer: userAnswer.trim(),
        subQuestionId: currentSubQuestion ? currentSubQuestion.id : null
      });

      const data = response.data;
      
      if (data.completed) {
        // Question is fully answered (coverage reached or 3 sub-questions answered)
        setEvaluation({
          completed: true,
          coverage: data.coverage,
          score: data.score,
          feedback: data.feedback,
          missingConcepts: data.missingConcepts || []
        });
        setCurrentSubQuestion(null);
      } else {
        // AI generated a sub-question
        setEvaluation({
          completed: false,
          coverage: data.coverage,
          feedback: data.feedback,
          missingConcepts: data.missingConcepts || []
        });
        
        // Save subquestion list
        const nextSub = data.subQuestion;
        setCurrentSubQuestion(nextSub);
        setSubQuestionsAsked((prev) => [...prev, {
          subQuestionText: nextSub.questionText,
          answer: '' // will be updated when evaluated
        }]);
        setUserAnswer(''); // Clear answer field for sub-question
      }
    } catch (error) {
      console.error('Answer submission error:', error);
      setErrorMessage(error?.response?.data?.message || 'Failed to evaluate answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setUserAnswer('');
    setEvaluation(null);
    setCurrentSubQuestion(null);
    setSubQuestionsAsked([]);
    
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // All questions completed! Route to ResultPage
      navigate('/result', { state: { interviewId } });
    }
  };

  if (errorMessage) {
    return (
      <div className="container page-shell">
        <div className="error-card text-center" style={{ padding: '40px 20px' }}>
          <h2 style={{ color: '#ef4444', marginBottom: '16px' }}>Session Expired or Missing</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{errorMessage}</p>
          <button 
            type="button" 
            className="primary-button" 
            onClick={() => navigate('/interview-setup')}
            style={{ borderRadius: '999px' }}
          >
            Go to Setup
          </button>
        </div>
      </div>
    );
  }

  const currentMainQuestion = questions[currentIndex] || {};
  const progressPercent = Math.round(((currentIndex) / questions.length) * 100);

  return (
    <div className="container page-shell">
      {/* Top Session Stats */}
      <div className="interview-room-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '16px',
        marginBottom: '28px'
      }}>
        <div>
          <span style={{ 
            color: 'var(--muted)', 
            fontSize: '0.9rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            fontWeight: '600'
          }}>
            AI Practice Session
          </span>
          <h2 style={{ margin: '4px 0 0 0', fontSize: '1.8rem', fontWeight: '800' }}>
            Question {currentIndex + 1} of {questions.length}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="timer-badge" style={{
            background: 'rgba(255,255,255,0.06)',
            padding: '8px 16px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            fontWeight: '700',
            fontFamily: 'monospace',
            color: '#60a5fa',
            fontSize: '1.1rem'
          }}>
            ⏱️ {formatTime(elapsedTime)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '6px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '3px',
        marginBottom: '32px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progressPercent}%`,
          height: '100%',
          background: 'linear-gradient(90deg, #6366f1, #38bdf8)',
          borderRadius: '3px',
          transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}></div>
      </div>

      {/* Question & Answer Card */}
      <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="room-card" style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          padding: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
        }}>
          {/* Main Question Display */}
          <div style={{ marginBottom: '24px' }}>
            <span style={{
              background: 'rgba(99, 102, 241, 0.15)',
              color: '#a5b4fc',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: '700',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              Main Question
            </span>
            <p style={{
              fontSize: '1.25rem',
              fontWeight: '600',
              lineHeight: '1.6',
              color: '#f8fafc',
              margin: 0
            }}>
              {currentMainQuestion.questionText}
            </p>
          </div>

          {/* Follow-up Sub-questions Log */}
          {subQuestionsAsked.length > 0 && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid rgba(148, 163, 184, 0.1)'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#cbd5e1', fontSize: '0.95rem' }}>Adaptive Conversation History</h4>
              {subQuestionsAsked.map((sub, index) => (
                <div key={index} style={{ marginBottom: index === subQuestionsAsked.length - 1 ? 0 : '16px' }}>
                  <div style={{ color: '#fbbf24', fontSize: '0.9rem', fontWeight: '600' }}>AI Follow-up {index + 1}:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.95rem', fontStyle: 'italic', margin: '4px 0' }}>"{sub.subQuestionText}"</div>
                </div>
              ))}
            </div>
          )}

          {/* Current Sub-question Input Header */}
          {currentSubQuestion && (
            <div style={{
              background: 'rgba(251, 191, 36, 0.1)',
              borderLeft: '4px solid #fbbf24',
              padding: '16px 20px',
              borderRadius: '0 12px 12px 0',
              marginBottom: '24px'
            }}>
              <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                Follow-up Question (Needs Response)
              </span>
              <p style={{ margin: '6px 0 0 0', fontWeight: '600', fontSize: '1.1rem', color: '#fef3c7' }}>
                {currentSubQuestion.questionText}
              </p>
            </div>
          )}

          {/* Input Text Area */}
          {!evaluation?.completed ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={{ fontWeight: '600', color: '#cbd5e1', fontSize: '0.95rem' }}>
                {currentSubQuestion ? 'Provide details for the follow-up question:' : 'Type your answer here:'}
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={currentSubQuestion 
                    ? "Explain the concept, logic, or code related to the follow-up..." 
                    : "Explain virtual DOM, reconciliation, diffing, state changes, etc..."}
                  rows={8}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '16px',
                    borderRadius: '16px',
                    border: '1px solid rgba(148, 163, 184, 0.3)',
                    background: 'rgba(15, 23, 42, 0.6)',
                    color: '#e2e8f0',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    resize: 'vertical'
                  }}
                  disabled={loading}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleAnswerSubmit}
                  disabled={loading || !userAnswer.trim()}
                  className="primary-button"
                  style={{
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    boxShadow: '0 10px 20px rgba(99, 102, 241, 0.2)'
                  }}
                >
                  {loading ? 'Evaluating Response…' : 'Submit Answer'}
                </button>
              </div>
            </div>
          ) : (
            // Evaluation Dashboard / Question Complete
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: '20px',
              padding: '28px',
              border: '1px solid var(--border)',
              display: 'grid',
              gap: '24px'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(34, 197, 94, 0.15)',
                    border: '2px solid #22c55e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#22c55e',
                    fontSize: '1.5rem',
                    fontWeight: '800'
                  }}>
                    {evaluation.score}/10
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: '700' }}>Question Completed</h3>
                    <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '0.9rem' }}>Scored based on final answer coverage</p>
                  </div>
                </div>

                {/* Answer Coverage meter */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: '#e2e8f0', fontWeight: '600' }}>Answer Coverage:</span>
                  <div style={{
                    width: '120px',
                    height: '14px',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: '7px',
                    overflow: 'hidden',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      width: `${evaluation.coverage}%`,
                      height: '100%',
                      background: evaluation.coverage >= 70 ? '#22c55e' : '#eab308'
                    }}></div>
                  </div>
                  <span style={{ fontWeight: '700', color: evaluation.coverage >= 70 ? '#22c55e' : '#eab308' }}>
                    {evaluation.coverage}%
                  </span>
                </div>
              </div>

              {/* Feedback and Missing Concepts */}
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '16px' }}>
                  <h4 style={{ margin: '0 0 6px 0', color: '#c7d2fe', fontSize: '0.95rem' }}>AI Feedback</h4>
                  <p style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', lineHeight: '1.5' }}>{evaluation.feedback}</p>
                </div>

                {evaluation.missingConcepts.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', color: '#f87171', fontSize: '0.9rem' }}>Missing Concepts & Suggestions</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {evaluation.missingConcepts.map((concept, index) => (
                        <span key={index} style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          color: '#fca5a5',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          fontWeight: '600'
                        }}>
                          • {concept}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Next Question Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="primary-button"
                  style={{
                    padding: '14px 28px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 10px 20px rgba(34, 197, 94, 0.2)'
                  }}
                >
                  {currentIndex + 1 === questions.length ? 'View Performance Analytics' : 'Proceed to Next Question'}
                </button>
              </div>
            </div>
          )}

          {/* Intermediate Evaluation Feedback (while answering sub-questions) */}
          {evaluation && !evaluation.completed && (
            <div style={{
              marginTop: '24px',
              background: 'rgba(251, 191, 36, 0.05)',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <span style={{ color: '#fbbf24', fontWeight: '700', fontSize: '0.9rem' }}>Current Answer Coverage: {evaluation.coverage}%</span>
                <p style={{ margin: '4px 0 0 0', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  Coverage is below the required 70% threshold. Answer the follow-up question to improve.
                </p>
              </div>
              <div style={{
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fcd34d',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}>
                Adaptive Probing Mode
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
