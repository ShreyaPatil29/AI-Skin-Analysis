import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProfileSetupPage = () => {
  const { user, checkAuthStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get('redirect') || location.state?.from?.pathname || '/analysis';
  }, [location]);

  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Prefetch profile
    (async () => {
      try {
        const profileRes = await fetch('http://localhost:4000/api/profile', { credentials: 'include' });
        const profileData = await profileRes.json();
        if (profileData.success) {
          if (profileData.profile.age) setAge(String(profileData.profile.age));
          if (profileData.profile.gender) setGender(profileData.profile.gender);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const ageNum = Number(age);
    if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120) {
      setError('Please enter a valid age (1-120).');
      return;
    }
    if (!gender) {
      setError('Please select your gender.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ age: ageNum, gender })
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to save profile');
      }
      await checkAuthStatus();
      // Always go to analysis page after completing profile
      navigate('/analysis', { replace: true });
    } catch (e) {
      console.error(e);
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        <h2>Sign in required</h2>
        <p>Please sign in to continue.</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 640, margin: '2rem auto' }}>
      <h2>Complete Your Profile</h2>
      <p>We need a couple of details before you continue.</p>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={user?.name || ''} readOnly />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user?.email || ''} readOnly />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input
              type="number"
              min="1"
              max="120"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} required>
              <option value="" disabled>Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          {error && (
            <div className="alert alert-error" role="alert">{error}</div>
          )}
          <div className="form-actions" style={{ display: 'flex', gap: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save and Continue'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileSetupPage;
