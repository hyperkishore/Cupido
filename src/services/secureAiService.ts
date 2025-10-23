// Secure AI Service - Uses server proxy instead of direct API calls
// This replaces direct Anthropic API calls in the client

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiResponse {
  message: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  model: string;
  remaining_today?: number;
}

class SecureAiService {
  private baseUrl: string;

  constructor() {
    // Use your server URL
    this.baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  }

  async sendMessage(
    messages: ChatMessage[], 
    userId: string,
    model: 'haiku' | 'sonnet' = 'haiku'
  ): Promise<AiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          userId,
          model
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Handle specific error cases
        if (response.status === 429) {
          if (error.error?.includes('Daily message limit')) {
            throw new Error('You\'ve reached your daily limit of 50 messages. Come back tomorrow! 💙');
          } else {
            throw new Error('Please slow down a bit! Try again in a few seconds.');
          }
        }
        
        throw new Error(error.error || 'Failed to get response');
      }

      return await response.json();
    } catch (error) {
      console.error('AI service error:', error);
      
      // Friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('fetch')) {
          throw new Error('Connection issue. Please check your internet.');
        }
        throw error;
      }
      
      throw new Error('Something went wrong. Please try again.');
    }
  }

  // Fallback response for errors
  getFallbackResponse(): string {
    const fallbacks = [
      "I'm having a bit of trouble right now. Could you try asking again?",
      "Sorry, I couldn't process that. Let's try once more?",
      "Hmm, something didn't work. Mind rephrasing that?",
      "I'm experiencing some technical difficulties. One more try?",
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Check if we should use expensive model
  shouldUseSonnet(messageCount: number, messageContent: string): boolean {
    // Use Sonnet for complex questions or after several messages
    const isComplex = messageContent.length > 200 || 
                     messageContent.includes('?') && messageContent.split('?').length > 2;
    
    const isDeepConversation = messageCount > 10;
    
    return isComplex || isDeepConversation;
  }
}

export const secureAiService = new SecureAiService();

// Usage in your chat component:
/*
import { secureAiService } from './secureAiService';

// Instead of calling Anthropic directly:
try {
  const response = await secureAiService.sendMessage(
    messages,
    userId,
    'haiku'
  );
  
  // Show remaining messages
  if (response.remaining_today !== undefined) {
    console.log(`Messages remaining today: ${response.remaining_today}`);
  }
  
  return response.message;
} catch (error) {
  // Show user-friendly error
  showToast(error.message, 'error');
  return secureAiService.getFallbackResponse();
}
*/