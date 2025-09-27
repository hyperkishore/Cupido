import { User } from '../types';
import { MockAuthService } from './demo/mockAuthService';
import { LocalUserRepository } from './localDatabase/userRepository';
import type { AppMode } from '../contexts/AppModeContext';
import { userContextService } from './userContext';

export class AuthService {
  static async signInWithPhone(phoneNumber: string, mode: AppMode): Promise<User> {
    if (mode === 'demo') {
      const user = await MockAuthService.signInWithPhone(phoneNumber);
      await userContextService.setCurrentUser(phoneNumber);
      return user;
    }

    const user = await LocalUserRepository.upsertUser(phoneNumber);
    await userContextService.setCurrentUser(phoneNumber);
    return user;
  }

  static async signOut(mode: AppMode) {
    if (mode === 'demo') {
      await MockAuthService.signOut();
    } else {
      await LocalUserRepository.signOut();
    }
    
    await userContextService.clearCurrentUser();
  }

  static async getCurrentUser(mode: AppMode): Promise<User | null> {
    // Initialize user context on app start
    await userContextService.initialize();
    
    if (mode === 'demo') {
      const user = await MockAuthService.getCurrentUser();
      if (user && user.phoneNumber) {
        await userContextService.setCurrentUser(user.phoneNumber);
      }
      return user;
    }

    const user = await LocalUserRepository.getCurrentUser();
    if (user && user.phoneNumber) {
      await userContextService.setCurrentUser(user.phoneNumber);
    }
    return user;
  }

  static async updateStreak(userId: string, newStreak: number) {
    return MockAuthService.updateStreak(userId, newStreak);
  }

  static async updatePersona(userId: string, personaData: any) {
    return MockAuthService.updatePersona(userId, personaData);
  }
}
