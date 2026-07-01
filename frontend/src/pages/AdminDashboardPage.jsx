import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

// ─── Sub-components ───────────────────────────────────────────────────────

function StatWidget({ icon, label, value, accent }) {
  return (
    <div className="stat-widget" style={{ '--accent': accent }}>
      <div className="stat-widget-icon">{icon}</div>
      <div className="stat-widget-info">
        <div className="stat-widget-value">{value}</div>
        <div className="stat-widget-label">{label}</div>
      </div>
    </div>
  );
}

function DifficultyBadge({ level }) {
  const colors = { Easy: '#22c55e', Medium: '#f59e0b', Hard: '#ef4444' };
  return (
    <span className="difficulty-badge" style={{ background: colors[level] || '#6366f1' }}>
      {level}
    </span>
  );
}

function StatusBadge({ active }) {
  return (
    <span className="status-badge" style={{ background: active ? '#22c55e22' : 'rgba(239, 68, 68, 0.15)', color: active ? '#22c55e' : '#ef4444', border: active ? '1px solid #22c55e55' : '1px solid rgba(239, 68, 68, 0.3)' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function ProgressBar({ value, max = 100, color = '#6366f1' }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      <span className="progress-label">{value}%</span>
    </div>
  );
}

// ─── Tab: Dashboard ───────────────────────────────────────────────────────

function DashboardTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/dashboard')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading dashboard…</div>;
  if (!data) return <div className="admin-error">Could not load dashboard data.</div>;

  const widgets = [
    { icon: '👥', label: 'Total Registered Students', value: data.total_students, accent: '#6366f1' },
    { icon: '🎯', label: 'Total Interviews Conducted', value: data.total_interviews.toLocaleString(), accent: '#38bdf8' },
    { icon: '📊', label: 'Average Interview Score', value: `${data.avg_score}%`, accent: '#22c55e' },
    { icon: '🏆', label: 'Most Selected Domain', value: data.most_selected_domain, accent: '#f59e0b' },
    { icon: '⚡', label: 'Most Difficult Topic', value: data.most_difficult_topic, accent: '#ef4444' },
    { icon: '📅', label: "Today's Interviews", value: data.today_interviews, accent: '#a855f7' },
    { icon: '🟢', label: 'Active Students (7 days)', value: data.active_students, accent: '#10b981' },
  ];

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h3>Platform Overview</h3>
        <p>Real-time snapshot of the entire AI Interview Preparation platform.</p>
      </div>
      <div className="stat-grid">
        {widgets.map((w) => (
          <StatWidget key={w.label} icon={w.icon} label={w.label} value={w.value} accent={w.accent} />
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Student Monitoring ──────────────────────────────────────────────

function StudentsTab() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axios.get('/api/admin/students')
      .then(r => setStudents(r.data.students || []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const isActive = (student) => {
    if (!student.last_login) return false;
    const diff = Date.now() - new Date(student.last_login).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  if (loading) return <div className="admin-loading">Loading students…</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h3>Student Monitoring</h3>
        <p>Monitor all registered students, their interview activity and performance.</p>
      </div>
      <div className="admin-search-row">
        <input
          className="admin-search-input"
          placeholder="🔍  Search by name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span className="admin-count-badge">{filtered.length} students</span>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Student</th>
              <th>Email</th>
              <th>Registered</th>
              <th>Resume</th>
              <th>Interviews</th>
              <th>Avg Score</th>
              <th>Latest Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="9" className="admin-empty">No students found.</td></tr>
            ) : (
              filtered.map((s, i) => (
                <tr key={s.id}>
                  <td className="admin-td-muted">{i + 1}</td>
                  <td><strong>{s.name}</strong></td>
                  <td className="admin-td-muted">{s.email}</td>
                  <td className="admin-td-muted">{s.registered_at ? new Date(s.registered_at).toLocaleDateString() : '—'}</td>
                  <td>{s.has_resume > 0 ? <span className="badge-yes">✔ Uploaded</span> : <span className="badge-no">✗ None</span>}</td>
                  <td>{s.interview_count || 0}</td>
                  <td>{s.avg_score ? `${s.avg_score}%` : '—'}</td>
                  <td>{s.latest_score ? `${s.latest_score}%` : '—'}</td>
                  <td><StatusBadge active={isActive(s)} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Interview Statistics ────────────────────────────────────────────

function StatisticsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/statistics')
      .then(r => setStats(r.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading statistics…</div>;
  if (!stats) return <div className="admin-error">Could not load statistics.</div>;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h3>Interview Statistics</h3>
        <p>Aggregate performance data across all students and interview sessions.</p>
      </div>

      <div className="stats-cards-grid">
        <div className="stats-card">
          <div className="stats-card-value">{stats.total_interviews}</div>
          <div className="stats-card-label">Total Interviews</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.avg_score}%</div>
          <div className="stats-card-label">Average Score</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.avg_coverage}%</div>
          <div className="stats-card-label">Avg Answer Coverage</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.avg_duration} min</div>
          <div className="stats-card-label">Avg Duration</div>
        </div>
        <div className="stats-card">
          <div className="stats-card-value">{stats.avg_questions_attempted}</div>
          <div className="stats-card-label">Avg Questions Attempted</div>
        </div>
      </div>

      <div className="stats-pass-fail">
        <h4>Pass / Fail Distribution</h4>
        <div className="pass-fail-row">
          <div className="pass-fail-item">
            <span className="pass-label">✅ Pass Rate</span>
            <ProgressBar value={stats.pass_percent} color="#22c55e" />
          </div>
          <div className="pass-fail-item">
            <span className="pass-label">❌ Fail Rate</span>
            <ProgressBar value={stats.fail_percent} color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Performance Analytics ───────────────────────────────────────────

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/analytics')
      .then(r => setData(r.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="admin-loading">Loading analytics…</div>;
  if (!data) return <div className="admin-error">Could not load analytics.</div>;

  const truncate = (text, n = 55) => text?.length > n ? text.substring(0, n) + '…' : text;

  return (
    <div className="admin-tab-content">
      <div className="admin-section-header">
        <h3>Performance Analytics</h3>
        <p>Deep insights into question-level and domain-level performance.</p>
      </div>
      <div className="analytics-grid">
        <div className="analytics-card">
          <div className="analytics-card-title">🔴 Most Difficult Questions</div>
          {data.mostDifficult.length === 0
            ? <p className="analytics-empty">No data yet.</p>
            : data.mostDifficult.map((q, i) => (
              <div key={i} className="analytics-row">
                <div className="analytics-q">{truncate(q.question_text)}</div>
                <div className="analytics-meta">
                  <span>Avg: <strong>{q.avg_score}%</strong></span>
                  <span>{q.attempts} attempts</span>
                </div>
                <ProgressBar value={q.avg_score} color="#ef4444" />
              </div>
            ))
          }
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">🔥 Frequently Asked Questions</div>
          {data.frequentlyAsked.length === 0
            ? <p className="analytics-empty">No data yet.</p>
            : data.frequentlyAsked.map((q, i) => (
              <div key={i} className="analytics-row">
                <div className="analytics-q">{truncate(q.question_text)}</div>
                <div className="analytics-meta">
                  <span>Attempted <strong>{q.attempt_count}</strong> times</span>
                </div>
              </div>
            ))
          }
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">📉 Weak Topics</div>
          {data.weakTopics.length === 0
            ? <p className="analytics-empty">No data yet.</p>
            : data.weakTopics.map((t, i) => (
              <div key={i} className="analytics-row">
                <div className="analytics-q">{t.topic}</div>
                <div className="analytics-meta"><span>Avg: <strong>{t.avg_score}%</strong></span></div>
                <ProgressBar value={t.avg_score} color="#f59e0b" />
              </div>
            ))
          }
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">📈 Strong Topics</div>
          {data.strongTopics.length === 0
            ? <p className="analytics-empty">No data yet.</p>
            : data.strongTopics.map((t, i) => (
              <div key={i} className="analytics-row">
                <div className="analytics-q">{t.topic}</div>
                <div className="analytics-meta"><span>Avg: <strong>{t.avg_score}%</strong></span></div>
                <ProgressBar value={t.avg_score} color="#22c55e" />
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ─── Main Admin Dashboard Page ────────────────────────────────────────────

const TABS = [
  { id: 'dashboard', label: '🏠 Dashboard' },
  { id: 'students', label: '👥 Students' },
  { id: 'statistics', label: '📊 Statistics' },
  { id: 'analytics', label: '📈 Analytics' },
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container">
      <div className="admin-page-header">
        <h2>⚙️ Admin Management Panel</h2>
        <p className="admin-page-subtitle">
          Centralized control for the AI Interview Preparation Platform — monitor students, manage content, and configure AI behaviour.
        </p>
      </div>

      <div className="admin-tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            className={`admin-tab-btn ${activeTab === tab.id ? 'admin-tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-panel">
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'students' && <StudentsTab />}
        {activeTab === 'statistics' && <StatisticsTab />}
        {activeTab === 'analytics' && <AnalyticsTab />}
      </div>
    </div>
  );
}
