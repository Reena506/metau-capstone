import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const EditTrip = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState({
    title: "",
    destination: "",
    start_date: "",
    end_date: "",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`http://localhost:3000/trips/${tripId}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch trip");
        const data = await res.json();
        // Format dates 
        setTrip({
          ...data,
          start_date: data.start_date.slice(0, 10),
          end_date: data.end_date.slice(0, 10),
        });
        setLoading(false);
      } catch (err) {
        console.error(err);
        alert("Error loading trip.");
        navigate("/trips");
      }
   };

    fetchTrip();
  }, [tripId, navigate]);

  const handleChange = (e) => {
    setTrip({ ...trip, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch(`http://localhost:3000/trips/${tripId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(trip),
    });

    if (res.ok) {
      navigate(`/trips/${tripId}`);
    } else {
      const error = await res.json();
      alert("Update failed: " + error.error);
    }
  };

  if (loading) return <p>Loading trip...</p>;

  return (
    <div>
      <h2>Edit Trip</h2>
      <form onSubmit={handleSubmit} className="edit-trip-form">
        <div>
          <label>Title:</label>
          <input
            type="text"
            name="title"
            value={trip.title}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Destination:</label>
          <input
            type="text"
            name="destination"
            value={trip.destination}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Start Date:</label>
     <input
            type="date"
            name="start_date"
            value={trip.start_date}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>End Date:</label>
          <input
            type="date"
            name="end_date"
            value={trip.end_date}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
};

export default EditTrip;


