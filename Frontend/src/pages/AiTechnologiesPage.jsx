import React from 'react';

function AiTechnologiesPage() {
  return (
    <section id="ai-technologies" className="ai-technologies section-padding bg-light">
      <div className="container">
        <h2 className="animate-fade-in-up">AI Technologies</h2>
        <p className="section-description animate-fade-in-up animate-delay-200">
          Cutting-edge artificial intelligence powering our skin analysis platform
        </p>
        <div className="tech-cards">
          <div className="tech-card animate-fade-in-up animate-delay-300">
            <h3>Advanced AI Models</h3>
            <p>Powered by state-of-the-art computer vision models for accurate skin condition detection and analysis.</p>
          </div>
          <div className="tech-card animate-fade-in-up animate-delay-400">
            <h3>Secure & Private</h3>
            <p>Your images are processed securely with end-to-end encryption and are never stored permanently.</p>
          </div>
          <div className="tech-card animate-fade-in-up animate-delay-500">
            <h3>Instant Results</h3>
            <p>Get comprehensive analysis results in seconds with cloud-based processing power.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AiTechnologiesPage;


