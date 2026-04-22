import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(sessionStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      api.setToken(token);
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.getCurrentAdmin();
      if (response._id) {
        setUser(response);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      logoutUser();
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email, password) => {
    try {
      const response = await api.login(email, password);
      if (response.token) {
        api.setToken(response.token);
        setToken(response.token);
        setUser(response.admin);
        return { success: true, message: 'Login successful' };
      }
      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const registerUser = async (data) => {
    try {
      const response = await api.register(data);
      if (response.token) {
        api.setToken(response.token);
        setToken(response.token);
        setUser(response.admin);
        return { success: true, message: 'Registration successful' };
      }
      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const logoutUser = () => {
    sessionStorage.removeItem('token');
    setToken(null);
    setUser(null);
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      loginUser,
      registerUser,
      logoutUser,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
