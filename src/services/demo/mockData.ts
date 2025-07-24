import { User, Match, Badge, WeeklyDigest, QARoom, QAMessage } from '../../types';

export const DEMO_RESPONSES = [
  {
    id: 'resp-1',
    userId: 'demo-user-123',
    promptId: 'prompt_2024-01-27',
    content: 'Today I smiled when I saw a couple helping an elderly man cross the street. It reminded me that small acts of kindness create ripples of positivity that we might never fully see.',
    type: 'text' as const,
    createdAt: '2024-01-27T09:15:00.000Z',
  },
  {
    id: 'resp-2',
    userId: 'demo-user-123',
    promptId: 'prompt_2024-01-26',
    content: 'I feel most authentically myself when I\'m writing in my journal late at night. There\'s something about the quiet darkness that lets me be completely honest with my thoughts.',
    type: 'text' as const,
    createdAt: '2024-01-26T22:30:00.000Z',
  },
  {
    id: 'resp-3',
    userId: 'demo-user-123',
    promptId: 'prompt_2024-01-25',
    content: 'I used to believe that success meant having all the answers, but now I think it means being comfortable with uncertainty and staying curious about what I don\'t know.',
    type: 'voice' as const,
    createdAt: '2024-01-25T08:45:00.000Z',
  },
];

export const DEMO_MATCHES: Match[] = [
  {
    id: 'match-1',
    userId: 'demo-user-123',
    matchedUserId: 'user-456',
    compatibility: 0.87,
    status: 'pending',
    createdAt: '2024-01-26T14:20:00.000Z',
  },
  {
    id: 'match-2',
    userId: 'demo-user-123',
    matchedUserId: 'user-789',
    compatibility: 0.82,
    status: 'active',
    createdAt: '2024-01-25T11:30:00.000Z',
  },
  {
    id: 'match-3',
    userId: 'demo-user-123',
    matchedUserId: 'user-101',
    compatibility: 0.78,
    status: 'pending',
    createdAt: '2024-01-24T16:45:00.000Z',
  },
];

export const DEMO_BADGES: Badge[] = [
  {
    id: 'first_reflection',
    name: 'First Steps',
    description: 'Complete your first daily reflection',
    icon: '✨',
    unlockedAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'week_streak',
    name: 'Week Warrior',
    description: 'Complete 7 days of consecutive reflections',
    icon: '🔥',
    unlockedAt: '2024-01-21T00:00:00.000Z',
  },
  {
    id: 'voice_pioneer',
    name: 'Voice Pioneer',
    description: 'Submit your first voice reflection',
    icon: '🎤',
    unlockedAt: '2024-01-25T00:00:00.000Z',
  },
  {
    id: 'authentic_soul',
    name: 'Authentic Soul',
    description: 'Score highly on authenticity traits',
    icon: '🌈',
    unlockedAt: '2024-01-26T00:00:00.000Z',
  },
  {
    id: 'empathetic_heart',
    name: 'Empathetic Heart',
    description: 'Score highly on empathy traits',
    icon: '❤️',
    unlockedAt: '2024-01-27T00:00:00.000Z',
  },
];

export const DEMO_WEEKLY_DIGEST: WeeklyDigest = {
  id: 'digest_demo-user-123_2024-01-22',
  userId: 'demo-user-123',
  week: '2024-01-22',
  insights: [
    '📝 You completed 7 reflections this week.',
    '🎤 29% of your reflections used voice recording.',
    '🎯 Your main reflection themes: relationships, growth, authenticity.',
    '💫 You made 2 new matches with 82% average compatibility.',
    '🎨 Your strongest trait this week: authenticity (92%).',
    '🏆 You earned 2 new badges this week!',
    '📈 Your reflections are becoming more detailed and thoughtful.',
  ],
  matches: 2,
  streakInfo: {
    current: 12,
    longest: 12,
  },
  createdAt: '2024-01-28T00:00:00.000Z',
};

export const DEMO_QA_MESSAGES: QAMessage[] = [
  {
    id: 'msg-1',
    userId: 'demo-user-123',
    content: 'What\'s something you\'ve learned about yourself this year?',
    type: 'question',
    createdAt: '2024-01-26T15:00:00.000Z',
  },
  {
    id: 'msg-2',
    userId: 'user-789',
    content: 'I\'ve learned that I\'m much more resilient than I thought. Going through some challenges this year showed me that I can adapt and grow from difficult situations. What about you?',
    type: 'answer',
    createdAt: '2024-01-26T15:15:00.000Z',
  },
  {
    id: 'msg-3',
    userId: 'user-789',
    content: 'What does a perfect day look like to you?',
    type: 'question',
    createdAt: '2024-01-26T15:20:00.000Z',
  },
  {
    id: 'msg-4',
    userId: 'demo-user-123',
    content: 'A perfect day starts with a slow morning with coffee and journaling, includes meaningful conversations with people I care about, and ends with a good book or a peaceful walk. Simple but fulfilling.',
    type: 'answer',
    createdAt: '2024-01-26T15:35:00.000Z',
  },
  {
    id: 'msg-5',
    userId: 'demo-user-123',
    content: 'What\'s something you\'re passionate about that others might find surprising?',
    type: 'question',
    createdAt: '2024-01-26T15:40:00.000Z',
  },
  {
    id: 'msg-6',
    userId: 'user-789',
    content: 'I\'m really into urban sketching! Most people see me as very digital/tech-focused, but I love sitting in cafes or parks and drawing the world around me. There\'s something meditative about capturing a moment in time.',
    type: 'answer',
    createdAt: '2024-01-26T15:55:00.000Z',
  },
];

export const DEMO_QA_ROOM: QARoom = {
  id: 'room-1',
  matchId: 'match-2',
  users: ['demo-user-123', 'user-789'],
  messages: DEMO_QA_MESSAGES,
  createdAt: '2024-01-26T14:30:00.000Z',
};

export const DEMO_GAMIFICATION_STATS = {
  totalBadges: 5,
  currentStreak: 12,
  totalReflections: 27,
  totalMatches: 8,
  level: 3,
};

export const DEMO_MATCHING_STATS = {
  totalMatches: 8,
  activeMatches: 3,
  averageCompatibility: 0.82,
  topCompatibility: 0.89,
};