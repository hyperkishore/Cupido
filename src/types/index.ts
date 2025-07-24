export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
  streak: number;
  lastPromptDate?: string;
  persona?: PersonaData;
}

export interface PersonaData {
  traits: Record<string, number>;
  insights: string[];
  lastUpdated: string;
}

export interface Prompt {
  id: string;
  question: string;
  type: 'text' | 'voice';
  category: string;
  theme?: string;
  tone?: string;
  intendedUseCase?: string;
  emotionalDepth?: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface Response {
  id: string;
  userId: string;
  promptId: string;
  content: string;
  type: 'text' | 'voice';
  audioUrl?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  userId: string;
  matchedUserId: string;
  compatibility: number;
  status: 'pending' | 'active' | 'ended';
  createdAt: string;
}

export interface QARoom {
  id: string;
  matchId: string;
  users: string[];
  messages: QAMessage[];
  revealedAt?: string;
  createdAt: string;
}

export interface QAMessage {
  id: string;
  userId: string;
  content: string;
  type: 'question' | 'answer';
  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
}

export interface WeeklyDigest {
  id: string;
  userId: string;
  week: string;
  insights: string[];
  matches: number;
  streakInfo: {
    current: number;
    longest: number;
  };
  createdAt: string;
}