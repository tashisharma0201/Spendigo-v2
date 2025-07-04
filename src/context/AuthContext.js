// src/context/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load current session user on mount
  useEffect(() => {
    const session = localStorage.getItem('current_user');
    if (session) setUser(JSON.parse(session));
    setLoading(false);
  }, []);

  // Helper to get the users array (or empty)
  const getUsers = () => {
    const raw = localStorage.getItem('users');
    return raw ? JSON.parse(raw) : [];
  };

  // Helper to save the users array
  const saveUsers = (users) => {
    localStorage.setItem('users', JSON.stringify(users));
  };

  // Sign up: append new user to users array
  const signup = async ({ email, password }) => {
    try {
      if (!email || !password) throw new Error('Email and password are required');
      const users = getUsers();
      // Prevent duplicate emails
      if (users.some(u => u.email === email)) {
        throw new Error('An account with that email already exists');
      }
      const newUser = { id: Date.now(), email, password, name: 'User Name' };
      users.push(newUser);
      saveUsers(users);
      // Auto-login after signup
      localStorage.setItem('current_user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Login: search users array for matching credentials
  const login = async ({ email, password }) => {
    try {
      const users = getUsers();
      const matched = users.find(u => u.email === email && u.password === password);
      if (!matched) throw new Error('Invalid credentials');
      localStorage.setItem('current_user', JSON.stringify(matched));
      setUser(matched);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // Logout: clear session
  const logout = () => {
    setUser(null);
    localStorage.removeItem('current_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
