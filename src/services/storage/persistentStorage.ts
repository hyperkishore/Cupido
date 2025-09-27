import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ChatMessage {
  id: string;
  questionId?: string;
  question: string;
  answer: string;
  timestamp: string;
  mood?: string;
  tags?: string[];
  summary?: string;
  insights?: string[];
  isBot: boolean;
  metadata?: any;
}

interface UserActivity {
  id: string;
  type: 'like' | 'view' | 'share' | 'comment';
  contentId: string;
  contentType: 'reflection' | 'prompt' | 'connector';
  timestamp: string;
  metadata?: any;
}

interface UserProfile {
  id: string;
  phoneNumber: string;
  name?: string;
  bio?: string;
  createdAt: string;
  lastActive: string;
  preferences?: any;
  personalityTraits?: any;
}

interface UserSession {
  userId: string;
  profile: UserProfile;
  chatHistory: ChatMessage[];
  activities: UserActivity[];
  reflectionCount: number;
  lastReflectionDate?: string;
  conversationContext: {
    recentTopics: string[];
    emotionalTone: string;
    engagementLevel: number;
  };
}

class PersistentStorageService {
  private readonly STORAGE_KEYS = {
    USER_SESSION: 'cupido_user_session',
    CHAT_HISTORY: 'cupido_chat_history',
    USER_ACTIVITIES: 'cupido_user_activities',
    USER_PROFILE: 'cupido_user_profile',
    CONVERSATION_CONTEXT: 'cupido_conversation_context',
  };

  // Initialize storage with user ID
  async initializeUserStorage(userId: string): Promise<UserSession> {
    try {
      const key = `${this.STORAGE_KEYS.USER_SESSION}_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      
      if (stored) {
        return JSON.parse(stored);
      }

      // Create new session
      const newSession: UserSession = {
        userId,
        profile: {
          id: userId,
          phoneNumber: userId,
          createdAt: new Date().toISOString(),
          lastActive: new Date().toISOString(),
        },
        chatHistory: [],
        activities: [],
        reflectionCount: 0,
        conversationContext: {
          recentTopics: [],
          emotionalTone: 'neutral',
          engagementLevel: 0,
        },
      };

      await this.saveUserSession(userId, newSession);
      return newSession;
    } catch (error) {
      console.error('Error initializing user storage:', error);
      throw error;
    }
  }

  // Save entire user session
  async saveUserSession(userId: string, session: UserSession): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.USER_SESSION}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(session));
    } catch (error) {
      console.error('Error saving user session:', error);
    }
  }

  // Get user session
  async getUserSession(userId: string): Promise<UserSession | null> {
    try {
      const key = `${this.STORAGE_KEYS.USER_SESSION}_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  // Add chat message
  async addChatMessage(userId: string, message: ChatMessage): Promise<void> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return;

      // Add to chat history
      session.chatHistory.push(message);
      
      // Keep last 1000 messages
      if (session.chatHistory.length > 1000) {
        session.chatHistory = session.chatHistory.slice(-1000);
      }

      // Update conversation context
      if (!message.isBot && message.answer) {
        // Update recent topics
        if (message.tags && message.tags.length > 0) {
          session.conversationContext.recentTopics = [
            ...new Set([...message.tags, ...session.conversationContext.recentTopics])
          ].slice(0, 10);
        }

        // Update engagement level
        session.conversationContext.engagementLevel = Math.min(
          100,
          session.conversationContext.engagementLevel + 5
        );

        // Update reflection count
        session.reflectionCount++;
        session.lastReflectionDate = new Date().toISOString();
      }

      // Update last active
      session.profile.lastActive = new Date().toISOString();

      await this.saveUserSession(userId, session);
    } catch (error) {
      console.error('Error adding chat message:', error);
    }
  }

  // Get chat history with optional limit
  async getChatHistory(userId: string, limit?: number): Promise<ChatMessage[]> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return [];

      if (limit) {
        return session.chatHistory.slice(-limit);
      }
      return session.chatHistory;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  // Get conversation context for AI
  async getConversationContext(userId: string): Promise<any> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return null;

      // Get last 10 messages for immediate context
      const recentMessages = session.chatHistory.slice(-10);
      
      // Get user's personality traits from activities
      const likedContent = session.activities
        .filter(a => a.type === 'like')
        .slice(-50);

      return {
        recentMessages,
        recentTopics: session.conversationContext.recentTopics,
        emotionalTone: session.conversationContext.emotionalTone,
        engagementLevel: session.conversationContext.engagementLevel,
        reflectionCount: session.reflectionCount,
        lastReflectionDate: session.lastReflectionDate,
        userPreferences: session.profile.preferences || {},
        likedContentTypes: likedContent.map(l => l.contentType),
        totalInteractions: session.activities.length,
      };
    } catch (error) {
      console.error('Error getting conversation context:', error);
      return null;
    }
  }

  // Track user activity
  async trackActivity(userId: string, activity: UserActivity): Promise<void> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return;

      session.activities.push(activity);
      
      // Keep last 500 activities
      if (session.activities.length > 500) {
        session.activities = session.activities.slice(-500);
      }

      // Update engagement based on activity
      if (activity.type === 'like') {
        session.conversationContext.engagementLevel = Math.min(
          100,
          session.conversationContext.engagementLevel + 2
        );
      }

      await this.saveUserSession(userId, session);
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  // Get user activities
  async getUserActivities(userId: string, type?: string): Promise<UserActivity[]> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return [];

      if (type) {
        return session.activities.filter(a => a.type === type);
      }
      return session.activities;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const session = await this.getUserSession(userId);
      if (!session) return;

      session.profile = {
        ...session.profile,
        ...updates,
        lastActive: new Date().toISOString(),
      };

      await this.saveUserSession(userId, session);
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Get insights for better conversation
  async getConversationInsights(userId: string): Promise<{
    favoriteTopics: string[];
    bestTimeToEngage: string;
    averageResponseLength: number;
    emotionalPattern: string;
    engagementTrend: string;
  }> {
    try {
      const session = await this.getUserSession(userId);
      if (!session || session.chatHistory.length === 0) {
        return {
          favoriteTopics: [],
          bestTimeToEngage: 'anytime',
          averageResponseLength: 0,
          emotionalPattern: 'neutral',
          engagementTrend: 'new',
        };
      }

      // Analyze chat history
      const userMessages = session.chatHistory.filter(m => !m.isBot);
      
      // Calculate average response length
      const avgLength = userMessages.length > 0
        ? userMessages.reduce((sum, m) => sum + (m.answer?.length || 0), 0) / userMessages.length
        : 0;

      // Determine engagement trend
      const recentEngagement = session.activities.slice(-20).length;
      const engagementTrend = recentEngagement > 15 ? 'high' : 
                             recentEngagement > 8 ? 'medium' : 'low';

      return {
        favoriteTopics: session.conversationContext.recentTopics.slice(0, 5),
        bestTimeToEngage: this.calculateBestEngagementTime(session.chatHistory),
        averageResponseLength: Math.round(avgLength),
        emotionalPattern: session.conversationContext.emotionalTone,
        engagementTrend,
      };
    } catch (error) {
      console.error('Error getting conversation insights:', error);
      return {
        favoriteTopics: [],
        bestTimeToEngage: 'anytime',
        averageResponseLength: 0,
        emotionalPattern: 'neutral',
        engagementTrend: 'new',
      };
    }
  }

  private calculateBestEngagementTime(messages: ChatMessage[]): string {
    if (messages.length === 0) return 'anytime';
    
    // Group messages by hour
    const hourCounts: Record<number, number> = {};
    messages.forEach(m => {
      const hour = new Date(m.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Find peak hour
    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];
    
    if (!peakHour) return 'anytime';
    
    const hour = parseInt(peakHour[0]);
    if (hour < 6) return 'late night';
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    if (hour < 21) return 'evening';
    return 'night';
  }

  // Clear all data for a user
  async clearUserData(userId: string): Promise<void> {
    try {
      const key = `${this.STORAGE_KEYS.USER_SESSION}_${userId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  // Export user data (for GDPR compliance)
  async exportUserData(userId: string): Promise<UserSession | null> {
    return this.getUserSession(userId);
  }
}

export const persistentStorage = new PersistentStorageService();