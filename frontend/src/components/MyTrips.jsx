import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import './MyTrips.css'
import {formatDate} from '../utils/dateUtils';
const APP_URL=import.meta.env.VITE_APP_URL


const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: ""
  });

  const navigate = useNavigate();


  useEffect(() => {
    const fetchTrips = async () => {
      const res = await fetch(`${APP_URL}/trips/my`, {
        credentials: "include"
      });
      const data = await res.json();
      setTrips(Array.isArray(data) ? data:data.trips||[]);
    };


    fetchTrips();
  }, []);


  const handleDelete = async (tripId) => {
    if (!window.confirm("Are you sure you want to delete this trip?")) return;


    try {
      const res = await fetch(`${APP_URL}/trips/${tripId}`, {
        method: "DELETE",
        credentials: "include"
      });


      if (res.ok) {
        setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
      } else {
        const errorData = await res.json();
        alert("Failed to delete trip: " + errorData.error);
      }
    } catch (error) {
      console.error("Error deleting trip:", error);
    }
  };


  const handleEdit = (tripId) => {
    navigate(`/trips/${tripId}/edit`);
  };


  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };


  const handleCreateTrip = async (e) => {
    e.preventDefault();


    const res = await fetch(`${APP_URL}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify(form)
    });


    if (res.ok) {
      const newTrip = await res.json();
      setTrips((prev) => [...prev, newTrip]);
      setShowModal(false);
      setForm({ title: "", destination: "", start_date: "", end_date: "" });
    } else {
      const err = await res.json();
      alert(err.error || "Failed to create trip.");
    }
  };


  return (
    <div>
      <h2>My Trips</h2>
      <button onClick={() => setShowModal(true)}>Add Trip</button>


      <div className="trip-list">
        {trips.map((trip) => (
          <div key={trip.id} className="trip-card">
            <div onClick={() => navigate(`/trips/${trip.id}`)} style={{ cursor: "pointer" }}>
              <h3>{trip.title}</h3>
              <p>{trip.destination}</p>
              <p>
                {formatDate(trip.start_date)} → {formatDate(trip.end_date)}
              </p>
            </div>
            <div className="trip-actions">
              <button onClick={() => handleEdit(trip.id)}>Edit</button>
              <button onClick={() => handleDelete(trip.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>


      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Trip</h3>
            <form className="trip-form" onSubmit={handleCreateTrip}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  placeholder="Enter trip title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="destination">Destination</label>
                <input
                  id="destination"
                  name="destination"
                  value={form.destination}
                  onChange={handleChange}
                  required
                  placeholder="Enter destination"
                />
              </div>

              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  id="start_date"
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input
                  id="end_date"
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-button">
                  Create Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


export default MyTrips;





