import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Google Maps based page (replaces Leaflet)

function DoctorMapsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Get search data from location state
  const searchData = location.state?.searchData;
  const doctors = location.state?.doctors || [];

  useEffect(() => {
    if (!searchData || !doctors.length) {
      navigate('/doctor-recommendation');
    }
  }, [searchData, doctors, navigate]);

  useEffect(() => {
    if (!searchData || !doctors.length) {
      navigate('/doctor-recommendation');
      return;
    }
    // No external script to load; mark as ready
    setIsLoading(false);
  }, [searchData, doctors, navigate]);

  const handleDoctorSelect = (doctor) => {
    setSelectedDoctor(doctor);
  };

  const getPriceLevelText = (priceLevel) => {
    if (!priceLevel) return 'Price not available';
    const levels = ['$', '$$', '$$$', '$$$$'];
    return levels[priceLevel - 1] || 'Price not available';
  };

  const formatRating = (rating) => {
    return rating ? rating.toFixed(1) : 'No rating';
  };

  // Always render the layout so the map container exists, even while loading

  if (error) {
    const center = doctors[0]?.geometry?.location || { lat: 40.7128, lng: -74.0060 };
    const src = `https://www.google.com/maps?q=${encodeURIComponent(center.lat + ',' + center.lng)}&z=13&output=embed`;
    return (
      <section className="doctor-maps-page">
        <div className="maps-container">
          <div className="maps-header">
            <div className="header-content">
              <h1>📍 Doctor Locations</h1>
              <p>Found {doctors.length} dermatologists near {searchData?.city || 'your area'}</p>
              <button onClick={() => navigate('/doctor-recommendation')} className="btn btn-secondary">← Back to Search</button>
            </div>
          </div>
          <div className="maps-layout">
            <div className="map-container">
              <iframe
                title="Google Maps Fallback"
                src={src}
                width="100%"
                height="500"
                style={{ border: 0, borderRadius: 12 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="doctors-sidebar">
              <div className="sidebar-header">
                <h3>👨‍⚕️ Nearby Doctors</h3>
                <p>Click on a doctor to view details</p>
              </div>
              <div className="doctors-list">
                {doctors.map((doctor) => (
                  <div key={doctor.id} className="doctor-item">
                    <div className="doctor-item-header">
                      <h4 className="doctor-name">{doctor.name}</h4>
                      <div className="doctor-address">
                        <span className="address-icon">📍</span>
                        <span className="address-text">{doctor.vicinity || doctor.address}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const initialCenter = doctors[0]?.geometry?.location || { lat: 40.7128, lng: -74.0060 };
  const activeCenter = (selectedDoctor?.geometry?.location) || initialCenter;

  return (
    <section className="doctor-maps-page">
      <div className="maps-container">
        {/* Header */}
        <div className="maps-header">
          <div className="header-content">
            <h1>📍 Doctor Locations</h1>
            <p>Found {doctors.length} dermatologists near {searchData.city}</p>
            {location.state?.searchMethod === 'nearby_search' && (
              <p className="search-method-info">
                🎯 Using precise location-based search for better results
              </p>
            )}
            <button 
              onClick={() => navigate('/doctor-recommendation')} 
              className="btn btn-secondary"
            >
              ← Back to Search
            </button>
          </div>
        </div>

        <div className="maps-layout">
          {/* Map (Google Maps Embed) */}
          <div className="map-container">
            <iframe
              title="Google Maps"
              src={`https://www.google.com/maps?q=${encodeURIComponent('loc:' + activeCenter.lat + ',' + activeCenter.lng)}&z=18&output=embed`}
              width="100%"
              height="500"
              style={{ border: 0, borderRadius: 12 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          {/* Doctor List */}
          <div className="doctors-sidebar">
            <div className="sidebar-header">
              <h3>👨‍⚕️ Nearby Doctors</h3>
              <p>Click on a doctor to view details</p>
            </div>

            <div className="doctors-list">
              {doctors.map((doctor, index) => (
                <div 
                  key={doctor.id} 
                  className={`doctor-item ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                  onClick={() => handleDoctorSelect(doctor)}
                >
                  <div className="doctor-item-header">
                    <h4 className="doctor-name">{doctor.name}</h4>
                    <div className="doctor-rating">
                      <span className="rating-stars">⭐</span>
                      <span className="rating-value">{formatRating(doctor.rating)}</span>
                      {doctor.userRatingsTotal > 0 && (
                        <span className="rating-count">({doctor.userRatingsTotal})</span>
                      )}
                    </div>
                  </div>

                  <div className="doctor-address">
                    <span className="address-icon">📍</span>
                    <span className="address-text">{doctor.vicinity || doctor.address}</span>
                  </div>

                  <div className="doctor-details">
                    <div className="detail-row">
                      <span className="detail-label">Price Level:</span>
                      <span className="detail-value">{getPriceLevelText(doctor.priceLevel)}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Status:</span>
                      <span className={`detail-value status ${doctor.businessStatus?.toLowerCase()}`}>
                        {doctor.businessStatus || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="doctor-actions">
                    <div className="btn-row" style={{ display: 'flex', gap: 8 }}>
                      <button 
                        className="btn btn-primary btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          const { lat, lng } = doctor.geometry.location;
                          const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
                          window.open(url, '_blank');
                        }}
                      >
                        View on OSM
                      </button>
                      <button 
                        className="btn btn-secondary btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          const { lat, lng } = doctor.geometry.location;
                          const url = `https://www.google.com/maps?q=${lat},${lng}`;
                          window.open(url, '_blank');
                        }}
                      >
                        Google Maps
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Doctor Details */}
        {selectedDoctor && (
          <div className="selected-doctor-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>{selectedDoctor.name}</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedDoctor(null)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="doctor-info-grid">
                  <div className="info-section">
                    <h4>📍 Address</h4>
                    <p>{selectedDoctor.address}</p>
                  </div>

                  <div className="info-section">
                    <h4>⭐ Rating</h4>
                    <p>{formatRating(selectedDoctor.rating)} ({selectedDoctor.userRatingsTotal} reviews)</p>
                  </div>

                  <div className="info-section">
                    <h4>💰 Price Level</h4>
                    <p>{getPriceLevelText(selectedDoctor.priceLevel)}</p>
                  </div>

                  <div className="info-section">
                    <h4>🏥 Business Status</h4>
                    <p className={`status ${selectedDoctor.businessStatus?.toLowerCase()}`}>
                      {selectedDoctor.businessStatus || 'Unknown'}
                    </p>
                  </div>
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      const { lat, lng } = selectedDoctor.geometry.location;
                      const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Open in OSM
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      const url = `https://www.google.com/search?q=${encodeURIComponent(selectedDoctor.name + ' ' + selectedDoctor.address)}`;
                      window.open(url, '_blank');
                    }}
                  >
                    Search for More Info
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default DoctorMapsPage;


