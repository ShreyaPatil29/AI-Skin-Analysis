import React from 'react';

function HowItWorksPage() {
  return (
    <section id="how-it-works" className="how-it-works section-padding">
      <div className="container">
        <h2 className="animate-fade-in-up">How it Works</h2>
        <p className="section-description animate-fade-in-up animate-delay-200">
          Simple steps to get your personalized skin analysis and recommendations
        </p>
        <div className="steps">
          <div className="step-item animate-fade-in-up animate-delay-300">
            <div className="step-icon">📷</div>
            <h3>Upload Photo</h3>
            <p>Take or upload a clear photo of the skin area you want analyzed</p>
          </div>
          <div className="step-item animate-fade-in-up animate-delay-400">
            <div className="step-icon">🔍</div>
            <h3>AI Analysis</h3>
            <p>Our AI examines patterns, colors, textures, and other visual features</p>
          </div>
          <div className="step-item animate-fade-in-up animate-delay-500">
            <div className="step-icon">📊</div>
            <h3>Results</h3>
            <p>Get detailed predictions with confidence levels and risk assessments</p>
          </div>
          <div className="step-item animate-fade-in-up animate-delay-600">
            <div className="step-icon">💡</div>
            <h3>Recommendations</h3>
            <p>Receive personalized care tips and professional consultation advice</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksPage;


