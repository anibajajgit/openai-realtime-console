import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import AuthDialog from '../components/auth/AuthDialog';
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(() => {
    const savedUser = typeof window !== 'undefined' && localStorage.getItem('user') 
    ? JSON.parse(localStorage.getItem('user')) 
    : null;
    return savedUser;
  });

  // Redirect to home if user is logged in
  if (user) {
    return <Navigate to="/home" />;
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-2">Voice Chat App</h1>
          <p className="text-gray-600">
            Sign in to access real-time voice chat and scenarios
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-md">
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="w-full"
            size="lg"
          >
            Get Started
          </Button>
        </div>
      </div>

      <AuthDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
};

export default LandingPage;