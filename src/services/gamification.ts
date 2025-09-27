// @ts-nocheck
import { supabase } from './supabase';
import { Badge } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockGamificationService } from './demo/mockGamificationService';

export class GamificationService {
  private static badgeDefinitions: Record<string, Badge> = {
    'first_reflection': {
      id: 'first_reflection',
      name: 'First Steps',
      description: 'Complete your first daily reflection',
      icon: '✨',
    },
    'week_streak': {
      id: 'week_streak',
      name: 'Week Warrior',
      description: 'Complete 7 days of consecutive reflections',
      icon: '🔥',
    },
    'month_streak': {
      id: 'month_streak',
      name: 'Monthly Master',
      description: 'Complete 30 days of consecutive reflections',
      icon: '🌟',
    },
    'first_match': {
      id: 'first_match',
      name: 'Perfect Match',
      description: 'Get your first compatibility match',
      icon: '💫',
    },
    'conversation_starter': {
      id: 'conversation_starter',
      name: 'Conversation Starter',
      description: 'Start your first Q&A conversation',
      icon: '💬',
    },
    'deep_connection': {
      id: 'deep_connection',
      name: 'Deep Connection',
      description: 'Have a 20+ message conversation',
      icon: '💝',
    },
    'voice_pioneer': {
      id: 'voice_pioneer',
      name: 'Voice Pioneer',
      description: 'Submit your first voice reflection',
      icon: '🎤',
    },
    'authentic_soul': {
      id: 'authentic_soul',
      name: 'Authentic Soul',
      description: 'Score highly on authenticity traits',
      icon: '🌈',
    },
    'curious_mind': {
      id: 'curious_mind',
      name: 'Curious Mind',
      description: 'Score highly on curiosity traits',
      icon: '🧠',
    },
    'empathetic_heart': {
      id: 'empathetic_heart',
      name: 'Empathetic Heart',
      description: 'Score highly on empathy traits',
      icon: '❤️',
    },
  };

  static async checkAndAwardBadges(userId: string): Promise<Badge[]> {
    const newBadges: Badge[] = [];
    
    // Get user's current badges
    const currentBadges = await this.getUserBadges(userId);
    const currentBadgeIds = new Set(currentBadges.map(b => b.id));

    // Check each badge condition
    for (const [badgeId, badgeDefinition] of Object.entries(this.badgeDefinitions)) {
      if (currentBadgeIds.has(badgeId)) continue;

      const earned = await this.checkBadgeCondition(userId, badgeId);
      if (earned) {
        await this.awardBadge(userId, badgeId);
        newBadges.push({
          ...badgeDefinition,
          unlockedAt: new Date().toISOString(),
        });
      }
    }

    return newBadges;
  }

  private static async checkBadgeCondition(userId: string, badgeId: string): Promise<boolean> {
    switch (badgeId) {
      case 'first_reflection':
        return await this.checkFirstReflection(userId);
      
      case 'week_streak':
        return await this.checkStreakBadge(userId, 7);
      
      case 'month_streak':
        return await this.checkStreakBadge(userId, 30);
      
      case 'first_match':
        return await this.checkFirstMatch(userId);
      
      case 'conversation_starter':
        return await this.checkConversationStarter(userId);
      
      case 'deep_connection':
        return await this.checkDeepConnection(userId);
      
      case 'voice_pioneer':
        return await this.checkVoicePioneer(userId);
      
      case 'authentic_soul':
        return await this.checkTraitBadge(userId, 'authenticity', 0.8);
      
      case 'curious_mind':
        return await this.checkTraitBadge(userId, 'curiosity', 0.8);
      
      case 'empathetic_heart':
        return await this.checkTraitBadge(userId, 'empathy', 0.8);
      
      default:
        return false;
    }
  }

  private static async checkFirstReflection(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('responses')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    
    return (data?.length || 0) > 0;
  }

  private static async checkStreakBadge(userId: string, requiredStreak: number): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('streak')
      .eq('id', userId)
      .single();
    
    return (data?.streak || 0) >= requiredStreak;
  }

  private static async checkFirstMatch(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('matches')
      .select('id')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .limit(1);
    
    return (data?.length || 0) > 0;
  }

  private static async checkConversationStarter(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('qa_rooms')
      .select('id')
      .contains('users', [userId])
      .limit(1);
    
    return (data?.length || 0) > 0;
  }

  private static async checkDeepConnection(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('qa_rooms')
      .select('messages')
      .contains('users', [userId]);
    
    if (!data) return false;
    
    return data.some(room => (room.messages?.length || 0) >= 20);
  }

  private static async checkVoicePioneer(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from('responses')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'voice')
      .limit(1);
    
    return (data?.length || 0) > 0;
  }

  private static async checkTraitBadge(userId: string, trait: string, threshold: number): Promise<boolean> {
    const { data } = await supabase
      .from('users')
      .select('persona_data')
      .eq('id', userId)
      .single();
    
    const personaData = data?.persona_data;
    if (!personaData?.traits) return false;
    
    return (personaData.traits[trait] || 0) >= threshold;
  }

  private static async awardBadge(userId: string, badgeId: string): Promise<void> {
    const { error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId,
        unlocked_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error awarding badge:', error);
    }
  }

  static async getUserBadges(userId: string): Promise<Badge[]> {
    if (DEMO_MODE) {
      return MockGamificationService.getUserBadges(userId);
    }

    const { data, error } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching user badges:', error);
      return [];
    }
    
    return data.map(userBadge => ({
      ...this.badgeDefinitions[userBadge.badge_id],
      unlockedAt: userBadge.unlocked_at,
    }));
  }

  static async generateInsights(userId: string): Promise<string[]> {
    if (DEMO_MODE) {
      return MockGamificationService.generateInsights(userId);
    }

    const insights: string[] = [];
    
    // Get user data
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!userData) return insights;
    
    // Streak insights
    const streak = userData.streak || 0;
    if (streak >= 7) {
      insights.push(`🔥 Amazing! You're on a ${streak}-day reflection streak!`);
    } else if (streak >= 3) {
      insights.push(`⭐ Great job! You're building a ${streak}-day streak.`);
    }
    
    // Persona insights
    const personaData = userData.persona_data;
    if (personaData?.traits) {
      const topTrait = Object.entries(personaData.traits)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];
      
      if (topTrait) {
        insights.push(`🎯 Your strongest trait is ${topTrait[0]} (${Math.round((topTrait[1] as number) * 100)}%)`);
      }
    }
    
    // Match insights
    const { data: matches } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);
    
    if (matches && matches.length > 0) {
      const avgCompatibility = matches.reduce((sum, match) => sum + match.compatibility, 0) / matches.length;
      insights.push(`💫 Your average compatibility score is ${Math.round(avgCompatibility * 100)}%`);
    }
    
    // Recent activity insights
    const { data: recentResponses } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(7);
    
    if (recentResponses && recentResponses.length > 0) {
      const voiceResponses = recentResponses.filter(r => r.type === 'voice').length;
      const voicePercentage = (voiceResponses / recentResponses.length) * 100;
      
      if (voicePercentage > 50) {
        insights.push(`🎤 You've been expressing yourself through voice ${Math.round(voicePercentage)}% of the time!`);
      }
    }
    
    return insights;
  }

  static async getStreakInfo(userId: string): Promise<{
    current: number;
    longest: number;
    nextMilestone: { streak: number; badge: string } | null;
  }> {
    const { data } = await supabase
      .from('users')
      .select('streak')
      .eq('id', userId)
      .single();
    
    const currentStreak = data?.streak || 0;
    
    // For now, we'll use current streak as longest
    // In a real app, you'd track longest streak separately
    const longestStreak = currentStreak;
    
    // Determine next milestone
    let nextMilestone = null;
    if (currentStreak < 7) {
      nextMilestone = { streak: 7, badge: 'Week Warrior' };
    } else if (currentStreak < 30) {
      nextMilestone = { streak: 30, badge: 'Monthly Master' };
    } else if (currentStreak < 100) {
      nextMilestone = { streak: 100, badge: 'Century Champion' };
    }
    
    return {
      current: currentStreak,
      longest: longestStreak,
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
    if (DEMO_MODE) {
      return MockGamificationService.getGamificationStats(userId);
    }

    const [badges, userData, responses, matches] = await Promise.all([
      this.getUserBadges(userId),
      supabase.from('users').select('streak').eq('id', userId).single(),
      supabase.from('responses').select('id').eq('user_id', userId),
      supabase.from('matches').select('id').or(`user_id.eq.${userId},matched_user_id.eq.${userId}`),
    ]);
    
    const totalReflections = responses.data?.length || 0;
    const level = Math.floor(totalReflections / 10) + 1; // Level up every 10 reflections
    
    return {
      totalBadges: badges.length,
      currentStreak: userData.data?.streak || 0,
      totalReflections,
      totalMatches: matches.data?.length || 0,
      level,
    };
  }
}