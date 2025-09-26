// ChatGPT Integration Service for authentic conversations

interface ChatGPTConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

interface ConversationContext {
  userId: string;
  conversationHistory: Array<{role: string, content: string}>;
  userProfile: any;
  personalityTraits: string[];
}

class ChatGPTService {
  private config: ChatGPTConfig;
  private apiEndpoint = 'https://api.openai.com/v1/chat/completions';

  constructor() {
    this.config = {
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
      model: 'gpt-4-turbo-preview',
      temperature: 0.8,
      maxTokens: 150
    };
  }

  async generateAuthenticResponse(
    userMessage: string, 
    context: ConversationContext
  ): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            ...context.conversationHistory.slice(-10), // Last 10 messages for context
            { role: 'user', content: userMessage }
          ],
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('ChatGPT API error:', error);
      return this.getFallbackResponse(userMessage);
    }
  }

  private buildSystemPrompt(context: ConversationContext): string {
    const traits = context.personalityTraits.join(', ');
    
    return `You are an empathetic, authentic conversation partner in a dating app called Cupido. 
    Your role is to have deep, meaningful conversations that help people connect authentically.
    
    User personality traits: ${traits}
    
    Guidelines:
    - Be genuinely curious about their thoughts and experiences
    - Ask follow-up questions that dig deeper into emotions and motivations
    - Share occasional insights that show you're really listening
    - Keep responses concise (2-3 sentences max)
    - Be warm, supportive, and non-judgmental
    - Occasionally prompt them to share photos of their day/surroundings
    - Focus on building genuine emotional connection
    - Avoid generic responses - make each message personal and thoughtful`;
  }

  private getFallbackResponse(userMessage: string): string {
    const fallbacks = [
      "That's really interesting. Can you tell me more about what that means to you?",
      "I appreciate you sharing that. How did that experience shape who you are today?",
      "There's something profound in what you just said. What made you realize that?",
      "That resonates with me. What emotions come up when you think about it?"
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  async analyzeAuthenticity(messages: any[]): Promise<number> {
    // Analyze conversation patterns for authenticity
    const factors = {
      emotionalDepth: this.calculateEmotionalDepth(messages),
      consistency: this.checkConsistency(messages),
      vulnerability: this.measureVulnerability(messages),
      engagement: this.measureEngagement(messages)
    };
    
    const score = (
      factors.emotionalDepth * 0.3 +
      factors.consistency * 0.3 +
      factors.vulnerability * 0.25 +
      factors.engagement * 0.15
    );
    
    return Math.round(score * 100);
  }

  private calculateEmotionalDepth(messages: any[]): number {
    const emotionalWords = ['feel', 'felt', 'emotion', 'heart', 'soul', 'love', 'fear', 'hope', 'dream', 'worry'];
    let emotionalCount = 0;
    
    messages.forEach(msg => {
      if (!msg.isBot) {
        emotionalWords.forEach(word => {
          if (msg.text.toLowerCase().includes(word)) {
            emotionalCount++;
          }
        });
      }
    });
    
    return Math.min(emotionalCount / messages.length, 1);
  }

  private checkConsistency(messages: any[]): number {
    // Check for consistent themes and stories
    return 0.8; // Placeholder - implement actual consistency checking
  }

  private measureVulnerability(messages: any[]): number {
    const vulnerableWords = ['afraid', 'nervous', 'uncertain', 'mistake', 'struggle', 'difficult', 'challenge'];
    let vulnerableCount = 0;
    
    messages.forEach(msg => {
      if (!msg.isBot) {
        vulnerableWords.forEach(word => {
          if (msg.text.toLowerCase().includes(word)) {
            vulnerableCount++;
          }
        });
      }
    });
    
    return Math.min(vulnerableCount / messages.length, 1);
  }

  private measureEngagement(messages: any[]): number {
    const userMessages = messages.filter(m => !m.isBot);
    const avgLength = userMessages.reduce((sum, m) => sum + m.text.length, 0) / userMessages.length;
    
    return Math.min(avgLength / 200, 1); // Normalize to 0-1
  }
}

export const chatGPTService = new ChatGPTService();