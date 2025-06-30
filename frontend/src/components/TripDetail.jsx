import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";


function TripDetail() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
 

  useEffect(() => {
    fetch(`http://localhost:3000/trips/${tripId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setTrip(data));
  }, [tripId]);

  if (!trip) return <p>Loading trip...</p>;

  return (
    
      <div className="trip-content">
        <h3>Trip Overview</h3>
        <p>Start Date: {new Date(trip.start_date).toLocaleDateString()}</p>
        <p>End Date: {new Date(trip.end_date).toLocaleDateString()}</p>
      </div>

  );
}

export default TripDetail;

