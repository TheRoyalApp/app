import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItem, setItem, deleteItem } from '@/helpers/secureStore';
import { AuthService, User, LoginCredentials, RegisterData } from '@/services';
import { apiClient } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isFirstTime: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, firstName: string, lastName: string, phone: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearStorage: () => Promise<void>;
  refreshUser: () => Promise<void>;
  markWelcomeAsSeen: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(true);

  useEffect(() => {
    // Check if user is already logged in and if it's first time
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      // Ensure API client is initialized with tokens from storage
      await apiClient.initialize();
      
      // Check if it's the first time opening the app
      const hasSeenWelcome = await getItem('hasSeenWelcome');
      setIsFirstTime(!hasSeenWelcome);
      
      console.log('=== AUTH CONTEXT DEBUG ===');
      
      // Check if user is authenticated with the API
      console.log('Checking if user is authenticated...');
      const isAuthenticated = await AuthService.isAuthenticated();
      console.log('isAuthenticated result:', isAuthenticated);
      
      if (isAuthenticated) {
        console.log('User appears authenticated, fetching profile...');
        // Get current user data
        const response = await AuthService.getCurrentUser();
        console.log('getCurrentUser response:', response);
        
        if (response.success && response.data) {
          console.log('User loaded successfully:', response.data);
          setUser(response.data);
        } else {
          console.log('Failed to get user data:', response.error);
          // Clear tokens if user data fetch fails
          await clearStorage();
        }
      } else {
        console.log('User not authenticated');
        // Clear any stored tokens
        await clearStorage();
      }
      
      console.log('=== END AUTH CONTEXT DEBUG ===');
    } catch (error) {
      console.error('Error checking auth status:', error);
      await clearStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      await deleteItem('user');
      await deleteItem('hasSeenWelcome');
      setUser(null);
      setIsFirstTime(true);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  };

  const markWelcomeAsSeen = async () => {
    try {
      await setItem('hasSeenWelcome', 'true');
      setIsFirstTime(false);
    } catch (error) {
      console.error('Error marking welcome as seen:', error);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await AuthService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const credentials: LoginCredentials = { email, password };
      console.log('Attempting sign in with:', { email });
      
      const response = await AuthService.login(credentials);
      console.log('Login response:', response);
      
      if (response.success && response.data) {
        console.log('Login successful, user data:', response.data.user);
        console.log('Tokens received - Access:', !!response.data.accessToken, 'Refresh:', !!response.data.refreshToken);
        
        setUser(response.data.user);
        // Store user data in secure storage for offline access
        await setItem('user', JSON.stringify(response.data.user));
        console.log('User data stored in secure storage');
        
        return true;
      }
      
      console.log('Login failed:', response.error);
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string, phone: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const registerData: RegisterData = { 
        email, 
        password, 
        firstName, 
        lastName, 
        phone, 
        role: 'customer' 
      };
      const response = await AuthService.register(registerData);
      
      if (response.success && response.data) {
        setUser(response.data.user);
        // Store user data in secure storage for offline access
        await setItem('user', JSON.stringify(response.data.user));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await AuthService.logout();
      
      // Clear local storage
      await clearStorage();
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear storage even if API call fails
      await clearStorage();
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isFirstTime,
    signIn,
    signUp,
    signOut,
    clearStorage,
    refreshUser,
    markWelcomeAsSeen,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 