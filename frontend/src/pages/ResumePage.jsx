import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export default function ResumePage() {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [selectedName, setSelectedName] = useState('No file selected');
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/resume/profile');
        setProfile(response.data.profile);
      } catch (error) {
        setProfile(null);
      }
    };

    fetchProfile();
  }, []);

  const handleFileChange = (event) => {
    const selected = event.target.files[0];
    if (selected) {
      setFile(selected);
      setSelectedName(selected.name);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Please select a resume file first.');
      return;
    }

    const formData = new FormData();
    formData.append('resume', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/resume/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setProfile(response.data.profile);
      setMessage(response.data.message || 'Resume uploaded successfully.');
    } catch (error) {
      const errorMessage = error?.response?.data?.message || 'Upload failed.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-shell">
      <h2>Resume Management</h2>
      <div className="resume-upload-card">
        <div className="resume-upload-header">Upload Resume</div>
        <div className="resume-upload-actions">
          <label className="file-upload-button">
            Choose File
            <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
          </label>
          <div className="selected-file">Selected File: {selectedName}</div>
          <button type="button" className="primary-button" disabled={loading} onClick={handleUpload}>
            {loading ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
        {message && <div className="upload-message">{message}</div>}
      </div>

      {profile && (
        <div className="extracted-profile-card">
          <div className="profile-title">Extracted Profile</div>
          <div><strong>Name:</strong> {profile.name || user?.name || 'N/A'}</div>
          <div><strong>Skills:</strong> {profile.skills || 'N/A'}</div>
          <div><strong>Education:</strong> {profile.education || 'N/A'}</div>
          <div><strong>Projects:</strong> {profile.projects || 'N/A'}</div>
          <div><strong>Experience:</strong> {profile.experience || 'N/A'}</div>
          <div><strong>Certifications:</strong> {profile.certifications || 'N/A'}</div>
        </div>
      )}
    </div>
  );
}
