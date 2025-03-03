
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../utils/AuthContext";
import LoginDialog from "./LoginDialog";
import { motion } from "framer-motion";
import { cn } from "../utils/styleUtils";
import { ElegantShape } from "./ElegantBackground";

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Close login dialog if user is logged in
    if (user && isLoginOpen) {
      setIsLoginOpen(false);
    }
  }, [user, isLoginOpen]);

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
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-[#030303] text-white">
      {/* Elegant Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

      <div className="absolute inset-0 overflow-hidden">
        <ElegantShape
          delay={0.3}
          width={600}
          height={140}
          rotate={12}
          gradient="from-indigo-500/[0.15]"
          className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
        />

        <ElegantShape
          delay={0.5}
          width={500}
          height={120}
          rotate={-15}
          gradient="from-rose-500/[0.15]"
          className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
        />

        <ElegantShape
          delay={0.4}
          width={300}
          height={80}
          rotate={-8}
          gradient="from-violet-500/[0.15]"
          className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
        />

        <ElegantShape
          delay={0.6}
          width={200}
          height={60}
          rotate={20}
          gradient="from-amber-500/[0.15]"
          className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
        />

        <ElegantShape
          delay={0.7}
          width={150}
          height={40}
          rotate={-25}
          gradient="from-cyan-500/[0.15]"
          className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
        />
      </div>

      {/* Add a subtle gradient overlay to ensure content visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />

      {/* Content - Preserved exactly as it was */}
      <div className="max-w-2xl w-full text-center z-10 relative p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold mb-4 tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300">
              ConvoCoach
            </span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-white/60 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto">
            Get Real-Time Voice Insights & Communication Feedback by AI
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          {user ? (
            <>
              <button
                onClick={handleGetStarted}
                className="py-2 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Get Started
              </button>
              <button
                onClick={logout}
                className="py-2 px-6 bg-transparent border border-white/30 text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="py-2 px-6 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Login to Get Started
            </button>
          )}
        </motion.div>
      </div>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(userData) => {
          console.log("Login successful", userData);
          // The function will automatically store user in localStorage
        }}
      />
    </div>
  );
};

export default Home;
