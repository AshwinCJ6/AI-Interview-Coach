import { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = {
  question_text: '',
  platform: 'Frontend Developer',
  language: 'JavaScript',
  difficulty: 'Medium',
  question_type: 'Subjective',
  keywords: '',
  expected_answer: ''
};

export default function QuestionManagementPage() {
  const [activeTab, setActiveTab] = useState('questions');
  
  // Question State
  const [form, setForm] = useState(initialFormState);
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ platform: '', language: '', difficulty: '', question_type: '', search: '' });
  const [editingId, setEditingId] = useState(null);
  const [questionMsg, setQuestionMsg] = useState('');
  
  // Modal State
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });

  // Dropdown options
  const [platforms, setPlatforms] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [difficulties, setDifficulties] = useState([]);
  const [questionTypes, setQuestionTypes] = useState([]);

  useEffect(() => {
    fetchQuestions();
  }, []);

  // ─── Questions ─────────────────────────────────────────────────────────

  const fetchQuestions = async (query = filters) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    try {
      const response = await axios.get(`/api/questions?${params.toString()}`);
      setQuestions(response.data.questions);
      setPlatforms(response.data.platforms || []);
      setLanguages(response.data.languages || []);
      setDifficulties(response.data.difficulties || []);
      setQuestionTypes(response.data.questionTypes || ['Objective', 'Subjective', 'Coding', 'Scenario Based']);
    } catch (error) {
      console.error('Failed to fetch questions', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setQuestionMsg('');
    try {
      if (editingId) {
        await axios.put(`/api/questions/${editingId}`, form);
        setQuestionMsg('✅ Question updated successfully.');
      } else {
        await axios.post('/api/questions', form);
        setQuestionMsg('✅ Question saved successfully.');
      }
      setForm(initialFormState);
      setEditingId(null);
      fetchQuestions(filters);
    } catch (error) {
      setQuestionMsg(`❌ ${error.response?.data?.message || 'Unable to save question.'}`);
    }
  };

  const startEdit = (q) => {
    setForm({
      question_text: q.question_text,
      platform: q.platform,
      language: q.language,
      difficulty: q.difficulty,
      question_type: q.question_type || 'Subjective',
      keywords: q.keywords || '',
      expected_answer: q.expected_answer || ''
    });
    setEditingId(q.id);
    setActiveTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuestionMsg('Editing question. Save changes or clear to add new.');
  };

  const confirmDeleteQuestion = async () => {
    if (!deleteModal.id) return;
    try {
      await axios.delete(`/api/questions/${deleteModal.id}`);
      setQuestionMsg('✅ Question deleted successfully.');
      fetchQuestions(filters);
    } catch (error) {
      setQuestionMsg(`❌ ${error?.response?.data?.message || 'Unable to delete question.'}`);
    } finally {
      setDeleteModal({ isOpen: false, id: null });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchQuestions(filters);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setQuestionMsg('');
  };

  return (
    <div className="container page-shell">
      <h2>📚 Question Bank Management</h2>
      <p>Admin can manage the centralized database of interview questions and categories.</p>

      <div className="admin-tab-bar" style={{ marginTop: '24px' }}>
        <button
          className={`admin-tab-btn ${activeTab === 'questions' ? 'admin-tab-active' : ''}`}
          onClick={() => setActiveTab('questions')}
        >
          Questions
        </button>
      </div>

      {activeTab === 'questions' && (
        <div className="admin-tab-content">
          {/* Add / Edit Question Form */}
          <div className="question-form-card">
            <h3>{editingId ? '✏️ Edit Question' : '➕ Add Question'}</h3>
            <form className="question-form" onSubmit={handleSubmit}>
              <div className="form-grid-2">
                <label>
                  Platform (Domain)
                  <select name="platform" value={form.platform} onChange={handleChange}>
                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
                <label>
                  Programming Language
                  <select name="language" value={form.language} onChange={handleChange}>
                    {languages.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </label>
                <label>
                  Difficulty
                  <select name="difficulty" value={form.difficulty} onChange={handleChange}>
                    {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </label>
                <label>
                  Question Type
                  <select name="question_type" value={form.question_type} onChange={handleChange}>
                    {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
              </div>

              <label>
                Question Text
                <textarea name="question_text" value={form.question_text} onChange={handleChange} rows="3" required placeholder="E.g. Explain how React hooks work under the hood." />
              </label>
              
              <label>
                Expected Answer (for AI evaluation context)
                <textarea name="expected_answer" value={form.expected_answer} onChange={handleChange} rows="3" placeholder="Core concepts that should be covered in the answer..." />
              </label>

              <label>
                Keywords (comma separated)
                <input type="text" name="keywords" value={form.keywords} onChange={handleChange} placeholder="E.g. useState, useEffect, fiber, closure" />
              </label>

              <div className="form-actions">
                <button type="submit" className="primary-button">{editingId ? 'Update Question' : 'Save Question'}</button>
                <button type="button" className="secondary" onClick={resetForm} style={{ padding: '14px 18px', borderRadius: '16px', border: '1px solid #475569', background: 'transparent', color: '#f8fafc', fontWeight: '600' }}>
                  Clear Form
                </button>
              </div>
              {questionMsg && <div className="message-box" style={{ marginTop: '16px' }}>{questionMsg}</div>}
            </form>
          </div>

          {/* Filters & Search */}
          <div className="question-filter-card" style={{ marginTop: '24px' }}>
            <h3>🔍 Search & Filter</h3>
            <div className="question-filter-row">
              <input
                type="text"
                name="search"
                value={filters.search}
                onChange={handleFilterChange}
                placeholder="Search by question text..."
                style={{ flex: '1 1 200px' }}
              />
              <select name="platform" value={filters.platform} onChange={handleFilterChange}>
                <option value="">All Domains</option>
                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
                <option value="">All Difficulties</option>
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select name="question_type" value={filters.question_type} onChange={handleFilterChange}>
                <option value="">All Types</option>
                {questionTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button type="button" onClick={applyFilters} className="primary-button">Apply</button>
            </div>
          </div>

          {/* Questions Table */}
          <div className="question-table-card" style={{ marginTop: '24px', overflowX: 'auto' }}>
            <h3>Question Bank ({questions.length})</h3>
            <table className="admin-table" style={{ minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Difficulty</th>
                  <th style={{ width: '150px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="admin-empty">No questions found. Try adjusting filters.</td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <div style={{ fontWeight: '500', marginBottom: '4px' }}>{q.question_text.length > 80 ? q.question_text.substring(0, 80) + '...' : q.question_text}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Keywords: {q.keywords || 'None'}</div>
                      </td>
                      <td>
                        <div>{q.platform}</div>
                        <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{q.category}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem', padding: '4px 8px', background: '#334155', borderRadius: '4px' }}>
                          {q.question_type}
                        </span>
                      </td>
                      <td>
                        <span className={`difficulty-badge diff-${q.difficulty.toLowerCase()}`}>
                          {q.difficulty}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button type="button" onClick={() => startEdit(q)} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '8px', background: '#4f46e5', color: 'white', border: 'none' }}>
                            Edit
                          </button>
                          <button type="button" className="danger" onClick={() => setDeleteModal({ isOpen: true, id: q.id })} style={{ padding: '6px 12px', fontSize: '0.9rem', borderRadius: '8px', border: 'none' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 style={{ marginTop: '0', color: '#f8fafc' }}>⚠️ Confirmation Required</h3>
            <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>Are you sure you want to delete this question? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button onClick={() => setDeleteModal({ isOpen: false, id: null })} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #475569', background: 'transparent', color: '#f8fafc' }}>
                No, Cancel
              </button>
              <button onClick={confirmDeleteQuestion} className="danger" style={{ padding: '10px 16px', borderRadius: '8px', border: 'none' }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
