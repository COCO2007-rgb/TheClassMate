import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('theclassmate_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('theclassmate_user') || 'null'));
  const [role, setRole] = useState(localStorage.getItem('theclassmate_role'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      alert('Your session has expired. Please sign in again.');
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    setLoading(false);

    return () => {
      window.removeEventListener('auth_session_expired', handleSessionExpired);
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login/', { email, password });
      const { token, user: userData, must_change_password } = response.data;
      
      localStorage.setItem('theclassmate_token', token);
      localStorage.setItem('theclassmate_user', JSON.stringify(userData));
      localStorage.setItem('theclassmate_role', userData.role);
      
      setToken(token);
      setUser(userData);
      setRole(userData.role);
      return { user: userData, must_change_password };
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Login failed. Please verify credentials.');
    }
  };

  const register = async (first_name, last_name, email, password) => {
    try {
      await api.post('/auth/register-admin/', { first_name, last_name, email, password });
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Registration failed.');
    }
  };

  const logout = () => {
    localStorage.removeItem('theclassmate_token');
    localStorage.removeItem('theclassmate_user');
    localStorage.removeItem('theclassmate_role');
    setToken(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, role, login, register, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
