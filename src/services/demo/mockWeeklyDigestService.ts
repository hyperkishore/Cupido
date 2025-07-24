import { WeeklyDigest } from '../../types';
import { DEMO_WEEKLY_DIGEST } from './mockData';

export class MockWeeklyDigestService {
  static async generateWeeklyDigest(userId: string): Promise<WeeklyDigest> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return DEMO_WEEKLY_DIGEST;
  }

  static async getWeeklyDigest(userId: string, week: string): Promise<WeeklyDigest | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (week === '2024-01-22') {
      return DEMO_WEEKLY_DIGEST;
    }
    
    return null;
  }

  static async getUserDigests(userId: string, limit: number = 10): Promise<WeeklyDigest[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, return past digests
    const pastDigests: WeeklyDigest[] = [
      {
        id: 'digest_demo-user-123_2024-01-15',
        userId,
        week: '2024-01-15',
        insights: [
          '📝 You completed 6 reflections this week.',
          '🎯 Your main reflection themes: creativity, work, relationships.',
          '🎨 Your strongest trait this week: openness (85%).',
          '🏆 You earned 1 new badge this week!',
        ],
        matches: 1,
        streakInfo: {
          current: 6,
          longest: 6,
        },
        createdAt: '2024-01-21T00:00:00.000Z',
      },
      {
        id: 'digest_demo-user-123_2024-01-08',
        userId,
        week: '2024-01-08',
        insights: [
          '📝 You completed 5 reflections this week.',
          '🎯 Your main reflection themes: growth, mindfulness.',
          '🎨 Your strongest trait this week: introspection (88%).',
          '🌟 Welcome to Cupido! Great start on your self-discovery journey.',
        ],
        matches: 0,
        streakInfo: {
          current: 5,
          longest: 5,
        },
        createdAt: '2024-01-14T00:00:00.000Z',
      },
    ];
    
    return pastDigests;
  }

  static async getCurrentWeekDigest(userId: string): Promise<WeeklyDigest | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return DEMO_WEEKLY_DIGEST;
  }

  static async shouldGenerateDigest(userId: string): Promise<boolean> {
    // For demo, always allow generation
    return true;
  }

  static formatWeekString(week: string): string {
    const date = new Date(week);
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    
    return `${date.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }
}