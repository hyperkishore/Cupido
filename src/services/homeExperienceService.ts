import { reflectionsRepository, UserReflectionRecord, CommunityReflectionRecord } from './reflectionsRepository';

export interface HomeExperienceData {
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalReflections: number;
    authenticityScore: number;
    lastReflectionDate?: string | null;
  };
  trendingTags: string[];
  latestReflection?: {
    id: string;
    question: string;
    summary: string;
    createdAt: string;
    mood?: string;
    insights: string[];
    tags: string[];
  };
  recommendedPrompts: {
    id: string;
    question: string;
    category: string;
  }[];
  communitySpotlight: CommunityReflectionRecord[];
  dailyIntention?: string;
}

const computeTrendingTags = (reflections: UserReflectionRecord[]): string[] => {
  const counts: Record<string, number> = {};
  reflections.forEach((reflection) => {
    reflection.tags.forEach((tag) => {
      if (!tag) return;
      counts[tag] = (counts[tag] ?? 0) + 1;
    });
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tag]) => tag);
};

type ReflectionsRepo = typeof reflectionsRepository;

const selectDailyIntention = (
  latestReflection?: HomeExperienceData['latestReflection'],
  trendingTags: string[] = []
): string | undefined => {
  if (latestReflection?.insights?.length) {
    return latestReflection.insights[0];
  }

  if (trendingTags.length > 0) {
    const intentMap: Record<string, string> = {
      growth: 'Give yourself credit for how you are changing—capture one example today.',
      vulnerability: 'Name a safe person or ritual that lets you stay brave and open.',
      gratitude: 'Pause once today to acknowledge something small that warms you.',
      connection: 'Reach out to someone who would appreciate the honesty you brought here.',
      roots: 'Return to a tradition or memory that grounds you for a few minutes.',
    };

    for (const tag of trendingTags) {
      if (intentMap[tag]) {
        return intentMap[tag];
      }
    }
  }

  return undefined;
};

class HomeExperienceService {
  async load(options: { repository?: ReflectionsRepo } = {}): Promise<HomeExperienceData> {
    const repo = options.repository ?? reflectionsRepository;

    await repo.initialize();

    const [stats, userReflections, community, prompts] = await Promise.all([
      repo.getStats(),
      repo.listUserReflections(30),
      repo.listCommunityReflections(6),
      repo.listActivePrompts(12),
    ]);

    const latestReflection = userReflections[0]
      ? {
          id: userReflections[0].id,
          question: userReflections[0].questionText,
          summary: userReflections[0].summary || userReflections[0].answerText,
          createdAt: userReflections[0].createdAt,
          mood: userReflections[0].mood ?? undefined,
          insights: userReflections[0].insights ?? [],
          tags: userReflections[0].tags,
        }
      : undefined;

    const trendingTags = computeTrendingTags(userReflections);

    const recommendedPrompts = prompts
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const communitySpotlight = [...community].sort(
      (a, b) => (b.communityHearts ?? 0) - (a.communityHearts ?? 0)
    ).slice(0, 3);

    return {
      stats: {
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalReflections: stats.responses,
        authenticityScore: stats.authenticityScore,
        lastReflectionDate: stats.lastReflectionDate,
      },
      trendingTags,
      latestReflection,
      recommendedPrompts,
      communitySpotlight,
      dailyIntention: selectDailyIntention(latestReflection, trendingTags),
    };
  }

  async likeCommunityReflection(reflectionId: string, options: { repository?: ReflectionsRepo } = {}): Promise<void> {
    const repo = options.repository ?? reflectionsRepository;
    await repo.likeCommunityReflection(reflectionId);
  }
}

export const homeExperienceService = new HomeExperienceService();
