import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setLogoutHandler } from "../constants/api";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");
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
    await AsyncStorage.setItem("user", JSON.stringify(userData));
    await AsyncStorage.setItem("token", tokenData);
  };

  const logout = async (navigation = null, showToast = false) => {
    console.log("Logging out user...");

    // Set a flag to indicate logout just happened
    try {
      await AsyncStorage.setItem("justLoggedOut", "true");
    } catch (error) {
      console.error("Error setting logout flag:", error);
    }

    // Clear state immediately
    setUser(null);
    setToken(null);

    // Clear storage
    try {
      await AsyncStorage.removeItem("user");
      await AsyncStorage.removeItem("token");
    } catch (error) {
      console.error("Error clearing storage:", error);
    }

    // Navigate to login immediately if navigation is provided
    if (navigation) {
      // Immediate redirect to login page
      navigation.reset({
        index: 0,
        routes: [{ name: "Login" }],
      });
    }

    console.log("Logout completed");
  };

  return (
    <AuthContext.Provider
      value={{ user, token, setUser, setToken, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
