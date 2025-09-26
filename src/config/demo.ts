export let DEMO_MODE = true; // Dynamic flag controlled by AppModeProvider

export const setDemoMode = (value: boolean) => {
  DEMO_MODE = value;
};

export const DEMO_USER = {
  id: 'demo-user-123',
  email: 'demo@cupido.app',
  createdAt: '2024-01-15T00:00:00.000Z',
  streak: 12,
  lastPromptDate: '2024-01-27T00:00:00.000Z',
  persona: {
    traits: {
      openness: 0.85,
      conscientiousness: 0.72,
      extraversion: 0.45,
      agreeableness: 0.88,
      neuroticism: 0.35,
      authenticity: 0.92,
      creativity: 0.78,
      empathy: 0.85,
      curiosity: 0.88,
      resilience: 0.75,
      introspection: 0.90,
      adventure: 0.65,
      stability: 0.70,
      humor: 0.82,
      ambition: 0.75,
      spirituality: 0.55,
      independence: 0.70,
      collaboration: 0.85,
      optimism: 0.80,
      mindfulness: 0.88,
    },
    insights: [
      'You have a strong ability to understand and connect with others emotions.',
      'Being genuine and true to yourself is a core value you hold.',
      'You often reflect on relationships and growth in your responses.',
      'Your recent reflections show increasing positivity and self-awareness.',
    ],
    lastUpdated: '2024-01-27T00:00:00.000Z',
  },
};
