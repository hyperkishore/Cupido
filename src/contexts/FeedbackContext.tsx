import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform, DeviceEventEmitter, NativeEventEmitter, NativeModules } from 'react-native';
// Platform-specific import will automatically use .web.ts for web and .ts for native
import { feedbackDatabase } from '../services/feedbackDatabase';

interface FeedbackContextType {
  feedbackMode: boolean;
  toggleFeedbackMode: () => void;
  currentScreen: string;
  setCurrentScreen: (screen: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

export const useFeedback = () => {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider');
  }
  return context;
};

interface FeedbackProviderProps {
  children: React.ReactNode;
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Unknown');

  useEffect(() => {
    // Initialize the feedback database
    const initDatabase = async () => {
      try {
        await feedbackDatabase.initializeDatabase();
        console.log('Feedback system initialized');
      } catch (error) {
        console.error('Failed to initialize feedback database:', error);
      }
    };

    initDatabase();

    // Set up keyboard shortcut listeners
    const keyboardHandler = (event: any) => {
      // Check for Cmd+Q (Meta+Q) or Ctrl+Q combination
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'q') {
        event.preventDefault();
        toggleFeedbackMode();
        console.log('Feedback mode toggled via keyboard shortcut');
      }
    };

    // For web platform, add keyboard event listener
    if (Platform.OS === 'web') {
      document.addEventListener('keydown', keyboardHandler);
      
      return () => {
        document.removeEventListener('keydown', keyboardHandler);
      };
    }

    // For React Native, we'll need to implement native keyboard detection
    // This is a simplified version - in a real app, you'd want to use a library
    // or implement native modules for proper keyboard shortcut detection
    
    return () => {
      // Cleanup
    };
  }, []);

  const toggleFeedbackMode = () => {
    setFeedbackMode(prev => {
      const newMode = !prev;
      console.log(`Feedback mode ${newMode ? 'enabled' : 'disabled'}`);
      if (newMode) {
        console.log('💡 Feedback mode active! Long-press any element to provide feedback.');
        console.log('💡 Press Cmd+Q again to disable feedback mode.');
      }
      return newMode;
    });
  };

  const value: FeedbackContextType = {
    feedbackMode,
    toggleFeedbackMode,
    currentScreen,
    setCurrentScreen,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
    </FeedbackContext.Provider>
  );
};

// Hook for keyboard shortcut detection in React Native
export const useKeyboardShortcuts = () => {
  const { toggleFeedbackMode } = useFeedback();

  useEffect(() => {
    // For iOS/Android, we can use hardware key events
    if (Platform.OS !== 'web') {
      const keyboardListener = DeviceEventEmitter.addListener('keyboardShortcut', (event) => {
        if (event.key === 'ctrlQ') {
          toggleFeedbackMode();
        }
      });

      return () => {
        keyboardListener.remove();
      };
    }
  }, [toggleFeedbackMode]);
};