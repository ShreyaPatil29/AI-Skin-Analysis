import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const HistoryPage = () => {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analyses, setAnalyses] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:4000/api/analyses', { credentials: 'include' });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load history');
        setAnalyses(data.analyses || []);
      } catch (e) {
        console.error(e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isAllSelected = analyses.length > 0 && selectedIds.size === analyses.length;
  const toggleSelectAll = () => {
    setSelectedIds(prev => {
      if (analyses.length === 0) return new Set();
      if (prev.size === analyses.length) return new Set();
      return new Set(analyses.map(a => a._id));
    });
  };

  const deleteIds = async (ids) => {
    setDeleting(true);
    try {
      const results = await Promise.all(ids.map(async (id) => {
        const res = await fetch(`http://localhost:4000/api/analyses/${id}`, { method: 'DELETE', credentials: 'include' });
        const data = await res.json();
        return { id, ok: data.success };
      }));
      const okIds = results.filter(r => r.ok).map(r => r.id);
      if (okIds.length > 0) {
        setAnalyses(prev => prev.filter(a => !okIds.includes(a._id)));
        setSelectedIds(prev => {
          const next = new Set(prev);
          okIds.forEach(id => next.delete(id));
          return next;
        });
      }
      const failed = results.filter(r => !r.ok).map(r => r.id);
      if (failed.length > 0) {
        alert(`Failed to delete ${failed.length} item(s).`);
      }
    } catch (e) {
      console.error(e);
      alert('Delete failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected item(s)? This cannot be undone.`)) return;
    await deleteIds(Array.from(selectedIds));
  };

  const handleDeleteOne = async (id) => {
    if (!confirm('Delete this analysis? This cannot be undone.')) return;
    await deleteIds([id]);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading history...</p>
      </div>
    );
  }

  if (error) {
    return <div className="container" style={{ padding: '2rem' }}><div className="alert alert-error">{error}</div></div>;
  }

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <div className="user-summary card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {user?.photo && (
            <img src={user.photo} alt={user.name || 'User'} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          )}
          <div>
            <h2 style={{ margin: 0 }}>{user?.name || 'User'}</h2>
            <div style={{ color: '#555' }}>{user?.email}</div>
            <div style={{ marginTop: 4 }}>
              <strong>Age:</strong> {user?.age ?? '—'} | <strong>Gender:</strong> {user?.gender ?? '—'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
            <span>Select All</span>
          </label>
          <button className="btn btn-danger" onClick={handleDeleteSelected} disabled={selectedIds.size === 0 || deleting}>
            {deleting ? 'Deleting...' : `Delete Selected (${selectedIds.size})`}
          </button>
          <button className="btn btn-ghost" onClick={signOut}>
            <span className="btn-icon">🚪</span>
            Logout
          </button>
        </div>
      </div>
      <h3>Past Analyses</h3>
      {analyses.length === 0 ? (
        <p>No analyses found yet.</p>
      ) : (
        <div className="history-grid" style={{ display: 'grid', gap: '1rem' }}>
          {analyses.map((item) => (
            <div key={item._id} className="card">
              <div className="card-body">
                <div className="history-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(item._id)}
                      onChange={() => toggleSelect(item._id)}
                      aria-label="Select analysis"
                    />
                    <h3 style={{ margin: 0 }}>Analysis Result</h3>
                  </div>
                  <small>{new Date(item.createdAt || item.timestamp || item._id?.toString().slice(0,8)).toLocaleString()}</small>
                </div>
                <div className="history-content" style={{ marginTop: '0.5rem' }}>
                  {item.result?.diagnosis && <p><strong>Diagnosis:</strong> {item.result.diagnosis}</p>}
                  {typeof item.result?.confidence !== 'undefined' && <p><strong>Confidence:</strong> {item.result.confidence}%</p>}
                  {item.result?.severity && <p><strong>Severity:</strong> {item.result.severity}</p>}
                  {Array.isArray(item.result?.differential) && item.result.differential.length > 0 && (
                    <div>
                      <strong>Differential:</strong>
                      <ul>
                        {item.result.differential.map((d, idx) => <li key={idx}>{d}</li>)}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(item.result?.treatment_recommendations) && item.result.treatment_recommendations.length > 0 && (
                    <div>
                      <strong>Treatment Recommendations:</strong>
                      <ul>
                        {item.result.treatment_recommendations.map((t, idx) => <li key={idx}>{t}</li>)}
                      </ul>
                    </div>
                  )}
                  {(item.result?.notes || item.notes) && (
                    <div className="notes-section" style={{ marginTop: '0.5rem', borderTop: '1px solid #e5e7eb', paddingTop: '0.5rem' }}>
                      <strong>Notes</strong>
                      {item.result?.notes && (
                        <div className="note note-ai" style={{ marginTop: '0.25rem' }}>
                          <small style={{ color: '#6b7280' }}>AI Notes</small>
                          <div className="note-body" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.5rem', marginTop: 4 }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{item.result.notes}</div>
                          </div>
                        </div>
                      )}
                      {item.notes && String(item.notes).trim() !== String(item.result?.notes ?? '').trim() && (
                        <div className="note note-user" style={{ marginTop: '0.5rem' }}>
                          <small style={{ color: '#6b7280' }}>Saved Notes</small>
                          <div className="note-body" style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.5rem', marginTop: 4 }}>
                            <div style={{ whiteSpace: 'pre-wrap' }}>{item.notes}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {item.imageData && (
                  <div className="history-image" style={{ marginTop: '0.75rem' }}>
                    <img src={`data:image/jpeg;base64,${item.imageData}`} alt="Analyzed" style={{ maxWidth: '100%', borderRadius: 8 }} />
                  </div>
                )}
                <div className="card-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                  <button className="btn btn-danger" onClick={() => handleDeleteOne(item._id)} disabled={deleting}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
