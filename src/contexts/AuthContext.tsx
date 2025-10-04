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
    const getSession = async () => {
      try {
        const currentUser = await AuthService.getCurrentUser(mode);
        setUser(currentUser);
      } catch (error) {
        console.error('Error getting current user:', error);
      } finally {
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
