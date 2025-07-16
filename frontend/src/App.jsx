import React from 'react';
import WithAuth from './components/WithAuth';
import { useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Navigate } from "react-router-dom";
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import MyTrips from './components/MyTrips';
import { useUser } from './contexts/UserContext';
import Navbar from './components/Navbar';
import EditTrip from './components/EditTrip';
import TripDetail from './components/TripDetail';
import Notes from './components/Notes';
import Suggestions from './components/Suggestions';
import './App.css'
import TripNavBar from './components/TripNavBar';
import Itinerary from './components/Itinerary';
import ExpenseTracker from './components/ExpenseTracker';
const APP_URL=import.meta.env.VITE_APP_URL

const App = () => {
  const { user, setUser } = useUser();


  useEffect(() => {
  fetch(`${APP_URL}/me`, { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error("Not logged in");
      return res.json();
    })
    .then((data) => {
      if (data.id) setUser(data);
    })
    .catch((err) => {
      console.log("User not logged in");
    });
}, [setUser]);


  

  return (
    <Router>
      <main>
        <header>
          <Navbar/>
        </header>
        <Routes>
           <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/my-trips" element={<MyTrips/>}/>
          <Route path="/trips/:tripId/edit" element={<EditTrip/>}/> 
           <Route path="/trips/:tripId" element={<TripNavBar/>}> 
            <Route index element={<TripDetail/>}/>
             <Route path="notes" element={<Notes/>}/> 
              <Route path="suggestions" element={<Suggestions/>}/> 
              <Route path="itinerary" element={<Itinerary/>}/> 
              <Route path="expenses" element={<ExpenseTracker/>}/> 
              
           </Route>
        </Routes>
      </main>
    </Router>
  );
};

export default App;
