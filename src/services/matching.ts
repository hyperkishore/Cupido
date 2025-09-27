// @ts-nocheck
import { supabase } from './supabase';
import { Neo4jService } from './neo4j';
import { PersonaService } from './personaService';
import { Match } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockMatchingService } from './demo/mockMatchingService';

export class MatchingService {
  static async generateMatches(userId: string, limit: number = 5): Promise<void> {
    if (DEMO_MODE) {
      return MockMatchingService.generateMatches(userId, limit);
    }

    try {
      // Ensure user has an updated persona
      const shouldUpdate = await PersonaService.shouldUpdatePersona(userId);
      if (shouldUpdate) {
        await PersonaService.updatePersona(userId);
      }

      // Update user in Neo4j
      const persona = await PersonaService.getPersona(userId);
      if (!persona) {
        throw new Error('User persona not found');
      }

      await Neo4jService.createUserNode(userId, persona);

      // Find compatible users using Neo4j
      const compatibleUsers = await Neo4jService.findCompatibleUsers(userId, limit * 2);

      // Filter out users we've already matched with
      const existingMatches = await this.getExistingMatches(userId);
      const existingMatchIds = new Set(existingMatches.map(m => m.matchedUserId));

      const newMatches = compatibleUsers.filter(
        user => !existingMatchIds.has(user.userId) && user.compatibility > 0.6
      ).slice(0, limit);

      // Create matches in both Supabase and Neo4j
      for (const match of newMatches) {
        await this.createMatch(userId, match.userId, match.compatibility);
      }

    } catch (error) {
      console.error('Error generating matches:', error);
      throw error;
    }
  }

  static async createMatch(userId1: string, userId2: string, compatibility: number): Promise<string> {
    // Create match in Supabase
    const { data: supabaseMatch, error: supabaseError } = await supabase
      .from('matches')
      .insert({
        user_id: userId1,
        matched_user_id: userId2,
        compatibility,
        status: 'pending',
      })
      .select()
      .single();

    if (supabaseError) throw supabaseError;

    // Create match in Neo4j
    await Neo4jService.createMatch(userId1, userId2, compatibility);

    return supabaseMatch.id;
  }

  static async getMatches(userId: string, status?: 'pending' | 'active' | 'ended'): Promise<Match[]> {
    if (DEMO_MODE) {
      return MockMatchingService.getMatches(userId, status);
    }

    let query = supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(match => ({
      id: match.id,
      userId: match.user_id,
      matchedUserId: match.matched_user_id,
      compatibility: match.compatibility,
      status: match.status,
      createdAt: match.created_at,
    }));
  }

  static async updateMatchStatus(matchId: string, status: 'pending' | 'active' | 'ended'): Promise<void> {
    const { error } = await supabase
      .from('matches')
      .update({ status })
      .eq('id', matchId);

    if (error) throw error;

    // Update in Neo4j as well
    await Neo4jService.updateMatchStatus(matchId, status);
  }

  static async getMatchDetails(matchId: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      matchedUserId: data.matched_user_id,
      compatibility: data.compatibility,
      status: data.status,
      createdAt: data.created_at,
    };
  }

  private static async getExistingMatches(userId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`);

    if (error) throw error;

    return data.map(match => ({
      id: match.id,
      userId: match.user_id,
      matchedUserId: match.matched_user_id,
      compatibility: match.compatibility,
      status: match.status,
      createdAt: match.created_at,
    }));
  }

  static async getMatchingStats(userId: string): Promise<{
    totalMatches: number;
    activeMatches: number;
    averageCompatibility: number;
    topCompatibility: number;
  }> {
    if (DEMO_MODE) {
      return MockMatchingService.getMatchingStats(userId);
    }

    const matches = await this.getMatches(userId);
    const activeMatches = matches.filter(m => m.status === 'active').length;
    const compatibilityScores = matches.map(m => m.compatibility);
    
    return {
      totalMatches: matches.length,
      activeMatches,
      averageCompatibility: compatibilityScores.reduce((a, b) => a + b, 0) / compatibilityScores.length || 0,
      topCompatibility: Math.max(...compatibilityScores, 0),
    };
  }

  static async suggestNextActions(userId: string): Promise<string[]> {
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

    const shouldUpdate = await PersonaService.shouldUpdatePersona(userId);
    if (shouldUpdate) {
      suggestions.push('Your persona could use an update based on recent responses.');
    }

    return suggestions;
  }
}