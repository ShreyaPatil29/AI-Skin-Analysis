import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage.jsx';
import AiTechnologiesPage from './pages/AiTechnologiesPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import AssistantPage from './pages/AssistantPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import DoctorRecommendationPage from './pages/DoctorRecommendationPage.jsx';
import DoctorMapsPage from './pages/DoctorMapsPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';

function AppContent() {
  // Debug: show current location for router troubleshooting
  const loc = useLocation();
  const { user, signIn, signOut } = useAuth();
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [assistantInput, setAssistantInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { type: 'assistant', text: "Hello! I'm here to help with your skin care questions. What would you like to know?" },
    { type: 'user', text: "What's the best sunscreen for sensitive skin?" },
    { type: 'assistant', text: "For sensitive skin, look for mineral sunscreens with zinc oxide or titanium dioxide. These are less likely to cause irritation compared to chemical sunscreens." }
  ]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
    // ensure reset when closed
    document.body.style.overflow = '';
  }, [isMobileMenuOpen]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setAnalysis(null);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    setSelectedFile(file);
    setAnalysis(null);
  };

  const handleAssistantInputChange = (event) => {
    setAssistantInput(event.target.value);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return alert('Choose an image first');
    setIsAnalyzing(true);
    setAnalysis(null);
    const form = new FormData();
    form.append('image', selectedFile);

    try {
      const res = await fetch('http://localhost:4000/api/analyze-image', {
        method: 'POST',
        body: form,
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success) {
        setAnalysis(data.result ?? data);
      } else {
        setAnalysis({ error: data.error || 'No result' });
      }
    } catch (err) {
      console.error(err);
      setAnalysis({ error: err.message });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Manage preview URL for image preview and cleanup
  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreviewUrl(null);
    };
  }, [selectedFile]);

  const handleClear = () => {
    setSelectedFile(null);
    setAnalysis(null);
    setIsAnalyzing(false);
  };

  const handleAssistantSubmit = (event) => {
    event.preventDefault();
    if (assistantInput.trim()) {
      const userText = assistantInput.trim();
      setChatMessages(prev => [...prev, { type: 'user', text: userText }]);
      setAssistantInput("");

      // Send prompt to backend assistant endpoint
      (async () => {
        try {
          const res = await fetch('http://localhost:4000/api/assistant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: userText }),
            credentials: 'include',
          });
          const data = await res.json();
          if (data.success) {
            setChatMessages(prev => [...prev, { type: 'assistant', text: data.text }]);
          } else {
            setChatMessages(prev => [...prev, { type: 'assistant', text: 'Assistant error: ' + (data.error || 'unknown') }]);
          }
        } catch (err) {
          console.error(err);
          setChatMessages(prev => [...prev, { type: 'assistant', text: 'Assistant request failed.' }]);
        }
      })();
    }
  };

  // Fetch curated common conditions from backend and insert into chat as assistant message
  const fetchCommonConditions = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/common-conditions', {
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.conditions)) {
        const formatted = data.conditions.map(c => `- ${c.name}: ${c.short} Symptoms: ${c.symptoms.join(', ')}`).join('\n');
        setChatMessages(prev => [...prev, { type: 'assistant', text: `Common facial skin conditions and symptoms:\n${formatted}` }]);
      } else {
        setChatMessages(prev => [...prev, { type: 'assistant', text: 'Could not load conditions.' }]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { type: 'assistant', text: 'Error fetching conditions.' }]);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <Link to="/" className="logo">
                <div className="logo-icon">🔬</div>
                <div className="logo-text">
                  <span className="logo-title">DermaScan</span>
                  <span className="logo-subtitle">AI Skin Analysis</span>
                </div>
              </Link>
            </div>
            <button 
              className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle mobile menu"
              aria-controls="primary-navigation"
              aria-expanded={isMobileMenuOpen}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            
            <div className={`navbar-menu ${isMobileMenuOpen ? 'active' : ''}`} id="primary-navigation" role="navigation" aria-label="Primary" aria-hidden={!isMobileMenuOpen && window.innerWidth < 768 ? true : false}>
              <ul className="nav-links">
                <li className="nav-item">
                  <Link to="/" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">🏠</span>
                    <span>Home</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/doctor-recommendation" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">👨‍⚕️</span>
                    <span>Doctor Recommendation</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/ai-technologies" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">🤖</span>
                    <span>AI Tech</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/how-it-works" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">⚙️</span>
                    <span>How It Works</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/analysis" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">📸</span>
                    <span>Analysis</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/assistant" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">💬</span>
                    <span>Assistant</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/contact" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">📞</span>
                    <span>Contact</span>
                  </Link>
                </li>
                <li className="nav-item">
                  <Link to="/history" className="nav-link" onClick={closeMobileMenu}>
                    <span className="nav-icon">🕓</span>
                    <span>History</span>
                  </Link>
                </li>
              </ul>
              
              <div className="navbar-actions">
                {user ? (
                  <div className="user-menu">
                    <div className="user-info">
                      {user.photo && (
                        <img 
                          src={user.photo} 
                          alt={user.name || 'User'} 
                          className="user-avatar"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      )}
                      <span className="user-name">{user.name || 'User'}</span>
                    </div>
                    <button className="btn btn-ghost" onClick={signOut}>
                      <span className="btn-icon">🚪</span>
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <button className="btn btn-ghost" onClick={() => signIn('/analysis')}>
                    <span className="btn-icon">👤</span>
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>
      {isMobileMenuOpen && (
        <div className="mobile-backdrop" onClick={closeMobileMenu} aria-hidden="true"></div>
      )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/doctor-recommendation" element={<DoctorRecommendationPage />} />
          <Route path="/doctor-maps" element={<DoctorMapsPage />} />
          <Route path="/ai-technologies" element={<AiTechnologiesPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/analysis" element={
            <ProtectedRoute>
              <AnalysisPage
                selectedFile={selectedFile}
                onFileChange={handleFileChange}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                analysis={analysis}
                previewUrl={previewUrl}
                onClear={handleClear}
              />
            </ProtectedRoute>
          } />
          <Route path="/assistant" element={
            <ProtectedRoute>
              <AssistantPage
                chatMessages={chatMessages}
                assistantInput={assistantInput}
                onAssistantInputChange={handleAssistantInputChange}
                onAssistantSubmit={handleAssistantSubmit}
                onInsertCommonConditions={fetchCommonConditions}
              />
            </ProtectedRoute>
          } />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/history" element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          } />
          {/* Fallback for unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>


      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-col">
              <h3>SkinAI Care</h3>
              <p>Advanced AI-powered skin analysis for better health awareness and care.</p>
            </div>
            <div className="footer-col">
              <h3>Features</h3>
              <ul>
                <li><a href="#">Skin Analysis</a></li>
                <li><a href="#">AI Assistant</a></li>
                <li><a href="#">Care Tips</a></li>
                <li><a href="#">Progress Tracking</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Resources</h3>
              <ul>
                <li><a href="#">Documentation</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Support</a></li>
              </ul>
            </div>
            <div className="footer-col">
              <h3>Follow Us</h3>
              {/* Social media icons would go here */}
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 SkinAI Care. All rights reserved.</p>
            <p className="medical-disclaimer">
              <strong>Medical Disclaimer:</strong> This tool is for educational and informational purposes only. It is not intended to diagnose, treat, cure, or prevent any skin condition or disease. Always consult with a qualified dermatologist or healthcare provider for proper medical advice, diagnosis, and treatment. Do not rely solely on this AI analysis for medical decisions.
            </p>
          </div>
        </div>
      </footer>
       <button className="chat-fab" onClick={() => setIsChatOpen(!isChatOpen)}>
        {isChatOpen ? 'X' : '💬'}
      </button>
      {isChatOpen && (
        <div className="floating-chat-window">
          <div className="chat-header">
            AI Skin Assistant
            <button className="close-chat" onClick={() => setIsChatOpen(false)}>X</button>
          </div>
          <div className="chat-messages">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`chat-message ${msg.type}`}>
                <p>{msg.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleAssistantSubmit} className="chat-input-form">
            <input
              type="text"
              placeholder="Ask about skincare, treatments, ingredients..."
              value={assistantInput}
              onChange={handleAssistantInputChange}
              aria-label="Ask AI Assistant"
            />
            <button type="submit" className="btn btn-primary">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

