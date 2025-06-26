import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('login'); // default to login

  const handleNavigation = (tab) => {
    setActiveTab(tab);
    navigate(`/${tab}`);
  };

  return (
    <nav>
      <button
        onClick={() => handleNavigation('login')}
      >
        Login
      </button>
      <button
        onClick={() => handleNavigation('signup')}
      >
        Sign Up
      </button>
    </nav>
  );
};

export default Navbar;


