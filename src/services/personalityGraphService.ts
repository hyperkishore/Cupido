/**
 * Personality Graph Service
 * Tracks and builds user personality profile based on likes and interactions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { userContextService } from './userContext';

interface PersonalityTrait {
  trait: string;
  score: number;
  category: string;
}

interface LikeRecord {
  contentId: string;
  contentType: 'reflection' | 'prompt' | 'response';
  tags: string[];
  mood?: string;
  timestamp: string;
  question?: string;
  answer?: string;
}

interface PersonalityProfile {
  userId: string;
  traits: PersonalityTrait[];
  interests: string[];
  values: string[];
  emotionalPatterns: Record<string, number>;
  likeHistory: LikeRecord[];
  lastUpdated: string;
}

class PersonalityGraphService {
  private readonly STORAGE_KEY_PREFIX = 'personality_graph_';
  
  /**
   * Record a like action and update personality profile
   */
  async recordLike(content: {
    id: string;
    type: 'reflection' | 'prompt' | 'response';
    tags: string[];
    mood?: string;
    question?: string;
    answer?: string;
  }): Promise<void> {
    const userId = userContextService.getCurrentUserId();
    if (!userId) return;
    
    const profile = await this.getPersonalityProfile(userId);
    
    // Add to like history
    const likeRecord: LikeRecord = {
      contentId: content.id,
      contentType: content.type,
      tags: content.tags,
      mood: content.mood,
      question: content.question,
      answer: content.answer,
      timestamp: new Date().toISOString(),
    };
    
    profile.likeHistory.push(likeRecord);
    
    // Keep only last 100 likes for analysis
    if (profile.likeHistory.length > 100) {
      profile.likeHistory = profile.likeHistory.slice(-100);
    }
    
    // Update personality traits based on the liked content
    this.updateTraitsFromLike(profile, likeRecord);
    
    // Update interests based on tags
    this.updateInterests(profile, content.tags);
    
    // Update emotional patterns
    if (content.mood) {
      this.updateEmotionalPatterns(profile, content.mood);
    }
    
    // Analyze values from content
    if (content.answer) {
      this.extractValuesFromText(profile, content.answer);
    }
    
    profile.lastUpdated = new Date().toISOString();
    
    await this.savePersonalityProfile(userId, profile);
  }
  
  /**
   * Get personality profile for matching
   */
  async getPersonalityProfile(userId: string): Promise<PersonalityProfile> {
    const key = `${this.STORAGE_KEY_PREFIX}${userId}`;
    
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading personality profile:', error);
    }
    
    // Return default profile
    return {
      userId,
      traits: [],
      interests: [],
      values: [],
      emotionalPatterns: {},
      likeHistory: [],
      lastUpdated: new Date().toISOString(),
    };
  }
  
  /**
   * Calculate compatibility between two users
   */
  async calculateCompatibility(userId1: string, userId2: string): Promise<number> {
    const [profile1, profile2] = await Promise.all([
      this.getPersonalityProfile(userId1),
      this.getPersonalityProfile(userId2),
    ]);
    
    let compatibility = 0;
    let weights = 0;
    
    // Compare traits (40% weight)
    const traitScore = this.compareTraits(profile1.traits, profile2.traits);
    compatibility += traitScore * 0.4;
    weights += 0.4;
    
    // Compare interests (30% weight)
    const interestScore = this.compareArrays(profile1.interests, profile2.interests);
    compatibility += interestScore * 0.3;
    weights += 0.3;
    
    // Compare values (20% weight)
    const valueScore = this.compareArrays(profile1.values, profile2.values);
    compatibility += valueScore * 0.2;
    weights += 0.2;
    
    // Compare emotional patterns (10% weight)
    const emotionalScore = this.compareEmotionalPatterns(
      profile1.emotionalPatterns,
      profile2.emotionalPatterns
    );
    compatibility += emotionalScore * 0.1;
    weights += 0.1;
    
    return Math.round((compatibility / weights) * 100);
  }
  
  /**
   * Get personality insights for display
   */
  async getPersonalityInsights(userId: string): Promise<{
    topTraits: PersonalityTrait[];
    dominantMood: string;
    coreValues: string[];
    interestCategories: string[];
  }> {
    const profile = await this.getPersonalityProfile(userId);
    
    // Get top 5 traits
    const topTraits = profile.traits
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    
    // Find dominant mood
    const dominantMood = Object.entries(profile.emotionalPatterns)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'balanced';
    
    // Get core values (top 3)
    const coreValues = profile.values.slice(0, 3);
    
    // Categorize interests
    const interestCategories = this.categorizeInterests(profile.interests);
    
    return {
      topTraits,
      dominantMood,
      coreValues,
      interestCategories,
    };
  }
  
  // Private helper methods
  
  private updateTraitsFromLike(profile: PersonalityProfile, like: LikeRecord): void {
    // Map tags to personality traits
    const traitMappings: Record<string, string[]> = {
      'introspective': ['thoughtful', 'self-aware', 'reflective'],
      'creative': ['imaginative', 'artistic', 'innovative'],
      'emotional': ['empathetic', 'sensitive', 'compassionate'],
      'analytical': ['logical', 'systematic', 'detail-oriented'],
      'social': ['outgoing', 'collaborative', 'communicative'],
      'adventurous': ['bold', 'curious', 'spontaneous'],
      'mindful': ['present', 'aware', 'balanced'],
    };
    
    like.tags.forEach(tag => {
      const traits = traitMappings[tag.toLowerCase()] || [tag];
      traits.forEach(trait => {
        const existing = profile.traits.find(t => t.trait === trait);
        if (existing) {
          existing.score = Math.min(100, existing.score + 2);
        } else {
          profile.traits.push({
            trait,
            score: 10,
            category: this.getTraitCategory(trait),
          });
        }
      });
    });
  }
  
  private updateInterests(profile: PersonalityProfile, tags: string[]): void {
    tags.forEach(tag => {
      if (!profile.interests.includes(tag)) {
        profile.interests.push(tag);
      }
    });
    
    // Keep top 20 interests
    if (profile.interests.length > 20) {
      profile.interests = profile.interests.slice(-20);
    }
  }
  
  private updateEmotionalPatterns(profile: PersonalityProfile, mood: string): void {
    profile.emotionalPatterns[mood] = (profile.emotionalPatterns[mood] || 0) + 1;
  }
  
  private extractValuesFromText(profile: PersonalityProfile, text: string): void {
    const valueKeywords: Record<string, string[]> = {
      'authenticity': ['genuine', 'authentic', 'real', 'honest', 'true'],
      'growth': ['learn', 'grow', 'improve', 'develop', 'progress'],
      'connection': ['connect', 'relationship', 'together', 'bond', 'close'],
      'creativity': ['create', 'imagine', 'design', 'artistic', 'innovative'],
      'kindness': ['kind', 'compassion', 'caring', 'help', 'support'],
      'freedom': ['free', 'independent', 'choice', 'liberty', 'autonomy'],
      'balance': ['balance', 'harmony', 'peace', 'calm', 'centered'],
    };
    
    const lowercaseText = text.toLowerCase();
    
    Object.entries(valueKeywords).forEach(([value, keywords]) => {
      if (keywords.some(keyword => lowercaseText.includes(keyword))) {
        if (!profile.values.includes(value)) {
          profile.values.push(value);
        }
      }
    });
    
    // Keep top 10 values
    if (profile.values.length > 10) {
      profile.values = profile.values.slice(0, 10);
    }
  }
  
  private getTraitCategory(trait: string): string {
    const categories: Record<string, string[]> = {
      'emotional': ['empathetic', 'sensitive', 'compassionate', 'caring'],
      'intellectual': ['thoughtful', 'analytical', 'logical', 'curious'],
      'social': ['outgoing', 'collaborative', 'communicative', 'friendly'],
      'creative': ['imaginative', 'artistic', 'innovative', 'expressive'],
      'physical': ['active', 'energetic', 'adventurous', 'bold'],
    };
    
    for (const [category, traits] of Object.entries(categories)) {
      if (traits.includes(trait.toLowerCase())) {
        return category;
      }
    }
    
    return 'general';
  }
  
  private compareTraits(traits1: PersonalityTrait[], traits2: PersonalityTrait[]): number {
    if (traits1.length === 0 || traits2.length === 0) return 50;
    
    let similarity = 0;
    let comparisons = 0;
    
    traits1.forEach(trait1 => {
      const trait2 = traits2.find(t => t.trait === trait1.trait);
      if (trait2) {
        // Similar trait found, calculate score difference
        const diff = Math.abs(trait1.score - trait2.score);
        similarity += (100 - diff) / 100;
        comparisons++;
      }
    });
    
    if (comparisons === 0) return 30;
    
    return (similarity / comparisons) * 100;
  }
  
  private compareArrays(arr1: string[], arr2: string[]): number {
    if (arr1.length === 0 || arr2.length === 0) return 50;
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return (intersection.size / union.size) * 100;
  }
  
  private compareEmotionalPatterns(
    patterns1: Record<string, number>,
    patterns2: Record<string, number>
  ): number {
    const moods1 = Object.keys(patterns1);
    const moods2 = Object.keys(patterns2);
    
    if (moods1.length === 0 || moods2.length === 0) return 50;
    
    // Compare dominant moods
    const dominant1 = moods1.sort((a, b) => patterns1[b] - patterns1[a])[0];
    const dominant2 = moods2.sort((a, b) => patterns2[b] - patterns2[a])[0];
    
    if (dominant1 === dominant2) return 90;
    
    // Check if they share any moods
    const sharedMoods = moods1.filter(mood => moods2.includes(mood));
    
    return (sharedMoods.length / Math.max(moods1.length, moods2.length)) * 100;
  }
  
  private categorizeInterests(interests: string[]): string[] {
    const categories: Record<string, string[]> = {
      'Creative': ['art', 'music', 'writing', 'design', 'photography'],
      'Intellectual': ['reading', 'learning', 'philosophy', 'science', 'technology'],
      'Social': ['relationships', 'community', 'communication', 'networking'],
      'Wellness': ['mindfulness', 'health', 'fitness', 'meditation', 'yoga'],
      'Adventure': ['travel', 'exploration', 'outdoors', 'sports', 'adventure'],
    };
    
    const foundCategories = new Set<string>();
    
    interests.forEach(interest => {
      const lowerInterest = interest.toLowerCase();
      Object.entries(categories).forEach(([category, keywords]) => {
        if (keywords.some(keyword => lowerInterest.includes(keyword))) {
          foundCategories.add(category);
        }
      });
    });
    
    return Array.from(foundCategories);
  }
  
  private async savePersonalityProfile(userId: string, profile: PersonalityProfile): Promise<void> {
    const key = `${this.STORAGE_KEY_PREFIX}${userId}`;
    try {
      await AsyncStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving personality profile:', error);
    }
  }
}

export const personalityGraphService = new PersonalityGraphService();