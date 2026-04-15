import React, { createContext, useContext, useState } from 'react';
import { getStoredAuth, setStoredAuth, removeStoredAuth } from '../utils/auth';
import API_BASE_URL from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ✅ Initialize directly from localStorage — no race condition
  const storedAuth = getStoredAuth();
  const [user, setUser]     = useState(storedAuth?.user  || null);
  const [token, setToken]   = useState(storedAuth?.token || null);
  const [loading, setLoading] = useState(false);

  const login = (userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setStoredAuth({ user: userData, token: authToken });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeStoredAuth();
  };

  // ✅ Re-fetch the current user from the server and update context + localStorage.
  // Call this after any action that mutates user data (e.g. requestVerification,
  // completeProfile) so the UI reflects the new state without a full page reload.
  const refreshUser = async (currentToken) => {
    const authToken = currentToken || token;
    if (!authToken) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/profile/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setStoredAuth({ user: data.user, token: authToken });
      }
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    refreshUser, // ✅ exported so any component can call it
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};