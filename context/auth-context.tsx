'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';
import type { SuperAdmin, LoginCredentials } from '@/types';

/**
 * Authentication Context for Super Admin users
 * Manages user state, login/logout, and protected route access
 */

interface AuthContextType {
  user: SuperAdmin | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshTokens: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * Wraps the app to provide authentication state and methods
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SuperAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user && apiClient.isAuthenticated();

  /**
   * Initialize authentication state on app load
   */
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Check if we have tokens
      if (!apiClient.isAuthenticated()) {
        console.log('No valid tokens found during initialization');
        setUser(null);
        return;
      }

      console.log('Valid tokens found, initializing auth...');

      // Try to get user from localStorage first (faster)
      const storedUser = apiClient.getStoredUser();
      if (storedUser) {
        console.log('Found stored user data:', storedUser.firstName);
        setUser(storedUser);
      }

      try {
        // Validate with backend and refresh user data
        const currentUser = await apiClient.getCurrentUser();
        console.log('Successfully validated user with backend:', currentUser.firstName);
        setUser(currentUser);
        
        // Update localStorage with fresh data
        localStorage.setItem('copay_user', JSON.stringify(currentUser));
      } catch (apiError) {
        console.log('Backend validation failed, using stored user data');
        // If backend call fails but we have stored user data, continue with stored data
        if (storedUser) {
          setUser(storedUser);
        } else {
          throw apiError;
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setUser(null);
      // Clear any invalid tokens
      try {
        await apiClient.logout();
      } catch (logoutError) {
        console.error('Logout during initialization failed:', logoutError);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Login function
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    
    try {
      const authResponse = await apiClient.login(credentials);
      setUser(authResponse.user);
      
      // Redirect to dashboard after successful login
      router.push('/dashboard');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Logout function
   */
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push('/login');
    }
  }, [router]);

  /**
   * Refresh user data from backend
   */
  const refreshUser = useCallback(async () => {
    if (!apiClient.isAuthenticated()) return;
    
    try {
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('copay_user', JSON.stringify(currentUser));
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  }, [logout]);

  /**
   * Manually refresh authentication tokens
   */
  const refreshTokens = useCallback(async (): Promise<boolean> => {
    try {
      // This will trigger the token refresh through the interceptor
      const currentUser = await apiClient.getCurrentUser();
      setUser(currentUser);
      localStorage.setItem('copay_user', JSON.stringify(currentUser));
      return true;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }, []);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Set up token refresh timer
  useEffect(() => {
    if (!isAuthenticated) return;

    // Check token expiration every 5 minutes
    const tokenCheckInterval = setInterval(async () => {
      try {
        const tokenDataStr = localStorage.getItem('copay_tokens');
        if (!tokenDataStr) return;
        
        const tokenData = JSON.parse(tokenDataStr);
        if (tokenData.expiresAt) {
          const timeUntilExpiry = tokenData.expiresAt - Date.now();
          // Refresh token if it expires in less than 10 minutes
          if (timeUntilExpiry < 10 * 60 * 1000 && timeUntilExpiry > 0) {
            console.log('Token expires soon, refreshing...');
            const success = await refreshTokens();
            if (!success) {
              console.log('Token refresh failed, logging out...');
              await logout();
            }
          }
        }
      } catch (error) {
        console.error('Error in token check interval:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(tokenCheckInterval);
  }, [isAuthenticated, refreshTokens, logout]);

  // Listen for storage events (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'copay_tokens' || event.key === 'copay_user') {
        console.log('Storage changed in another tab, reinitializing auth...');
        initializeAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    refreshTokens,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Custom hook for protected routes
 * Automatically redirects to login if not authenticated
 */
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push('/login');
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}

/**
 * Higher-order component for protected pages
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function AuthenticatedComponent(props: P) {
    const auth = useRequireAuth();

    // Show loading spinner while checking auth
    if (auth.isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-copay-navy"></div>
        </div>
      );
    }

    // Don't render component if not authenticated (redirect is handled by useRequireAuth)
    if (!auth.isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
}