import { Match } from '../../types';
import { DEMO_MATCHES, DEMO_MATCHING_STATS } from './mockData';

export class MockMatchingService {
  static async generateMatches(userId: string, limit: number = 5): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In demo mode, use stored responses to calculate compatibility
    const { DEMO_RESPONSES } = await import('./mockData');
    const userResponses = DEMO_RESPONSES.filter(r => r.userId === userId);
    
    if (userResponses.length === 0) {
      // No responses yet, create basic matches
      const newMatches: Match[] = [];
      for (let i = 0; i < Math.min(limit, 3); i++) {
        newMatches.push({
          id: `match_${Date.now()}_${i}`,
          userId,
          matchedUserId: `user_${Math.random().toString(36).substr(2, 9)}`,
          compatibility: 0.6 + Math.random() * 0.2, // 60-80% compatibility
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      }
      DEMO_MATCHES.unshift(...newMatches);
      return;
    }
    
    // Generate matches based on response similarity
    const newMatches: Match[] = [];
    for (let i = 0; i < Math.min(limit, 3); i++) {
      // Simulate compatibility based on response patterns
      const compatibility = this.calculateCompatibility(userResponses);
      
      newMatches.push({
        id: `match_${Date.now()}_${i}`,
        userId,
        matchedUserId: `user_${Math.random().toString(36).substr(2, 9)}`,
        compatibility,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    
    DEMO_MATCHES.unshift(...newMatches);
  }

  private static calculateCompatibility(userResponses: any[]): number {
    // Simple compatibility calculation based on response length and sentiment
    let baseCompatibility = 0.7;
    
    // Longer, more thoughtful responses increase compatibility
    const avgResponseLength = userResponses.reduce((sum, r) => sum + r.content.length, 0) / userResponses.length;
    if (avgResponseLength > 100) baseCompatibility += 0.1;
    if (avgResponseLength > 200) baseCompatibility += 0.1;
    
    // Recent responses increase compatibility
    const recentResponses = userResponses.filter(r => 
      new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
    );
    if (recentResponses.length > 0) baseCompatibility += 0.05;
    
    // Add some randomness
    baseCompatibility += (Math.random() - 0.5) * 0.2;
    
    return Math.min(0.95, Math.max(0.6, baseCompatibility));
  }

  static async createMatch(userId1: string, userId2: string, compatibility: number): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const matchId = `match_${Date.now()}`;
    
    const match: Match = {
      id: matchId,
      userId: userId1,
      matchedUserId: userId2,
      compatibility,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    DEMO_MATCHES.push(match);
    return matchId;
  }

  static async getMatches(userId: string, status?: 'pending' | 'active' | 'ended'): Promise<Match[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let matches = DEMO_MATCHES.filter(match => 
      match.userId === userId || match.matchedUserId === userId
    );
    
    if (status) {
      matches = matches.filter(match => match.status === status);
    }
    
    return matches;
  }

  static async updateMatchStatus(matchId: string, status: 'pending' | 'active' | 'ended'): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const match = DEMO_MATCHES.find(m => m.id === matchId);
    if (match) {
      match.status = status;
    }
  }

  static async getMatchDetails(matchId: string): Promise<Match | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return DEMO_MATCHES.find(match => match.id === matchId) || null;
  }

  static async getMatchingStats(userId: string): Promise<{
    totalMatches: number;
    activeMatches: number;
    averageCompatibility: number;
    topCompatibility: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return DEMO_MATCHING_STATS;
  }

  static async suggestNextActions(userId: string): Promise<string[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const matches = await this.getMatches(userId);
    const suggestions: string[] = [];

    const pendingMatches = matches.filter(m => m.status === 'pending').length;
    const activeMatches = matches.filter(m => m.status === 'active').length;

    if (pendingMatches > 0) {
      suggestions.push(`You have ${pendingMatches} new match${pendingMatches > 1 ? 'es' : ''} waiting!`);
    }

    if (activeMatches > 0) {
      suggestions.push(`Continue conversations with your ${activeMatches} active match${activeMatches > 1 ? 'es' : ''}.`);
    }

    if (matches.length < 3) {
      suggestions.push('Complete more daily reflections to improve your matches.');
    }

    return suggestions;
  }
}