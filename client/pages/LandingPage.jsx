
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import AuthDialog from '../components/auth/AuthDialog';
// Import the correct Button component
import { Button } from '../components/ui/button';

const LandingPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    }
  }, []);

  // Redirect to home if user is logged in
  if (user) {
    return <Navigate to="/home" />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-indigo-100 p-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-blue-900">Practice Your Sales Pitch</h1>
        <p className="text-xl text-blue-700">
          Perfect your presentation skills by practicing with AI-powered role-playing scenarios. Get instant feedback and improve your performance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-blue-800">Select a Role</h3>
            <p className="mt-2 text-gray-600">Choose from various personas with different personalities and preferences</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-blue-800">Practice Your Pitch</h3>
            <p className="mt-2 text-gray-600">Present your ideas to AI characters that respond in real-time</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-blue-800">Get Feedback</h3>
            <p className="mt-2 text-gray-600">Receive detailed analysis and suggestions to improve your approach</p>
          </div>
        </div>

        <div className="mt-12">
          <Button
            onClick={() => {
              console.log("Opening dialog");
              setIsDialogOpen(true);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
            type="button"
          >
            Get Started
          </Button>
        </div>
      </div>

      <AuthDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={(user) => {
          setUser(user);
        }}
      />
    </div>
  );
};

export default LandingPage;
