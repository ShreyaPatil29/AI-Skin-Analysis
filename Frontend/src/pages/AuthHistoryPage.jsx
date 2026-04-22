import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function formatUA(ua) {
  if (!ua) return 'Unknown device';
  try {
    if (ua.includes('Mobile')) return 'Mobile device';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Macintosh')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
  } catch {}
  return ua.slice(0, 80);
}

const AuthHistoryPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/auth-history', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load authentication history');
        setHistory(Array.isArray(data.history) ? data.history : []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading authentication history...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ padding: '2rem' }}><div className="alert alert-error">{error}</div></div>;
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Authentication History</h2>
        <p style={{ color: '#555' }}>Only unique sign-ins per day and device are shown.</p>
        <div style={{ marginTop: '0.5rem' }}>
          <strong>User:</strong> {user?.name || 'User'} <span style={{ color: '#6b7280' }}>({user?.email})</span>
        </div>
      </div>

      {history.length === 0 ? (
        <p>No authentication events recorded yet.</p>
      ) : (
        <div className="history-grid" style={{ display: 'grid', gap: '0.75rem' }}>
          {history.map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div><strong>Signed in:</strong> {new Date(item.timestamp).toLocaleString()}</div>
                  <div style={{ color: '#555' }}>
                    <span><strong>IP:</strong> {item.ip || 'Unknown'}</span>
                    {' \u00A0\u00A0|\u00A0\u00A0'}
                    <span><strong>Device:</strong> {formatUA(item.userAgent)}</span>
                  </div>
                </div>
                <div className="nav-icon" aria-hidden>🕓</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuthHistoryPage;
