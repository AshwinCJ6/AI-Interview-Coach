import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const initialSetup = {
  platform: 'Frontend Developer',
  language: 'JavaScript',
  difficulty: 'Easy',
  questionCount: 5,
  interviewType: 'Technical',
  companyDescription: ''
};

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const [setup, setSetup] = useState(initialSetup);
  const [companyDoc, setCompanyDoc] = useState(null);
  const [companyDocName, setCompanyDocName] = useState('No file selected');
  const [companyDocSummary, setCompanyDocSummary] = useState('');
  const [companyUploadMessage, setCompanyUploadMessage] = useState('');
  const [companyUploadLoading, setCompanyUploadLoading] = useState(false);
  const [companyText, setCompanyText] = useState('');
  const [companyTextMessage, setCompanyTextMessage] = useState('');
  const [companyTextLoading, setCompanyTextLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setSetup((prev) => ({ ...prev, [name]: value }));
  };

  const handleCompanyFileChange = (event) => {
    const selected = event.target.files[0];
    if (selected) {
      setCompanyDoc(selected);
      setCompanyDocName(selected.name);
      setCompanyUploadMessage('');
    }
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

  const uploadCompanyDoc = async () => {
    if (!companyDoc) {
      setCompanyUploadMessage('Please select a company document before uploading.');
      return;
    }

    setCompanyUploadLoading(true);
    setCompanyUploadMessage('');

    try {
      const formData = new FormData();
      formData.append('companyDoc', companyDoc);
      formData.append('companyDescription', setup.companyDescription || '');

      const response = await axios.post('/api/interview/company-doc/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setCompanyUploadMessage(response.data.message || 'Company document uploaded successfully.');
      if (response.data.fileName) {
        setCompanyDocName(response.data.fileName);
      }
      if (response.data.summary) {
        setCompanyDocSummary(response.data.summary);
      }
    } catch (error) {
      setCompanyUploadMessage(error?.response?.data?.message || 'Unable to upload company document.');
    } finally {
      setCompanyUploadLoading(false);
    }
  };

  const saveCompanyText = async () => {
    if (!companyText.trim()) {
      setCompanyTextMessage('Please enter company document text before saving.');
      return;
    }

    setCompanyTextLoading(true);
    setCompanyTextMessage('');

    try {
      const response = await axios.post('/api/interview/company-doc/text', {
        companyText,
        companyDescription: setup.companyDescription || ''
      });

      setCompanyTextMessage(response.data.message || 'Company text saved successfully.');
      if (response.data.summary) {
        setCompanyDocSummary(response.data.summary);
      }
      setCompanyText('');
    } catch (error) {
      setCompanyTextMessage(error?.response?.data?.message || 'Unable to save company text.');
    } finally {
      setCompanyTextLoading(false);
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
        interviewType: setup.interviewType,
        companyDescription: setup.companyDescription
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

  const startInterview = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/interview/start', {
        platform: setup.platform,
        language: setup.language,
        difficulty: setup.difficulty,
        questionCount: Number(setup.questionCount),
        interviewType: setup.interviewType,
        companyDescription: setup.companyDescription
      });
      const { interviewId, questions } = response.data;
      navigate('/interview-room', { state: { interviewId, questions } });
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to start interview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadDefaultDifficulty = async () => {
      try {
        const response = await axios.get('/api/admin/ai-config');
        const configuredDifficulty = response?.data?.default_difficulty;
        if (configuredDifficulty) {
          setSetup((prev) => ({
            ...prev,
            difficulty: prev.difficulty === initialSetup.difficulty ? configuredDifficulty : prev.difficulty
          }));
        }
      } catch (error) {
        console.warn('Unable to load default interview difficulty:', error);
      }
    };

    loadDefaultDifficulty();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQuestions(true);
    }, 400);

    return () => clearTimeout(timer);
  }, [setup.platform, setup.language, setup.difficulty, setup.questionCount, setup.interviewType, setup.companyDescription]);

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

        <div className="company-upload-card">
          <h3>Company Documents</h3>
          <p>Upload a company brief or document to tailor questions to the role and employer. This is optional.</p>
          <div className="company-upload-actions">
            <label className="file-upload-button">
              Choose File
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                onChange={handleCompanyFileChange}
              />
            </label>
            <div className="selected-file">Selected: {companyDocName}</div>

            <textarea
              name="companyDescription"
              value={setup.companyDescription}
              onChange={handleChange}
              placeholder="Optional: add company name, role, or notes about the company here."
              rows={4}
            />

            <textarea
              value={companyText}
              onChange={(event) => setCompanyText(event.target.value)}
              placeholder="Paste company document text here instead of uploading a file."
              rows={6}
            />
            <button type="button" className="primary-button" onClick={uploadCompanyDoc} disabled={companyUploadLoading}>
              {companyUploadLoading ? 'Uploading…' : 'Upload Company Document'}
            </button>
            <button type="button" className="primary-button" onClick={saveCompanyText} disabled={companyTextLoading}>
              {companyTextLoading ? 'Saving…' : 'Save Company Text'}
            </button>
            {companyUploadMessage && <div className="upload-message">{companyUploadMessage}</div>}
            {companyTextMessage && <div className="upload-message">{companyTextMessage}</div>}
            {companyDocSummary && (
              <div className="company-upload-summary">
                <strong>Uploaded company document summary:</strong>
                <p>{companyDocSummary}</p>
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={saveSetup}>Save Config</button>
          <button type="button" className="primary-button" onClick={startInterview} disabled={loading}>
            {loading ? 'Starting…' : 'Start Practice Interview'}
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
