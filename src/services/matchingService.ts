import AsyncStorage from '@react-native-async-storage/async-storage';
import { personalityInsightsService, PersonalityProfile } from './personalityInsightsService';
import { conversationMemoryService, ConversationMemory } from './conversationMemoryService';
import { personalityEvolutionService } from './personalityEvolutionService';

export interface UserProfile {
  id: string;
  createdAt: string;
  lastActive: string;
  location?: {
    city: string;
    state: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  personalityProfile: PersonalityProfile;
  conversationSummary: {
    totalConversations: number;
    averageDepth: number;
    preferredTopics: string[];
    communicationStyle: string;
    emotionalPatterns: { [emotion: string]: number };
  };
  preferences: {
    ageRange: { min: number; max: number };
    maxDistance: number;
    dealBreakers: string[];
    mustHaves: string[];
  };
  matchingData: {
    compatibilityScores: { [userId: string]: number };
    lastCalculated: string;
    totalMatches: number;
    conversationsStarted: number;
    meetupsCompleted: number;
  };
}

export interface CompatibilityScore {
  userId: string;
  overallScore: number;
  breakdown: {
    personalityMatch: number;
    valuesAlignment: number;
    communicationStyle: number;
    emotionalIntelligence: number;
    growthPotential: number;
    conversationalChemistry: number;
  };
  reasoning: string[];
  matchType: 'personality_twin' | 'complementary_growth' | 'balanced_connection' | 'deep_alignment';
  confidenceLevel: number;
}

export interface Match {
  id: string;
  userId: string;
  compatibilityScore: CompatibilityScore;
  status: 'suggested' | 'liked' | 'passed' | 'mutual_like' | 'conversation_started';
  createdAt: string;
  interactionHistory: MatchInteraction[];
  revealLevel: number; // 0-5, how much info has been revealed
  conversationStarters: string[];
}

export interface MatchInteraction {
  id: string;
  type: 'like' | 'pass' | 'conversation_start' | 'message_sent' | 'photo_revealed' | 'meetup_suggested';
  timestamp: string;
  data?: any;
}

class MatchingService {
  private storageKey = 'user_profiles';
  private matchesKey = 'user_matches';
  private userProfiles: { [userId: string]: UserProfile } = {};
  private currentUserProfile: UserProfile | null = null;
  private matches: Match[] = [];

  private getCurrentUserId(): string {
    // Try to get user ID from various sources
    try {
      // Check if we have auth context (would need to be passed in)
      if (typeof window !== 'undefined' && (window as any).__currentUserId) {
        return (window as any).__currentUserId;
      }
      
      // Check AsyncStorage for user session
      const storedSession = localStorage.getItem('user_session');
      if (storedSession) {
        const session = JSON.parse(storedSession);
        if (session.userId) return session.userId;
      }
      
      // Generate and store a unique ID as fallback
      let userId = localStorage.getItem('matching_user_id');
      if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('matching_user_id', userId);
      }
      return userId;
    } catch {
      // Fallback for non-web environments
      return `user_${Date.now()}`;
    }
  }

  async initialize(): Promise<void> {
    try {
      // Load user profiles
      const storedProfiles = await AsyncStorage.getItem(this.storageKey);
      if (storedProfiles) {
        this.userProfiles = JSON.parse(storedProfiles);
      }

      // Load matches
      const storedMatches = await AsyncStorage.getItem(this.matchesKey);
      if (storedMatches) {
        this.matches = JSON.parse(storedMatches);
      }

      // Initialize current user profile
      await this.initializeCurrentUserProfile();
    } catch (error) {
      console.error('Error initializing matching service:', error);
    }
  }

  private async initializeCurrentUserProfile(): Promise<void> {
    // FIXED: Use actual user ID from auth or generate unique ID
    const currentUserId = this.getCurrentUserId();
    
    if (this.userProfiles[currentUserId]) {
      this.currentUserProfile = this.userProfiles[currentUserId];
      return;
    }

    // Create new user profile
    const personalityProfile = await personalityInsightsService.getPersonalityProfile();
    const conversationMemory = await conversationMemoryService.getConversationMemory();
    
    if (!personalityProfile || !conversationMemory) {
      console.log('Not enough data to create user profile yet');
      return;
    }

    this.currentUserProfile = {
      id: currentUserId,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      personalityProfile,
      conversationSummary: this.generateConversationSummary(conversationMemory),
      preferences: {
        ageRange: { min: 25, max: 35 },
        maxDistance: 50,
        dealBreakers: [],
        mustHaves: ['authenticity', 'emotional_intelligence']
      },
      matchingData: {
        compatibilityScores: {},
        lastCalculated: new Date().toISOString(),
        totalMatches: 0,
        conversationsStarted: 0,
        meetupsCompleted: 0
      }
    };

    this.userProfiles[currentUserId] = this.currentUserProfile;
    await this.saveUserProfiles();
  }

  private generateConversationSummary(memory: ConversationMemory): UserProfile['conversationSummary'] {
    const totalWords = memory.conversationHistory.reduce((sum, conv) => sum + conv.wordCount, 0);
    const averageDepth = totalWords / Math.max(memory.totalConversations, 1);
    
    // Get top 3 most discussed topics
    const topicEntries = Object.entries(memory.topicFrequency);
    const preferredTopics = topicEntries
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic, _]) => topic);

    // Determine communication style
    let communicationStyle = 'thoughtful';
    if (averageDepth > 50) communicationStyle = 'deep';
    if (averageDepth < 20) communicationStyle = 'concise';
    
    const vulnerableRatio = (memory.emotionalPatterns.vulnerable || 0) / memory.totalConversations;
    if (vulnerableRatio > 0.3) communicationStyle = 'authentic';

    return {
      totalConversations: memory.totalConversations,
      averageDepth,
      preferredTopics,
      communicationStyle,
      emotionalPatterns: memory.emotionalPatterns
    };
  }

  async calculateCompatibility(userId1: string, userId2: string): Promise<CompatibilityScore | null> {
    const user1 = this.userProfiles[userId1];
    const user2 = this.userProfiles[userId2];

    if (!user1 || !user2) {
      console.error('User profiles not found for compatibility calculation');
      return null;
    }

    const breakdown = {
      personalityMatch: this.calculatePersonalityMatch(user1, user2),
      valuesAlignment: this.calculateValuesAlignment(user1, user2),
      communicationStyle: this.calculateCommunicationCompatibility(user1, user2),
      emotionalIntelligence: this.calculateEmotionalIntelligence(user1, user2),
      growthPotential: this.calculateGrowthPotential(user1, user2),
      conversationalChemistry: this.calculateConversationalChemistry(user1, user2)
    };

    // Weighted overall score
    const weights = {
      personalityMatch: 0.25,
      valuesAlignment: 0.25,
      communicationStyle: 0.15,
      emotionalIntelligence: 0.15,
      growthPotential: 0.1,
      conversationalChemistry: 0.1
    };

    const overallScore = Object.entries(breakdown).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);

    const reasoning = this.generateCompatibilityReasoning(breakdown, user1, user2);
    const matchType = this.determineMatchType(breakdown, user1, user2);
    const confidenceLevel = this.calculateConfidenceLevel(user1, user2);

    return {
      userId: userId2,
      overallScore: Math.round(overallScore),
      breakdown,
      reasoning,
      matchType,
      confidenceLevel
    };
  }

  private calculatePersonalityMatch(user1: UserProfile, user2: UserProfile): number {
    const traits1 = user1.personalityProfile.traits;
    const traits2 = user2.personalityProfile.traits;

    // Create maps for easier lookup
    const traitMap1 = new Map(traits1.map(t => [t.name, t.percentage]));
    const traitMap2 = new Map(traits2.map(t => [t.name, t.percentage]));

    let totalDifference = 0;
    let traitCount = 0;

    // Calculate similarity for each trait
    traitMap1.forEach((percentage1, traitName) => {
      const percentage2 = traitMap2.get(traitName);
      if (percentage2 !== undefined) {
        // Convert difference to similarity score (0-100)
        const difference = Math.abs(percentage1 - percentage2);
        const similarity = Math.max(0, 100 - difference);
        totalDifference += similarity;
        traitCount++;
      }
    });

    return traitCount > 0 ? totalDifference / traitCount : 50;
  }

  private calculateValuesAlignment(user1: UserProfile, user2: UserProfile): number {
    // Get insights about core values from conversation patterns
    const topics1 = user1.conversationSummary.preferredTopics;
    const topics2 = user2.conversationSummary.preferredTopics;

    // Calculate topic overlap
    const commonTopics = topics1.filter(topic => topics2.includes(topic));
    const topicAlignment = (commonTopics.length / Math.max(topics1.length, topics2.length)) * 100;

    // Authenticity score alignment
    const auth1 = user1.personalityProfile.authenticityScore;
    const auth2 = user2.personalityProfile.authenticityScore;
    const authAlignment = Math.max(0, 100 - Math.abs(auth1 - auth2));

    // Communication style alignment
    const styleMatch = user1.conversationSummary.communicationStyle === user2.conversationSummary.communicationStyle ? 100 : 60;

    return (topicAlignment * 0.4 + authAlignment * 0.4 + styleMatch * 0.2);
  }

  private calculateCommunicationCompatibility(user1: UserProfile, user2: UserProfile): number {
    const depth1 = user1.conversationSummary.averageDepth;
    const depth2 = user2.conversationSummary.averageDepth;

    // Communication depth compatibility
    const depthDifference = Math.abs(depth1 - depth2);
    const depthCompatibility = Math.max(0, 100 - (depthDifference * 2));

    // Emotional expression compatibility
    const emotions1 = user1.conversationSummary.emotionalPatterns;
    const emotions2 = user2.conversationSummary.emotionalPatterns;

    const vulnerableRatio1 = (emotions1.vulnerable || 0) / Math.max(user1.conversationSummary.totalConversations, 1);
    const vulnerableRatio2 = (emotions2.vulnerable || 0) / Math.max(user2.conversationSummary.totalConversations, 1);

    const emotionalCompatibility = Math.max(0, 100 - (Math.abs(vulnerableRatio1 - vulnerableRatio2) * 200));

    return (depthCompatibility * 0.6 + emotionalCompatibility * 0.4);
  }

  private calculateEmotionalIntelligence(user1: UserProfile, user2: UserProfile): number {
    // Based on empathy trait and emotional pattern diversity
    const empathy1 = user1.personalityProfile.traits.find(t => t.name === 'Empathy')?.percentage || 50;
    const empathy2 = user2.personalityProfile.traits.find(t => t.name === 'Empathy')?.percentage || 50;

    const empathyAlignment = Math.max(0, 100 - Math.abs(empathy1 - empathy2));

    // Emotional range (how many different emotions they express)
    const emotionRange1 = Object.keys(user1.conversationSummary.emotionalPatterns).length;
    const emotionRange2 = Object.keys(user2.conversationSummary.emotionalPatterns).length;

    const rangeCompatibility = Math.min(emotionRange1, emotionRange2) / Math.max(emotionRange1, emotionRange2) * 100;

    return (empathyAlignment * 0.7 + rangeCompatibility * 0.3);
  }

  private calculateGrowthPotential(user1: UserProfile, user2: UserProfile): number {
    // Based on curiosity trait and conversation progression
    const curiosity1 = user1.personalityProfile.traits.find(t => t.name === 'Curiosity')?.percentage || 50;
    const curiosity2 = user2.personalityProfile.traits.find(t => t.name === 'Curiosity')?.percentage || 50;

    const averageCuriosity = (curiosity1 + curiosity2) / 2;

    // Openness to new experiences
    const openness1 = user1.personalityProfile.traits.find(t => t.name === 'Openness')?.percentage || 50;
    const openness2 = user2.personalityProfile.traits.find(t => t.name === 'Openness')?.percentage || 50;

    const averageOpenness = (openness1 + openness2) / 2;

    return (averageCuriosity * 0.6 + averageOpenness * 0.4);
  }

  private calculateConversationalChemistry(user1: UserProfile, user2: UserProfile): number {
    // Predict conversation flow based on patterns
    const totalConversations1 = user1.conversationSummary.totalConversations;
    const totalConversations2 = user2.conversationSummary.totalConversations;

    // Experience balance
    const experienceBalance = Math.min(totalConversations1, totalConversations2) / Math.max(totalConversations1, totalConversations2) * 100;

    // Topic diversity overlap
    const topics1 = new Set(user1.conversationSummary.preferredTopics);
    const topics2 = new Set(user2.conversationSummary.preferredTopics);
    const commonTopics = new Set([...topics1].filter(t => topics2.has(t)));
    
    const topicChemistry = (commonTopics.size > 0 ? 80 : 40) + (Math.random() * 20); // Add some variability

    return (experienceBalance * 0.4 + topicChemistry * 0.6);
  }

  private generateCompatibilityReasoning(
    breakdown: CompatibilityScore['breakdown'],
    user1: UserProfile,
    user2: UserProfile
  ): string[] {
    const reasoning: string[] = [];

    // Highlight strongest compatibility areas
    const scores = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const strongest = scores[0];
    const weakest = scores[scores.length - 1];

    if (strongest[1] > 80) {
      switch (strongest[0]) {
        case 'personalityMatch':
          reasoning.push('You have remarkably similar personality traits, suggesting natural understanding');
          break;
        case 'valuesAlignment':
          reasoning.push('Your core values and life perspectives align beautifully');
          break;
        case 'communicationStyle':
          reasoning.push('Your communication styles complement each other perfectly');
          break;
        case 'emotionalIntelligence':
          reasoning.push('Both of you show high emotional intelligence and empathy');
          break;
        case 'growthPotential':
          reasoning.push('You both have strong growth mindsets that could flourish together');
          break;
        case 'conversationalChemistry':
          reasoning.push('Your conversation patterns suggest excellent flow and engagement');
          break;
      }
    }

    // Add specific insights
    const auth1 = user1.personalityProfile.authenticityScore;
    const auth2 = user2.personalityProfile.authenticityScore;
    if (Math.min(auth1, auth2) > 80) {
      reasoning.push('Both of you value authenticity highly in your self-expression');
    }

    if (user1.conversationSummary.communicationStyle === user2.conversationSummary.communicationStyle) {
      reasoning.push(`You both share a ${user1.conversationSummary.communicationStyle} communication approach`);
    }

    // Add growth opportunity if there's a weaker area
    if (weakest[1] < 60) {
      reasoning.push(`While ${weakest[0].replace(/([A-Z])/g, ' $1').toLowerCase()} might need some work, relationships grow through differences`);
    }

    return reasoning;
  }

  private determineMatchType(
    breakdown: CompatibilityScore['breakdown'],
    user1: UserProfile,
    user2: UserProfile
  ): CompatibilityScore['matchType'] {
    const personalityScore = breakdown.personalityMatch;
    const valuesScore = breakdown.valuesAlignment;
    const growthScore = breakdown.growthPotential;

    // Personality twins (very similar)
    if (personalityScore > 85 && valuesScore > 80) {
      return 'personality_twin';
    }

    // Deep alignment (values and emotional connection)
    if (valuesScore > 85 && breakdown.emotionalIntelligence > 80) {
      return 'deep_alignment';
    }

    // Complementary growth (different but growth-oriented)
    if (growthScore > 80 && personalityScore < 70) {
      return 'complementary_growth';
    }

    // Balanced connection (good all-around)
    return 'balanced_connection';
  }

  private calculateConfidenceLevel(user1: UserProfile, user2: UserProfile): number {
    // Confidence based on amount of data available
    const conversations1 = user1.conversationSummary.totalConversations;
    const conversations2 = user2.conversationSummary.totalConversations;

    const minConversations = Math.min(conversations1, conversations2);
    
    // Confidence increases with more data
    if (minConversations >= 20) return 95;
    if (minConversations >= 15) return 85;
    if (minConversations >= 10) return 75;
    if (minConversations >= 5) return 65;
    return 45;
  }

  async generateMatches(limit: number = 10): Promise<Match[]> {
    if (!this.currentUserProfile) {
      console.log('Current user profile not available');
      return [];
    }

    // For demo purposes, create some sample user profiles
    await this.createSampleProfiles();

    const potentialMatches: Match[] = [];

    for (const [userId, userProfile] of Object.entries(this.userProfiles)) {
      if (userId === this.currentUserProfile.id) continue;

      const compatibility = await this.calculateCompatibility(this.currentUserProfile.id, userId);
      if (!compatibility) continue;

      // Only suggest matches above a certain threshold
      if (compatibility.overallScore < 60) continue;

      const match: Match = {
        id: `match_${Date.now()}_${userId}`,
        userId,
        compatibilityScore: compatibility,
        status: 'suggested',
        createdAt: new Date().toISOString(),
        interactionHistory: [],
        revealLevel: 0,
        conversationStarters: this.generateConversationStarters(this.currentUserProfile, userProfile, compatibility)
      };

      potentialMatches.push(match);
    }

    // Sort by compatibility score
    potentialMatches.sort((a, b) => b.compatibilityScore.overallScore - a.compatibilityScore.overallScore);

    return potentialMatches.slice(0, limit);
  }

  private generateConversationStarters(
    currentUser: UserProfile,
    matchedUser: UserProfile,
    compatibility: CompatibilityScore
  ): string[] {
    const starters: string[] = [];
    const commonTopics = currentUser.conversationSummary.preferredTopics
      .filter(topic => matchedUser.conversationSummary.preferredTopics.includes(topic));

    // Topic-based starters
    if (commonTopics.includes('family')) {
      starters.push("I noticed we both value family. What's a family tradition that means a lot to you?");
    }
    if (commonTopics.includes('personal_growth')) {
      starters.push("We both seem focused on personal growth. What's something you've learned about yourself recently?");
    }
    if (commonTopics.includes('creativity')) {
      starters.push("I love that we're both creative spirits. What's your favorite way to express creativity?");
    }

    // Compatibility-based starters
    if (compatibility.matchType === 'personality_twin') {
      starters.push("We seem to have really similar perspectives. What's something that might surprise me about how you see the world?");
    }
    if (compatibility.matchType === 'complementary_growth') {
      starters.push("I think we could learn a lot from each other. What's one thing you'd love to understand better about yourself?");
    }

    // Authenticity-based starters
    if (matchedUser.personalityProfile.authenticityScore > 80) {
      starters.push("Your authenticity really comes through. What's something you're genuinely excited about right now?");
    }

    // Default starters if no specific ones match
    if (starters.length === 0) {
      starters.push(
        "What's something you've always been curious about but never had the chance to explore?",
        "If you could have a conversation with anyone, living or dead, who would it be and why?",
        "What's a small thing that happened recently that made you smile?"
      );
    }

    return starters.slice(0, 3);
  }

  private async createSampleProfiles(): Promise<void> {
    // Only create if we don't have any other profiles
    if (Object.keys(this.userProfiles).length <= 1) {
      const sampleProfiles: UserProfile[] = [
        {
          id: 'user_001',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString(),
          personalityProfile: {
            traits: [
              { name: 'Authenticity', percentage: 88, description: 'Genuine and true to self', category: 'core', dataPoints: ['Honest communication', 'Vulnerable sharing'], lastUpdated: new Date() },
              { name: 'Empathy', percentage: 92, description: 'Deeply understanding of others', category: 'emotional', dataPoints: ['Compassionate responses', 'Active listening'], lastUpdated: new Date() },
              { name: 'Curiosity', percentage: 79, description: 'Loves learning and exploring', category: 'cognitive', dataPoints: ['Asks thoughtful questions', 'Explores new ideas'], lastUpdated: new Date() },
              { name: 'Openness', percentage: 85, description: 'Open to new experiences', category: 'social', dataPoints: ['Tries new things', 'Shares personal stories'], lastUpdated: new Date() }
            ],
            authenticityScore: 87,
            insightsSummary: 'Highly empathetic individual with strong authentic expression and curiosity about the world.',
            totalReflections: 28,
            lastAnalyzed: new Date()
          },
          conversationSummary: {
            totalConversations: 28,
            averageDepth: 45,
            preferredTopics: ['relationships', 'personal_growth', 'family'],
            communicationStyle: 'empathetic',
            emotionalPatterns: { positive: 12, vulnerable: 8, excited: 5, neutral: 3 }
          },
          preferences: {
            ageRange: { min: 26, max: 34 },
            maxDistance: 40,
            dealBreakers: ['dishonesty', 'closed_mindedness'],
            mustHaves: ['emotional_intelligence', 'family_oriented']
          },
          matchingData: {
            compatibilityScores: {},
            lastCalculated: new Date().toISOString(),
            totalMatches: 0,
            conversationsStarted: 0,
            meetupsCompleted: 0
          }
        },
        {
          id: 'user_002',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString(),
          personalityProfile: {
            traits: [
              { name: 'Authenticity', percentage: 91, description: 'Values genuine expression', category: 'core', dataPoints: ['Direct communication', 'Self-aware'], lastUpdated: new Date() },
              { name: 'Empathy', percentage: 76, description: 'Considers others perspectives', category: 'emotional', dataPoints: ['Supportive friend', 'Understanding'], lastUpdated: new Date() },
              { name: 'Curiosity', percentage: 94, description: 'Insatiably curious about everything', category: 'cognitive', dataPoints: ['Always learning', 'Asks deep questions'], lastUpdated: new Date() },
              { name: 'Openness', percentage: 83, description: 'Embraces new experiences', category: 'social', dataPoints: ['Adventurous spirit', 'Open-minded'], lastUpdated: new Date() }
            ],
            authenticityScore: 89,
            insightsSummary: 'Highly curious and authentic individual with a passion for learning and genuine connection.',
            totalReflections: 22,
            lastAnalyzed: new Date()
          },
          conversationSummary: {
            totalConversations: 22,
            averageDepth: 52,
            preferredTopics: ['creativity', 'personal_growth', 'values'],
            communicationStyle: 'inquisitive',
            emotionalPatterns: { excited: 10, positive: 8, vulnerable: 3, neutral: 1 }
          },
          preferences: {
            ageRange: { min: 25, max: 35 },
            maxDistance: 60,
            dealBreakers: ['lack_of_curiosity', 'superficiality'],
            mustHaves: ['intellectual_connection', 'growth_mindset']
          },
          matchingData: {
            compatibilityScores: {},
            lastCalculated: new Date().toISOString(),
            totalMatches: 0,
            conversationsStarted: 0,
            meetupsCompleted: 0
          }
        },
        {
          id: 'user_003',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString(),
          personalityProfile: {
            traits: [
              { name: 'Authenticity', percentage: 82, description: 'Strives for genuine connection', category: 'core', dataPoints: ['Real conversations', 'Honest about struggles'], lastUpdated: new Date() },
              { name: 'Empathy', percentage: 95, description: 'Exceptionally attuned to others', category: 'emotional', dataPoints: ['Natural counselor', 'Emotionally supportive'], lastUpdated: new Date() },
              { name: 'Curiosity', percentage: 71, description: 'Thoughtfully curious', category: 'cognitive', dataPoints: ['Reflects deeply', 'Seeks understanding'], lastUpdated: new Date() },
              { name: 'Openness', percentage: 88, description: 'Welcomes vulnerability', category: 'social', dataPoints: ['Shares openly', 'Accepts others'], lastUpdated: new Date() }
            ],
            authenticityScore: 85,
            insightsSummary: 'Deeply empathetic soul with strong emotional intelligence and desire for meaningful connection.',
            totalReflections: 31,
            lastAnalyzed: new Date()
          },
          conversationSummary: {
            totalConversations: 31,
            averageDepth: 38,
            preferredTopics: ['relationships', 'family', 'values'],
            communicationStyle: 'supportive',
            emotionalPatterns: { vulnerable: 12, positive: 11, excited: 4, neutral: 4 }
          },
          preferences: {
            ageRange: { min: 28, max: 38 },
            maxDistance: 35,
            dealBreakers: ['emotional_unavailability', 'commitment_issues'],
            mustHaves: ['emotional_maturity', 'ready_for_relationship']
          },
          matchingData: {
            compatibilityScores: {},
            lastCalculated: new Date().toISOString(),
            totalMatches: 0,
            conversationsStarted: 0,
            meetupsCompleted: 0
          }
        }
      ];

      sampleProfiles.forEach(profile => {
        this.userProfiles[profile.id] = profile;
      });

      await this.saveUserProfiles();
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.userProfiles[userId] || null;
  }

  async getCurrentUserProfile(): Promise<UserProfile | null> {
    return this.currentUserProfile;
  }

  async updateUserProfile(updates: Partial<UserProfile>): Promise<void> {
    if (!this.currentUserProfile) return;

    this.currentUserProfile = { ...this.currentUserProfile, ...updates };
    this.userProfiles[this.currentUserProfile.id] = this.currentUserProfile;
    await this.saveUserProfiles();
  }

  async getMatches(): Promise<Match[]> {
    return this.matches;
  }

  async interactWithMatch(matchId: string, interaction: Omit<MatchInteraction, 'id' | 'timestamp'>): Promise<void> {
    const match = this.matches.find(m => m.id === matchId);
    if (!match) return;

    const newInteraction: MatchInteraction = {
      id: `interaction_${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...interaction
    };

    match.interactionHistory.push(newInteraction);

    // Update match status based on interaction
    if (interaction.type === 'like' && match.status === 'suggested') {
      match.status = 'liked';
    } else if (interaction.type === 'conversation_start') {
      match.status = 'conversation_started';
      match.revealLevel = Math.max(1, match.revealLevel);
    }

    await this.saveMatches();
  }

  private async saveUserProfiles(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.userProfiles));
    } catch (error) {
      console.error('Error saving user profiles:', error);
    }
  }

  private async saveMatches(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.matchesKey, JSON.stringify(this.matches));
    } catch (error) {
      console.error('Error saving matches:', error);
    }
  }

  async resetMatchingData(): Promise<void> {
    this.userProfiles = {};
    this.currentUserProfile = null;
    this.matches = [];
    await this.saveUserProfiles();
    await this.saveMatches();
  }
}

export const matchingService = new MatchingService();