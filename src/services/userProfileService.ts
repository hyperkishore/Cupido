import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  name?: string;
  age?: number;
  gender?: string;
  datingPreference?: string;
  location?: string;
  birthplace?: string;
  siblings?: string;
  parentsProfession?: string;
  hobbies?: string[];
  weekendActivities?: string[];
}

class UserProfileService {
  private STORAGE_KEY = 'cupido_user_profile';
  private profile: UserProfile = {};

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.profile = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<void> {
    this.profile = { ...this.profile, ...updates };
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  async setName(name: string): Promise<void> {
    await this.updateProfile({ name });
  }

  getName(): string | undefined {
    return this.profile.name;
  }

  getProfile(): UserProfile {
    return { ...this.profile };
  }

  async clearProfile(): Promise<void> {
    this.profile = {};
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing user profile:', error);
    }
  }

  // Extract profile data from chat messages
  extractProfileFromMessage(message: string, previousMessages: string[] = []): Partial<UserProfile> {
    const updates: Partial<UserProfile> = {};
    const lowerMessage = message.toLowerCase();

    // Name detection (first message usually)
    if (!this.profile.name && previousMessages.length < 3) {
      // Check if it looks like a name (starts with capital, no numbers, reasonable length)
      const words = message.trim().split(/\s+/);
      if (words.length <= 3 && words[0].match(/^[A-Z][a-z]+$/)) {
        updates.name = words[0];
      }
    }

    // Age detection
    const ageMatch = message.match(/\b(1[89]|[2-9]\d)\b/);
    if (ageMatch && (lowerMessage.includes('year') || lowerMessage.includes('old') || previousMessages.some(m => m.toLowerCase().includes('how old')))) {
      const age = parseInt(ageMatch[0]);
      if (age >= 18 && age <= 100) {
        updates.age = age;
      }
    }

    // Gender detection
    if (lowerMessage.includes('male') || lowerMessage.includes('man') || lowerMessage.includes('guy')) {
      updates.gender = 'male';
    } else if (lowerMessage.includes('female') || lowerMessage.includes('woman') || lowerMessage.includes('girl')) {
      updates.gender = 'female';
    } else if (lowerMessage.includes('non-binary') || lowerMessage.includes('they/them')) {
      updates.gender = 'non-binary';
    }

    // Dating preference detection
    if (lowerMessage.includes('looking for')) {
      if (lowerMessage.includes('men') || lowerMessage.includes('guys')) {
        updates.datingPreference = 'men';
      } else if (lowerMessage.includes('women') || lowerMessage.includes('girls')) {
        updates.datingPreference = 'women';
      } else if (lowerMessage.includes('both') || lowerMessage.includes('anyone')) {
        updates.datingPreference = 'both';
      }
    }

    return updates;
  }
}

export const userProfileService = new UserProfileService();