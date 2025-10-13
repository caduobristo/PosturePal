import React, { createContext, useContext, useState } from 'react';
import { mockUser } from '../mock';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Mock login - simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (email === 'admin@ballet.com' && password === 'admin') {
        setUser(mockUser);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;