
import React from 'react';
import { Navigate } from 'react-router-dom';
import App from '../components/App';

const HomePage = () => {
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;

  if (!user) {
    return <Navigate to="/" />;
  }

  return <App />;
};

export default HomePage;
