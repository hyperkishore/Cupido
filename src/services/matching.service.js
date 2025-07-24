// Advanced Matching Algorithm for Cupido
// Uses reflection embeddings, personality analysis, and behavioral patterns

import { supabase } from './supabase.service';

export class MatchingAlgorithm {
  constructor() {
    this.weights = {
      personalityMatch: 0.30,
      valuesAlignment: 0.35,
      interestsOverlap: 0.20,
      communicationStyle: 0.10,
      activityPattern: 0.05
    };
  }

  // Main matching function
  async findCompatibleMatches(userId, options = {}) {
    const {
      limit = 10,
      minScore = 0.7,
      maxDistance = 50, // km
      ageRange = { min: 18, max: 100 }
    } = options;

    try {
      // Get user data and preferences
      const userData = await this.getUserMatchingData(userId);
      if (!userData) throw new Error('User data not found');

      // Get potential candidates
      const candidates = await this.getCandidates(userId, userData.preferences);
      
      // Calculate compatibility scores
      const scoredMatches = await Promise.all(
        candidates.map(async (candidate) => {
          const score = await this.calculateCompatibility(userData, candidate);
          return {
            ...candidate,
            compatibilityScore: score.total,
            matchReasons: score.reasons,
            commonalities: score.commonalities
          };
        })
      );

      // Filter and sort matches
      const filteredMatches = scoredMatches
        .filter(match => match.compatibilityScore >= minScore)
        .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
        .slice(0, limit);

      // Create match records
      await this.createMatchRecords(userId, filteredMatches);

      return filteredMatches;
    } catch (error) {
      console.error('Matching error:', error);
      throw error;
    }
  }

  // Get comprehensive user data for matching
  async getUserMatchingData(userId) {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        preferences:user_preferences(*),
        reflections(
          id,
          question_id,
          answer,
          answer_embedding,
          authenticity_score,
          keywords,
          topics,
          sentiment,
          word_count,
          questions(category, subcategory)
        )
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    // Process reflections into categories
    const reflectionsByCategory = this.categorizeReflections(user.reflections);
    
    return {
      ...user,
      reflectionsByCategory,
      avgAuthenticityScore: this.calculateAvgAuthenticity(user.reflections),
      communicationStyle: this.analyzeCommunicationStyle(user.reflections)
    };
  }

  // Get potential match candidates
  async getCandidates(userId, preferences) {
    let query = supabase
      .from('users')
      .select(`
        *,
        preferences:user_preferences(*),
        reflections(
          id,
          answer_embedding,
          authenticity_score,
          keywords,
          topics,
          sentiment,
          word_count,
          questions(category)
        )
      `)
      .neq('id', userId)
      .eq('is_banned', false)
      .eq('profile_complete', true);

    // Apply preference filters
    if (preferences) {
      if (preferences.gender_preference) {
        query = query.eq('gender', preferences.gender_preference);
      }
      if (preferences.min_age && preferences.max_age) {
        query = query.gte('age', preferences.min_age)
                     .lte('age', preferences.max_age);
      }
    }

    // Exclude already matched or blocked users
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    const excludedIds = existingMatches?.flatMap(m => 
      [m.user1_id, m.user2_id].filter(id => id !== userId)
    ) || [];

    if (excludedIds.length > 0) {
      query = query.not('id', 'in', `(${excludedIds.join(',')})`);
    }

    const { data, error } = await query.limit(100);
    if (error) throw error;

    return data || [];
  }

  // Calculate compatibility between two users
  async calculateCompatibility(user1, user2) {
    const scores = {
      personality: await this.calculatePersonalityMatch(user1, user2),
      values: await this.calculateValuesAlignment(user1, user2),
      interests: await this.calculateInterestsOverlap(user1, user2),
      communication: this.calculateCommunicationMatch(user1, user2),
      activity: this.calculateActivityMatch(user1, user2)
    };

    // Calculate weighted total
    const total = Object.entries(this.weights).reduce((sum, [key, weight]) => {
      const scoreKey = key.replace('Match', '').replace('Alignment', '').replace('Overlap', '').toLowerCase();
      return sum + (scores[scoreKey] || 0) * weight;
    }, 0);

    // Find commonalities
    const commonalities = await this.findCommonalities(user1, user2);

    // Generate match reasons
    const reasons = this.generateMatchReasons(scores, commonalities);

    return {
      total,
      scores,
      commonalities,
      reasons
    };
  }

  // Calculate personality match using embeddings
  async calculatePersonalityMatch(user1, user2) {
    if (!user1.personality_vector || !user2.personality_vector) {
      // Fallback: analyze from reflections
      return this.analyzePersonalityFromReflections(user1, user2);
    }

    // Calculate cosine similarity
    return this.cosineSimilarity(user1.personality_vector, user2.personality_vector);
  }

  // Calculate values alignment from reflections
  async calculateValuesAlignment(user1, user2) {
    const valueCategories = ['Values', 'Beliefs', 'Life Philosophy'];
    
    const user1Values = user1.reflections?.filter(r => 
      valueCategories.includes(r.questions?.category)
    ) || [];
    
    const user2Values = user2.reflections?.filter(r => 
      valueCategories.includes(r.questions?.category)
    ) || [];

    if (user1Values.length === 0 || user2Values.length === 0) {
      return 0.5; // Neutral score if no data
    }

    // Compare embeddings of value-related answers
    let totalSimilarity = 0;
    let comparisons = 0;

    for (const r1 of user1Values) {
      for (const r2 of user2Values) {
        if (r1.answer_embedding && r2.answer_embedding) {
          totalSimilarity += this.cosineSimilarity(
            r1.answer_embedding,
            r2.answer_embedding
          );
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? totalSimilarity / comparisons : 0.5;
  }

  // Calculate interests overlap
  async calculateInterestsOverlap(user1, user2) {
    // Extract interests from topics and keywords
    const user1Interests = new Set([
      ...(user1.preferences?.interests || []),
      ...(user1.reflections?.flatMap(r => r.topics || []) || [])
    ]);

    const user2Interests = new Set([
      ...(user2.preferences?.interests || []),
      ...(user2.reflections?.flatMap(r => r.topics || []) || [])
    ]);

    if (user1Interests.size === 0 || user2Interests.size === 0) {
      return 0.5;
    }

    // Calculate Jaccard similarity
    const intersection = new Set([...user1Interests].filter(x => user2Interests.has(x)));
    const union = new Set([...user1Interests, ...user2Interests]);

    return intersection.size / union.size;
  }

  // Calculate communication style match
  calculateCommunicationMatch(user1, user2) {
    const style1 = user1.communicationStyle || this.analyzeCommunicationStyle(user1.reflections);
    const style2 = user2.communicationStyle || this.analyzeCommunicationStyle(user2.reflections);

    // Compare average word counts
    const wordCountDiff = Math.abs(style1.avgWordCount - style2.avgWordCount);
    const wordCountScore = 1 - Math.min(wordCountDiff / 100, 1);

    // Compare response patterns
    const frequencyScore = 1 - Math.abs(style1.responseFrequency - style2.responseFrequency) / 10;

    // Compare depth (authenticity scores)
    const depthScore = 1 - Math.abs(style1.avgDepth - style2.avgDepth) / 100;

    return (wordCountScore + frequencyScore + depthScore) / 3;
  }

  // Calculate activity pattern match
  calculateActivityMatch(user1, user2) {
    // Simple time-based matching for now
    const lastActive1 = new Date(user1.last_active);
    const lastActive2 = new Date(user2.last_active);
    const daysDiff = Math.abs(lastActive1 - lastActive2) / (1000 * 60 * 60 * 24);

    return Math.max(0, 1 - daysDiff / 30); // Decay over 30 days
  }

  // Helper: Analyze communication style from reflections
  analyzeCommunicationStyle(reflections) {
    if (!reflections || reflections.length === 0) {
      return {
        avgWordCount: 50,
        responseFrequency: 5,
        avgDepth: 70
      };
    }

    const totalWords = reflections.reduce((sum, r) => sum + (r.word_count || 0), 0);
    const avgWordCount = totalWords / reflections.length;
    
    const totalAuthenticity = reflections.reduce((sum, r) => sum + (r.authenticity_score || 0), 0);
    const avgDepth = totalAuthenticity / reflections.length;

    return {
      avgWordCount,
      responseFrequency: reflections.length,
      avgDepth
    };
  }

  // Helper: Categorize reflections
  categorizeReflections(reflections) {
    const categories = {};
    
    reflections?.forEach(r => {
      const category = r.questions?.category || 'Other';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(r);
    });

    return categories;
  }

  // Helper: Calculate average authenticity
  calculateAvgAuthenticity(reflections) {
    if (!reflections || reflections.length === 0) return 0;
    
    const total = reflections.reduce((sum, r) => sum + (r.authenticity_score || 0), 0);
    return total / reflections.length;
  }

  // Helper: Find commonalities between users
  async findCommonalities(user1, user2) {
    const commonalities = {
      interests: [],
      values: [],
      topics: [],
      locations: []
    };

    // Common interests
    const interests1 = new Set(user1.preferences?.interests || []);
    const interests2 = new Set(user2.preferences?.interests || []);
    commonalities.interests = [...interests1].filter(i => interests2.has(i));

    // Common topics from reflections
    const topics1 = new Set(user1.reflections?.flatMap(r => r.topics || []) || []);
    const topics2 = new Set(user2.reflections?.flatMap(r => r.topics || []) || []);
    commonalities.topics = [...topics1].filter(t => topics2.has(t));

    // Location proximity
    if (user1.city === user2.city) {
      commonalities.locations.push(user1.city);
    } else if (user1.country === user2.country) {
      commonalities.locations.push(user1.country);
    }

    return commonalities;
  }

  // Generate human-readable match reasons
  generateMatchReasons(scores, commonalities) {
    const reasons = [];

    // High-level compatibility
    if (scores.personality > 0.8) {
      reasons.push("Your personalities are highly compatible");
    }
    if (scores.values > 0.8) {
      reasons.push("You share similar values and beliefs");
    }
    if (scores.interests > 0.7) {
      reasons.push("You have many common interests");
    }
    if (scores.communication > 0.8) {
      reasons.push("Your communication styles align well");
    }

    // Specific commonalities
    if (commonalities.interests.length > 0) {
      reasons.push(`Both interested in: ${commonalities.interests.slice(0, 3).join(', ')}`);
    }
    if (commonalities.topics.length > 0) {
      reasons.push(`You both reflect on: ${commonalities.topics.slice(0, 2).join(', ')}`);
    }
    if (commonalities.locations.length > 0) {
      reasons.push(`Located in ${commonalities.locations[0]}`);
    }

    return reasons;
  }

  // Create match records in database
  async createMatchRecords(userId, matches) {
    const matchRecords = matches.map(match => ({
      user1_id: userId,
      user2_id: match.id,
      compatibility_score: match.compatibilityScore,
      match_reasons: match.matchReasons,
      common_interests: match.commonalities.interests,
      common_values: match.commonalities.topics,
      status: 'pending',
      created_at: new Date().toISOString()
    }));

    if (matchRecords.length > 0) {
      const { error } = await supabase
        .from('matches')
        .insert(matchRecords);
      
      if (error) console.error('Error creating match records:', error);
    }
  }

  // Helper: Cosine similarity calculation
  cosineSimilarity(vec1, vec2) {
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0.5;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2);
  }

  // Fallback personality analysis from reflections
  async analyzePersonalityFromReflections(user1, user2) {
    // Analyze sentiment patterns
    const sentiment1 = this.analyzeSentimentPattern(user1.reflections);
    const sentiment2 = this.analyzeSentimentPattern(user2.reflections);

    // Compare emotional expression
    const emotionalDiff = Math.abs(sentiment1.positivity - sentiment2.positivity);
    const emotionalScore = 1 - Math.min(emotionalDiff, 1);

    // Compare openness (based on personal category responses)
    const openness1 = this.calculateOpenness(user1.reflections);
    const openness2 = this.calculateOpenness(user2.reflections);
    const opennessDiff = Math.abs(openness1 - openness2);
    const opennessScore = 1 - Math.min(opennessDiff, 1);

    return (emotionalScore + opennessScore) / 2;
  }

  // Helper: Analyze sentiment patterns
  analyzeSentimentPattern(reflections) {
    if (!reflections || reflections.length === 0) {
      return { positivity: 0.5, consistency: 0.5 };
    }

    const sentiments = reflections
      .map(r => r.sentiment?.score || 0.5)
      .filter(s => s !== null);

    const avgSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;
    
    return {
      positivity: avgSentiment,
      consistency: 1 - this.standardDeviation(sentiments)
    };
  }

  // Helper: Calculate openness from reflections
  calculateOpenness(reflections) {
    const personalReflections = reflections?.filter(r => 
      ['Personal Growth', 'Vulnerability', 'Emotions'].includes(r.questions?.category)
    ) || [];

    if (personalReflections.length === 0) return 0.5;

    // Higher authenticity in personal categories indicates openness
    const avgAuthenticity = personalReflections.reduce(
      (sum, r) => sum + (r.authenticity_score || 0), 0
    ) / personalReflections.length;

    return avgAuthenticity / 100;
  }

  // Helper: Standard deviation
  standardDeviation(values) {
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
  }
}

// Export singleton instance
export const matchingAlgorithm = new MatchingAlgorithm();

// Conversation starter generator
export const generateConversationStarters = (match) => {
  const starters = [];

  // Based on common interests
  if (match.commonalities?.interests?.length > 0) {
    starters.push(
      `I noticed we both enjoy ${match.commonalities.interests[0]}. What got you into it?`,
      `How long have you been interested in ${match.commonalities.interests[0]}?`
    );
  }

  // Based on reflection topics
  if (match.commonalities?.topics?.length > 0) {
    starters.push(
      `I saw we both reflect on ${match.commonalities.topics[0]}. What's your take on it?`,
      `${match.commonalities.topics[0]} seems important to both of us. What draws you to think about it?`
    );
  }

  // Based on location
  if (match.commonalities?.locations?.length > 0) {
    starters.push(
      `What's your favorite thing about living in ${match.commonalities.locations[0]}?`,
      `How long have you been in ${match.commonalities.locations[0]}?`
    );
  }

  // Generic thoughtful starters
  starters.push(
    "What's been the highlight of your week so far?",
    "What's something you're looking forward to?",
    "What kind of conversations do you enjoy most?"
  );

  return starters.slice(0, 5); // Return top 5
};

export default matchingAlgorithm;