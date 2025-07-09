import { useState } from "react";
import { useParams } from "react-router-dom";
import "./Suggestions.css";

const APP_URL = import.meta.env.VITE_APP_URL;

function Suggestions() {
  const { tripId } = useParams(); // Get tripId from route params
  const [city, setCity] = useState("");
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAttraction, setSelectedAttraction] = useState(null);
  const [addingToItinerary, setAddingToItinerary] = useState(false);
  const [addSuccess, setAddSuccess] = useState("");

  // Form state for adding to itinerary
  const [eventForm, setEventForm] = useState({
    date: "",
    start_time: "",
    end_time: "",
  });

  const searchAttractions = async () => {
    if (!city.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setAttractions([]);

    try {
      const response = await fetch(
        `${APP_URL}/suggestions/attractions?city=${encodeURIComponent(city)}`
      );
      if (!response.ok) throw new Error("Request failed");

      const data = await response.json();
      if (data.status === "OK") {
        setAttractions(data.results);
      } else {
        setError(
          `Google API error: ${data.status} - ${
            data.error_message || "Unknown error"
          }`
        );
      }
    } catch (err) {
      setError("Failed to load attractions.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToItinerary = (attraction) => {
    setSelectedAttraction(attraction);
    setShowAddModal(true);
    setAddSuccess("");
    setError("");

    //default
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDate = tomorrow.toISOString().split("T")[0];

    setEventForm({
      date: defaultDate,
      start_time: `${defaultDate}T09:00`,
      end_time: `${defaultDate}T11:00`,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitToItinerary = async (e) => {
    e.preventDefault();

    if (!eventForm.date || !eventForm.start_time || !eventForm.end_time) {
      setError("Please fill in all required fields");
      return;
    }

    if (!tripId) {
      setError(
        "Trip ID not found. Please make sure you're viewing this from a specific trip."
      );
      return;
    }

    setAddingToItinerary(true);
    setError("");

    try {
      const eventData = {
        event: selectedAttraction.name,
        location: selectedAttraction.formatted_address,
        date: new Date(eventForm.date).toISOString(),
        start_time: new Date(eventForm.start_time).toISOString(),
        end_time: new Date(eventForm.end_time).toISOString(),
      };

      const response = await fetch(`${APP_URL}/trips/${tripId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(eventData),
      });

      if (!response.ok) throw new Error("Failed to add to itinerary");

      setAddSuccess(
        `"${selectedAttraction.name}" has been added to your itinerary!`
      );

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowAddModal(false);
        setAddSuccess("");
      }, 2000);
    } catch (err) {
      setError("Failed to add to itinerary. Please try again.");
      console.error("Error adding to itinerary:", err);
    } finally {
      setAddingToItinerary(false);
    }
  };

  return (
    <div className="container">
      <h1 className="searchtitle">Tourist Attractions Search</h1>

      <form
        className="search-bar"
        onSubmit={(e) => {
          e.preventDefault();
          searchAttractions();
        }}
      >
        <input
          placeholder="Enter city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      {attractions.length > 0 && (
        <div className="attractions-list">
          {attractions.map((a) => (
            <div key={a.place_id} className="attraction-card">
              <h2 className="attraction-name">{a.name}</h2>
              <p className="attraction-address">{a.formatted_address}</p>
              {a.rating && (
                <p className="attraction-rating">
                  ⭐ {a.rating} ({a.user_ratings_total?.toLocaleString() || 0}{" "}
                  reviews)
                </p>
              )}
              {a.opening_hours && a.opening_hours.open_now !== undefined && (
                <p
                  className={`attraction-status ${
                    a.opening_hours.open_now ? "open" : "closed"
                  }`}
                >
                  {a.opening_hours.open_now ? "Open Now" : "Closed"}
                </p>
              )}

              {/* Add to Itinerary Button */}
              <button
                className="add-to-itinerary-btn"
                onClick={() => handleAddToItinerary(a)}
                disabled={!tripId}
              >
                {tripId ? "Add to Itinerary" : "No Trip Selected"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add to Itinerary Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add to Itinerary</h2>
              <button
                className="close-button"
                onClick={() => setShowAddModal(false)}
              >
                x
              </button>
            </div>

            {selectedAttraction && (
              <div className="selected-attraction-info">
                <h3>{selectedAttraction.name}</h3>
                <p>{selectedAttraction.formatted_address}</p>
                {selectedAttraction.rating && (
                  <p>⭐ {selectedAttraction.rating}</p>
                )}
              </div>
            )}

            {error && <div className="error-message">{error}</div>}
            {addSuccess && <div className="success-message">{addSuccess}</div>}

            <div className="form-group">
              <label className="form-label">Event Title *</label>
              <input
                type="text"
                name="event"
                value={selectedAttraction?.name || ""}
                className="form-input"
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                name="location"
                value={selectedAttraction?.formatted_address || ""}
                className="form-input"
                readOnly
              />
            </div>

            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                type="date"
                name="date"
                value={eventForm.date}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="datetime-local"
                name="start_time"
                value={eventForm.start_time}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">End Time *</label>
              <input
                type="datetime-local"
                name="end_time"
                value={eventForm.end_time}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="button-group">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-secondary"
                disabled={addingToItinerary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitToItinerary}
                className="btn btn-primary"
                disabled={addingToItinerary}
              >
                {addingToItinerary ? "Adding..." : "Add to Itinerary"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Suggestions;
