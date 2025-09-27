// @ts-nocheck
import { supabase } from './supabase';
import { PersonaService } from './personaService';
import { GamificationService } from './gamification';
import { WeeklyDigest } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockWeeklyDigestService } from './demo/mockWeeklyDigestService';

export class WeeklyDigestService {
  static async generateWeeklyDigest(userId: string): Promise<WeeklyDigest> {
    if (DEMO_MODE) {
      return MockWeeklyDigestService.generateWeeklyDigest(userId);
    }

    const weekStart = this.getWeekStart();
    const weekEnd = this.getWeekEnd();
    const weekString = this.getWeekString(weekStart);

    // Check if digest already exists for this week
    const existingDigest = await this.getWeeklyDigest(userId, weekString);
    if (existingDigest) {
      return existingDigest;
    }

    // Get user's activity for the week
    const [responses, matches, persona, badges] = await Promise.all([
      this.getWeeklyResponses(userId, weekStart, weekEnd),
      this.getWeeklyMatches(userId, weekStart, weekEnd),
      PersonaService.getPersona(userId),
      GamificationService.getUserBadges(userId),
    ]);

    // Generate insights based on weekly activity
    const insights = await this.generateWeeklyInsights(responses, matches, persona, badges);

    // Get streak information
    const streakInfo = await GamificationService.getStreakInfo(userId);

    // Create digest
    const digest: WeeklyDigest = {
      id: `digest_${userId}_${weekString}`,
      userId,
      week: weekString,
      insights,
      matches: matches.length,
      streakInfo: {
        current: streakInfo.current,
        longest: streakInfo.longest,
      },
      createdAt: new Date().toISOString(),
    };

    // Save digest to database
    await this.saveWeeklyDigest(digest);

    return digest;
  }

  private static async getWeeklyResponses(userId: string, weekStart: Date, weekEnd: Date) {
    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private static async getWeeklyMatches(userId: string, weekStart: Date, weekEnd: Date) {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
      .gte('created_at', weekStart.toISOString())
      .lte('created_at', weekEnd.toISOString());

    if (error) throw error;
    return data || [];
  }

  private static async generateWeeklyInsights(
    responses: any[],
    matches: any[],
    persona: any,
    badges: any[]
  ): Promise<string[]> {
    const insights: string[] = [];

    // Reflection insights
    if (responses.length > 0) {
      insights.push(`📝 You completed ${responses.length} reflection${responses.length > 1 ? 's' : ''} this week.`);
      
      const voiceResponses = responses.filter(r => r.type === 'voice').length;
      if (voiceResponses > 0) {
        const percentage = Math.round((voiceResponses / responses.length) * 100);
        insights.push(`🎤 ${percentage}% of your reflections used voice recording.`);
      }

      // Analyze themes in responses
      const themes = this.analyzeResponseThemes(responses);
      if (themes.length > 0) {
        insights.push(`🎯 Your main reflection themes: ${themes.join(', ')}.`);
      }
    } else {
      insights.push(`💡 No reflections this week. Daily self-discovery helps build deeper connections.`);
    }

    // Matching insights
    if (matches.length > 0) {
      const avgCompatibility = matches.reduce((sum, match) => sum + match.compatibility, 0) / matches.length;
      insights.push(`💫 You made ${matches.length} new match${matches.length > 1 ? 'es' : ''} with ${Math.round(avgCompatibility * 100)}% average compatibility.`);
    } else {
      insights.push(`🌟 Complete more reflections to improve your matching potential.`);
    }

    // Persona insights
    if (persona?.traits) {
      const topTrait = Object.entries(persona.traits)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0];
      
      if (topTrait) {
        insights.push(`🎨 Your strongest trait this week: ${topTrait[0]} (${Math.round((topTrait[1] as number) * 100)}%).`);
      }
    }

    // Badge insights
    const recentBadges = badges.filter(badge => {
      const unlockedAt = new Date(badge.unlockedAt);
      const weekStart = this.getWeekStart();
      return unlockedAt >= weekStart;
    });

    if (recentBadges.length > 0) {
      insights.push(`🏆 You earned ${recentBadges.length} new badge${recentBadges.length > 1 ? 's' : ''} this week!`);
    }

    // Growth insights
    const growthInsight = this.generateGrowthInsight(responses);
    if (growthInsight) {
      insights.push(growthInsight);
    }

    return insights;
  }

  private static analyzeResponseThemes(responses: any[]): string[] {
    const themes: string[] = [];
    const commonThemes = [
      'relationships', 'work', 'family', 'friends', 'love', 'career', 
      'growth', 'learning', 'creativity', 'nature', 'travel', 'health',
      'goals', 'dreams', 'challenges', 'gratitude', 'happiness', 'success'
    ];

    const themeCount: Record<string, number> = {};

    responses.forEach(response => {
      const content = response.content.toLowerCase();
      commonThemes.forEach(theme => {
        if (content.includes(theme)) {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        }
      });
    });

    // Get top 3 themes
    const sortedThemes = Object.entries(themeCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([theme]) => theme);

    return sortedThemes;
  }

  private static generateGrowthInsight(responses: any[]): string | null {
    if (responses.length < 2) return null;

    const recentResponses = responses.slice(0, Math.ceil(responses.length / 2));
    const olderResponses = responses.slice(Math.ceil(responses.length / 2));

    const recentWordCount = recentResponses.reduce((sum, r) => sum + r.content.split(' ').length, 0);
    const olderWordCount = olderResponses.reduce((sum, r) => sum + r.content.split(' ').length, 0);

    const recentAvg = recentWordCount / recentResponses.length;
    const olderAvg = olderWordCount / olderResponses.length;

    if (recentAvg > olderAvg * 1.2) {
      return `📈 Your reflections are becoming more detailed and thoughtful.`;
    } else if (recentAvg < olderAvg * 0.8) {
      return `📊 Your reflections are becoming more concise and focused.`;
    }

    return null;
  }

  private static async saveWeeklyDigest(digest: WeeklyDigest): Promise<void> {
    const { error } = await supabase
      .from('weekly_digests')
      .insert({
        id: digest.id,
        user_id: digest.userId,
        week: digest.week,
        insights: digest.insights,
        matches: digest.matches,
        streak_info: digest.streakInfo,
        created_at: digest.createdAt,
      });

    if (error) throw error;
  }

  static async getWeeklyDigest(userId: string, week: string): Promise<WeeklyDigest | null> {
    const { data, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userId)
      .eq('week', week)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      week: data.week,
      insights: data.insights,
      matches: data.matches,
      streakInfo: data.streak_info,
      createdAt: data.created_at,
    };
  }

  static async getUserDigests(userId: string, limit: number = 10): Promise<WeeklyDigest[]> {
    if (DEMO_MODE) {
      return MockWeeklyDigestService.getUserDigests(userId, limit);
    }

    const { data, error } = await supabase
      .from('weekly_digests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(digest => ({
      id: digest.id,
      userId: digest.user_id,
      week: digest.week,
      insights: digest.insights,
      matches: digest.matches,
      streakInfo: digest.streak_info,
      createdAt: digest.created_at,
    }));
  }

  static async getCurrentWeekDigest(userId: string): Promise<WeeklyDigest | null> {
    if (DEMO_MODE) {
      return MockWeeklyDigestService.getCurrentWeekDigest(userId);
    }

    const currentWeek = this.getWeekString(this.getWeekStart());
    return await this.getWeeklyDigest(userId, currentWeek);
  }

  private static getWeekStart(): Date {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  private static getWeekEnd(): Date {
    const weekStart = this.getWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  }

  private static getWeekString(weekStart: Date): string {
    const year = weekStart.getFullYear();
    const month = String(weekStart.getMonth() + 1).padStart(2, '0');
    const day = String(weekStart.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  static async shouldGenerateDigest(userId: string): Promise<boolean> {
    const currentWeek = this.getWeekString(this.getWeekStart());
    const existingDigest = await this.getWeeklyDigest(userId, currentWeek);
    
    // Only generate if it's Monday and no digest exists for this week
    const today = new Date();
    const isMonday = today.getDay() === 1;
    
    return isMonday && !existingDigest;
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