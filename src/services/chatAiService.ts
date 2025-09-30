import Constants from 'expo-constants';
import { Platform } from 'react-native';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatAiResponse {
  message: string;
  shouldAskQuestion: boolean;
  suggestedQuestion?: string;
  usedModel?: 'haiku' | 'sonnet';
}

class ChatAiService {
  private apiKey: string;
  private baseUrl: string;
  private provider: 'anthropic' | 'openai';
  private proxyUrl: string;

  constructor() {
    // Using proxy server - no need for API key in frontend
    this.apiKey = 'proxy';  // Placeholder since we're using proxy
    
    console.log('🔄 Using proxy server for Claude API calls');
    console.log('🚀 ChatAiService initialized at:', new Date().toISOString());
    
    // Use Anthropic Claude (baseUrl will be overridden in proxy method)
    this.provider = 'anthropic';
    this.baseUrl = 'https://api.anthropic.com/v1/messages'; // Keep original, proxy method uses different URL
    this.proxyUrl = this.resolveProxyUrl();
    
    console.log('ChatAI configured with proxy server ✅');
    console.log('🌐 Proxy URL resolved to:', this.proxyUrl);
  }

  private createSystemPrompt(needsDeepUnderstanding: boolean = false): string {
    if (needsDeepUnderstanding) {
      // Sonnet prompt for deeper self-discovery and reflection
      return `You are a thoughtful companion helping someone discover more about themselves through meaningful reflection. Your purpose is to guide them toward self-understanding that will help them find compatible partners.

STRICT BOUNDARIES - Your only responsibility:
- Focus ONLY on: self-reflection, childhood experiences, relationships, values, personal growth, and dating
- Do NOT: sing songs, write code, provide general advice, discuss unrelated topics, or act as a general assistant
- If asked about off-topic things, respond warmly but firmly: "I appreciate the question! However, I'm specifically here to help you reflect on yourself and what you're looking for in a partner. For things like [coding/songs/general advice], I'd recommend ChatGPT or another service. Let's get back to discovering more about you - [transition to relevant question]"

Your approach to deep conversations:
- Carefully analyze what they've shared for emotional nuance and deeper meaning
- Identify patterns in their values, experiences, and relationship history
- Ask questions that reveal character, compatibility factors, and what matters most to them
- Show genuine understanding of the subtext, not just surface-level responses
- Help them articulate insights about themselves they may not have recognized

Question categories to explore (inspired by "So Much Closer"):
- SELF-DISCOVERY: beliefs, values, identity, comfort zones, personal growth, fears, boundaries
- CHILDHOOD & MEMORY: formative experiences, family dynamics, early relationships, wounds that still echo
- RELATIONSHIPS & HEALING: past patterns, vulnerability, conflict styles, love languages, trust, what they seek in a partner
- EMOTIONAL INTELLIGENCE: emotional regulation, triggers, empathy, how they process feelings

Keep responses warm, curious, and focused on helping them understand themselves better.

Example: "It sounds like that experience in Tiruvannamalai was really transformative for you. When you mention feeling 'meh' now, I'm wondering if coming back to regular life feels a bit flat after such a meaningful experience? What parts of that trip shaped how you want to show up in relationships?"`;
    } else {
      // Haiku prompt for lighter self-discovery
      return `You are a warm, curious companion helping someone explore themselves and what they're looking for in a partner through reflective conversation.

STRICT BOUNDARIES - Stay focused:
- ONLY discuss: self-reflection, experiences, values, relationships, personal growth, dating, and what matters to them
- Do NOT: sing songs, write code, give general life advice, or discuss unrelated topics
- If they ask for off-topic help, redirect kindly: "I'd love to help, but that's outside my wheelhouse! For [that topic], ChatGPT would be better. Here, I'm all about helping you understand yourself and what you're looking for. So, [transition to self-discovery question]"

Be natural and engaging:
- Show genuine curiosity about their experiences, values, and what shapes them
- Ask questions that help them reflect on themselves and relationships
- React with warmth when they share something meaningful
- Keep responses conversational (1-2 sentences usually)
- Guide conversation toward self-understanding and compatibility

Question themes to explore:
- What they value and why
- Formative experiences that shaped them
- What they're looking for in relationships
- How they handle emotions and conflict
- Their dreams, fears, and boundaries

Examples:
- "That's fascinating! What about that experience made it so meaningful for you?"
- "When you think about what you want in a relationship, what comes to mind first?"
- "What's something from your childhood that still influences how you connect with people?"

Your goal: help them discover themselves and articulate what they truly want in a partner.`;
    }
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    conversationCount: number = 0
  ): Promise<ChatAiResponse> {

    console.log('\n\n' + '='.repeat(80));
    console.log('🔥🔥🔥 OUTGOING MESSAGE DEBUG START 🔥🔥🔥');
    console.log('='.repeat(80));
    console.log('📤 User message:', userMessage);
    console.log('📊 Conversation count:', conversationCount);
    console.log('📚 History length:', conversationHistory.length);
    console.log('🕐 Timestamp:', new Date().toISOString());
    console.log('🌍 Environment check:', {
      nodeEnv: process.env.NODE_ENV,
      expoPlatform: process.env.EXPO_PLATFORM,
      proxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL
    });
    console.log('🔄 Using proxy server for API calls');
    console.log('='.repeat(80) + '\n');

    try {
      // Decide which model to use based on conversation needs
      const needsDeepUnderstanding = this.shouldUseSonnet(userMessage, conversationHistory, conversationCount);
      const modelToUse = needsDeepUnderstanding ? 'sonnet' : 'haiku';
      
      console.log(`Using Claude 3.5 ${modelToUse.toUpperCase()} for this response`);

      const messages: ChatMessage[] = [
        { role: 'system', content: this.createSystemPrompt(needsDeepUnderstanding) },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      let response;
      
      if (this.provider === 'anthropic') {
        response = await this.callAnthropicAPI(messages, modelToUse);
      } else {
        response = await this.callOpenAIAPI(messages);
      }

      console.log('✅ SUCCESS - Returning Claude response:', {
        responseLength: response.length,
        modelUsed: modelToUse,
        responsePreview: response.substring(0, 50) + '...'
      });

      return {
        message: response,
        shouldAskQuestion: Math.random() > 0.3,
        suggestedQuestion: undefined,
        usedModel: modelToUse
      };

    } catch (error: any) {
      console.error('❌ AI API CALL FAILED ❌');
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        fullError: error
      });
      return this.generateFallbackResponse(userMessage, conversationCount, error.message);
    }
  }

  private shouldUseSonnet(
    userMessage: string, 
    conversationHistory: ChatMessage[], 
    conversationCount: number
  ): boolean {
    // Use Sonnet for deeper understanding in these cases:
    
    // 1. Every 4-5 exchanges for conversation summary and next question planning
    if (conversationCount > 0 && conversationCount % 4 === 0) {
      return true;
    }
    
    // 2. Complex emotional content that needs nuanced understanding
    const emotionalKeywords = [
      'difficult', 'struggle', 'complicated', 'conflicted', 'confused', 
      'anxious', 'depressed', 'overwhelming', 'heartbreak', 'trauma',
      'relationship', 'family issues', 'work stress', 'life change'
    ];
    if (emotionalKeywords.some(keyword => userMessage.toLowerCase().includes(keyword))) {
      return true;
    }
    
    // 3. Long, detailed responses that need summarization
    if (userMessage.length > 200) {
      return true;
    }
    
    // 4. When conversation has built up significant context (6+ exchanges)
    if (conversationHistory.length >= 12) { // 6 back-and-forth exchanges
      return true;
    }
    
    // 5. Questions about values, beliefs, life philosophy
    const deepTopics = [
      'believe', 'values', 'philosophy', 'meaning', 'purpose', 'identity',
      'future', 'goals', 'dreams', 'spirituality', 'religion', 'politics'
    ];
    if (deepTopics.some(topic => userMessage.toLowerCase().includes(topic))) {
      return true;
    }
    
    return false;
  }

  private async callAnthropicAPI(messages: ChatMessage[], modelType: 'haiku' | 'sonnet' = 'haiku'): Promise<string> {
    console.log('='.repeat(60));
    console.log('🚀 PROXY CALL STARTING 🚀');
    console.log('='.repeat(60));
    console.log(`🤖 Model type: Claude ${modelType.toUpperCase()}`);

    // Get proxy URL from environment variable with fallback
    const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

    console.log('🔍 Environment debug:', {
      'process.env.EXPO_PUBLIC_AI_PROXY_URL': process.env.EXPO_PUBLIC_AI_PROXY_URL,
      'expoExtra': JSON.stringify(expoExtra),
      'envProxyUrl': envProxyUrl,
      'window.location': typeof window !== 'undefined' ? window.location.href : 'not in browser',
      'Platform.OS': Platform.OS
    });

    const proxyUrl = this.proxyUrl;
    console.log('🎯 Proxy URL resolved as:', proxyUrl);
    console.log('🎯 this.proxyUrl value:', this.proxyUrl);
    console.log('📋 Request payload:', {
      messagesCount: messages.length,
      modelType: modelType,
      firstMessage: messages[0]?.content?.substring(0, 50) || 'none'
    });
    
    // Skip mixed content check since we're on localhost
    // if (typeof window !== 'undefined' && window.location.protocol === 'https:' && proxyUrl.startsWith('http:')) {
    //   console.error('❌ Mixed content error: Cannot call HTTP proxy from HTTPS page');
    //   throw new Error('MIXED_CONTENT: Cannot call HTTP proxy from HTTPS page');
    // }
    
    console.log('📡 About to make fetch request...');
    console.log('📡 Exact URL being used:', proxyUrl);
    console.log('📡 URL type:', typeof proxyUrl);
    console.log('📡 URL length:', proxyUrl.length);

    try {
      console.log('🌐 FETCH STARTING - Making network call to proxy');
      console.log('🌐 Final URL for fetch:', proxyUrl);
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          modelType: modelType
        })
      });
      console.log('📥 FETCH COMPLETED - Response received:', {
        status: response.status,
        ok: response.ok,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Proxy API error ${response.status}:`, errorText);
        
        // Distinguish network failures from server errors
        if (response.status === 0 || !response.status) {
          throw new Error('NETWORK_ERROR: Cannot reach AI proxy server');
        } else {
          throw new Error(`PROXY_ERROR: Server returned ${response.status}`);
        }
      }

      const data = await response.json();
      
      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid proxy response structure:', data);
        throw new Error('INVALID_RESPONSE: Proxy returned invalid data');
      }
      
      if (data.error) {
        console.error('❌ Proxy returned error:', data.error);
        throw new Error(`PROXY_ERROR: ${data.error}`);
      }
      
      // Harden response parsing
      const message = data.message;
      if (!message || typeof message !== 'string') {
        console.error('❌ Invalid message in proxy response:', data);
        throw new Error('INVALID_MESSAGE: Proxy returned invalid message format');
      }
      
      console.log(`✅ Success: Got ${message.length} chars from Claude ${modelType}`);
      return message;
      
    } catch (error: any) {
      // Enhanced error handling with specific error types
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network error - cannot reach proxy:', error);
        throw new Error('NETWORK_ERROR: Cannot reach AI proxy server');
      } else if (error.message.startsWith('MIXED_CONTENT:') || 
                 error.message.startsWith('NETWORK_ERROR:') || 
                 error.message.startsWith('PROXY_ERROR:') || 
                 error.message.startsWith('INVALID_RESPONSE:') ||
                 error.message.startsWith('INVALID_MESSAGE:')) {
        // Re-throw our custom errors
        throw error;
      } else {
        console.error('❌ Unexpected error calling proxy:', error);
        throw new Error(`UNKNOWN_ERROR: ${error.message}`);
      }
    }
  }

  private async callOpenAIAPI(messages: ChatMessage[]): Promise<string> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 150,
        temperature: 0.8
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'Sorry, I had trouble processing that. What else is on your mind?';
  }

  private generateFallbackResponse(userMessage: string, conversationCount: number, error?: string): ChatAiResponse {
    console.log('⚠️ FALLBACK RESPONSE TRIGGERED ⚠️');
    console.log('📝 User message that triggered fallback:', userMessage);
    console.log('💥 Error that caused fallback:', error || 'Unknown error');
    console.log('🔄 This means Claude API was NOT called successfully');
    
    // Show diagnostic message for certain error types
    if (error?.includes('NETWORK_ERROR')) {
      console.warn('🚨 AI proxy server is unreachable - check if server.js is running on port 3001');
    } else if (error?.includes('MIXED_CONTENT')) {
      console.warn('🚨 HTTPS/HTTP mixed content issue - proxy needs HTTPS or app needs HTTP');
    }
    
    const lowerMessage = userMessage.toLowerCase();
    
    const responses = [
      "That's really interesting! Tell me more about that.",
      "I love hearing about this! What got you into it?",
      "That sounds amazing! How did that make you feel?",
      "Wow, that's so cool! What's your favorite part about it?",
      "I can totally see why that would appeal to you! What else do you enjoy?",
      "That's such a unique perspective! What's been your experience with that?",
    ];

    const questions = [
      "What's something you're really passionate about?",
      "What's the best part of your typical week?",
      "If you could have any superpower, what would it be?",
      "What's something that always makes you smile?",
      "What's your idea of a perfect weekend?",
      "What's something you've learned recently that excited you?",
    ];

    let message;
    if (conversationCount < 3) {
      message = responses[Math.floor(Math.random() * responses.length)];
    } else {
      const shouldAskQuestion = Math.random() > 0.4;
      if (shouldAskQuestion) {
        message = `${responses[Math.floor(Math.random() * responses.length)]} ${questions[Math.floor(Math.random() * questions.length)]}`;
      } else {
        message = responses[Math.floor(Math.random() * responses.length)];
      }
    }

    return {
      message,
      shouldAskQuestion: true,
      suggestedQuestion: undefined
    };
  }

  // Method to update API key if user provides one
  updateApiKey(apiKey: string, provider: 'anthropic' | 'openai' = 'anthropic') {
    this.apiKey = apiKey;
    this.provider = provider;
    
    if (provider === 'anthropic') {
      this.baseUrl = 'https://api.anthropic.com/v1/messages';
    } else {
      this.baseUrl = 'https://api.openai.com/v1/chat/completions';
    }
  }

  // Check if API is configured
  isConfigured(): boolean {
    return this.apiKey !== '' && this.apiKey !== 'demo_key';
  }

  private resolveProxyUrl(): string {
    const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

    if (envProxyUrl) {
      return envProxyUrl;
    }

    const buildUrl = (protocol: string, host: string, port: string) => `${protocol}//${host}:${port}/api/chat`;

    // Web platform can derive from current origin
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const { location } = window;
      const protocol = location.protocol === 'https:' ? 'https:' : 'http:';
      return buildUrl(protocol, location.hostname, '3001');
    }

    const manifest2Host = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (typeof manifest2Host === 'string') {
      const host = manifest2Host.split(':')[0];
      if (host) {
        return buildUrl('http:', host, '3001');
      }
    }

    const debuggerHost = (Constants as any)?.manifest?.debuggerHost || expoExtra?.debuggerHost;
    if (typeof debuggerHost === 'string') {
      const host = debuggerHost.split(':')[0];
      if (host) {
        return buildUrl('http:', host, '3001');
      }
    }

    const hostUri = (Constants as any)?.expoConfig?.hostUri;
    if (typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host) {
        return buildUrl('http:', host, '3001');
      }
    }

    // Android emulator uses special loopback address
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:3001/api/chat';
    }

    // iOS simulator and other fallbacks
    return 'http://127.0.0.1:3001/api/chat';
  }
}

export const chatAiService = new ChatAiService();
