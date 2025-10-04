import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setDemoMode } from '../config/demo';

export type AppMode = 'demo' | 'local';

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
}

const ModeContext = createContext<ModeContextValue | undefined>(undefined);

const STORAGE_KEY = 'cupido_app_mode';

export const ModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<AppMode>('local');

  useEffect(() => {
    const loadMode = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'demo' || stored === 'local') {
          setModeState(stored);
          setDemoMode(stored === 'demo');
        }
      } catch (error) {
        console.warn('Failed to read mode from storage', error);
      }
    };

    loadMode();
  }, []);

  const setMode = async (nextMode: AppMode) => {
    setModeState(nextMode);
    setDemoMode(nextMode === 'demo');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error) {
      console.warn('Failed to persist app mode', error);
    }
  };

  const value = useMemo(() => ({ mode, setMode }), [mode]);

  return <ModeContext.Provider value={value}>{children}</ModeContext.Provider>;
};

export const useAppMode = () => {
  const context = useContext(ModeContext);
  if (!context) {
    throw new Error('useAppMode must be used within a ModeProvider');
  }
  return context;
};
