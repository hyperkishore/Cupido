import { PersonaData } from '../../types';
import { DEMO_USER } from '../../config/demo';

export class MockPersonaService {
  static async updatePersona(userId: string): Promise<PersonaData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, slightly modify the existing persona
    const updatedPersona = {
      ...DEMO_USER.persona!,
      lastUpdated: new Date().toISOString(),
    };
    
    return updatedPersona;
  }

  static async getPersona(userId: string): Promise<PersonaData | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return DEMO_USER.persona || null;
  }

  static async findCompatibleUsers(userId: string, limit: number = 10): Promise<Array<{ userId: string; compatibility: number }>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Return mock compatible users
    const compatibleUsers = [];
    for (let i = 0; i < limit; i++) {
      compatibleUsers.push({
        userId: `user_${Math.random().toString(36).substr(2, 9)}`,
        compatibility: 0.7 + Math.random() * 0.25, // 70-95% compatibility
      });
    }
    
    return compatibleUsers;
  }

  static async shouldUpdatePersona(userId: string): Promise<boolean> {
    // For demo, randomly suggest updates
    return Math.random() > 0.7;
  }

  static async getPersonaInsights(userId: string): Promise<string[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return DEMO_USER.persona?.insights || [];
  }

  static async getTraitVisualization(userId: string): Promise<Record<string, number> | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 250));
    
    const persona = DEMO_USER.persona;
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