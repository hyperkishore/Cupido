import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDemoMode } from '../config/demo';
import { updateSupabaseClient } from '../services/supabase';

export type AppMode = 'demo' | 'local';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isLoading: boolean; // FIXED: Add loading state to interface
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'cupido_app_mode';

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIXED: Add loading state to prevent race condition/flicker
  const [mode, setModeState] = useState<AppMode>('local');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'demo' || stored === 'local') {
          setModeState(stored);
          setDemoMode(stored === 'demo');
          // Update Supabase client to match the mode
          updateSupabaseClient(stored === 'demo');
        }
      } catch (error) {
        console.warn('Failed to read mode from storage', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMode();
  }, []);

  const setMode = async (nextMode: AppMode) => {
    setModeState(nextMode);
    setDemoMode(nextMode === 'demo');
    // Update Supabase client when mode changes
    updateSupabaseClient(nextMode === 'demo');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn('Failed to persist app mode', error);
    }
  };

  const value = useMemo(() => ({ mode, setMode, isLoading }), [mode, isLoading]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useAppMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within a ModeProvider');
  }
  return context;
};
