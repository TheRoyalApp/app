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
  redirectToWelcome: () => Promise<void>;
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

  console.log('=== AUTH PROVIDER STATE ===');
  console.log('user:', user ? 'User exists' : 'No user');
  console.log('isLoading:', isLoading);
  console.log('isFirstTime:', isFirstTime);
  console.log('shouldShowAuth:', isFirstTime || !user);
  console.log('=== END AUTH PROVIDER STATE ===');

  useEffect(() => {
    // Check if user is already logged in and if it's first time
    checkAuthStatus();
  }, []);

  // Add a backup effect to ensure auth screens show if something goes wrong
  useEffect(() => {
    const backupTimer = setTimeout(() => {
      if (isLoading) {
        console.log('Backup timer triggered - forcing auth screens');
        setIsLoading(false);
        setIsFirstTime(true);
        setUser(null);
      }
    }, 8000); // Increased to 8 second backup

    return () => clearTimeout(backupTimer);
  }, [isLoading]);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      
      console.log('=== AUTH CONTEXT: Starting checkAuthStatus ===');
      
      // Add a timeout to prevent getting stuck
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Auth check timeout')), 5000); // Reduced to 5 second timeout
      });
      
      const authCheckPromise = async () => {
        try {
          // Ensure API client is initialized with tokens from storage
          console.log('Initializing API client...');
          await apiClient.initialize();
          
          // Check if it's the first time opening the app
          console.log('Checking if user has seen welcome screen...');
          const hasSeenWelcome = await getItem('hasSeenWelcome');
          console.log('hasSeenWelcome from storage:', hasSeenWelcome);
          setIsFirstTime(!hasSeenWelcome);
          console.log('isFirstTime set to:', !hasSeenWelcome);
          
          // If it's first time, don't even try to authenticate
          if (!hasSeenWelcome) {
            console.log('First time user, skipping authentication check');
            return;
          }
          
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
              await redirectToWelcome();
            }
          } else {
            console.log('User not authenticated');
            // Clear any stored tokens and redirect to welcome
            await redirectToWelcome();
          }
          
          console.log('=== END AUTH CONTEXT DEBUG ===');
        } catch (innerError) {
          console.error('Inner error in auth check:', innerError);
          // On any inner error, redirect to welcome
          await redirectToWelcome();
        }
      };
      
      // Race between timeout and auth check
      await Promise.race([authCheckPromise(), timeoutPromise]);
      
    } catch (error) {
      console.error('Error checking auth status:', error);
      // On any error, redirect to welcome
      await redirectToWelcome();
    } finally {
      console.log('Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const clearStorage = async () => {
    try {
      console.log('=== CLEARING STORAGE ===');
      await deleteItem('user');
      await deleteItem('hasSeenWelcome');
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      setUser(null);
      // Don't reset isFirstTime when clearing storage - let it stay as it was
      // This ensures users who have seen welcome screen don't see it again
      console.log('Storage cleared, user set to null');
      console.log('=== END CLEARING STORAGE ===');
    } catch (error) {
      console.error('Error clearing storage:', error);
      // Force reset state even if storage fails
      setUser(null);
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

  const redirectToWelcome = async () => {
    try {
      // Clear user data but keep welcome screen state
      await deleteItem('user');
      await deleteItem('accessToken');
      await deleteItem('refreshToken');
      setUser(null);
      console.log('Redirected to welcome - user cleared');
    } catch (error) {
      console.error('Error redirecting to welcome:', error);
      setUser(null);
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
      
      // Clear local storage and reset first time state
      await clearStorage();
      await deleteItem('hasSeenWelcome');
      setIsFirstTime(true);
      
      console.log('User signed out - redirecting to welcome screen');
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear storage even if API call fails
      await clearStorage();
      await deleteItem('hasSeenWelcome');
      setIsFirstTime(true);
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
    redirectToWelcome,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 