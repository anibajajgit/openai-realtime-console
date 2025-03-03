import React, { createContext, useState, useContext, useEffect } from 'react';

// Create context with default values to prevent undefined errors
export const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
  isClient: false
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Only run this effect on the client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log("Auth context loading user from localStorage:", parsedUser);
          setUser(parsedUser);
        } catch (e) {
          console.error("Error parsing stored user:", e);
          localStorage.removeItem('user');
        }
      }
    }
  }, []);

  // Add another effect to help with debugging
  useEffect(() => {
    if (user) {
      console.log("AuthContext user state updated:", user);
    }
  }, [user]);

  console.log("AuthContext Provider rendering with user:", user);

  const login = (userData) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isClient }}>
      {children}
    </AuthContext.Provider>
  );
}