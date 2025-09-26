import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../types';
import { DEMO_USER } from '../../config/demo';

const STORAGE_KEY = 'cupido_demo_user';

const createUserFromPhone = (phoneNumber: string): User => ({
  id: `demo_${phoneNumber}`,
  phoneNumber,
  createdAt: new Date().toISOString(),
  streak: DEMO_USER.streak,
  lastPromptDate: DEMO_USER.lastPromptDate,
  persona: DEMO_USER.persona,
});

export class MockAuthService {
  static async signInWithPhone(phoneNumber: string): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 350));
    const normalized = phoneNumber.trim();
    const user = createUserFromPhone(normalized);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  static async signOut() {
    await new Promise(resolve => setTimeout(resolve, 200));
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  static async getCurrentUser(): Promise<User | null> {
    await new Promise(resolve => setTimeout(resolve, 200));
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as User;
      return parsed;
    } catch (error) {
      console.warn('Failed to parse stored demo user', error);
      return null;
    }
  }

  static async updateStreak(userId: string, newStreak: number) {
    await new Promise(resolve => setTimeout(resolve, 150));
    DEMO_USER.streak = newStreak;
    DEMO_USER.lastPromptDate = new Date().toISOString();
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        parsed.streak = newStreak;
        parsed.lastPromptDate = DEMO_USER.lastPromptDate;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.warn('Failed to update stored demo user streak', error);
      }
    }
  }

  static async updatePersona(userId: string, personaData: any) {
    await new Promise(resolve => setTimeout(resolve, 150));
    DEMO_USER.persona = personaData;
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User;
        parsed.persona = personaData;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      } catch (error) {
        console.warn('Failed to update stored demo persona', error);
      }
    }
  }
}
