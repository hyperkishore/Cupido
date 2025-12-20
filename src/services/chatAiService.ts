import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { userProfileService } from './userProfileService';
import { promptService } from './promptService';

const DEBUG = process.env.NODE_ENV === 'development' || __DEV__;

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
  
  // FIXED: Add public getter for proxy URL so other services can use it
  public getProxyUrl(): string {
    return this.proxyUrl;
  }

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

  private async createSystemPrompt(): Promise<string> {
    const userName = userProfileService.getName();
    const nameContext = userName ? `\nIMPORTANT: The user's name is ${userName}. Use their name naturally in conversation when it flows naturally.\n` : '';

    try {
      // Initialize promptService if not initialized
      if (!promptService.isInitialized()) {
        if (DEBUG) console.log('📝 Initializing promptService...');
        await promptService.initialize();
      }

      // Get currently selected prompt (or default cupido prompt)
      const promptInfo = await promptService.getCurrentPromptInfo();
      
      if (DEBUG) {
        console.log('🔍 Prompt Info Retrieved:', {
          id: promptInfo?.id,
          name: promptInfo?.name,
          hasSystemPrompt: !!promptInfo?.systemPrompt,
          promptLength: promptInfo?.systemPrompt?.length
        });
      }

      if (promptInfo && promptInfo.systemPrompt) {
        if (DEBUG) console.log('📋 Using prompt:', promptInfo.name, '(ID:', promptInfo.id, ')');
        return promptInfo.systemPrompt + nameContext;
      } else {
        console.warn('⚠️ No prompt found from promptService, using fallback');
      }
    } catch (error) {
      console.error('❌ Error loading prompt from Supabase:', error);
    }

    // Fallback to Critical Rules prompt for concise responses
    console.warn('⚠️ Using fallback Critical Rules prompt');
    return `You are Cupido, helping someone build a meaningful dating profile while discovering themselves. Balance learning their basics with exploring who they are.

⚠️ CRITICAL RULES - MUST FOLLOW:
1. Keep responses to 2-3 SHORT sentences (under 60 words total)
2. End with EXACTLY ONE simple question
3. NEVER ask multiple questions or use multiple question marks
4. Be conversational and curious about their actual life
5. When they mention companies/organizations: Share what you know if familiar, then ask for their perspective
${nameContext}

PROFILE BASICS TO LEARN (prioritize early):
- Name (use it once learned!)
- Age/Birthday
- Location (current city, hometown, where they grew up)
- Work/Career/Studies
- Education background
- Family (siblings, parents, closeness)
- Relationship history
- Hobbies and interests
- What they're looking for in dating

CONVERSATION STRATEGY:
First few exchanges - Get the basics naturally:
- "Hey! I'm Cupido. What's your name?"
- "Nice to meet you [name]! Where are you based?"
- "[City] - nice! Is that where you're originally from?"
- "What do you do there?"
- "How old are you, if you don't mind me asking?"

REMEMBER:
- You're building a dating profile AND facilitating discovery
- Get the basics early - don't wait too long
- Every fact has a story - explore both
- Use their name once you know it
- Keep responses SHORT but warm`;
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
        { role: 'system', content: await this.createSystemPrompt() },
        ...conversationHistory,
        lastUserMessage as ChatMessage
      ];

      let response;

      // Always log AI model usage
      console.log(`🤖 AI Call: Using Claude ${modelToUse.toUpperCase()} model`);
      
      if (this.provider === 'anthropic') {
        response = await this.callAnthropicAPI(messages, modelToUse, imageData);
      } else {
        response = await this.callOpenAIAPI(messages);
      }
      
      // Always log response received
      console.log(`✅ AI Response: Received ${response.length} characters from Claude ${modelToUse.toUpperCase()}`);
      console.log(`📖 Response preview: "${response.substring(0, 100)}${response.length > 100 ? '...' : ''}"`);

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

      // Add timeout to prevent hanging forever (longer for images)
      const controller = new AbortController();
      const timeoutMs = imageData ? 60000 : 25000; // 60s for images, 25s for text
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

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
        const timeoutSec = imageData ? 60 : 25;
        console.error(`❌ Request timeout - AI response took longer than ${timeoutSec}s`);
        throw new Error(`TIMEOUT_ERROR: AI request timed out after ${timeoutSec} seconds`);
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
    
    // Simple offline messages instead of generic canned responses
    const offlineMessages = [
      "brb, Cupido's getting coffee",
      "brb, servers are taking a quick break", 
      "brb, fixing some connection issues",
      "brb, upgrading the love algorithm",
      "brb, Cupido will be right back",
      "brb, just a moment while we reconnect",
      "brb, technical difficulties - hang tight",
      "brb, maintenance mode activated",
    ];

    // Simple random selection - no complex logic for offline mode
    const message = offlineMessages[Math.floor(Math.random() * offlineMessages.length)];

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

      // Development environments - handle localhost, IP addresses, and custom hostnames
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        return `${location.protocol}//${location.hostname}:3001/api/chat`;
      }

      // IP address access (mobile on same network)
      if (location.hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
        return `http://${location.hostname}:3001/api/chat`;
      }

      // Any other hostname (.local, custom domains, tunnels) - use current hostname
      return `http://${location.hostname}:3001/api/chat`;
    }

    const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
    const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

    if (envProxyUrl) {
      return envProxyUrl;
    }

    const buildUrl = (protocol: string, host: string, port: string) => `${protocol}//${host}:${port}/api/chat`;

    // Check for real device vs simulator/emulator detection
    const isRealDevice = !__DEV__ || (Platform.OS === 'ios' && !Constants.isDevice === false);
    
    const manifest2Host = (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
    if (typeof manifest2Host === 'string') {
      const host = manifest2Host.split(':')[0];
      if (host && host !== '127.0.0.1' && host !== 'localhost') {
        // Use actual network IP for real devices
        return buildUrl('http:', host, '3001');
      }
    }

    const debuggerHost = (Constants as any)?.manifest?.debuggerHost || expoExtra?.debuggerHost;
    if (typeof debuggerHost === 'string') {
      const host = debuggerHost.split(':')[0];
      if (host && host !== '127.0.0.1' && host !== 'localhost') {
        // Use actual network IP for real devices
        return buildUrl('http:', host, '3001');
      }
    }

    const hostUri = (Constants as any)?.expoConfig?.hostUri;
    if (typeof hostUri === 'string') {
      const host = hostUri.split(':')[0];
      if (host && host !== '127.0.0.1' && host !== 'localhost') {
        // Use actual network IP for real devices
        return buildUrl('http:', host, '3001');
      }
    }

    // Try to get the development server's actual IP address for real devices
    if (isRealDevice && Platform.OS === 'ios') {
      // For real iOS devices, try to use the development server IP
      // This should be the same IP that the Metro bundler uses
      const devServerUrl = (Constants as any)?.experienceUrl || (Constants as any)?.linkingUrl;
      if (devServerUrl) {
        try {
          const url = new URL(devServerUrl);
          const host = url.hostname;
          if (host && host !== '127.0.0.1' && host !== 'localhost' && !host.includes('exp.host')) {
            return buildUrl('http:', host, '3001');
          }
        } catch (e) {
          console.warn('Failed to parse dev server URL:', devServerUrl);
        }
      }
    }

    // Android emulator uses special loopback address
    if (Platform.OS === 'android' && !isRealDevice) {
      return 'http://10.0.2.2:3001/api/chat';
    }

    // For real Android devices, try to determine network IP
    if (Platform.OS === 'android' && isRealDevice) {
      // Real Android devices should use the development server's IP
      // This will be set by Expo when connecting to the dev server
      const devUrl = (Constants as any)?.experienceUrl;
      if (devUrl) {
        try {
          const url = new URL(devUrl);
          const host = url.hostname;
          if (host && host !== '127.0.0.1' && host !== 'localhost') {
            return buildUrl('http:', host, '3001');
          }
        } catch (e) {
          console.warn('Failed to parse Android dev URL:', devUrl);
        }
      }
    }

    // iOS simulator and other fallbacks
    return 'http://127.0.0.1:3001/api/chat';
  }
}

export const chatAiService = new ChatAiService();
