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

  // Extract profile data using Claude API for natural language understanding
  async extractProfileFromMessage(message: string, previousMessages: string[] = []): Promise<Partial<UserProfile>> {
    try {
      // Use Claude API to intelligently extract structured data
      const extractionPrompt = `You are a profile data extraction assistant. Extract any personal information from the user's message and return ONLY a valid JSON object.

Important rules:
1. Only extract information explicitly mentioned
2. Return {} if no profile information found
3. Do not infer or guess information
4. Valid fields: name, age, gender, location, hobbies (string[]), datingPreference

Examples:
"My name is Jamie" → {"name": "Jamie"}
"I'm 28 years old" → {"age": 28}
"I'm a woman looking for men" → {"gender": "female", "datingPreference": "men"}
"Jamie here, 28, from Boston" → {"name": "Jamie", "age": 28, "location": "Boston"}

User message: "${message}"

JSON:`;

      // FIXED: Use dynamic proxy URL from chatAiService instead of hardcoded localhost
      // This ensures it works on mobile devices and various network configurations
      const { chatAiService } = await import('./chatAiService');
      const proxyUrl = chatAiService.getProxyUrl();
      
      // Call Claude API via the proxy with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(`${proxyUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You extract profile data and return only valid JSON. No explanations.' },
            { role: 'user', content: extractionPrompt }
          ],
          modelType: 'sonnet'
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('[Profile Extraction] API call failed:', response.status);
        return {};
      }

      const data = await response.json();
      const extractedText = data.message || '{}';

      // Parse JSON from Claude's response
      // Claude might wrap it in markdown code blocks
      const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.log('[Profile Extraction] No JSON found in response:', extractedText);
        return {};
      }

      const extracted = JSON.parse(jsonMatch[0]);

      // Validate extracted data
      const updates: Partial<UserProfile> = {};
      if (extracted.name && typeof extracted.name === 'string' && extracted.name.length > 0) {
        updates.name = extracted.name;
      }
      if (extracted.age && typeof extracted.age === 'number' && extracted.age >= 18 && extracted.age <= 100) {
        updates.age = extracted.age;
      }
      if (extracted.gender && typeof extracted.gender === 'string') {
        updates.gender = extracted.gender;
      }
      if (extracted.location && typeof extracted.location === 'string') {
        updates.location = extracted.location;
      }
      if (extracted.datingPreference && typeof extracted.datingPreference === 'string') {
        updates.datingPreference = extracted.datingPreference;
      }
      if (extracted.hobbies && Array.isArray(extracted.hobbies)) {
        updates.hobbies = extracted.hobbies.filter((h: any) => typeof h === 'string');
      }

      return updates;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('[Profile Extraction] Timeout after 5s - skipping extraction');
      } else {
        console.error('[Profile Extraction] Error:', error);
      }
      return {};
    }
  }
}

export const userProfileService = new UserProfileService();