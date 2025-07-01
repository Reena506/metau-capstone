import { useUser } from '../contexts/UserContext';
import { useNavigate, useLocation } from 'react-router-dom';
const APP_URL=import.meta.env.VITE_APP_URL

const Navbar = () => {
  const { user, setUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on a trip detail page
  const isOnTripPage = location.pathname.includes('/trips/') && location.pathname !== '/my-trips';

  const handleLogout = async () => {
    try {
      const res = await fetch(`${APP_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setUser(null);
        navigate('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleBackToTrips = () => {
    navigate('/my-trips');
  };

  return (
    <nav className="main-navbar">
      <div className="navbar-content">
        
        <div className="navbar-center">
          <h1 className="app-title">MyTravel</h1>
        </div>
        
        <div className="navbar-right">
          {!user && (
            <>
              <button onClick={() => navigate('/login')}>Login</button>
              <button onClick={() => navigate('/signup')}>Sign Up</button>
            </>
          )}
          {user && (
            <>
              {isOnTripPage && (
                <button onClick={handleBackToTrips} className="back-btn">
                  ← Back to My Trips
                </button>
              )}
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

