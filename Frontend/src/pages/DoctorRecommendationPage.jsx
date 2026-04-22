import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function DoctorRecommendationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    city: '',
    selectedPlace: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch suggestions from backend OSM geocoder
  useEffect(() => {
    const q = formData.city.trim();
    if (q.length < 3) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);
    const run = async () => {
      try {
        const res = await fetch(`http://localhost:4000/api/geocode?q=${encodeURIComponent(q)}`, {
          credentials: 'include'
        });
        const data = await res.json();
        if (!cancelled) {
          setSuggestions(data.success ? data.results : []);
        }
      } catch (_) {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    };
    const t = setTimeout(run, 200); // simple debounce
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [formData.city]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Reset selected place when user types
    if (name === 'city') {
      setFormData(prev => ({ ...prev, selectedPlace: null }));
    }
  };

  const handleSuggestionClick = (sug) => {
    setFormData(prev => ({
      ...prev,
      city: sug.name,
      selectedPlace: {
        placeId: sug.id, // OSM id format like node:123
        name: sug.name,
        formattedAddress: sug.address,
        geometry: {
          location: { lat: sug.lat, lng: sug.lng }
        }
      }
    }));
    setSuggestions([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.city.trim()) {
      setError('Please enter a location');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare search data with coordinates if available
      const searchData = {
        city: formData.city
      };

      // Add coordinates if place was selected from suggestions
      if (formData.selectedPlace && formData.selectedPlace.geometry) {
        searchData.coordinates = formData.selectedPlace.geometry.location;
        searchData.placeId = formData.selectedPlace.placeId;
      }

      const response = await fetch('http://localhost:4000/api/search-doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(searchData)
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to search for doctors');
      }

      if (data.doctors.length === 0) {
        setError('No dermatologists found in the specified location. Please try a different city.');
        return;
      }

      // Navigate to maps page with search results
      navigate('/doctor-maps', {
        state: {
          searchData: formData,
          doctors: data.doctors,
          searchQuery: data.searchQuery,
          searchMethod: data.searchMethod,
          totalResults: data.totalResults,
          coordinates: data.coordinates
        }
      });

    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Failed to search for doctors. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="doctor-recommendation-page section-padding">
      <div className="container">
        <div className="page-header">
          <h1>Find Dermatologists Near You</h1>
          <p>Get personalized doctor recommendations based on your location</p>
        </div>

        <div className="recommendation-form-container">
          <div className="form-card">
            <div className="form-header">
              <h2>📍 Location Information</h2>
              <p>Enter your location details to find nearby dermatologists</p>
            </div>

            <form onSubmit={handleSubmit} className="recommendation-form">
              <div className="form-group">
                <label htmlFor="city" className="form-label">
                  Location <span className="required">*</span>
                </label>
                <input
                  ref={inputRef}
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  placeholder="Start typing to search for your city or location..."
                  className="form-input"
                  required
                />
                <small className="form-help">
                  🌍 Start typing and pick a suggestion for better results
                </small>

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <ul className="autocomplete-list">
                    {suggestions.map((s) => (
                      <li key={s.id} className="autocomplete-item" onClick={() => handleSuggestionClick(s)}>
                        {s.name}
                      </li>
                    ))}
                  </ul>
                )}
                {isSearching && <div className="autocomplete-loading">Searching...</div>}
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary btn-large"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="btn-icon">⏳</span>
                    Finding Doctors...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">🔍</span>
                    Find Doctors
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

      </div>
    </section>
  );
}

export default DoctorRecommendationPage;
