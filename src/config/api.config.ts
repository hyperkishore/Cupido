// API Configuration for Cupido App
// This file contains all API endpoints and configuration

export const API_CONFIG = {
  // Base URLs
  BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.cupido.app',
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  
  // Authentication
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    VERIFY_OTP: '/auth/verify-otp',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    GET_SESSION: '/auth/session',
  },
  
  // User Profile
  USER: {
    GET_PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPDATE_AVATAR: '/user/avatar',
    GET_AUTHENTICITY_SCORE: '/user/authenticity-score',
    UPDATE_PREFERENCES: '/user/preferences',
  },
  
  // Questions & Answers
  QUESTIONS: {
    GET_DAILY: '/questions/daily',
    GET_COMMUNITY: '/questions/community',
    GET_TRENDING: '/questions/trending',
    CREATE: '/questions/create',
    ANSWER: '/questions/answer',
    GET_USER_ANSWERS: '/questions/user-answers',
    LIKE: '/questions/like',
    UNLIKE: '/questions/unlike',
  },
  
  // Reflections
  REFLECTIONS: {
    GET_CURRENT: '/reflections/current',
    SUBMIT: '/reflections/submit',
    GET_HISTORY: '/reflections/history',
    GET_STATS: '/reflections/stats',
  },
  
  // Social Media Integration
  SOCIAL: {
    CONNECT: '/social/connect',
    DISCONNECT: '/social/disconnect',
    GET_CONNECTIONS: '/social/connections',
    VERIFY_CONNECTION: '/social/verify',
    GET_SOCIAL_SCORE: '/social/score',
  },
  
  // Matching
  MATCHING: {
    GET_POTENTIAL_MATCHES: '/matching/potential',
    GET_ACTIVE_MATCHES: '/matching/active',
    SEND_MATCH_REQUEST: '/matching/request',
    ACCEPT_MATCH: '/matching/accept',
    DECLINE_MATCH: '/matching/decline',
    UNMATCH: '/matching/unmatch',
  },
  
  // Chat
  CHAT: {
    GET_CONVERSATIONS: '/chat/conversations',
    GET_MESSAGES: '/chat/messages',
    SEND_MESSAGE: '/chat/send',
    MARK_READ: '/chat/read',
    GET_UNREAD_COUNT: '/chat/unread-count',
  },
  
  // Notifications
  NOTIFICATIONS: {
    GET_ALL: '/notifications',
    MARK_READ: '/notifications/read',
    GET_PREFERENCES: '/notifications/preferences',
    UPDATE_PREFERENCES: '/notifications/preferences',
    REGISTER_PUSH_TOKEN: '/notifications/push-token',
  },
  
  // Analytics
  ANALYTICS: {
    TRACK_EVENT: '/analytics/event',
    GET_USER_STATS: '/analytics/user-stats',
  },
};

// API Headers Configuration
export const getHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-App-Version': '1.0.0',
    'X-Platform': 'mobile',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Error codes
export const API_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
};