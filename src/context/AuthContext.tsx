"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, signup as apiSignup } from '../lib/api';
import { toast } from 'sonner';

interface AuthUser {
  email: string;
  full_name: string;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (email: string, full_name: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Using sonner toast directly

  const refreshToken = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout(); // Token is invalid/expired, logout the user
          return false;
        }
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setUser(prev => prev ? { ...prev, token: data.access_token } : null);
      localStorage.setItem('authUser', JSON.stringify({ 
        ...user, 
        token: data.access_token 
      }));
      return true;
    } catch (err) {
      console.error('Token refresh failed:', err);
      return false;
    }
  };

  // Restore user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // Save user to localStorage when changed
  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const login = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiLogin(username, password);
      
      // Make sure we have a token
      if (!res.access_token) {
        throw new Error('No access token returned from server');
      }

      // Store just the raw token value
      const token = res.access_token;
      console.log('Setting auth token:', '<token>');
      
      setUser({
        email: username,
        full_name: res.full_name || username,
        token: token,
      });

      // Add a success toast
      toast.success('Login successful! Welcome back.');

    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Login failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, full_name: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiSignup(email, full_name, password);
      // Server returns user info, but not token; require login after signup
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = (showNotification = false) => {
    setUser(null);
    setError(null);
    localStorage.removeItem('authUser');
    
    if (showNotification) {
      toast.info('Your session has expired. Please log in again.');
    }
  };

  // Set up automatic token refresh and auth error handling
  useEffect(() => {
    if (!user) return;

    // Set up token refresh interval
    const refreshInterval = setInterval(async () => {
      console.log('Attempting to refresh token...');
      const success = await refreshToken();
      if (!success) {
        console.log('Token refresh failed, logging out...');
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    // Set up auth error listener
    const handleAuthError = () => {
      console.log('Auth error detected, logging out...');
      logout(true); // Show notification when logging out due to auth error
    };

    window.addEventListener('auth-error', handleAuthError);

    return () => {
      clearInterval(refreshInterval);
      window.removeEventListener('auth-error', handleAuthError);
    };
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, refreshToken, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
