import { useEffect, useState } from 'react';
import axios from 'axios';

const initialSetup = {
  platform: 'Frontend Developer',
  language: 'JavaScript',
  difficulty: 'Easy',
  questionCount: 5,
  interviewType: 'Technical'
};

export default function InterviewSetupPage() {
  const [setup, setSetup] = useState(initialSetup);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSetup((prev) => ({ ...prev, [name]: value }));
  };

  const saveSetup = async () => {
    try {
      await axios.post('/api/interview/setup', {
        platform: setup.platform,
        language: setup.language,
        difficulty: setup.difficulty,
        questionCount: Number(setup.questionCount),
        interviewType: setup.interviewType
      });
      setMessage('Interview configuration saved.');
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to save interview setup.');
    }
  };

  const generateQuestions = async (silent = false) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/interview/generate', {
        platform: setup.platform,
        language: setup.language,
        difficulty: setup.difficulty,
        questionCount: Number(setup.questionCount),
        interviewType: setup.interviewType
      });
      setQuestions(response.data.questions);
      if (!silent) {
        setMessage('Questions generated successfully.');
      } else {
        setMessage('Questions are generated.');
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to generate questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQuestions(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [setup.platform, setup.language, setup.difficulty, setup.questionCount, setup.interviewType]);

  return (
    <div className="container page-shell">
      <h2>Interview Setup</h2>
      <p>Select the platform, language, difficulty, and question count before starting your interview.</p>

      <div className="interview-setup-card">
        <div className="interview-setup-row">
          <label>
            Platform
            <select name="platform" value={setup.platform} onChange={handleChange}>
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
            Language
            <select name="language" value={setup.language} onChange={handleChange}>
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
        </div>

        <div className="interview-setup-row">
          <label>
            Difficulty
            <select name="difficulty" value={setup.difficulty} onChange={handleChange}>
              <option>Easy</option>
              <option>Medium</option>
              <option>Hard</option>
            </select>
          </label>
          <label>
            Number Of Questions
            <select name="questionCount" value={setup.questionCount} onChange={handleChange}>
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </label>
        </div>

        <div className="interview-setup-row">
          <label className="radio-group">
            Interview Type
            <div>
              <label>
                <input
                  type="radio"
                  name="interviewType"
                  value="Technical"
                  checked={setup.interviewType === 'Technical'}
                  onChange={handleChange}
                />
                Technical
              </label>
              <label>
                <input
                  type="radio"
                  name="interviewType"
                  value="HR"
                  checked={setup.interviewType === 'HR'}
                  onChange={handleChange}
                />
                HR
              </label>
              <label>
                <input
                  type="radio"
                  name="interviewType"
                  value="Mixed"
                  checked={setup.interviewType === 'Mixed'}
                  onChange={handleChange}
                />
                Mixed
              </label>
            </div>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" onClick={saveSetup}>Save Interview</button>
          <button type="button" onClick={generateQuestions} disabled={loading}>
            {loading ? 'Generating…' : 'Generate Interview'}
          </button>
        </div>

        {message && <div className="message-box">{message}</div>}
      </div>

      {questions.length > 0 && (
        <div className="question-table-card">
          <h3>Interview Questions</h3>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Question</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr key={question.id}>
                  <td>{index + 1}</td>
                  <td>{question.question}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
