export interface SampleUserReflection {
  id: string;
  questionId: string;
  questionText: string;
  text: string;
  category: string;
  timestamp: string;
  hearts: number;
  isLiked?: boolean;
}

export interface SampleCommunityReflection {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  date: string;
  question: string;
  answer: string;
  voiceUsed: boolean;
  mood: string;
  tags: string[];
  communityHearts: number;
  hasUserLiked: boolean;
  visibility: 'community' | 'matched_only' | 'private';
  createdAt: string;
}

export const SAMPLE_USER_REFLECTIONS: SampleUserReflection[] = [
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
];

export const SAMPLE_COMMUNITY_REFLECTIONS: SampleCommunityReflection[] = [
  {
    id: 'sarah_reflection',
    authorId: 'user_sarah',
    authorName: 'Sarah M.',
    isAnonymous: false,
    date: new Date().toISOString().split('T')[0],
    question: 'What made you feel most alive today?',
    answer: 'Dancing in my kitchen while making dinner. No one was watching, no music was perfect, but I felt completely free and joyful in that moment.',
    voiceUsed: true,
    mood: 'excited',
    tags: ['joy', 'freedom', 'authenticity'],
    communityHearts: 23,
    hasUserLiked: false,
    visibility: 'community',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'alex_reflection',
    authorId: 'user_alex',
    authorName: 'Anonymous',
    isAnonymous: true,
    date: new Date().toISOString().split('T')[0],
    question: 'What fear did you face today?',
    answer: "I finally told my best friend about my anxiety. I've been hiding it for months, thinking they'd see me differently. Instead, they shared their own struggles and we both felt less alone.",
    voiceUsed: false,
    mood: 'contemplative',
    tags: ['vulnerability', 'friendship', 'courage'],
    communityHearts: 41,
    hasUserLiked: true,
    visibility: 'community',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'jamie_reflection',
    authorId: 'user_jamie',
    authorName: 'Jamie L.',
    isAnonymous: false,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    question: 'What small act of kindness touched you today?',
    answer: "A stranger let me merge in heavy traffic and waved. Such a tiny gesture, but it reminded me that we're all just trying to get somewhere and be seen.",
    voiceUsed: true,
    mood: 'content',
    tags: ['kindness', 'connection', 'humanity'],
    communityHearts: 18,
    hasUserLiked: false,
    visibility: 'community',
    createdAt: new Date(Date.now() - 93600000).toISOString(),
  },
  {
    id: 'morgan_reflection',
    authorId: 'user_morgan',
    authorName: 'Anonymous',
    isAnonymous: true,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    question: 'How did you surprise yourself today?',
    answer: "I spoke up in a meeting when I usually stay quiet. My idea wasn't groundbreaking, but my voice was heard and that felt powerful.",
    voiceUsed: false,
    mood: 'thoughtful',
    tags: ['courage', 'self-advocacy', 'growth'],
    communityHearts: 32,
    hasUserLiked: false,
    visibility: 'community',
    createdAt: new Date(Date.now() - 100800000).toISOString(),
  },
  {
    id: 'river_reflection',
    authorId: 'user_river',
    authorName: 'River K.',
    isAnonymous: false,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    question: 'What did your heart need today?',
    answer: 'Silence. I spent 20 minutes just breathing and listening to nothing. In our noisy world, silence felt like medicine for my soul.',
    voiceUsed: true,
    mood: 'peaceful',
    tags: ['mindfulness', 'peace', 'self-care'],
    communityHearts: 27,
    hasUserLiked: true,
    visibility: 'community',
    createdAt: new Date(Date.now() - 175600000).toISOString(),
  },
];
