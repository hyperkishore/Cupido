import { PersonaData, Response } from '../types';

export class PersonaAI {
  private static readonly TRAIT_DIMENSIONS = [
    'openness',
    'conscientiousness', 
    'extraversion',
    'agreeableness',
    'neuroticism',
    'authenticity',
    'creativity',
    'empathy',
    'curiosity',
    'resilience',
    'introspection',
    'adventure',
    'stability',
    'humor',
    'ambition',
    'spirituality',
    'independence',
    'collaboration',
    'optimism',
    'mindfulness'
  ];

  static async generatePersona(responses: Response[]): Promise<PersonaData> {
    const traits = this.analyzeTraits(responses);
    const insights = this.generateInsights(responses, traits);
    
    return {
      traits,
      insights,
      lastUpdated: new Date().toISOString(),
    };
  }

  private static analyzeTraits(responses: Response[]): Record<string, number> {
    const traits: Record<string, number> = {};
    
    this.TRAIT_DIMENSIONS.forEach(trait => {
      traits[trait] = this.calculateTraitScore(responses, trait);
    });

    return traits;
  }

  private static calculateTraitScore(responses: Response[], trait: string): number {
    let score = 0.5; // Default neutral score
    
    const recentResponses = responses.slice(0, 10);
    
    recentResponses.forEach(response => {
      const content = response.content.toLowerCase();
      const traitScore = this.analyzeTextForTrait(content, trait);
      score = (score + traitScore) / 2; // Running average
    });

    return Math.max(0, Math.min(1, score));
  }

  private static analyzeTextForTrait(text: string, trait: string): number {
    const keywords = this.getTraitKeywords(trait);
    let score = 0.5;
    
    const positiveMatches = keywords.positive.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    const negativeMatches = keywords.negative.filter(keyword => 
      text.includes(keyword)
    ).length;
    
    const totalWords = text.split(' ').length;
    const positiveWeight = positiveMatches / Math.max(totalWords, 1);
    const negativeWeight = negativeMatches / Math.max(totalWords, 1);
    
    score += positiveWeight * 0.3 - negativeWeight * 0.3;
    
    // Analyze sentence structure and emotional tone
    if (text.includes('i feel') || text.includes('i think') || text.includes('i believe')) {
      score += 0.1; // Shows self-awareness
    }
    
    if (text.includes('?')) {
      score += 0.05; // Shows curiosity
    }
    
    return Math.max(0, Math.min(1, score));
  }

  private static getTraitKeywords(trait: string): { positive: string[]; negative: string[] } {
    const keywordMap: Record<string, { positive: string[]; negative: string[] }> = {
      openness: {
        positive: ['creative', 'curious', 'explore', 'new', 'different', 'artistic', 'imagine', 'wonder'],
        negative: ['routine', 'traditional', 'conservative', 'predictable', 'conventional']
      },
      conscientiousness: {
        positive: ['organized', 'plan', 'goal', 'disciplined', 'responsible', 'careful', 'thorough'],
        negative: ['messy', 'disorganized', 'procrastinate', 'lazy', 'careless']
      },
      extraversion: {
        positive: ['social', 'outgoing', 'energetic', 'talkative', 'party', 'people', 'friends'],
        negative: ['quiet', 'reserved', 'shy', 'introverted', 'alone', 'solitary']
      },
      agreeableness: {
        positive: ['kind', 'helpful', 'cooperative', 'trusting', 'empathetic', 'caring', 'compassionate'],
        negative: ['competitive', 'aggressive', 'selfish', 'suspicious', 'hostile']
      },
      neuroticism: {
        positive: ['anxious', 'worried', 'stressed', 'emotional', 'sensitive', 'nervous'],
        negative: ['calm', 'relaxed', 'stable', 'confident', 'resilient', 'composed']
      },
      authenticity: {
        positive: ['genuine', 'real', 'honest', 'true', 'authentic', 'sincere', 'myself'],
        negative: ['fake', 'pretend', 'mask', 'hide', 'dishonest']
      },
      creativity: {
        positive: ['create', 'art', 'music', 'write', 'design', 'innovative', 'original'],
        negative: ['boring', 'conventional', 'unimaginative', 'practical only']
      },
      empathy: {
        positive: ['understand', 'feel', 'others', 'perspective', 'compassion', 'relate'],
        negative: ['indifferent', 'cold', 'unsympathetic', 'detached']
      },
      curiosity: {
        positive: ['wonder', 'question', 'learn', 'discover', 'explore', 'why', 'how'],
        negative: ['uninterested', 'bored', 'indifferent', 'satisfied with knowing']
      },
      resilience: {
        positive: ['overcome', 'bounce back', 'recover', 'persist', 'endure', 'strong'],
        negative: ['give up', 'quit', 'defeated', 'overwhelmed', 'fragile']
      }
    };

    return keywordMap[trait] || { positive: [], negative: [] };
  }

  private static generateInsights(responses: Response[], traits: Record<string, number>): string[] {
    const insights: string[] = [];
    
    // Analyze dominant traits
    const sortedTraits = Object.entries(traits)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);
    
    sortedTraits.forEach(([trait, score]) => {
      if (score > 0.7) {
        insights.push(this.getTraitInsight(trait, 'high'));
      } else if (score < 0.3) {
        insights.push(this.getTraitInsight(trait, 'low'));
      }
    });

    // Analyze patterns in responses
    const recentResponses = responses.slice(0, 5);
    const themes = this.identifyThemes(recentResponses);
    
    themes.forEach(theme => {
      insights.push(`You often reflect on ${theme} in your responses.`);
    });

    // Growth insights
    if (responses.length >= 7) {
      const growthInsight = this.analyzeGrowthPatterns(responses);
      if (growthInsight) {
        insights.push(growthInsight);
      }
    }

    return insights.slice(0, 5); // Limit to 5 insights
  }

  private static getTraitInsight(trait: string, level: 'high' | 'low'): string {
    const insightMap: Record<string, { high: string; low: string }> = {
      openness: {
        high: "You embrace new experiences and value creativity in your daily life.",
        low: "You appreciate routine and find comfort in familiar patterns."
      },
      conscientiousness: {
        high: "You're highly organized and goal-oriented in your approach to life.",
        low: "You prefer flexibility and spontaneity over rigid planning."
      },
      extraversion: {
        high: "You gain energy from social interactions and enjoy being around others.",
        low: "You value quiet reflection and prefer intimate conversations."
      },
      authenticity: {
        high: "Being genuine and true to yourself is a core value you hold.",
        low: "You're still exploring different aspects of your identity."
      },
      empathy: {
        high: "You have a strong ability to understand and connect with others' emotions.",
        low: "You tend to approach situations more logically than emotionally."
      }
    };

    return insightMap[trait]?.[level] || `Your ${trait} score suggests interesting patterns in your responses.`;
  }

  private static identifyThemes(responses: Response[]): string[] {
    const themes: string[] = [];
    const commonThemes = ['relationships', 'growth', 'creativity', 'nature', 'work', 'family', 'dreams', 'challenges'];
    
    commonThemes.forEach(theme => {
      const mentions = responses.filter(r => 
        r.content.toLowerCase().includes(theme) ||
        r.content.toLowerCase().includes(theme.slice(0, -1)) // singular form
      ).length;
      
      if (mentions >= 2) {
        themes.push(theme);
      }
    });

    return themes;
  }

  private static analyzeGrowthPatterns(responses: Response[]): string | null {
    const recentResponses = responses.slice(0, 3);
    const olderResponses = responses.slice(3, 7);
    
    const recentPositivity = this.calculatePositivityScore(recentResponses);
    const olderPositivity = this.calculatePositivityScore(olderResponses);
    
    if (recentPositivity > olderPositivity + 0.2) {
      return "Your recent reflections show increasing positivity and self-awareness.";
    } else if (recentPositivity < olderPositivity - 0.2) {
      return "You've been more introspective and contemplative in your recent responses.";
    }
    
    return null;
  }

  private static calculatePositivityScore(responses: Response[]): number {
    const positiveWords = ['happy', 'joy', 'love', 'excited', 'grateful', 'good', 'great', 'amazing', 'wonderful'];
    const negativeWords = ['sad', 'angry', 'frustrated', 'difficult', 'hard', 'struggle', 'problem', 'worry'];
    
    let score = 0;
    
    responses.forEach(response => {
      const content = response.content.toLowerCase();
      const positiveCount = positiveWords.filter(word => content.includes(word)).length;
      const negativeCount = negativeWords.filter(word => content.includes(word)).length;
      
      score += (positiveCount - negativeCount) / Math.max(content.split(' ').length, 1);
    });
    
    return score / Math.max(responses.length, 1);
  }

  static calculateCompatibility(persona1: PersonaData, persona2: PersonaData): number {
    const traits1 = persona1.traits;
    const traits2 = persona2.traits;
    
    let compatibilityScore = 0;
    let totalWeights = 0;
    
    // Define compatibility weights for different traits
    const compatibilityWeights: Record<string, number> = {
      openness: 0.8,
      conscientiousness: 0.6,
      extraversion: 0.4, // Opposites can attract
      agreeableness: 0.9,
      neuroticism: 0.3, // Inverse relationship
      authenticity: 0.9,
      empathy: 0.8,
      curiosity: 0.7,
      resilience: 0.6,
      humor: 0.7,
    };
    
    Object.entries(compatibilityWeights).forEach(([trait, weight]) => {
      const score1 = traits1[trait] || 0.5;
      const score2 = traits2[trait] || 0.5;
      
      let traitCompatibility;
      if (trait === 'extraversion') {
        // For extraversion, moderate difference can be attractive
        const diff = Math.abs(score1 - score2);
        traitCompatibility = diff > 0.3 && diff < 0.7 ? 0.8 : 0.5;
      } else if (trait === 'neuroticism') {
        // Lower combined neuroticism is better
        traitCompatibility = 1 - ((score1 + score2) / 2);
      } else {
        // For most traits, similarity is good
        traitCompatibility = 1 - Math.abs(score1 - score2);
      }
      
      compatibilityScore += traitCompatibility * weight;
      totalWeights += weight;
    });
    
    return compatibilityScore / totalWeights;
  }
}