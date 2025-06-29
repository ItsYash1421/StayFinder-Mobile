import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLogoutHandler } from '../constants/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  useEffect(() => {
    // Register logout handler for token expiration
    setLogoutHandler(() => logout);
  }, []);

  const login = async (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    await AsyncStorage.setItem('user', JSON.stringify(userData));
    await AsyncStorage.setItem('token', tokenData);
  };

  const logout = async (navigation = null) => {
    console.log('Logging out user...');
    
    // Clear state immediately
    setUser(null);
    setToken(null);
    
    // Clear storage
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
    
    // Navigate to login with ultra-smooth animation if navigation is provided
    if (navigation) {
      // Use a slightly longer delay for smoother transition
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }, 150);
    }
    
    console.log('Logout completed');
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}; 