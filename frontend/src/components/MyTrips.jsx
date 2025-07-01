import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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


  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}-${day}-${year}`;
  };


  useEffect(() => {
    const fetchTrips = async () => {
      const res = await fetch(`${APP_URL}/trips/my`, {
        credentials: "include"
      });
      const data = await res.json();
      setTrips(data);
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
          <form className="modal-content" onSubmit={handleCreateTrip}>
            <h3>Add New Trip</h3>


            <label>
              Title:
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
              />
            </label>


            <label>
              Destination:
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                required
              />
            </label>


            <label>
              Start Date:
              <input
                type="date"
                name="start_date"
                value={form.start_date}
                onChange={handleChange}
                required
              />
            </label>


            <label>
              End Date:
              <input
                type="date"
                name="end_date"
                value={form.end_date}
                onChange={handleChange}
                required
              />
            </label>


            <div>
              <button type="submit">Create Trip</button>
              <button type="button" onClick={() => setShowModal(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};


export default MyTrips;





