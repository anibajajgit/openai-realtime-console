
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import LoginDialog from "./LoginDialog";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
        localStorage.removeItem("user");
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  const handleGetStarted = () => {
    navigate("/scenarios");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to the Scenario Simulator</h1>
        <p className="text-xl mb-8">
          Practice real-world scenarios with AI-powered role-playing
        </p>
        
        {user ? (
          <div className="space-y-4">
            <p className="text-gray-700">Logged in as: {user.username}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted} 
                className="w-full sm:w-auto"
              >
                Get Started
              </Button>
              <Button 
                variant="outline" 
                onClick={handleLogout} 
                className="w-full sm:w-auto"
              >
                Logout
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            size="lg" 
            onClick={() => setIsLoginOpen(true)}
            className="px-8"
          >
            Login to Get Started
          </Button>
        )}
      </div>

      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
        onLoginSuccess={handleLoginSuccess} 
      />
    </div>
  );
}
