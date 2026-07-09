import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    checkLoginState();
  }, []);

  const checkLoginState = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      const info = await AsyncStorage.getItem('userInfo');
      if (token && info) {
        setUserToken(token);
        setUserInfo(JSON.parse(info));
      }
    } catch (e) {
      console.error('Failed to load login state:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (mobile, otp_code, student_id, batch_code) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/parent/verify-otp/', {
        mobile,
        otp_code,
        student_id,
        batch_code
      });
      
      const { token, user } = response.data;
      if (token && user) {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userInfo', JSON.stringify(user));
        setUserToken(token);
        setUserInfo(user);
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (e) {
      const errorMsg = e.response?.data?.error || e.message || 'Login failed';
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setUserToken(null);
      setUserInfo(null);
    } catch (e) {
      console.error('Logout failed:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoading, userToken, userInfo, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
