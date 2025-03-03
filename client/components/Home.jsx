
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/Button";
import LoginDialog from "./LoginDialog";
import { HeroGeometric } from "./ElegantBackground";

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const isClient = typeof window !== 'undefined'; // Check if running in browser

  useEffect(() => {
    if (typeof window !== 'undefined') { // Only run this on the client-side
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Error parsing user from localStorage:", error);
          localStorage.removeItem("user");
        }
      }
    }
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.setItem('logout_timestamp', Date.now().toString());
    setUser(null);
    console.log("Home component: User logged out");
    // Force the page to reload to clear any lingering state
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const handleGetStarted = () => {
    console.log("Get Started button clicked, navigating to /scenarios");
    // Make sure user is actually stored before navigation
    if (!user && typeof window !== 'undefined') {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        console.log("No user found, redirecting to login first");
        setIsLoginOpen(true);
        return;
      }
    }
    navigate("/scenarios");
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden">
      {/* Background elements */}
      <HeroGeometric />
      
      {/* Content */}
      <div className="relative z-10 max-w-2xl w-full text-center px-6">
        <h1 className="text-4xl font-bold mb-4 text-white">Welcome to the Scenario Simulator</h1>
        <p className="text-xl mb-8 text-white/80">
          Practice real-world scenarios with AI-powered role-playing
        </p>

        {isClient && ( // Conditionally render based on client-side environment
          <>
            {user ? (
              <div className="space-y-4">
                <p className="text-white/90">Logged in as: {user.username}</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    onClick={handleGetStarted} 
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                  >
                    Get Started
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout} 
                    className="w-full sm:w-auto border-white text-white hover:bg-white/20"
                  >
                    Logout
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                size="lg" 
                onClick={() => setIsLoginOpen(true)}
                className="px-8 bg-primary hover:bg-primary/90"
              >
                Login to Get Started
              </Button>
            )}
          </>
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
