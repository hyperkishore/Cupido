import { User } from '../../types';
import { DEMO_USER } from '../../config/demo';

export class MockAuthService {
  static async signInWithName(name: string): Promise<User> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user: User = {
      id: `demo_${Date.now()}`,
      email: `${name.toLowerCase().replace(/\s+/g, '_')}@demo.com`,
      displayName: name,
      createdAt: new Date().toISOString(),
      streak: 0,
      lastPromptDate: undefined,
      persona: undefined,
    };
    
    return user;
  }

  static async signOut() {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return { error: null };
  }

  static async getCurrentUser(): Promise<User | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    return DEMO_USER;
  }

  static async updateStreak(userId: string, newStreak: number) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    DEMO_USER.streak = newStreak;
    DEMO_USER.lastPromptDate = new Date().toISOString();
  }

  static async updatePersona(userId: string, personaData: any) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    DEMO_USER.persona = personaData;
  }
}