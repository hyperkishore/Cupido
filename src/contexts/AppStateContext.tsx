import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
interface Answer {
  id: string;
  questionId: string;
  questionText: string;
  text: string;
  category: string;
  timestamp: string;
  hearts: number;
  isLiked?: boolean;
}

interface UserStats {
  totalPoints: number;
  responses: number;
  connected: number;
  authenticityScore: number;
  currentStreak: number;
}

interface AppState {
  answers: Answer[];
  userStats: UserStats;
  currentReflectionQuestion: string | null;
  reflectionProgress: number;
  unlockedFeatures: string[];
}

type AppAction = 
  | { type: 'ADD_ANSWER'; payload: Answer }
  | { type: 'LIKE_ANSWER'; payload: string }
  | { type: 'UPDATE_STATS'; payload: Partial<UserStats> }
  | { type: 'SET_REFLECTION_QUESTION'; payload: string }
  | { type: 'COMPLETE_REFLECTION'; payload: Answer }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET_STATE' };

const initialState: AppState = {
  answers: [
    {
      id: 'a1',
      questionId: 'q1',
      questionText: "What's a small act of kindness that restored your faith in people?",
      text: "A stranger helped an elderly person with groceries without being asked. It reminded me that small acts of kindness create ripples of goodness in the world, and humanity is more beautiful than the news would have us believe.",
      category: 'VALUES & PHILOSOPHY',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      hearts: 23,
      isLiked: false,
    },
    {
      id: 'a2',
      questionId: 'q2',
      questionText: "What's the best way someone has ever made you feel seen and understood?",
      text: "My friend noticed I was struggling and didn't ask questions or try to fix it. They just showed up with my favorite tea and sat with me in comfortable silence. Sometimes being truly seen means someone caring enough to just be present.",
      category: 'DATING & CONNECTION',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      hearts: 31,
      isLiked: false,
    },
    {
      id: 'a3',
      questionId: 'q3',
      questionText: "What's something you believe deeply that you learned not from being taught, but from living?",
      text: "That vulnerability isn't weakness - it's the birthplace of authentic connection. I learned this through years of trying to be perfect and realizing I only felt truly loved when I stopped pretending I had it all figured out.",
      category: 'VALUES & PHILOSOPHY',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      hearts: 47,
      isLiked: false,
    },
    {
      id: 'a4',
      questionId: 'q4',
      questionText: "What's something you've always been naturally drawn to that others might find puzzling?",
      text: "I collect interesting words and phrases I overhear in coffee shops. There's something magical about fragments of strangers' stories - the way someone says 'and then everything changed' makes me wonder about their whole universe.",
      category: 'SELF-DISCOVERY',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      hearts: 18,
      isLiked: false,
    },
    {
      id: 'a5',
      questionId: 'q5',
      questionText: "What's a way you've learned to show love that's different from how you received it growing up?",
      text: "I learned to ask 'How can I support you?' instead of immediately trying to fix or give advice. Growing up, love felt like solutions being imposed on me. Now I offer presence first, solutions second.",
      category: 'RELATIONSHIP & HEALING',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      hearts: 42,
      isLiked: false,
    },
    {
      id: 'a6',
      questionId: 'q6',
      questionText: "Which childhood ritual or tradition still brings you comfort when you think about it today?",
      text: "My grandmother would make hot chocolate on rainy days and we'd sit by the window, not talking, just watching the world get washed clean. Now when I feel overwhelmed, I make hot chocolate and remember that storms always pass.",
      category: 'CHILDHOOD & MEMORY',
      timestamp: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      hearts: 29,
      isLiked: false,
    },
    {
      id: 'a7',
      questionId: 'q7',
      questionText: "When do you feel most aligned with who you're meant to be?",
      text: "When I'm helping someone work through a problem they thought was impossible to solve. There's this moment when their face lights up with understanding, and I remember that my purpose is being a bridge between confusion and clarity.",
      category: 'VALUES & PHILOSOPHY',
      timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      hearts: 35,
      isLiked: false,
    },
    {
      id: 'a8',
      questionId: 'q8',
      questionText: "What's something you hope someone notices about you without you having to point it out?",
      text: "That I remember the small things people mention in passing - like how they prefer their coffee or a book they're excited to read. I hope they notice that their words matter enough to me to hold onto.",
      category: 'DATING & CONNECTION',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      hearts: 38,
      isLiked: false,
    },
  ],
  userStats: {
    totalPoints: 25,
    responses: 12,
    connected: 0,
    authenticityScore: 80,
    currentStreak: 12,
  },
  currentReflectionQuestion: null,
  reflectionProgress: 0,
  unlockedFeatures: [],
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'ADD_ANSWER':
      const newAnswer = action.payload;
      const updatedAnswers = [newAnswer, ...state.answers];
      const newStats = {
        ...state.userStats,
        totalPoints: state.userStats.totalPoints + 5, // 5 points per answer
        responses: state.userStats.responses + 1,
        authenticityScore: Math.min(100, state.userStats.authenticityScore + 1),
      };
      return {
        ...state,
        answers: updatedAnswers,
        userStats: newStats,
      };

    case 'LIKE_ANSWER':
      return {
        ...state,
        answers: state.answers.map(answer =>
          answer.id === action.payload
            ? { 
                ...answer, 
                hearts: answer.isLiked ? answer.hearts - 1 : answer.hearts + 1,
                isLiked: !answer.isLiked 
              }
            : answer
        ),
      };

    case 'UPDATE_STATS':
      return {
        ...state,
        userStats: { ...state.userStats, ...action.payload },
      };

    case 'SET_REFLECTION_QUESTION':
      return {
        ...state,
        currentReflectionQuestion: action.payload,
      };

    case 'COMPLETE_REFLECTION':
      return {
        ...state,
        currentReflectionQuestion: null,
        reflectionProgress: 0,
      };

    case 'LOAD_STATE':
      return action.payload;

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
};

const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('cupido_app_state');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          dispatch({ type: 'LOAD_STATE', payload: parsedState });
        }
      } catch (error) {
        console.error('Error loading app state:', error);
      }
    };
    loadState();
  }, []);

  // Save state to AsyncStorage whenever it changes
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('cupido_app_state', JSON.stringify(state));
      } catch (error) {
        console.error('Error saving app state:', error);
      }
    };
    saveState();
  }, [state]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
};

// Helper functions
export const generateId = () => Math.random().toString(36).substr(2, 9);

export const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const past = new Date(timestamp);
  const diffInHours = Math.floor((now.getTime() - past.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'just now';
  if (diffInHours === 1) return '1h ago';
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return '1d ago';
  return `${diffInDays}d ago`;
};