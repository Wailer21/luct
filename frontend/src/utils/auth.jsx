import React, { createContext, useState, useContext, useEffect } from 'react';
import { api, API_ENDPOINTS } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      try {
        // Verify token is still valid
        const response = await api.get(API_ENDPOINTS.ME, true);
        if (response.success) {
          setUser(response.data.user);
          setToken(savedToken);
        } else {
          // Token is invalid, clear storage
          logout();
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const saveLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!token && !!user;

  const value = {
    token,
    user,
    loading,
    isAuthenticated,
    saveLogin,
    logout,
  };

  console.log('Auth Context Value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};