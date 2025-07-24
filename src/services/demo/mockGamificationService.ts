import { Badge } from '../../types';
import { DEMO_BADGES, DEMO_GAMIFICATION_STATS } from './mockData';

export class MockGamificationService {
  static async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, randomly award a badge sometimes
    if (Math.random() > 0.7) {
      const availableBadges = [
        {
          id: 'curious_mind',
          name: 'Curious Mind',
          description: 'Score highly on curiosity traits',
          icon: '🧠',
          unlockedAt: new Date().toISOString(),
        },
        {
          id: 'deep_connection',
          name: 'Deep Connection',
          description: 'Have a 20+ message conversation',
          icon: '💝',
          unlockedAt: new Date().toISOString(),
        },
      ];
      
      const newBadge = availableBadges[Math.floor(Math.random() * availableBadges.length)];
      
      // Check if badge already exists
      if (!DEMO_BADGES.find(b => b.id === newBadge.id)) {
        DEMO_BADGES.push(newBadge);
        return [newBadge];
      }
    }
    
    return [];
  }

  static async getUserBadges(userId: string): Promise<Badge[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return DEMO_BADGES;
  }

  static async generateInsights(userId: string): Promise<string[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const insights = [
      `🔥 Amazing! You're on a ${DEMO_GAMIFICATION_STATS.currentStreak}-day reflection streak!`,
      `🎯 Your strongest trait is authenticity (92%)`,
      `💫 Your average compatibility score is 82%`,
      `🎤 You've been expressing yourself through voice 29% of the time!`,
    ];
    
    return insights;
  }

  static async getStreakInfo(userId: string): Promise<{
    current: number;
    longest: number;
    nextMilestone: { streak: number; badge: string } | null;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const current = DEMO_GAMIFICATION_STATS.currentStreak;
    let nextMilestone = null;
    
    if (current < 30) {
      nextMilestone = { streak: 30, badge: 'Monthly Master' };
    } else if (current < 100) {
      nextMilestone = { streak: 100, badge: 'Century Champion' };
    }
    
    return {
      current,
      longest: current, // For demo, longest = current
      nextMilestone,
    };
  }

  static async getGamificationStats(userId: string): Promise<{
    totalBadges: number;
    currentStreak: number;
    totalReflections: number;
    totalMatches: number;
    level: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      ...DEMO_GAMIFICATION_STATS,
      totalBadges: DEMO_BADGES.length,
    };
  }
}