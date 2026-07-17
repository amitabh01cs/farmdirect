import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Error loading user profile:', err);
        logout();
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please verify credentials.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone, role) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', { name, email, password, phone, role });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setToken(res.data.token);
        setUser(res.data.user);
        return { success: true, user: res.data.user };
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed. Please check inputs.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const res = await api.put('/profile', data);
      if (res.data.success) {
        setUser((prev) => ({
          ...prev,
          ...res.data.user
        }));
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  const updateFarmerProfile = async (data) => {
    try {
      const res = await api.put('/profile/farmer', data);
      if (res.data.success) {
        // Refresh full user state including new profile fields
        const meRes = await api.get('/auth/me');
        if (meRes.data.success) {
          setUser(meRes.data.user);
        }
        return { success: true };
      }
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Update failed' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateFarmerProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
