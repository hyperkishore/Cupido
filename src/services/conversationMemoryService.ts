import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ConversationEntry {
  id: string;
  questionId: string;
  questionText: string;
  answerText: string;
  category: string;
  theme: string;
  timestamp: string;
  voiceUsed: boolean;
  emotionalTone: 'positive' | 'neutral' | 'negative' | 'vulnerable' | 'excited';
  wordCount: number;
  keyTopics: string[];
  insights: string[];
}

export interface ConversationMemory {
  totalConversations: number;
  firstConversationDate: string;
  lastConversationDate: string;
  conversationHistory: ConversationEntry[];
  topicFrequency: { [topic: string]: number };
  emotionalPatterns: { [emotion: string]: number };
  conversationThemes: { [theme: string]: number };
  growthMilestones: GrowthMilestone[];
}

export interface GrowthMilestone {
  id: string;
  type: 'depth' | 'vulnerability' | 'consistency' | 'insight' | 'connection';
  title: string;
  description: string;
  achievedDate: string;
  conversationId: string;
}

export interface ConversationContext {
  recentTopics: string[];
  emotionalState: string;
  conversationDepth: number;
  preferredQuestionTypes: string[];
  avoidedTopics: string[];
  lastMentioned: { [topic: string]: string }; // topic -> last mentioned date
}

class ConversationMemoryService {
  private storageKey = 'conversation_memory';
  private contextKey = 'conversation_context';
  private memory: ConversationMemory | null = null;
  private context: ConversationContext | null = null;

  async initialize(): Promise<void> {
    try {
      // Load conversation memory
      const storedMemory = await AsyncStorage.getItem(this.storageKey);
      if (storedMemory) {
        this.memory = JSON.parse(storedMemory);
      } else {
        this.memory = this.createInitialMemory();
        await this.saveMemory();
      }

      // Load conversation context
      const storedContext = await AsyncStorage.getItem(this.contextKey);
      if (storedContext) {
        this.context = JSON.parse(storedContext);
      } else {
        this.context = this.createInitialContext();
        await this.saveContext();
      }
    } catch (error) {
      console.error('Error initializing conversation memory:', error);
      this.memory = this.createInitialMemory();
      this.context = this.createInitialContext();
    }
  }

  private createInitialMemory(): ConversationMemory {
    return {
      totalConversations: 0,
      firstConversationDate: new Date().toISOString(),
      lastConversationDate: new Date().toISOString(),
      conversationHistory: [],
      topicFrequency: {},
      emotionalPatterns: {},
      conversationThemes: {},
      growthMilestones: []
    };
  }

  private createInitialContext(): ConversationContext {
    return {
      recentTopics: [],
      emotionalState: 'neutral',
      conversationDepth: 0,
      preferredQuestionTypes: [],
      avoidedTopics: [],
      lastMentioned: {}
    };
  }

  async addConversation(
    questionId: string,
    questionText: string,
    answerText: string,
    category: string,
    theme: string,
    voiceUsed: boolean
  ): Promise<ConversationEntry> {
    if (!this.memory || !this.context) {
      await this.initialize();
    }

    const conversationEntry: ConversationEntry = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      questionId,
      questionText,
      answerText,
      category,
      theme,
      timestamp: new Date().toISOString(),
      voiceUsed,
      emotionalTone: this.analyzeEmotionalTone(answerText),
      wordCount: answerText.split(' ').length,
      keyTopics: this.extractKeyTopics(answerText),
      insights: this.generateInsights(answerText, questionText)
    };

    // Add to memory
    this.memory!.conversationHistory.push(conversationEntry);
    this.memory!.totalConversations += 1;
    this.memory!.lastConversationDate = conversationEntry.timestamp;

    // Update frequency tracking
    this.updateTopicFrequency(conversationEntry.keyTopics);
    this.updateEmotionalPatterns(conversationEntry.emotionalTone);
    this.updateThemeFrequency(theme);

    // Update context
    this.updateConversationContext(conversationEntry);

    // Check for growth milestones
    await this.checkGrowthMilestones(conversationEntry);

    // Save to storage
    await this.saveMemory();
    await this.saveContext();

    return conversationEntry;
  }

  private analyzeEmotionalTone(text: string): ConversationEntry['emotionalTone'] {
    const lowerText = text.toLowerCase();
    
    // Vulnerable indicators
    if (lowerText.includes('difficult') || lowerText.includes('struggle') || 
        lowerText.includes('hard') || lowerText.includes('challenge') ||
        lowerText.includes('vulnerable') || lowerText.includes('scared')) {
      return 'vulnerable';
    }
    
    // Excited indicators
    if (lowerText.includes('excited') || lowerText.includes('amazing') ||
        lowerText.includes('love') || lowerText.includes('passionate') ||
        lowerText.includes('incredible') || lowerText.includes('wonderful')) {
      return 'excited';
    }
    
    // Positive indicators
    if (lowerText.includes('happy') || lowerText.includes('good') ||
        lowerText.includes('great') || lowerText.includes('positive') ||
        lowerText.includes('enjoy') || lowerText.includes('appreciate')) {
      return 'positive';
    }
    
    // Negative indicators
    if (lowerText.includes('sad') || lowerText.includes('frustrated') ||
        lowerText.includes('angry') || lowerText.includes('disappointed') ||
        lowerText.includes('upset') || lowerText.includes('worried')) {
      return 'negative';
    }
    
    return 'neutral';
  }

  private extractKeyTopics(text: string): string[] {
    const topics: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Family-related topics
    if (lowerText.includes('family') || lowerText.includes('parent') || 
        lowerText.includes('mother') || lowerText.includes('father') ||
        lowerText.includes('sibling') || lowerText.includes('brother') ||
        lowerText.includes('sister')) {
      topics.push('family');
    }
    
    // Work/Career topics
    if (lowerText.includes('work') || lowerText.includes('job') ||
        lowerText.includes('career') || lowerText.includes('professional') ||
        lowerText.includes('colleague') || lowerText.includes('boss')) {
      topics.push('career');
    }
    
    // Relationship topics
    if (lowerText.includes('relationship') || lowerText.includes('partner') ||
        lowerText.includes('friend') || lowerText.includes('love') ||
        lowerText.includes('dating') || lowerText.includes('romantic')) {
      topics.push('relationships');
    }
    
    // Personal growth topics
    if (lowerText.includes('learn') || lowerText.includes('grow') ||
        lowerText.includes('change') || lowerText.includes('improve') ||
        lowerText.includes('develop') || lowerText.includes('better')) {
      topics.push('personal_growth');
    }
    
    // Creative topics
    if (lowerText.includes('creative') || lowerText.includes('art') ||
        lowerText.includes('music') || lowerText.includes('write') ||
        lowerText.includes('design') || lowerText.includes('paint')) {
      topics.push('creativity');
    }
    
    // Values topics
    if (lowerText.includes('value') || lowerText.includes('believe') ||
        lowerText.includes('important') || lowerText.includes('principle') ||
        lowerText.includes('moral') || lowerText.includes('ethics')) {
      topics.push('values');
    }
    
    return topics;
  }

  private generateInsights(answerText: string, questionText: string): string[] {
    const insights: string[] = [];
    const lowerAnswer = answerText.toLowerCase();
    const wordCount = answerText.split(' ').length;
    
    if (wordCount > 50) {
      insights.push('Demonstrates deep thoughtfulness and introspection');
    }
    
    if (lowerAnswer.includes('i think') || lowerAnswer.includes('i believe') ||
        lowerAnswer.includes('in my opinion')) {
      insights.push('Shows strong self-awareness and personal conviction');
    }
    
    if (lowerAnswer.includes('other') || lowerAnswer.includes('people') ||
        lowerAnswer.includes('everyone')) {
      insights.push('Displays empathy and consideration for others');
    }
    
    if (lowerAnswer.includes('because') || lowerAnswer.includes('reason') ||
        lowerAnswer.includes('why')) {
      insights.push('Provides thoughtful reasoning and logical thinking');
    }
    
    return insights;
  }

  private updateTopicFrequency(topics: string[]): void {
    if (!this.memory) return;
    
    topics.forEach(topic => {
      this.memory!.topicFrequency[topic] = (this.memory!.topicFrequency[topic] || 0) + 1;
    });
  }

  private updateEmotionalPatterns(emotion: string): void {
    if (!this.memory) return;
    
    this.memory.emotionalPatterns[emotion] = (this.memory.emotionalPatterns[emotion] || 0) + 1;
  }

  private updateThemeFrequency(theme: string): void {
    if (!this.memory) return;
    
    this.memory.conversationThemes[theme] = (this.memory.conversationThemes[theme] || 0) + 1;
  }

  private updateConversationContext(entry: ConversationEntry): void {
    if (!this.context) return;
    
    // Update recent topics (keep last 10)
    entry.keyTopics.forEach(topic => {
      if (!this.context!.recentTopics.includes(topic)) {
        this.context!.recentTopics.unshift(topic);
      }
    });
    this.context.recentTopics = this.context.recentTopics.slice(0, 10);
    
    // Update emotional state
    this.context.emotionalState = entry.emotionalTone;
    
    // Update conversation depth (based on word count and emotional tone)
    const depthScore = entry.wordCount / 10 + (entry.emotionalTone === 'vulnerable' ? 5 : 0);
    this.context.conversationDepth = Math.min(10, this.context.conversationDepth + depthScore / 10);
    
    // Update last mentioned topics
    entry.keyTopics.forEach(topic => {
      this.context!.lastMentioned[topic] = entry.timestamp;
    });
  }

  private async checkGrowthMilestones(entry: ConversationEntry): Promise<void> {
    if (!this.memory) return;
    
    const milestones: GrowthMilestone[] = [];
    
    // First deep conversation
    if (entry.wordCount > 100 && this.memory.growthMilestones.length === 0) {
      milestones.push({
        id: `milestone_${Date.now()}`,
        type: 'depth',
        title: 'First Deep Reflection',
        description: 'Shared your first detailed, thoughtful response',
        achievedDate: entry.timestamp,
        conversationId: entry.id
      });
    }
    
    // First vulnerable sharing
    if (entry.emotionalTone === 'vulnerable' && 
        !this.memory.growthMilestones.some(m => m.type === 'vulnerability')) {
      milestones.push({
        id: `milestone_${Date.now()}_vuln`,
        type: 'vulnerability',
        title: 'Courageous Vulnerability',
        description: 'Opened up about something difficult or challenging',
        achievedDate: entry.timestamp,
        conversationId: entry.id
      });
    }
    
    // Consistency milestone
    if (this.memory.totalConversations >= 5 && 
        !this.memory.growthMilestones.some(m => m.type === 'consistency')) {
      milestones.push({
        id: `milestone_${Date.now()}_consist`,
        type: 'consistency',
        title: 'Committed Explorer',
        description: 'Completed 5 meaningful reflections',
        achievedDate: entry.timestamp,
        conversationId: entry.id
      });
    }
    
    // Add milestones to memory
    this.memory.growthMilestones.push(...milestones);
  }

  async getConversationMemory(): Promise<ConversationMemory | null> {
    if (!this.memory) {
      await this.initialize();
    }
    return this.memory;
  }

  async getConversationContext(): Promise<ConversationContext | null> {
    if (!this.context) {
      await this.initialize();
    }
    return this.context;
  }

  async getRecentConversations(limit: number = 10): Promise<ConversationEntry[]> {
    if (!this.memory) {
      await this.initialize();
    }
    
    return this.memory?.conversationHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit) || [];
  }

  async getConversationsByTopic(topic: string): Promise<ConversationEntry[]> {
    if (!this.memory) {
      await this.initialize();
    }
    
    return this.memory?.conversationHistory
      .filter(conv => conv.keyTopics.includes(topic))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];
  }

  async getConversationsByTheme(theme: string): Promise<ConversationEntry[]> {
    if (!this.memory) {
      await this.initialize();
    }
    
    return this.memory?.conversationHistory
      .filter(conv => conv.theme === theme)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];
  }

  async getGrowthMilestones(): Promise<GrowthMilestone[]> {
    if (!this.memory) {
      await this.initialize();
    }
    
    return this.memory?.growthMilestones
      .sort((a, b) => new Date(b.achievedDate).getTime() - new Date(a.achievedDate).getTime()) || [];
  }

  async searchConversations(query: string): Promise<ConversationEntry[]> {
    if (!this.memory) {
      await this.initialize();
    }
    
    const lowerQuery = query.toLowerCase();
    
    return this.memory?.conversationHistory
      .filter(conv => 
        conv.questionText.toLowerCase().includes(lowerQuery) ||
        conv.answerText.toLowerCase().includes(lowerQuery) ||
        conv.keyTopics.some(topic => topic.includes(lowerQuery))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) || [];
  }

  async generateMemoryReference(topic?: string): Promise<string | null> {
    if (!this.memory) {
      await this.initialize();
    }
    
    const recent = await this.getRecentConversations(5);
    
    if (recent.length === 0) return null;
    
    // Generate contextual references
    if (topic && this.context?.lastMentioned[topic]) {
      const lastMentioned = new Date(this.context.lastMentioned[topic]);
      const daysSince = Math.floor((Date.now() - lastMentioned.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysSince === 0) {
        return `Earlier today you mentioned ${topic}...`;
      } else if (daysSince === 1) {
        return `Yesterday when we talked about ${topic}...`;
      } else if (daysSince < 7) {
        return `A few days ago you shared about ${topic}...`;
      } else {
        return `Last week you mentioned ${topic}...`;
      }
    }
    
    // General memory references
    const references = [
      `Building on what you shared about ${recent[0].keyTopics[0] || 'your experiences'}...`,
      `I remember you mentioning ${recent[0].keyTopics[0] || 'something interesting'}...`,
      `Last time we talked about how you ${recent[0].answerText.split(' ').slice(0, 5).join(' ')}...`,
      `You've been really thoughtful about ${this.getMostFrequentTopic()}...`
    ];
    
    return references[Math.floor(Math.random() * references.length)];
  }

  private getMostFrequentTopic(): string {
    if (!this.memory) return 'personal growth';
    
    const topicEntries = Object.entries(this.memory.topicFrequency);
    if (topicEntries.length === 0) return 'personal growth';
    
    const mostFrequent = topicEntries.reduce((max, current) => 
      current[1] > max[1] ? current : max
    );
    
    return mostFrequent[0];
  }

  private async saveMemory(): Promise<void> {
    if (!this.memory) return;
    
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.memory));
    } catch (error) {
      console.error('Error saving conversation memory:', error);
    }
  }

  private async saveContext(): Promise<void> {
    if (!this.context) return;
    
    try {
      await AsyncStorage.setItem(this.contextKey, JSON.stringify(this.context));
    } catch (error) {
      console.error('Error saving conversation context:', error);
    }
  }

  async resetMemory(): Promise<void> {
    this.memory = this.createInitialMemory();
    this.context = this.createInitialContext();
    await this.saveMemory();
    await this.saveContext();
  }
}

export const conversationMemoryService = new ConversationMemoryService();