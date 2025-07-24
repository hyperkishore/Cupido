import { supabase } from './supabase';
import { User } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockAuthService } from './demo/mockAuthService';

export class AuthService {
  static async signInWithName(name: string): Promise<User> {
    if (DEMO_MODE) {
      return MockAuthService.signInWithName(name);
    }

    const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    const { data, error } = await supabase.from('users').insert({
      id: userId,
      email: `${name.toLowerCase().replace(/\s+/g, '_')}@demo.com`,
      display_name: name,
      streak: 0,
      persona_data: null,
    }).select().single();

    if (error) throw error;

    return {
      id: data.id,
      email: data.email,
      displayName: data.display_name,
      createdAt: data.created_at,
      streak: data.streak,
      lastPromptDate: data.last_prompt_date,
      persona: data.persona_data,
    };
  }

  static async signOut() {
    if (DEMO_MODE) {
      return MockAuthService.signOut();
    }

    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser(): Promise<User | null> {
    if (DEMO_MODE) {
      return MockAuthService.getCurrentUser();
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    return {
      id: userData.id,
      email: userData.email,
      createdAt: userData.created_at,
      streak: userData.streak,
      lastPromptDate: userData.last_prompt_date,
      persona: userData.persona_data,
    };
  }

  static async updateStreak(userId: string, newStreak: number) {
    if (DEMO_MODE) {
      return MockAuthService.updateStreak(userId, newStreak);
    }

    const { error } = await supabase
      .from('users')
      .update({ 
        streak: newStreak,
        last_prompt_date: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;
  }

  static async updatePersona(userId: string, personaData: any) {
    if (DEMO_MODE) {
      return MockAuthService.updatePersona(userId, personaData);
    }

    const { error } = await supabase
      .from('users')
      .update({ persona_data: personaData })
      .eq('id', userId);

    if (error) throw error;
  }
}