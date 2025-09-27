import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { reflectionsRepository, CreateReflectionInput } from '../services/reflectionsRepository';
import { SAMPLE_USER_REFLECTIONS } from '../data/sampleReflections';
import { userContextService } from '../services/userContext';

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
  mood?: string;
  summary?: string;
  insights?: string[];
  tags?: string[];
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
  answers: SAMPLE_USER_REFLECTIONS,
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
  const [state, baseDispatch] = useReducer(appReducer, initialState);
  const isHydratedRef = useRef(false);

  useEffect(() => {
    const hydrate = async () => {
      try {
        await userContextService.initialize();
        await reflectionsRepository.initialize();
        const [reflections, stats] = await Promise.all([
          reflectionsRepository.listUserReflections(100),
          reflectionsRepository.getStats(),
        ]);

        const mappedAnswers: Answer[] = reflections.map((item) => ({
          id: item.id,
          questionId: item.questionId,
          questionText: item.questionText,
          text: item.answerText,
          category: item.category,
          timestamp: item.createdAt,
          hearts: item.hearts,
          isLiked: item.isLiked,
          summary: item.summary,
          insights: item.insights,
          mood: item.mood ?? undefined,
          tags: item.tags,
        }));

        baseDispatch({
          type: 'LOAD_STATE',
          payload: {
            answers: mappedAnswers,
            userStats: {
              totalPoints: stats.totalPoints,
              responses: stats.responses,
              connected: stats.connected,
              authenticityScore: stats.authenticityScore,
              currentStreak: stats.currentStreak,
            },
            currentReflectionQuestion: null,
            reflectionProgress: 0,
            unlockedFeatures: [],
          },
        });

        isHydratedRef.current = true;
      } catch (error) {
        console.error('Error hydrating app state from database:', error);
      }
    };

    hydrate();
  }, []);

  const persistReflection = useCallback((answer: Answer) => {
    const input: CreateReflectionInput = {
      id: answer.id,
      questionId: answer.questionId,
      questionText: answer.questionText,
      answerText: answer.text,
      category: answer.category,
      createdAt: answer.timestamp,
      hearts: answer.hearts,
      isLiked: answer.isLiked,
      voiceUsed: false,
      tags: answer.tags ?? [],
      mood: answer.mood,
      summary: answer.summary,
      insights: answer.insights,
    };

    void reflectionsRepository.createUserReflection(input).catch((error) => {
      console.error('Failed to persist reflection', error);
    });
  }, []);

  const updateReflectionLike = useCallback((reflectionId: string) => {
    void reflectionsRepository.toggleUserReflectionLike(reflectionId).catch((error) => {
      console.error('Failed to toggle reflection like', error);
    });
  }, []);

  const persistStats = useCallback((stats: Partial<UserStats>) => {
    void reflectionsRepository
      .updateStats({
        totalPoints: stats.totalPoints,
        responses: stats.responses,
        connected: stats.connected,
        authenticityScore: stats.authenticityScore,
        currentStreak: stats.currentStreak,
      })
      .catch((error) => {
        console.error('Failed to persist stats', error);
      });
  }, []);

  const dispatch = useCallback((action: AppAction) => {
    switch (action.type) {
      case 'ADD_ANSWER':
        baseDispatch(action);
        if (isHydratedRef.current) {
          persistReflection(action.payload);
        }
        break;
      case 'LIKE_ANSWER':
        baseDispatch(action);
        if (isHydratedRef.current) {
          updateReflectionLike(action.payload);
        }
        break;
      case 'UPDATE_STATS':
        baseDispatch(action);
        if (isHydratedRef.current) {
          persistStats(action.payload);
        }
        break;
      default:
        baseDispatch(action);
    }
  }, [baseDispatch, persistReflection, persistStats, updateReflectionLike]);

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
