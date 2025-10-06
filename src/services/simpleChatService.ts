// Simple direct chat service that works exactly like the HTML test
import { Platform } from 'react-native';
import Constants from 'expo-constants';

function resolveProxyUrl(): string {
  const expoExtra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra ?? {};
  const envProxyUrl = process.env.EXPO_PUBLIC_AI_PROXY_URL || expoExtra?.aiProxyUrl;

  if (envProxyUrl) {
    return `${envProxyUrl}/api/chat`;
  }

  // Web platform
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    // Check if we're on Netlify production
    if (window.location.hostname === 'cupido-dating-app.netlify.app' ||
        window.location.hostname.includes('netlify.app')) {
      // Use Netlify function for production
      return '/.netlify/functions/chat';
    }
    // Use localhost for development
    return 'http://localhost:3001/api/chat';
  }

  // Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001/api/chat';
  }

  // iOS simulator and others
  return 'http://127.0.0.1:3001/api/chat';
}

export async function callClaudeDirectly(userMessage: string, conversationHistory: any[] = []) {
  console.log('🎯🎯🎯 SIMPLE DIRECT CLAUDE CALL 🎯🎯🎯');
  console.log('📨 User sent:', userMessage);
  console.log('🕐 Time:', new Date().toISOString());
  
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
    console.log('📡 Calling proxy at:', proxyUrl);
    
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
    
    console.log('📥 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Got Claude response:', data.message);
    
    return {
      message: data.message,
      usedModel: 'haiku',
      success: true
    };
    
  } catch (error: any) {
    console.error('❌❌❌ SIMPLE SERVICE FAILED ❌❌❌');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    return {
      message: "I'm having trouble connecting right now. What would you like to talk about?",
      usedModel: undefined,
      success: false
    };
  }
}