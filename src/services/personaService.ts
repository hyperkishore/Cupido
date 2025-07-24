import { supabase } from './supabase';
import { PersonaAI } from './personaAI';
import { PromptService } from './prompts';
import { PersonaData } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockPersonaService } from './demo/mockPersonaService';

export class PersonaService {
  static async updatePersona(userId: string): Promise<PersonaData> {
    if (DEMO_MODE) {
      return MockPersonaService.updatePersona(userId);
    }

    // Get user's recent responses
    const responses = await PromptService.getUserResponses(userId, 20);
    
    if (responses.length === 0) {
      throw new Error('No responses found to generate persona');
    }

    // Generate persona using AI
    const personaData = await PersonaAI.generatePersona(responses);

    // Update user's persona in database
    const { error } = await supabase
      .from('users')
      .update({ persona_data: personaData })
      .eq('id', userId);

    if (error) throw error;

    return personaData;
  }

  static async getPersona(userId: string): Promise<PersonaData | null> {
    if (DEMO_MODE) {
      return MockPersonaService.getPersona(userId);
    }

    const { data, error } = await supabase
      .from('users')
      .select('persona_data')
      .eq('id', userId)
      .single();

    if (error || !data?.persona_data) return null;

    return data.persona_data as PersonaData;
  }

  static async findCompatibleUsers(userId: string, limit: number = 10): Promise<Array<{ userId: string; compatibility: number }>> {
    const userPersona = await this.getPersona(userId);
    if (!userPersona) {
      throw new Error('User persona not found');
    }

    // Get all users with personas (excluding current user)
    const { data: users, error } = await supabase
      .from('users')
      .select('id, persona_data')
      .neq('id', userId)
      .not('persona_data', 'is', null);

    if (error) throw error;

    // Calculate compatibility scores
    const compatibilityScores = users
      .map(user => ({
        userId: user.id,
        compatibility: PersonaAI.calculateCompatibility(userPersona, user.persona_data as PersonaData)
      }))
      .sort((a, b) => b.compatibility - a.compatibility)
      .slice(0, limit);

    return compatibilityScores;
  }

  static async shouldUpdatePersona(userId: string): Promise<boolean> {
    const persona = await this.getPersona(userId);
    if (!persona) return true;

    // Check if persona was updated in the last 7 days
    const lastUpdated = new Date(persona.lastUpdated);
    const daysSinceUpdate = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysSinceUpdate >= 7;
  }

  static async getPersonaInsights(userId: string): Promise<string[]> {
    const persona = await this.getPersona(userId);
    if (!persona) return [];

    return persona.insights;
  }

  static async getTraitVisualization(userId: string): Promise<Record<string, number> | null> {
    if (DEMO_MODE) {
      return MockPersonaService.getTraitVisualization(userId);
    }

    const persona = await this.getPersona(userId);
    if (!persona) return null;

    // Return top 8 traits for visualization
    const sortedTraits = Object.entries(persona.traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .reduce((acc, [trait, score]) => {
        acc[trait] = score;
        return acc;
      }, {} as Record<string, number>);

    return sortedTraits;
  }
}