// Simple direct chat service that works exactly like the HTML test
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { debugLog, debugError } from '../config/environment';

function resolveProxyUrl(): string {
  const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
  const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

  if (envProxyUrl) {
    debugLog('Using environment proxy URL:', envProxyUrl);
    // FIXED: Check if URL already ends with /api/chat
    if (envProxyUrl.endsWith('/api/chat')) {
      return envProxyUrl;
    }
    return `${envProxyUrl}/api/chat`;
  }

  // Check if we're in a web browser environment (works for both desktop and mobile browsers)
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    const hostname = window.location.hostname;
    debugLog('Browser detected - hostname:', hostname);

    // Check if we're on Netlify production
    if (hostname === 'cupido-dating-app.netlify.app' ||
        hostname.includes('netlify.app')) {
      // Use Netlify function for production
      debugLog('Production environment detected - using Netlify function');
      return '/.netlify/functions/chat';
    }
    // Use appropriate host for development
    debugLog('Development environment detected');
    // If accessed via IP address (mobile on same network), use that IP
    // Otherwise use localhost for desktop development
    if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
      // Accessed via IP address (e.g., 192.168.0.101)
      debugLog('Accessed via IP address:', hostname);
      return `http://${hostname}:3001/api/chat`;
    } else {
      // Accessed via localhost
      debugLog('Accessed via localhost');
      return 'http://localhost:3001/api/chat'; // Allow localhost
    }
  }

  // Fallback for React Native environments
  debugLog('React Native environment detected - Platform.OS:', Platform.OS);
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/chat';
  }

  // iOS simulator and others
  return 'http://127.0.0.1:3001/api/chat';
}

export async function callClaudeDirectly(userMessage: string, conversationHistory: any[] = []) {
  debugLog('🎯🎯🎯 SIMPLE DIRECT CLAUDE CALL 🎯🎯🎯');
  debugLog('📨 User sent:', userMessage);
  debugLog('🕐 Time:', new Date().toISOString());
  
  const messages = [
    {
      role: 'system',
      content: `You are a warm, curious friend chatting with someone you're interested in getting to know better. This is a casual dating app conversation.

Be natural and engaging:
- Show genuine interest in what they share
- Ask thoughtful follow-up questions
- React with enthusiasm when appropriate
- Keep responses conversational (1-2 sentences usually)
- Mix questions with relatable comments
- Match their energy level
- Avoid being clinical or overly formal`
    },
    ...conversationHistory,
    { role: 'user', content: userMessage }
  ];
  
  const proxyUrl = resolveProxyUrl();
  
  try {
    debugLog('📡 Calling proxy at:', proxyUrl);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages,
        modelType: 'haiku'
      })
    });
    
    debugLog('📥 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    debugLog('✅ Got Claude response:', data.message);
    
    return {
      message: data.message,
      usedModel: 'haiku',
      success: true
    };
    
  } catch (error: any) {
    debugError('❌❌❌ SIMPLE SERVICE FAILED ❌❌❌');
    debugError('Error name:', error.name);
    debugError('Error message:', error.message);
    debugError('Error stack:', error.stack);
    debugError('Full error:', error);
    return {
      message: "I'm having trouble connecting right now. What would you like to talk about?",
      usedModel: undefined,
      success: false
    };
  }
}