import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';

function SignInPage() {
  const { user, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // If user is already authenticated, redirect them
  useEffect(() => {
    if (user) {
      // Check for intended destination from location state or default to analysis
      const from = location.state?.from?.pathname || '/analysis';
      navigate(from, { replace: true });
    }
  }, [user, location.state, navigate]);

  const handleSignIn = () => {
    signIn();
  };

  return (
    <section className="signin-page section-padding">
      <div className="container">
        <div className="signin-content">
          <div className="signin-card">
            <div className="signin-header">
              <div className="logo-icon">🔬</div>
              <h1>Welcome to DermaScan</h1>
              <p>Sign in to access AI-powered skin analysis</p>
            </div>
            
            <div className="signin-body">
              <button 
                className="btn btn-google-signin"
                onClick={handleSignIn}
              >
                <span className="btn-icon">🔍</span>
                Sign in with Google
              </button>
              
              <div className="signin-features">
                <h3>What you'll get:</h3>
                <ul>
                  <li>🔍 AI-powered skin analysis</li>
                  <li>💊 Personalized treatment recommendations</li>
                  <li>📊 Detailed health insights</li>
                  <li>💬 AI skin care assistant</li>
                </ul>
              </div>
            </div>
            
            <div className="signin-footer">
              <p className="privacy-note">
                By signing in, you agree to our privacy policy and terms of service.
                Your data is secure and will only be used for skin analysis purposes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SignInPage;
