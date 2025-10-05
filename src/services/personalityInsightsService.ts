import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PersonalityTrait {
  name: string;
  percentage: number;
  description: string;
  category: 'core' | 'social' | 'cognitive' | 'emotional';
  dataPoints: string[];
  lastUpdated: Date;
}

export interface PersonalityProfile {
  traits: PersonalityTrait[];
  authenticityScore: number;
  insightsSummary: string;
  totalReflections: number;
  lastAnalyzed: Date;
}

class PersonalityInsightsService {
  private storageKey = 'personality_insights';
  private profile: PersonalityProfile | null = null;

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.profile = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.profile) {
          this.profile.lastAnalyzed = new Date(this.profile.lastAnalyzed);
          this.profile.traits.forEach(trait => {
            trait.lastUpdated = new Date(trait.lastUpdated);
          });
        }
      } else {
        this.profile = this.createInitialProfile();
        await this.saveProfile();
      }
    } catch (error) {
      console.error('Error initializing personality insights:', error);
      this.profile = this.createInitialProfile();
    }
  }

  private createInitialProfile(): PersonalityProfile {
    return {
      traits: [
        {
          name: 'Authenticity',
          percentage: 92,
          description: 'Shows genuine self-expression in responses',
          category: 'core',
          dataPoints: ['Consistent voice across different topics', 'Vulnerable sharing in reflections'],
          lastUpdated: new Date()
        },
        {
          name: 'Empathy',
          percentage: 88,
          description: 'Demonstrates understanding of others\' perspectives',
          category: 'emotional',
          dataPoints: ['Considers others in personal stories', 'Shows compassionate language'],
          lastUpdated: new Date()
        },
        {
          name: 'Curiosity',
          percentage: 85,
          description: 'Seeks deeper understanding through questions',
          category: 'cognitive',
          dataPoints: ['Asks follow-up questions', 'Explores complex topics'],
          lastUpdated: new Date()
        },
        {
          name: 'Openness',
          percentage: 79,
          description: 'Willing to share personal experiences and thoughts',
          category: 'social',
          dataPoints: ['Shares personal challenges', 'Open to new perspectives'],
          lastUpdated: new Date()
        }
      ],
      authenticityScore: 80,
      insightsSummary: 'Shows strong authentic self-expression with high emotional intelligence and openness to growth.',
      totalReflections: 25,
      lastAnalyzed: new Date()
    };
  }

  async analyzeReflection(
    question: string, 
    answer: string, 
    category: string,
    voiceUsed: boolean
  ): Promise<void> {
    if (!this.profile) {
      await this.initialize();
    }

    if (!this.profile) return;

    // Update total reflections
    this.profile.totalReflections += 1;

    // Analyze the reflection for personality insights
    const insights = this.extractInsights(question, answer, category, voiceUsed);
    
    // Update relevant traits
    this.updateTraits(insights);

    // Recalculate authenticity score
    this.updateAuthenticityScore();

    // Update insights summary
    this.updateInsightsSummary();

    this.profile.lastAnalyzed = new Date();
    await this.saveProfile();
  }

  private extractInsights(
    question: string, 
    answer: string, 
    category: string,
    voiceUsed: boolean
  ): { trait: string; strength: number; evidence: string }[] {
    const insights: { trait: string; strength: number; evidence: string }[] = [];
    const lowerAnswer = answer.toLowerCase();
    const wordCount = answer.split(' ').length;

    // Authenticity indicators
    if (lowerAnswer.includes('honestly') || lowerAnswer.includes('truthfully') || lowerAnswer.includes('i admit')) {
      insights.push({
        trait: 'Authenticity',
        strength: 3,
        evidence: 'Uses honest language markers'
      });
    }

    // Empathy indicators
    if (lowerAnswer.includes('others') || lowerAnswer.includes('people') || lowerAnswer.includes('understand')) {
      insights.push({
        trait: 'Empathy',
        strength: 2,
        evidence: 'Considers others in responses'
      });
    }

    // Curiosity indicators
    if (answer.includes('?') || lowerAnswer.includes('wonder') || lowerAnswer.includes('curious')) {
      insights.push({
        trait: 'Curiosity',
        strength: 2,
        evidence: 'Asks questions and shows wonder'
      });
    }

    // Openness indicators
    if (wordCount > 50 || lowerAnswer.includes('experience') || lowerAnswer.includes('learned')) {
      insights.push({
        trait: 'Openness',
        strength: 1,
        evidence: 'Provides detailed, thoughtful responses'
      });
    }

    // Voice usage increases authenticity
    if (voiceUsed) {
      insights.push({
        trait: 'Authenticity',
        strength: 1,
        evidence: 'Uses voice input for natural expression'
      });
    }

    // Demographic questions show openness
    if (category === 'DEMOGRAPHICS') {
      insights.push({
        trait: 'Openness',
        strength: 2,
        evidence: 'Willing to share personal information'
      });
    }

    return insights;
  }

  private updateTraits(insights: { trait: string; strength: number; evidence: string }[]): void {
    if (!this.profile) return;

    insights.forEach(insight => {
      const trait = this.profile!.traits.find(t => t.name === insight.trait);
      if (trait) {
        // Gradually increase trait percentage based on evidence
        const increase = Math.min(insight.strength * 0.5, 3); // Max 3% increase per reflection
        trait.percentage = Math.min(100, trait.percentage + increase);
        
        // Add evidence to data points (keep only last 5)
        trait.dataPoints.unshift(insight.evidence);
        if (trait.dataPoints.length > 5) {
          trait.dataPoints = trait.dataPoints.slice(0, 5);
        }
        
        trait.lastUpdated = new Date();
      }
    });
  }

  private updateAuthenticityScore(): void {
    if (!this.profile) return;

    // Base authenticity on multiple factors
    const authenticityTrait = this.profile.traits.find(t => t.name === 'Authenticity');
    const empathyTrait = this.profile.traits.find(t => t.name === 'Empathy');
    const opennessTrait = this.profile.traits.find(t => t.name === 'Openness');

    if (authenticityTrait && empathyTrait && opennessTrait) {
      // Weighted average with authenticity trait being most important
      this.profile.authenticityScore = Math.round(
        (authenticityTrait.percentage * 0.5) +
        (empathyTrait.percentage * 0.25) +
        (opennessTrait.percentage * 0.25)
      );
    }
  }

  private updateInsightsSummary(): void {
    if (!this.profile) return;

    const highestTrait = this.profile.traits.reduce((max, trait) => 
      trait.percentage > max.percentage ? trait : max
    );

    const summaries = [
      `Demonstrates strong ${highestTrait.name.toLowerCase()} with consistent authentic expression across ${this.profile.totalReflections} reflections.`,
      `Shows genuine self-awareness and emotional intelligence through thoughtful responses.`,
      `Displays authentic personality with balanced emotional and cognitive traits.`,
      `Exhibits strong authentic self-expression with growing emotional maturity.`
    ];

    this.profile.insightsSummary = summaries[Math.floor(Math.random() * summaries.length)];
  }

  async getPersonalityProfile(): Promise<PersonalityProfile | null> {
    if (!this.profile) {
      await this.initialize();
    }
    return this.profile;
  }

  async getTraitsByCategory(category: 'core' | 'social' | 'cognitive' | 'emotional'): Promise<PersonalityTrait[]> {
    if (!this.profile) {
      await this.initialize();
    }
    return this.profile?.traits.filter(trait => trait.category === category) || [];
  }

  async getTopTraits(limit: number = 4): Promise<PersonalityTrait[]> {
    if (!this.profile) {
      await this.initialize();
    }
    return this.profile?.traits
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, limit) || [];
  }

  private async saveProfile(): Promise<void> {
    if (!this.profile) return;
    
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.profile));
    } catch (error) {
      console.error('Error saving personality profile:', error);
    }
  }

  async resetProfile(): Promise<void> {
    this.profile = this.createInitialProfile();
    await this.saveProfile();
  }

  // Get insights for matching algorithm
  async getMatchingInsights(): Promise<{
    coreValues: string[];
    communicationStyle: string;
    emotionalIntelligence: number;
    openness: number;
  }> {
    const profile = await this.getPersonalityProfile();
    if (!profile) {
      return {
        coreValues: ['authenticity', 'growth'],
        communicationStyle: 'thoughtful',
        emotionalIntelligence: 70,
        openness: 70
      };
    }

    const authenticityTrait = profile.traits.find(t => t.name === 'Authenticity');
    const empathyTrait = profile.traits.find(t => t.name === 'Empathy');
    const opennessTrait = profile.traits.find(t => t.name === 'Openness');
    const curiosityTrait = profile.traits.find(t => t.name === 'Curiosity');

    const coreValues = [];
    if (authenticityTrait && authenticityTrait.percentage > 80) coreValues.push('authenticity');
    if (empathyTrait && empathyTrait.percentage > 80) coreValues.push('compassion');
    if (curiosityTrait && curiosityTrait.percentage > 80) coreValues.push('growth');
    if (opennessTrait && opennessTrait.percentage > 80) coreValues.push('openness');

    let communicationStyle = 'thoughtful';
    if (empathyTrait && empathyTrait.percentage > 85) communicationStyle = 'empathetic';
    if (curiosityTrait && curiosityTrait.percentage > 90) communicationStyle = 'inquisitive';

    return {
      coreValues: coreValues.length > 0 ? coreValues : ['authenticity', 'growth'],
      communicationStyle,
      emotionalIntelligence: empathyTrait?.percentage || 70,
      openness: opennessTrait?.percentage || 70
    };
  }

  // Clear all personality data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.storageKey);
      this.profile = null;
      console.log('✅ Cleared all personality insights data');
    } catch (error) {
      console.error('Error clearing personality data:', error);
    }
  }
}

export const personalityInsightsService = new PersonalityInsightsService();