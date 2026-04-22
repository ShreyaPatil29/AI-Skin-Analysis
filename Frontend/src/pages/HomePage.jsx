import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function HomePage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const handleTryAnalysis = (e) => {
    if (!user) {
      e.preventDefault();
      // Use signIn with the intended destination
      signIn('/analysis');
    }
  };

  return (
    <section id="home" className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="animate-fade-in-up">AI-Powered Skin Analysis</h1>
          <p className="animate-fade-in-up animate-delay-200">Upload your photo, let our advanced AI analyze your skin condition, and get instant insights with personalized recommendations.</p>
          <div className="hero-actions animate-fade-in-up animate-delay-400">
            <Link 
              to={user ? "/analysis" : "/signin"} 
              className="btn btn-primary"
              onClick={handleTryAnalysis}
            >
              <span className="btn-icon">🔍</span>
              Try Analysis
            </Link>
            <Link to="/how-it-works" className="btn btn-secondary">
              <span className="btn-icon">📚</span>
              Learn How
            </Link>
          </div>
        </div>
        <div className="hero-image animate-float animate-delay-300">
        </div>
      </div>
    </section>
  );
}

export default HomePage;


