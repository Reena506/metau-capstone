import { useEffect, useState} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Navigate } from "react-router-dom";
import SignupForm from './components/SignupForm';
import LoginForm from './components/LoginForm';
import { useUser } from './contexts/UserContext';
import './App.css'

const App = () => {
  const { user, setUser } = useUser();


  useEffect(() => {
  fetch("http://localhost:3000/me", { credentials: "include" })
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
          <h1>MyTravel</h1>
        </header>

        
        <Routes>
           <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </main>
    </Router>
  );
};

export default App;
