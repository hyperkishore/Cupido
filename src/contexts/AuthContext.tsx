import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthService } from '../services/auth';
import { User } from '../types';
import { useAppMode } from './AppModeContext';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (phoneNumber: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { mode } = useAppMode();

  useEffect(() => {
    console.log('[AuthContext] Starting initialization...');
    const getSession = async () => {
      try {
        // Increased timeout to 10s for slow networks/storage
        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => {
            console.warn('[AuthContext] ⏱️  Timeout reached (10s) - proceeding without user');
            resolve(null);
          }, 10000);
        });

        console.log('[AuthContext] Fetching current user...');
        const userPromise = AuthService.getCurrentUser(mode);

        // Race between the user fetch and timeout
        const currentUser = await Promise.race([userPromise, timeoutPromise]);
        console.log('[AuthContext] Result:', currentUser ? 'User loaded' : 'No user');
        setUser(currentUser);
      } catch (error) {
        console.error('[AuthContext] ❌ Error getting current user:', error);
        setUser(null); // Ensure we set user to null on error
      } finally {
        console.log('[AuthContext] ✅ Setting loading to false');
        setLoading(false);
      }
    };

    getSession();
  }, [mode]);

  const signIn = async (phoneNumber: string) => {
    setLoading(true);
    try {
      const nextUser = await AuthService.signInWithPhone(phoneNumber, mode);
      setUser(nextUser);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await AuthService.signOut(mode);
      setUser(null);
      // If we're in local mode, ensure we stay in local mode to show login screen
      // Don't switch to demo mode on logout
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider 
      value={{
        user,
        loading,
        signIn,
        signOut,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
