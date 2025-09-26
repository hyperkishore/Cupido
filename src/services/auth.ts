import { User } from '../types';
import { MockAuthService } from './demo/mockAuthService';
import { LocalUserRepository } from './localDatabase/userRepository';
import type { AppMode } from '../contexts/AppModeContext';

export class AuthService {
  static async signInWithPhone(phoneNumber: string, mode: AppMode): Promise<User> {
    if (mode === 'demo') {
      return MockAuthService.signInWithPhone(phoneNumber);
    }

    return LocalUserRepository.upsertUser(phoneNumber);
  }

  static async signOut(mode: AppMode) {
    if (mode === 'demo') {
      return MockAuthService.signOut();
    }

    await LocalUserRepository.signOut();
  }

  static async getCurrentUser(mode: AppMode): Promise<User | null> {
    if (mode === 'demo') {
      return MockAuthService.getCurrentUser();
    }

    return LocalUserRepository.getCurrentUser();
  }

  static async updateStreak(userId: string, newStreak: number) {
    return MockAuthService.updateStreak(userId, newStreak);
  }

  static async updatePersona(userId: string, personaData: any) {
    return MockAuthService.updatePersona(userId, personaData);
  }
}
