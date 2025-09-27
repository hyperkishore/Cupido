require('./setup/register-ts');
require('./setup/mock-async-storage');
require('./setup/mock-expo-sqlite');
const assert = require('assert');
const { homeExperienceService } = require('../src/services/homeExperienceService');

const now = new Date().toISOString();

const stubRepository = () => {
  const likedIds = [];
  const repo = {
    initialize: async () => undefined,
    getStats: async () => ({
      totalPoints: 120,
      responses: 8,
      connected: 2,
      authenticityScore: 83,
      currentStreak: 4,
      longestStreak: 9,
      lastReflectionDate: now,
    }),
    listUserReflections: async () => [
      {
        id: 'r1',
        questionId: 'q1',
        questionText: 'What helped you feel grounded today?',
        answerText: 'Checking in with myself and showing gratitude for the small wins.',
        category: 'SELF-DISCOVERY',
        mood: 'reflective',
        tags: ['gratitude', 'growth'],
        createdAt: now,
        hearts: 3,
        isLiked: false,
        voiceUsed: false,
        summary: 'Found gratitude in small wins.',
        insights: ['Gratitude is a recurring theme.'],
      },
      {
        id: 'r2',
        questionId: 'q2',
        questionText: 'Where did you surprise yourself?',
        answerText: 'I reached out for support even though it felt uncomfortable.',
        category: 'RELATIONSHIP & HEALING',
        mood: 'vulnerable',
        tags: ['vulnerability'],
        createdAt: new Date(Date.now() - 3600_000).toISOString(),
        hearts: 1,
        isLiked: false,
        voiceUsed: false,
        summary: '',
        insights: [],
      },
    ],
    listCommunityReflections: async () => [
      {
        id: 'community-1',
        authorId: 'user-1',
        authorName: 'Jamie',
        isAnonymous: false,
        question: 'What did your heart need today?',
        answer: 'A quiet walk and a reminder that I am doing enough.',
        mood: 'calm',
        tags: ['mindfulness', 'growth'],
        createdAt: now,
        communityHearts: 14,
        hasUserLiked: false,
        visibility: 'community',
      },
      {
        id: 'community-2',
        authorId: 'user-2',
        authorName: 'Anonymous',
        isAnonymous: true,
        question: 'How did you show up for yourself?',
        answer: 'I set a boundary around my time and felt proud of it.',
        mood: 'energized',
        tags: ['boundaries'],
        createdAt: now,
        communityHearts: 5,
        hasUserLiked: false,
        visibility: 'community',
      },
    ],
    listActivePrompts: async () => [
      { id: 'p1', question: 'What made you laugh recently?', category: 'DATING & CONNECTION' },
      { id: 'p2', question: 'Where are you growing right now?', category: 'SELF-DISCOVERY' },
      { id: 'p3', question: 'What do you want to remember about today?', category: 'VALUES & PHILOSOPHY' },
      { id: 'p4', question: 'How did you support someone this week?', category: 'RELATIONSHIP & HEALING' },
    ],
    likeCommunityReflection: async (id) => {
      likedIds.push(id);
    },
  };

  return { repo, likedIds };
};

(async () => {
  const { repo, likedIds } = stubRepository();
  const data = await homeExperienceService.load({ repository: repo });

  assert.strictEqual(data.stats.currentStreak, 4);
  assert.strictEqual(data.latestReflection?.id, 'r1');
  assert.ok(data.trendingTags.includes('gratitude'), 'Trending tags should surface recurring themes');
  assert.ok(data.recommendedPrompts.length <= 3, 'Recommended prompts should trim to three');
  assert.strictEqual(data.communitySpotlight[0].id, 'community-1');
  assert.ok(data.dailyIntention, 'Daily intention should resolve from insights or tags');

  await homeExperienceService.likeCommunityReflection('community-2', { repository: repo });
  assert.deepStrictEqual(likedIds, ['community-2']);

  console.log('homeExperienceService tests passed');
})();
