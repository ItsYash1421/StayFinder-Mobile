// const BASE_URL = 'http://localhost:5000'; // Local development
//const BASE_URL = "http://localhost:3000"; // Local development
//const BASE_URL = "http://10.211.146.185:3000"; // Example LAN IP
//const BASE_URL = "https://stayfinder-mobile.onrender.com"; // Production backend Pardheev
const BASE_URL = "https://stayfinder-backend-5wmn.onrender.com";

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Global logout handler (set by AuthContext)
let logoutHandler = null;
export const setLogoutHandler = (handler) => {
  logoutHandler = handler;
};

// Axios request interceptor to add token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token && token.trim() !== "") {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // Always allow the request to proceed - let the backend handle authentication
    } catch (error) {
      console.log("Error getting token from storage:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Axios response interceptor for JWT errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      (error.response.data?.message?.toLowerCase().includes("jwt expired") ||
        error.response.data?.message?.toLowerCase().includes("jwt malformed") ||
        error.response.data?.message?.toLowerCase().includes("invalid token"))
    ) {
      console.log("JWT error detected, logging out user");
      if (logoutHandler) logoutHandler();
    }
    return Promise.reject(error);
  }
);
