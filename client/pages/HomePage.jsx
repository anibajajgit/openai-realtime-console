
import React from 'react';
import { Navigate } from 'react-router-dom';
import App from '../components/App';

const HomePage = () => {
  const [user, setUser] = React.useState(null);
  
  React.useEffect(() => {
    // Only access localStorage on the client side
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Error parsing user data:", e);
        }
      }
    }
  }, []);

  if (!user) {
    return <Navigate to="/" />;
  }

  return <App />;
};

export default HomePage;
