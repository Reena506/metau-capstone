import { useParams, Link, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import './TripNavBar.css'
const APP_URL=import.meta.env.VITE_APP_URL

function TripNavBar() {
 const { tripId } = useParams();
 const [trip, setTrip] = useState(null);
 const location = useLocation();

 useEffect(() => {
   fetch(`${APP_URL}/trips/${tripId}`, { credentials: "include" })
     .then((res) => res.json())
     .then((data) => setTrip(data));
 }, [tripId]);


 const isActiveRoute = (path) => {
   if (path === `/trips/${tripId}`) {
     return location.pathname === path;
   }
   return location.pathname.startsWith(path);
 };

 if (!trip) return <p>Loading trip...</p>;

 return (
   <div>
     <div className="trip-header">
       <div className="trip-nav">
         <h1>{trip.title}</h1>
       </div>
       
     </div>
    
     <nav className="trip-detail-nav">
       <Link 
         to={`/trips/${tripId}`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}`) ? 'active' : ''}`}
       >
         Overview
       </Link>
       <Link 
         to={`/trips/${tripId}/itinerary`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}/itinerary`) ? 'active' : ''}`}
       >
         Itinerary
       </Link>
        <Link 
         to={`/trips/${tripId}/suggestions`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}/suggestions`) ? 'active' : ''}`}
       >
         Suggestions
       </Link>
       <Link 
         to={`/trips/${tripId}/notes`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}/notes`) ? 'active' : ''}`}
       >
         Notes
       </Link>
       <Link 
         to={`/trips/${tripId}/expenses`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}/expenses`) ? 'active' : ''}`}
       >
         Expenses
       </Link>
        <Link 
         to={`/trips/${tripId}/photos`} 
         className={`nav-link ${isActiveRoute(`/trips/${tripId}/photos`) ? 'active' : ''}`}
       >
         Photos
       </Link>
     </nav>

     <div className="trip-content">
       <Outlet />
     </div>
   </div>
 );
}

export default TripNavBar;

