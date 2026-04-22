import React from 'react';

function AnalysisPage({ selectedFile, onFileChange, onDragOver, onDrop, onAnalyze, isAnalyzing, analysis, previewUrl, onClear }) {
  return (
    <section id="analysis" className="analysis-tool section-padding bg-light">
      <div className="container">
        <h2 className="animate-fade-in-up">Skin Analysis Tool</h2>
        <p className="section-description animate-fade-in-up animate-delay-200">
          Upload a clear photo of your skin for AI-powered analysis and get instant insights
        </p>
        <div className="upload-box animate-scale-in animate-delay-300" onDragOver={onDragOver} onDrop={onDrop}>
          {selectedFile ? (
            <p>File selected: {selectedFile.name}</p>
          ) : (
            <p>Drop your image here or click to browse</p>
          )}
          <input type="file" id="file-upload" accept=".jpg,.png" onChange={onFileChange} style={{ display: 'none' }} />
          <div className="btn-group" style={{ marginTop: 'var(--space-4)' }}>
            <label htmlFor="file-upload" className="btn btn-primary">
              <span className="btn-icon">📁</span>
              Choose Image
            </label>
            <button className="btn btn-success" onClick={onAnalyze} disabled={!selectedFile || isAnalyzing}>
              <span className="btn-icon">{isAnalyzing ? '⏳' : '🔍'}</span>
              {isAnalyzing ? 'Analyzing...' : 'Analyze'}
            </button>
            <button className="btn btn-secondary" onClick={onClear}>
              <span className="btn-icon">🔄</span>
              Upload New
            </button>
          </div>

          <p className="file-info">Supports JPG, PNG files up to 10MB</p>

          {selectedFile && (
            <div className="file-preview animate-fade-in-up">
              {previewUrl && (
                <img src={previewUrl} alt="preview" />
              )}
              <div className="file-info-details">
                <p><strong>File:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="spinner" aria-hidden="true"></div>
          )}

          {analysis && (
            <div className="analysis-card animate-fade-in-up">
              <h3 className="title">🎉 Analysis Results</h3>

              <div className="analysis-content">
                <div className="result-item">
                  <span className="result-label">Diagnosis:</span>
                  <span className="result-value diagnosis">{analysis.diagnosis || 'N/A'}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Confidence:</span>
                  <span className="result-value confidence">{analysis.confidence || analysis.confidence_score || 'N/A'}{analysis.confidence && typeof analysis.confidence === 'number' ? '%' : ''}</span>
                </div>

                <div className="result-item">
                  <span className="result-label">Severity:</span>
                  <span className={`result-value severity ${analysis.severity?.toLowerCase()}`}>
                    {analysis.severity || 'N/A'}
                  </span>
                </div>

                {analysis.differential && analysis.differential.length > 0 && (
                  <div className="result-section">
                    <strong className="section-title">🔍 Possible Differentials:</strong>
                    <ul className="recommendation-list">
                      {analysis.differential.map((item, idx) => (
                        <li key={idx} className="recommendation-item">{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.treatment_recommendations && analysis.treatment_recommendations.length > 0 && (
                  <div className="result-section">
                    <strong className="section-title">💊 Treatment Recommendations:</strong>
                    <ul className="recommendation-list">
                      {analysis.treatment_recommendations.map((rec, idx) => (
                        <li key={idx} className="recommendation-item">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <div className="result-section">
                    <strong className="section-title">💊 Treatment Recommendations:</strong>
                    <ul className="recommendation-list">
                      {analysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="recommendation-item">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="result-item">
                  <span className="result-label">Refer to Dermatologist:</span>
                  <span className={`result-value ${analysis.refer_to_dermatologist ? 'refer-yes' : 'refer-no'}`}>
                    {analysis.refer_to_dermatologist ? "✅ Yes" : "❌ Not necessary"}
                  </span>
                </div>

                {analysis.notes && (
                  <div className="result-section">
                    <strong className="section-title">📝 Notes:</strong>
                    <p className="notes-text">{analysis.notes?.replace('```json', '').replace('```', '')}</p>
                  </div>
                )}

                {analysis.disclaimer && (
                  <div className="disclaimer">
                    ⚠️ {analysis.disclaimer}
                  </div>
                )}

                {/* Fallback for raw JSON if structured data isn't available */}
                {!analysis.diagnosis && !analysis.diagnoses && (
                  <div className="result-section">
                    <strong className="section-title">📊 Raw Analysis Data:</strong>
                    <div className="json-fallback">
                      <pre>{JSON.stringify(analysis, null, 2).replace("```json", "").replace('```', '')}</pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Default disclaimer if not provided in analysis */}
              {!analysis.disclaimer && (
                <div className="disclaimer">
                  <strong>⚠️ Medical Disclaimer:</strong> This AI analysis is for educational purposes only and is not a medical diagnosis. Always consult a qualified dermatologist for clinical advice.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default AnalysisPage;


