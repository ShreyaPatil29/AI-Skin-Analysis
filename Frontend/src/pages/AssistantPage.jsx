import React from 'react';

function AssistantPage({ chatMessages, assistantInput, onAssistantInputChange, onAssistantSubmit, onInsertCommonConditions }) {
  return (
    <section id="assistant" className="ai-assistant section-padding">
      <div className="container">
        <h2 className="animate-fade-in-up">AI Skin Assistant</h2>
        <p className="section-description animate-fade-in-up animate-delay-200">
          Get instant answers to your skin-related questions from our AI assistant
        </p>

        <div className="animate-fade-in-up animate-delay-300" style={{ marginBottom: 'var(--space-6)', textAlign: 'center' }}>
          <button className="btn btn-outline" onClick={onInsertCommonConditions}>
            <span className="btn-icon">📋</span>
            Insert 10 Common Skin Conditions
          </button>
        </div>

        <div className="assistant-content animate-scale-in animate-delay-400">
          <div className="chat-window">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={onAssistantSubmit} className="chat-input-form">
            <input
              type="text"
              placeholder="Ask about skincare, treatments, ingredients..."
              value={assistantInput}
              onChange={onAssistantInputChange}
              aria-label="Ask AI Assistant"
            />
            <button type="submit" className="btn btn-primary">
              <span className="btn-icon">📤</span>
              Send
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default AssistantPage;


