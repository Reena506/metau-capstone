import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import './TripDetail.css'
import {formatDate} from '../utils/dateUtils';
const APP_URL=import.meta.env.VITE_APP_URL

function TripDetail() {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
 

  useEffect(() => {
    fetch(`${APP_URL}/trips/${tripId}`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setTrip(data));
  }, [tripId]);

  if (!trip) return <p>Loading trip...</p>;

  return (
    
      <div className="trip-content">
        <h3>Trip Overview</h3>
        <p>Start Date: {formatDate(trip.start_date)}</p>
        <p>End Date: {formatDate(trip.end_date)}</p>
      </div>

  );
}

export default TripDetail;

