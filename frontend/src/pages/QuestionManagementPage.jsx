import { useEffect, useState } from 'react';
import axios from 'axios';

const initialFormState = {
  question_text: '',
  platform: 'Frontend Developer',
  language: 'JavaScript',
  difficulty: 'Easy',
  category: 'DSA',
  expected_answer: ''
};

export default function QuestionManagementPage() {
  const [form, setForm] = useState(initialFormState);
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ platform: '', language: '', difficulty: '' });
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchQuestions = async (query = {}) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await axios.get(`/api/questions?${params.toString()}`);
    setQuestions(response.data.questions);
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/questions/${editingId}`, form);
        setMessage('Question updated successfully.');
      } else {
        await axios.post('/api/questions', form);
        setMessage('Question saved successfully.');
      }
      setForm(initialFormState);
      setEditingId(null);
      await fetchQuestions(filters);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Unable to save question.';
      setMessage(errorMessage);
    }
  };

  const startEdit = (question) => {
    setForm({
      question_text: question.question_text,
      platform: question.platform,
      language: question.language,
      difficulty: question.difficulty,
      category: question.category,
      expected_answer: question.expected_answer
    });
    setEditingId(question.id);
    setMessage('Editing question. Save changes or clear to add new.');
  };

  const deleteQuestion = async (id) => {
    try {
      await axios.delete(`/api/questions/${id}`);
      setMessage('Question deleted successfully.');
      await fetchQuestions(filters);
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Unable to delete question.';
      setMessage(errorMessage);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyFilters = async () => {
    await fetchQuestions(filters);
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingId(null);
    setMessage('');
  };

  return (
    <div className="container page-shell">
      <h2>Question Management</h2>
      <p>Admin can manage question bank, filter entries, and create new interview questions.</p>

      <div className="question-form-card">
        <h3>{editingId ? 'Edit Question' : 'Add Question'}</h3>
        <form className="question-form" onSubmit={handleSubmit}>
          <label>
            Question
            <textarea name="question_text" value={form.question_text} onChange={handleChange} rows="3" />
          </label>
          <label>
            Platform
            <select name="platform" value={form.platform} onChange={handleChange}>
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Full Stack Developer</option>
              <option>Java Developer</option>
              <option>Python Developer</option>
              <option>React Developer</option>
              <option>Node.js Developer</option>
              <option>AI Engineer</option>
              <option>Data Scientist</option>
              <option>HR Interview</option>
            </select>
          </label>
          <label>
            Programming Language
            <select name="language" value={form.language} onChange={handleChange}>
              <option>Java</option>
              <option>Python</option>
              <option>JavaScript</option>
              <option>TypeScript</option>
              <option>C</option>
              <option>C++</option>
              <option>SQL</option>
              <option>React</option>
              <option>Node.js</option>
            </select>
          </label>
          <label>
            Difficulty
            <select name="difficulty" value={form.difficulty} onChange={handleChange}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>
          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange}>
              <option>DSA</option>
              <option>OOP</option>
              <option>DBMS</option>
              <option>OS</option>
              <option>React</option>
              <option>Node.js</option>
              <option>HR</option>
            </select>
          </label>
          <label>
            Expected Answer
            <textarea
              name="expected_answer"
              value={form.expected_answer}
              onChange={handleChange}
              rows="3"
            />
          </label>
          <div className="form-actions">
            <button type="submit">{editingId ? 'Update Question' : 'Save Question'}</button>
            <button type="button" className="secondary" onClick={resetForm}>
              Clear
            </button>
          </div>
          {message && <div className="message-box">{message}</div>}
        </form>
      </div>

      <div className="question-filter-card">
        <h3>Filter Questions</h3>
        <div className="question-filter-row">
          <select name="platform" value={filters.platform} onChange={handleFilterChange}>
            <option value="">All Platforms</option>
            <option>Frontend Developer</option>
            <option>Backend Developer</option>
            <option>Full Stack Developer</option>
            <option>Java Developer</option>
            <option>Python Developer</option>
            <option>React Developer</option>
            <option>Node.js Developer</option>
            <option>AI Engineer</option>
            <option>Data Scientist</option>
            <option>HR Interview</option>
          </select>
          <select name="language" value={filters.language} onChange={handleFilterChange}>
            <option value="">All Languages</option>
            <option>Java</option>
            <option>Python</option>
            <option>JavaScript</option>
            <option>TypeScript</option>
            <option>C</option>
            <option>C++</option>
            <option>SQL</option>
            <option>React</option>
            <option>Node.js</option>
          </select>
          <select name="difficulty" value={filters.difficulty} onChange={handleFilterChange}>
            <option value="">All Difficulties</option>
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
          <button type="button" onClick={applyFilters}>Apply</button>
        </div>
      </div>

      <div className="question-table-card">
        <h3>Question Bank</h3>
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Platform</th>
              <th>Language</th>
              <th>Difficulty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions.length === 0 ? (
              <tr>
                <td colSpan="5">No questions found.</td>
              </tr>
            ) : (
              questions.map((question) => (
                <tr key={question.id}>
                  <td>{question.question_text}</td>
                  <td>{question.platform}</td>
                  <td>{question.language}</td>
                  <td>{question.difficulty}</td>
                  <td>
                    <button type="button" onClick={() => startEdit(question)}>
                      Edit
                    </button>
                    <button type="button" className="danger" onClick={() => deleteQuestion(question.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
