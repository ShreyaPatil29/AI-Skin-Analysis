// Utility to load Google Maps JavaScript API dynamically using backend-provided key
// Ensures we don't expose the key in the frontend bundle and prevents duplicate loads

let loadPromise = null;

export function loadGoogleMaps() {
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (loadPromise) return loadPromise;

  loadPromise = new Promise(async (resolve, reject) => {
    try {
      const res = await fetch('http://localhost:4000/api/maps-api-key', { credentials: 'include' });
      const data = await res.json();
      if (!data.success || !data.apiKey) {
        return reject(new Error(data.error || 'Failed to get Maps API key'));
      }

      // Build script URL
      const params = new URLSearchParams({
        key: data.apiKey,
        libraries: 'places',
      });
      const scriptUrl = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;

      // If script already added but maps not ready, wait for onload
      const existing = document.querySelector(`script[src^="https://maps.googleapis.com/maps/api/js?"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.google.maps));
        existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')));
        return;
      }

      const script = document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) resolve(window.google.maps);
        else reject(new Error('Google Maps loaded but window.google.maps is undefined'));
      };
      script.onerror = () => reject(new Error('Failed to load Google Maps script'));
      document.head.appendChild(script);
    } catch (err) {
      reject(err);
    }
  });

  return loadPromise;
}
