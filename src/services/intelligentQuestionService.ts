// @ts-nocheck
import { conversationMemoryService, ConversationContext, ConversationMemory } from './conversationMemoryService';

export interface QuestionWithContext {
  id: string;
  question: string;
  theme: string;
  tone: string;
  emotional_depth: string;
  intended_use_case: string;
  contextScore: number;
  selectionReason: string;
}

export interface QuestionSelectionCriteria {
  avoidRecentThemes: boolean;
  progressiveDepth: boolean;
  emotionalStateAware: boolean;
  topicDiversity: boolean;
  personalGrowthFocus: boolean;
}

const PERSONAL_BACKGROUND_QUESTIONS = [
  {
    id: 'background_origin',
    question: "Where did you grow up, and what about that place still shows up in you today?",
    theme: 'Family & Roots',
    tone: 'warm',
    emotional_depth: 'medium',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_siblings',
    question: 'Were you surrounded by siblings growing up, or were you the solo kid writing your own storyline?',
    theme: 'Family & Roots',
    tone: 'curious',
    emotional_depth: 'low',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_caregivers',
    question: 'Who were the grown-ups steering your household, and what rhythms defined your home life?',
    theme: 'Family & Roots',
    tone: 'reflective',
    emotional_depth: 'medium',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_parents_work',
    question: 'What kinds of work did your parents or caregivers do, and how did that shape what you believed was possible for you?',
    theme: 'Family & Roots',
    tone: 'thoughtful',
    emotional_depth: 'medium',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_parent_relationship',
    question: 'How would you describe the way your parents (or the adults who raised you) relate to each other?',
    theme: 'Family & Roots',
    tone: 'gentle',
    emotional_depth: 'medium',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_tradition',
    question: 'Is there a family ritual or tradition you still find yourself carrying forward?',
    theme: 'Family & Roots',
    tone: 'nostalgic',
    emotional_depth: 'low',
    intended_use_case: 'personal backstory',
  },
  {
    id: 'background_languages',
    question: 'What cultures or languages lived in your home when you were growing up?',
    theme: 'Family & Roots',
    tone: 'inviting',
    emotional_depth: 'medium',
    intended_use_case: 'personal backstory',
  },
];

class IntelligentQuestionService {
  private allQuestions: any[] = [];
  private backgroundSequence: QuestionWithContext[] = PERSONAL_BACKGROUND_QUESTIONS.map((question, index) => ({
    ...question,
    contextScore: 140 - index * 5,
    selectionReason: 'Foundational backstory question to ground the conversation',
  }));
  
  async initialize(): Promise<void> {
    try {
      // Load questions from JSON file
      const questionsData = await import('../data/questions.json');
      const loadedQuestions = questionsData.default || questionsData;
      const existingIds = new Set((loadedQuestions ?? []).map((q: any) => q.id));
      const backgroundForPool = PERSONAL_BACKGROUND_QUESTIONS.filter((question) => !existingIds.has(question.id));
      this.allQuestions = [...loadedQuestions, ...backgroundForPool];
    } catch (error) {
      console.error('Error loading questions:', error);
      this.allQuestions = [...PERSONAL_BACKGROUND_QUESTIONS];
    }
  }

  async selectNextQuestion(
    options: {
      selectionCriteria?: Partial<QuestionSelectionCriteria>;
      preferredTheme?: string;
    } = {}
  ): Promise<QuestionWithContext | null> {
    const { selectionCriteria = {}, preferredTheme } = options;

    if (this.allQuestions.length === 0) {
      await this.initialize();
    }

    const memory = await conversationMemoryService.getConversationMemory();
    const context = await conversationMemoryService.getConversationContext();

    if (!memory || !context) {
      // Return a safe starter question
      return this.getStarterQuestion();
    }

    const askedQuestionIds = new Set(memory.conversationHistory.map((conv) => conv.questionId));
    const nextBackground = this.backgroundSequence.find((question) => !askedQuestionIds.has(question.id));
    if (nextBackground) {
      return nextBackground;
    }

    const defaultCriteria: QuestionSelectionCriteria = {
      avoidRecentThemes: true,
      progressiveDepth: true,
      emotionalStateAware: true,
      topicDiversity: true,
      personalGrowthFocus: true,
      ...selectionCriteria,
    };

    // Filter and score questions
    const scoredQuestions = this.scoreQuestions(memory, context, defaultCriteria).map((question) => {
      if (!preferredTheme) {
        return question;
      }

      const normalizedTheme = preferredTheme.toLowerCase();
      const questionTheme = (question.theme || '').toLowerCase();

      if (questionTheme.includes(normalizedTheme)) {
        return {
          ...question,
          contextScore: question.contextScore + 35,
        };
      }

      return {
        ...question,
        contextScore: question.contextScore - 10,
      };
    });

    if (scoredQuestions.length === 0) {
      return this.getStarterQuestion();
    }

    // Select question with weighted randomness (higher scores more likely)
    const selectedQuestion = this.weightedRandomSelection(scoredQuestions);
    
    return selectedQuestion;
  }

  private scoreQuestions(
    memory: ConversationMemory,
    context: ConversationContext,
    criteria: QuestionSelectionCriteria
  ): QuestionWithContext[] {
    const askedQuestions = new Set(memory.conversationHistory.map(conv => conv.questionId));
    
    return this.allQuestions
      .filter(q => !askedQuestions.has(q.id))
      .map(question => this.scoreQuestion(question, memory, context, criteria))
      .filter(q => q.contextScore > 0)
      .sort((a, b) => b.contextScore - a.contextScore);
  }

  private scoreQuestion(
    question: any,
    memory: ConversationMemory,
    context: ConversationContext,
    criteria: QuestionSelectionCriteria
  ): QuestionWithContext {
    let score = 50; // Base score
    let reasons: string[] = [];

    // Progressive depth scoring
    if (criteria.progressiveDepth) {
      const depthScore = this.calculateDepthScore(question, context);
      score += depthScore.score;
      if (depthScore.reason) reasons.push(depthScore.reason);
    }

    // Emotional state awareness
    if (criteria.emotionalStateAware) {
      const emotionScore = this.calculateEmotionalScore(question, context);
      score += emotionScore.score;
      if (emotionScore.reason) reasons.push(emotionScore.reason);
    }

    // Topic diversity
    if (criteria.topicDiversity) {
      const diversityScore = this.calculateDiversityScore(question, memory, context);
      score += diversityScore.score;
      if (diversityScore.reason) reasons.push(diversityScore.reason);
    }

    // Recent theme avoidance
    if (criteria.avoidRecentThemes) {
      const recencyScore = this.calculateRecencyScore(question, memory);
      score += recencyScore.score;
      if (recencyScore.reason) reasons.push(recencyScore.reason);
    }

    // Personal growth focus
    if (criteria.personalGrowthFocus) {
      const growthScore = this.calculateGrowthScore(question, memory);
      score += growthScore.score;
      if (growthScore.reason) reasons.push(growthScore.reason);
    }

    // Conversation flow continuity
    const flowScore = this.calculateFlowScore(question, memory, context);
    score += flowScore.score;
    if (flowScore.reason) reasons.push(flowScore.reason);

    return {
      id: question.id || `q_${Math.random().toString(36).substr(2, 9)}`,
      question: question.question,
      theme: question.theme,
      tone: question.tone,
      emotional_depth: question.emotional_depth,
      intended_use_case: question.intended_use_case,
      contextScore: Math.max(0, score),
      selectionReason: reasons.join('; ')
    };
  }

  private calculateDepthScore(
    question: any,
    context: ConversationContext
  ): { score: number; reason?: string } {
    const userDepth = context.conversationDepth;
    const questionDepth = this.getQuestionDepthValue(question.emotional_depth);
    
    // Perfect match gets highest score
    if (Math.abs(userDepth - questionDepth) < 1) {
      return { score: 20, reason: 'Perfect depth match for current conversation level' };
    }
    
    // Slightly deeper questions are good for growth
    if (questionDepth === userDepth + 1) {
      return { score: 15, reason: 'Slightly deeper question to encourage growth' };
    }
    
    // Too deep too fast
    if (questionDepth > userDepth + 2) {
      return { score: -20, reason: 'Too deep for current conversation level' };
    }
    
    // Too shallow
    if (questionDepth < userDepth - 1) {
      return { score: -10, reason: 'Too shallow for current depth' };
    }
    
    return { score: 0 };
  }

  private getQuestionDepthValue(depth: string): number {
    switch (depth) {
      case 'low': return 2;
      case 'medium': return 5;
      case 'high': return 8;
      default: return 5;
    }
  }

  private calculateEmotionalScore(
    question: any,
    context: ConversationContext
  ): { score: number; reason?: string } {
    const userEmotion = context.emotionalState;
    const questionTone = question.tone;
    
    // If user is vulnerable, offer supportive tones
    if (userEmotion === 'vulnerable') {
      if (['gentle', 'supportive', 'understanding'].includes(questionTone)) {
        return { score: 15, reason: 'Gentle tone appropriate for vulnerable state' };
      }
      if (['challenging', 'intense'].includes(questionTone)) {
        return { score: -15, reason: 'Too challenging for current emotional state' };
      }
    }
    
    // If user is excited, can handle more energy
    if (userEmotion === 'excited') {
      if (['curious', 'playful', 'engaging'].includes(questionTone)) {
        return { score: 10, reason: 'Engaging tone matches excited energy' };
      }
    }
    
    // If user is negative, be more careful
    if (userEmotion === 'negative') {
      if (['hopeful', 'gentle', 'reflective'].includes(questionTone)) {
        return { score: 12, reason: 'Supportive tone for difficult emotions' };
      }
    }
    
    return { score: 0 };
  }

  private calculateDiversityScore(
    question: any,
    memory: ConversationMemory,
    context: ConversationContext
  ): { score: number; reason?: string } {
    const questionTheme = question.theme;
    const recentThemes = Object.keys(memory.conversationThemes);
    
    // Encourage theme diversity
    if (!recentThemes.includes(questionTheme)) {
      return { score: 15, reason: 'Introduces new theme for variety' };
    }
    
    // If theme was discussed but not recently, it's okay
    const themeFrequency = memory.conversationThemes[questionTheme] || 0;
    const totalConversations = memory.totalConversations;
    
    if (themeFrequency / totalConversations < 0.3) {
      return { score: 5, reason: 'Theme not overused, good for exploration' };
    }
    
    // Heavily used themes get lower scores
    if (themeFrequency / totalConversations > 0.5) {
      return { score: -10, reason: 'Theme heavily used recently' };
    }
    
    return { score: 0 };
  }

  private calculateRecencyScore(
    question: any,
    memory: ConversationMemory
  ): { score: number; reason?: string } {
    const recentConversations = memory.conversationHistory
      .slice(-5); // Last 5 conversations
    
    const recentThemes = recentConversations.map(conv => conv.theme);
    const questionTheme = question.theme;
    
    // Avoid themes from last 3 conversations
    const lastThreeThemes = recentThemes.slice(-3);
    if (lastThreeThemes.includes(questionTheme)) {
      return { score: -15, reason: 'Theme used very recently' };
    }
    
    // Avoid themes from last 5 conversations but less penalty
    if (recentThemes.includes(questionTheme)) {
      return { score: -5, reason: 'Theme used recently' };
    }
    
    return { score: 10, reason: 'Theme not used recently' };
  }

  private calculateGrowthScore(
    question: any,
    memory: ConversationMemory
  ): { score: number; reason?: string } {
    const questionText = question.question.toLowerCase();
    const userTopics = Object.keys(memory.topicFrequency);
    
    // Growth-oriented questions get bonuses
    if (questionText.includes('learn') || questionText.includes('grow') || 
        questionText.includes('develop') || questionText.includes('change')) {
      return { score: 8, reason: 'Promotes personal growth' };
    }
    
    // Questions that explore user's established interests
    const userInterests = userTopics.filter(topic => 
      memory.topicFrequency[topic] > 1
    );
    
    for (const interest of userInterests) {
      if (questionText.includes(interest)) {
        return { score: 5, reason: `Builds on your interest in ${interest}` };
      }
    }
    
    return { score: 0 };
  }

  private calculateFlowScore(
    question: any,
    memory: ConversationMemory,
    context: ConversationContext
  ): { score: number; reason?: string } {
    if (memory.conversationHistory.length === 0) {
      // First question should be welcoming
      if (question.emotional_depth === 'low' || question.emotional_depth === 'medium') {
        return { score: 10, reason: 'Good starter question' };
      }
      return { score: -5, reason: 'Too intense for first question' };
    }
    
    const lastConversation = memory.conversationHistory[memory.conversationHistory.length - 1];
    
    // If last conversation was vulnerable, follow up thoughtfully
    if (lastConversation.emotionalTone === 'vulnerable') {
      if (question.tone === 'gentle' || question.tone === 'supportive') {
        return { score: 12, reason: 'Supportive follow-up to vulnerable sharing' };
      }
    }
    
    // If last conversation was exciting, can explore that energy
    if (lastConversation.emotionalTone === 'excited') {
      if (question.tone === 'curious' || question.tone === 'engaging') {
        return { score: 8, reason: 'Builds on positive energy' };
      }
    }
    
    return { score: 0 };
  }

  private weightedRandomSelection(questions: QuestionWithContext[]): QuestionWithContext {
    // Take top 5 highest scoring questions for weighted selection
    const topQuestions = questions.slice(0, 5);
    
    if (topQuestions.length === 1) {
      return topQuestions[0];
    }
    
    // Create weighted array
    const weights = topQuestions.map(q => Math.max(1, q.contextScore));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let randomNum = Math.random() * totalWeight;
    
    for (let i = 0; i < topQuestions.length; i++) {
      randomNum -= weights[i];
      if (randomNum <= 0) {
        return topQuestions[i];
      }
    }
    
    // Fallback to first question
    return topQuestions[0];
  }

  private getStarterQuestion(): QuestionWithContext {
    const starterQuestions: QuestionWithContext[] = [
      this.backgroundSequence[0],
      {
        id: 'starter_values',
        question: "What's one thing about you that tends to surprise people once they get to know you?",
        theme: 'Self-Discovery',
        tone: 'curious',
        emotional_depth: 'medium',
        intended_use_case: 'conversation starter',
        contextScore: 110,
        selectionReason: 'Engaging opener to reveal personality',
      },
    ].filter(Boolean) as QuestionWithContext[];

    return starterQuestions[Math.floor(Math.random() * starterQuestions.length)];
  }

  async getQuestionWithMemoryContext(
    questionId: string,
    options: {
      preferredTheme?: string;
      selectionCriteria?: Partial<QuestionSelectionCriteria>;
    } = {}
  ): Promise<{
    question: QuestionWithContext;
    memoryReference?: string;
    conversationLeadIn: string;
  } | null> {
    const question = await this.selectNextQuestion({
      preferredTheme: options.preferredTheme,
      selectionCriteria: options.selectionCriteria,
    });
    if (!question) return null;
    
    const memory = await conversationMemoryService.getConversationMemory();
    const context = await conversationMemoryService.getConversationContext();
    
    if (!memory || !context) {
      return {
        question,
        conversationLeadIn: "I'd love to know:"
      };
    }
    
    // Generate memory reference if appropriate
    const memoryReference = await conversationMemoryService.generateMemoryReference();
    
    // Generate contextual lead-in
    const leadIn = this.generateConversationLeadIn(question, memory, context);
    
    return {
      question,
      memoryReference,
      conversationLeadIn: leadIn
    };
  }

  private generateConversationLeadIn(
    question: QuestionWithContext,
    memory: ConversationMemory,
    context: ConversationContext
  ): string {
    const conversationCount = memory.totalConversations;
    
    // First conversation
    if (conversationCount === 0) {
      const starters = [
        "Let me start with something I'm genuinely curious about:",
        "Here's what I'm wondering about you:",
        "I'd love to know:"
      ];
      return starters[Math.floor(Math.random() * starters.length)];
    }
    
    // Based on emotional state
    if (context.emotionalState === 'vulnerable') {
      const supportive = [
        "I appreciate you being so open. This makes me wonder:",
        "Thank you for sharing that. I'm curious:",
        "Building on that courage:"
      ];
      return supportive[Math.floor(Math.random() * supportive.length)];
    }
    
    if (context.emotionalState === 'excited') {
      const energetic = [
        "I love that energy! This makes me think:",
        "Your enthusiasm is infectious. I'm curious:",
        "Building on that excitement:"
      ];
      return energetic[Math.floor(Math.random() * energetic.length)];
    }
    
    // Theme transitions
    const lastTheme = memory.conversationHistory[memory.conversationHistory.length - 1]?.theme;
    if (lastTheme && lastTheme !== question.theme) {
      const transitions = [
        "Speaking of that, this makes me think of something else:",
        "That's fascinating. On a slightly different note:",
        "You know what else I'm curious about?",
        "That reminds me of something I wanted to ask:"
      ];
      return transitions[Math.floor(Math.random() * transitions.length)];
    }
    
    // Same theme continuation
    const continuations = [
      "Building on that:",
      "That's interesting! Related to that:",
      "I'm curious to explore this further:",
      "That makes me wonder:"
    ];
    return continuations[Math.floor(Math.random() * continuations.length)];
  }

  async getQuestionAnalytics(): Promise<{
    totalQuestions: number;
    questionsAsked: number;
    questionsRemaining: number;
    themeDistribution: { [theme: string]: number };
    depthDistribution: { [depth: string]: number };
  }> {
    const memory = await conversationMemoryService.getConversationMemory();
    
    if (!memory) {
      return {
        totalQuestions: this.allQuestions.length,
        questionsAsked: 0,
        questionsRemaining: this.allQuestions.length,
        themeDistribution: {},
        depthDistribution: {}
      };
    }
    
    const askedQuestionIds = new Set(memory.conversationHistory.map(conv => conv.questionId));
    
    const themeDistribution: { [theme: string]: number } = {};
    const depthDistribution: { [depth: string]: number } = {};
    
    this.allQuestions.forEach(q => {
      themeDistribution[q.theme] = (themeDistribution[q.theme] || 0) + 1;
      depthDistribution[q.emotional_depth] = (depthDistribution[q.emotional_depth] || 0) + 1;
    });
    
    return {
      totalQuestions: this.allQuestions.length,
      questionsAsked: askedQuestionIds.size,
      questionsRemaining: this.allQuestions.length - askedQuestionIds.size,
      themeDistribution,
      depthDistribution
    };
  }
}

export const intelligentQuestionService = new IntelligentQuestionService();
