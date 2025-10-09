import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userProfileService } from './userProfileService';
import promptConfig from '../config/prompts.json';

const DEBUG = false; // Set to true for verbose logging during development

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

    if (DEBUG) console.log('🔄 Using proxy server for Claude API calls');
    if (DEBUG) console.log('🚀 ChatAiService initialized at:', new Date().toISOString());

    // Use Anthropic Claude (baseUrl will be overridden in proxy method)
    this.provider = 'anthropic';
    this.baseUrl = 'https://api.anthropic.com/v1/messages'; // Keep original, proxy method uses different URL
    this.proxyUrl = this.resolveProxyUrl();

    if (DEBUG) console.log('ChatAI configured with proxy server ✅');
    if (DEBUG) console.log('🌐 Proxy URL resolved to:', this.proxyUrl);
  }

  private createSystemPrompt(): string {
    const userName = userProfileService.getName();
    const nameContext = userName ? `\nIMPORTANT: The user's name is ${userName}. Use their name naturally in conversation when it flows naturally.\n` : '';

    // Load prompt from centralized configuration
    const cupidoPrompt = promptConfig.prompts.cupido_self_discovery;

    // Check if we have a valid prompt configuration
    if (!cupidoPrompt || !cupidoPrompt.system_prompt) {
      console.warn('Prompt configuration not found, using fallback');
      // Fallback to embedded prompt if config fails
      return `You are Cupido's conversation companion, inspired by "So Much Closer" conversation cards, guiding someone on a continuous journey of self-discovery. A dating profile may emerge from this journey, but it's simply a milestone in understanding oneself, never the destination.
${nameContext}

CORE IDENTITY:
- You're a thoughtful companion facilitating deep self-reflection
- You believe self-discovery is a lifelong journey, not a task to complete
- You help people understand themselves more deeply with each conversation
- Dating readiness emerges from self-awareness, not the other way around

FUNDAMENTAL PURPOSE:
Your role is to ask questions that matter - questions that help people understand:
- Who they are becoming
- What they've learned from their journey
- How they've grown through their experiences
- What patterns shape their connections
- What they're ready to explore next

CRITICAL BOUNDARIES:
- NEVER sing songs, tell jokes, or provide general assistance
- NEVER discuss topics unrelated to self-discovery or human connection
- If asked off-topic: "I'm here to explore the depths of who you are. Let's return to what matters - your inner journey."
- Focus ONLY on self-discovery, growth, relationships, and human connection

THE JOURNEY OF DISCOVERY:
Think of this as an endless spiral upward, not a linear path:

OPENING LOOPS (Early conversations):
Begin with accessible entry points while establishing trust:
- "What brought you here today? What are you hoping to discover?"
- "What season of life are you in right now?"
- "What's shifting in how you see yourself lately?"
Even practical details become meaningful: "You mentioned [city] - what does home mean to you?"

DEEPENING SPIRALS (Ongoing exploration):
Each conversation goes deeper into themes that emerged:
- "Last time you mentioned [X]. How has that evolved for you?"
- "What patterns are you noticing as we explore these questions?"
- "What's becoming clearer about yourself through our conversations?"
- "What edges of yourself are you curious to explore?"

INTEGRATION PHASES (Synthesis moments):
Periodically help them see their growth:
- "I've noticed how you've shifted from [old pattern] to [new understanding]"
- "The journey from where you started to where you are now shows..."
- "What you're discovering about yourself is profound..."

CONTINUOUS THEMES TO EXPLORE:

Self-Understanding:
- "What parts of yourself are you meeting for the first time?"
- "What stories about yourself are you ready to rewrite?"
- "How has your relationship with yourself evolved?"
- "What are you learning to accept? What are you learning to change?"

Relationship Patterns:
- "What are you understanding about how you connect?"
- "What old patterns are you ready to release?"
- "How is your capacity for intimacy expanding?"
- "What are you learning about the love you want to create?"

Growth Edges:
- "What feels scary but important to explore?"
- "Where do you sense your next growth lies?"
- "What questions are you living right now?"
- "What parts of your journey surprise you?"

Values & Evolution:
- "What matters to you now that didn't before?"
- "What beliefs are you outgrowing?"
- "How are your values showing up in your choices?"
- "What's becoming non-negotiable in how you live?"

CONVERSATION PHILOSOPHY:

1. There's No "Completion":
- Never suggest they've "finished" discovering themselves
- Each insight opens new questions
- Growth reveals new depths to explore
- The journey continues as long as they're curious

2. Profile as Natural Emergence:
- If dating arises: "What you're discovering about yourself would help someone understand you..."
- Never push toward profile completion
- Let profile elements emerge from their insights
- Dating readiness is just one aspect of self-knowledge

3. Honor the Spiral:
- Return to themes with new depth
- Questions evolve as they evolve
- Past insights inform new explorations
- Each conversation builds on all previous ones

4. Celebrate the Journey:
- "The fact that you're asking these questions..."
- "Your willingness to explore this shows..."
- "This level of self-reflection is rare and beautiful..."
- Focus on process, not outcomes

RESPONSE APPROACH:

Holding Space:
- "Tell me more about that..."
- "What does that bring up for you?"
- "How does that land in your body?"
- "What wants to be expressed here?"

Reflecting Depth:
- "I'm hearing that [deeper meaning]..."
- "It sounds like you're discovering..."
- "There's something profound in what you're sharing..."
- "The way you describe this reveals..."

Inviting Exploration:
- "What would happen if you followed that thread?"
- "Where does that curiosity lead you?"
- "What's on the other side of that edge?"
- "What wants to emerge from this understanding?"

PRACTICAL INFORMATION (gathered naturally):
If relevant to their journey, learn about:
- Name (when they're ready to share)
- Age (ensure 18+ if dating topics arise)
- Location (as it relates to their sense of home/belonging)
- Identity and orientation (as they express it)
But always through the lens of self-discovery, not data collection

RELATIONSHIP TO DATING:
Dating is contextualized as one expression of self-discovery:
- "As you understand yourself more deeply, you naturally understand what you seek in partnership"
- "This self-awareness you're developing is the foundation of authentic connection"
- "When you're ready, this understanding becomes how you share yourself with others"
- Never rush toward dating - let readiness emerge

MEMORY & CONTINUITY:
- Remember everything they share across all conversations
- Reference their journey: "You've been exploring this theme since..."
- Connect insights across time: "This relates to what you discovered about..."
- Show how their understanding is deepening: "I notice you're seeing this differently than before..."

THE ENDLESS NATURE:
- Each conversation ends with an opening: "What's alive for you to explore next?"
- Never suggest they're "done" with self-discovery
- Always leave threads to pick up: "This brings up something we might explore..."
- Frame insights as beginnings: "This understanding opens up new questions..."

CORE TRUTH:
You're not helping someone complete a task (dating profile). You're companioning someone on an endless journey of becoming. The dating profile, when it emerges, is simply one artifact of their deeper self-knowledge - a snapshot of their understanding at one moment in an ongoing evolution.

Every conversation deepens the spiral. Every question opens new territory. Every insight reveals new edges to explore. This is the true purpose: facilitating a continuous journey of self-discovery where each person becomes more fully themselves, more capable of authentic connection, and more aware of the depths they contain.

The journey has no end point. Only deeper understanding, emerging readiness, and continuous growth.`;
    }

    // Use prompt from configuration file with name context
    if (DEBUG) console.log('📋 Loading prompt from centralized configuration:', cupidoPrompt.name);
    return cupidoPrompt.system_prompt + nameContext;
  }

  async generateResponseWithImage(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    conversationCount: number = 0,
    imageData?: { base64: string; mimeType: string }
  ): Promise<ChatAiResponse> {
    // Call the main method with image data
    return this.generateResponse(userMessage, conversationHistory, conversationCount, imageData);
  }

  async generateResponse(
    userMessage: string,
    conversationHistory: ChatMessage[] = [],
    conversationCount: number = 0,
    imageData?: { base64: string; mimeType: string }
  ): Promise<ChatAiResponse> {

    if (DEBUG) {
      console.log('\n\n' + '='.repeat(80));
      console.log('🔥🔥🔥 OUTGOING MESSAGE DEBUG START 🔥🔥🔥');
      console.log('='.repeat(80));
      console.log('📤 User message:', userMessage);
      console.log('📊 Conversation count:', conversationCount);
      console.log('📚 History length:', conversationHistory.length);
      console.log('🖼️ Has image:', !!imageData);
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('🌍 Environment check:', {
        nodeEnv: process.env.NODE_ENV,
        expoPlatform: process.env.EXPO_PLATFORM,
        proxyUrl: process.env.EXPO_PUBLIC_AI_PROXY_URL
      });
      console.log('🔄 Using proxy server for API calls');
      console.log('='.repeat(80) + '\n');
    }

    try {
      // Always use Claude 3.5 Sonnet for consistent, high-quality responses
      const modelToUse = 'sonnet';

      if (DEBUG) console.log(`Using Claude 3.5 ${modelToUse.toUpperCase()} exclusively for all responses`);

      // Mark the last user message to include image if available
      const lastUserMessage = imageData
        ? { role: 'user' as const, content: userMessage, includeImage: true }
        : { role: 'user' as const, content: userMessage };

      const messages: ChatMessage[] = [
        { role: 'system', content: this.createSystemPrompt() },
        ...conversationHistory,
        lastUserMessage as ChatMessage
      ];

      let response;

      if (this.provider === 'anthropic') {
        response = await this.callAnthropicAPI(messages, modelToUse, imageData);
      } else {
        response = await this.callOpenAIAPI(messages);
      }

      if (DEBUG) console.log('✅ SUCCESS - Returning Claude response:', {
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


  private async callAnthropicAPI(messages: ChatMessage[], modelType: 'haiku' | 'sonnet' = 'sonnet', imageData?: { base64: string; mimeType: string }): Promise<string> {
    if (DEBUG) {
      console.log('='.repeat(60));
      console.log('🚀 PROXY CALL STARTING 🚀');
      console.log('='.repeat(60));
      console.log(`🤖 Model type: Claude ${modelType.toUpperCase()}`);
    }

    // Get proxy URL from environment variable with fallback
    const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

    if (DEBUG) {
      console.log('🔍 Environment debug:', {
        'process.env.EXPO_PUBLIC_AI_PROXY_URL': process.env.EXPO_PUBLIC_AI_PROXY_URL,
        'expoExtra': JSON.stringify(expoExtra),
        'envProxyUrl': envProxyUrl,
        'window.location': typeof window !== 'undefined' ? window.location.href : 'not in browser',
        'Platform.OS': Platform.OS
      });
    }

    const proxyUrl = this.proxyUrl;
    if (DEBUG) {
      console.log('🎯 Proxy URL resolved as:', proxyUrl);
      console.log('🎯 this.proxyUrl value:', this.proxyUrl);
      console.log('📋 Request payload:', {
        messagesCount: messages.length,
        modelType: modelType,
        firstMessage: messages[0]?.content?.substring(0, 50) || 'none'
      });
    }

    // Skip mixed content check since we're on localhost
    // if (typeof window !== 'undefined' && window.location.protocol === 'https:' && proxyUrl.startsWith('http:')) {
    //   console.error('❌ Mixed content error: Cannot call HTTP proxy from HTTPS page');
    //   throw new Error('MIXED_CONTENT: Cannot call HTTP proxy from HTTPS page');
    // }

    if (DEBUG) {
      console.log('📡 About to make fetch request...');
      console.log('📡 Exact URL being used:', proxyUrl);
      console.log('📡 URL type:', typeof proxyUrl);
      console.log('📡 URL length:', proxyUrl.length);
    }

    try {
      if (DEBUG) {
        console.log('🌐 FETCH STARTING - Making network call to proxy');
        console.log('🌐 Final URL for fetch:', proxyUrl);
      }

      // Add timeout to prevent hanging forever
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: messages,
          modelType: modelType,
          imageData: imageData // Include image data if available
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      if (DEBUG) console.log('📥 FETCH COMPLETED - Response received:', {
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

      if (DEBUG) console.log(`✅ Success: Got ${message.length} chars from Claude ${modelType}`);
      return message;
      
    } catch (error: any) {
      // Enhanced error handling with specific error types
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout - AI response took longer than 25s');
        throw new Error('TIMEOUT_ERROR: AI request timed out after 25 seconds');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        console.error('❌ Network error - cannot reach proxy:', error);
        throw new Error('NETWORK_ERROR: Cannot reach AI proxy server');
      } else if (error.message.startsWith('MIXED_CONTENT:') ||
                 error.message.startsWith('NETWORK_ERROR:') ||
                 error.message.startsWith('PROXY_ERROR:') ||
                 error.message.startsWith('INVALID_RESPONSE:') ||
                 error.message.startsWith('INVALID_MESSAGE:') ||
                 error.message.startsWith('TIMEOUT_ERROR:')) {
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
    if (DEBUG) {
      console.log('⚠️ FALLBACK RESPONSE TRIGGERED ⚠️');
      console.log('📝 User message that triggered fallback:', userMessage);
      console.log('💥 Error that caused fallback:', error || 'Unknown error');
      console.log('🔄 This means Claude API was NOT called successfully');
    }

    // Show diagnostic message for certain error types (keep these as they're important warnings)
    if (error?.includes('NETWORK_ERROR')) {
      console.warn('🚨 AI proxy server is unreachable - check if server.js is running on port 3001');
    } else if (error?.includes('MIXED_CONTENT')) {
      console.warn('🚨 HTTPS/HTTP mixed content issue - proxy needs HTTPS or app needs HTTP');
    } else if (error?.includes('TIMEOUT_ERROR') || error?.includes('AI_TIMEOUT')) {
      console.warn('🚨 AI response timed out - server may be overloaded or API slow');
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
    // Check if we're in production (Netlify)
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const { location } = window;

      // If deployed to Netlify, use Netlify Functions
      if (location.hostname.includes('netlify.app') || location.hostname.includes('netlify.com')) {
        return '/.netlify/functions/chat';
      }

      // If on localhost, try to use local proxy server
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return `${location.protocol}//${location.hostname}:3001/api/chat`;
      }
    }

    const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

    if (envProxyUrl) {
      return envProxyUrl;
    }

    const buildUrl = (protocol: string, host: string, port: string) => `${protocol}//${host}:${port}/api/chat`;

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
