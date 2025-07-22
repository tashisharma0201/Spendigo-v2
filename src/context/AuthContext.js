// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          // Clear any stale session data on error
          await clearLocalAuthData();
        } else if (mounted) {
          setUser(session?.user ?? null);
          console.log('Initial session loaded:', session?.user ? 'User found' : 'No user');
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        await clearLocalAuthData();
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user ? 'User present' : 'No user');
        
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Handle specific auth events
        if (event === 'SIGNED_OUT') {
          await clearLocalAuthData();
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // ✅ Helper function to clear all local auth data
  const clearLocalAuthData = async () => {
    try {
      // Clear localStorage items that might contain auth data
      const authKeys = Object.keys(localStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('token')
      );
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage as well
      const sessionKeys = Object.keys(sessionStorage).filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('session') ||
        key.includes('token')
      );
      
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
      });

      console.log('Local auth data cleared');
    } catch (error) {
      console.error('Error clearing local auth data:', error);
    }
  };

  const signup = async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      console.log('Attempting signup for:', email);
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: email.split('@')[0] || 'User'
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        // Handle specific Supabase errors
        if (error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.');
        } else if (error.message.includes('Unable to validate email address') || error.message.includes('invalid')) {
          throw new Error('Please enter a valid email address.');
        } else if (error.message.includes('Signup is disabled')) {
          throw new Error('New registrations are currently disabled.');
        } else {
          throw new Error(error.message || 'Signup failed');
        }
      }

      console.log('Signup successful:', data?.user ? 'User created' : 'Check email for confirmation');
      return { success: true, data };
    } catch (error) {
      console.error('Signup failed:', error.message);
      return { success: false, error: error.message };
    }
  };

  const login = async ({ email, password }) => {
    if (!email || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('Login error:', error);
        // Handle specific Supabase errors
        if (error.message.includes('Invalid login credentials') || error.message.includes('invalid')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email address before signing in.');
        } else if (error.message.includes('Too many requests')) {
          throw new Error('Too many login attempts. Please wait a moment and try again.');
        } else if (error.message.includes('User not found')) {
          throw new Error('No account found with this email address.');
        } else {
          throw new Error(error.message || 'Login failed');
        }
      }

      console.log('Login successful:', data?.user ? 'User authenticated' : 'No user returned');
      return { success: true, data };
    } catch (error) {
      console.error('Login failed:', error.message);
      return { success: false, error: error.message };
    }
  };

  // ✅ Enhanced logout with fallback handling
  const logout = async () => {
    try {
      console.log('Attempting logout...');
      
      // Try to logout from Supabase first
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Supabase logout error:', error);
        
        // If it's a session missing error, force local logout
        if (error.message.includes('Auth session missing') || 
            error.message.includes('session missing') ||
            error.message.includes('403')) {
          
          console.log('Session missing - performing force logout');
          await forceLogout();
          return { success: true, forced: true };
        } else {
          throw new Error(error.message);
        }
      }

      console.log('Logout successful');
      return { success: true };
    } catch (error) {
      console.error('Logout failed, attempting force logout:', error.message);
      
      // Fallback: force logout regardless of Supabase response
      await forceLogout();
      return { success: true, forced: true, error: error.message };
    }
  };

  // ✅ Force logout - clears everything locally
  const forceLogout = async () => {
    try {
      console.log('Performing force logout...');
      
      // Clear all local auth data
      await clearLocalAuthData();
      
      // Force update user state
      setUser(null);
      
      // Trigger a page reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
      console.log('Force logout completed');
    } catch (error) {
      console.error('Force logout error:', error);
      // Even if clearing fails, reload the page
      window.location.reload();
    }
  };

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Helper function to get user metadata
  const getUserMetadata = () => {
    return user?.user_metadata || {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signup,
        login,
        logout,
        forceLogout,
        isAuthenticated,
        getUserMetadata
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
