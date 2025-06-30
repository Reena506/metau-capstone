import { useState } from 'react';
import './Suggestions.css'

function Suggestions() {
  const [city, setCity] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchAttractions = async () => {
    if (!city.trim()) {
      setError('Please enter a city name.');
      return;
    }

    setLoading(true);
    setError('');
    setAttractions([]);

    try {
      const response = await fetch(`http://localhost:3000/suggestions/attractions?city=${encodeURIComponent(city)}`);
      if (!response.ok) throw new Error('Request failed');

      const data = await response.json();
      if (data.status === 'OK') {
        setAttractions(data.results);
      } else {
        setError(`Google API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
      }
    } catch (err) {
      setError('Failed to load attractions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="container">
  <h1 className="searchtitle">Tourist Attractions Search</h1>

  <div className="search-bar">
    <input
      type="text"
      placeholder="Enter city"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && searchAttractions()}
      className="input"
    />
    <button onClick={searchAttractions} disabled={loading} className="search-button">
      {loading ? 'Searching...' : 'Search'}
    </button>
  </div>

  {error && <div className="error">{error}</div>}

  {attractions.length > 0 && (
    <div className="attractions-list">
      {attractions.map((a) => (
        <div key={a.place_id} className="attraction-card">
          <h2 className="attraction-name">{a.name}</h2>
          <p className="attraction-address">{a.formatted_address}</p>
          {a.rating && (
            <p className="attraction-rating">
              ⭐ {a.rating} ({a.user_ratings_total?.toLocaleString() || 0} reviews)
            </p>
          )}
          {a.opening_hours && a.opening_hours.open_now !== undefined && (
            <p
              className={`attraction-status ${
                a.opening_hours.open_now ? 'open' : 'closed'
              }`}
            >
              {a.opening_hours.open_now ? 'Open Now' : 'Closed'}
            </p>
          )}
        </div>
      ))}
    </div>
  )}
</div>
  );
}

export default Suggestions;





