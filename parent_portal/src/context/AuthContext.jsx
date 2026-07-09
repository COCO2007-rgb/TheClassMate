import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('theclassmate_token'));
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('theclassmate_user') || 'null'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      alert('Your parent portal session has expired. Please sign in again.');
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
      const { token, user: userData } = response.data;
      
      if (userData.role !== 'parent') {
        throw new Error('Access denied. This portal is strictly for parents.');
      }
      
      localStorage.setItem('theclassmate_token', token);
      localStorage.setItem('theclassmate_user', JSON.stringify(userData));
      localStorage.setItem('theclassmate_role', 'parent');
      
      setToken(token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Login failed.');
    }
  };

  const loginSendOTP = async (email, studentId) => {
    try {
      const response = await api.post('/auth/parent/send-otp/', { email, student_id: studentId });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'Failed to send OTP.');
    }
  };

  const loginVerifyOTP = async (email, otpCode, studentId) => {
    try {
      const response = await api.post('/auth/parent/verify-otp/', { email, otp_code: otpCode, student_id: studentId });
      const { token, user: userData, is_new_user } = response.data;
      
      if (!is_new_user) {
        localStorage.setItem('theclassmate_token', token);
        localStorage.setItem('theclassmate_user', JSON.stringify(userData));
        localStorage.setItem('theclassmate_role', 'parent');
        
        setToken(token);
        setUser(userData);
      }
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || error.message || 'OTP verification failed.');
    }
  };

  const requestOTP = async (batchCode, studentId, mobile) => {
    try {
      const response = await api.post('/public/parent/register/', {
        batch_code: batchCode,
        student_id: studentId,
        mobile: mobile
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'OTP request failed. Please check credentials.');
    }
  };

  const verifyOTP = async (studentId, otpCode, email, password) => {
    try {
      await api.post('/public/parent/verify/', {
        student_id: studentId,
        otp_code: otpCode,
        email,
        password
      });
      // Automatically login after successful verification
      return await login(email, password);
    } catch (error) {
      throw new Error(error.response?.data?.error || 'OTP verification failed.');
    }
  };

  const completeRegistration = (token, userData) => {
    localStorage.setItem('theclassmate_token', token);
    localStorage.setItem('theclassmate_user', JSON.stringify(userData));
    localStorage.setItem('theclassmate_role', 'parent');
    setToken(token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('theclassmate_token');
    localStorage.removeItem('theclassmate_user');
    localStorage.removeItem('theclassmate_role');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, loginSendOTP, loginVerifyOTP, requestOTP, verifyOTP, completeRegistration, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
