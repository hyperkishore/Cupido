import { supabase } from './supabase';

export interface ChatConversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  content: string;
  is_bot: boolean;
  ai_model?: 'haiku' | 'sonnet';
  metadata?: {
    mood?: string;
    tags?: string[];
    response_time?: number;
    token_count?: number;
  };
  created_at: string;
}

export interface UserProfile {
  id: string;
  phone_number?: string;
  name?: string;
  created_at: string;
  last_active?: string;
}

class ChatDatabaseService {
  // Get or create user profile
  async getOrCreateUser(phoneNumber: string, name?: string): Promise<UserProfile | null> {
    try {
      console.log(`👤 Looking for user with phone: ${phoneNumber}`);

      // First try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

      if (existingUser && !fetchError) {
        console.log(`✅ Found existing user: ${existingUser.id} (${existingUser.name})`);
        // Update last_active
        await supabase
          .from('profiles')
          .update({ last_active: new Date().toISOString() })
          .eq('id', existingUser.id);

        return existingUser;
      }

      // Create new user if not found (PGRST116 = no rows returned, which is expected)
      if (!existingUser && (!fetchError || fetchError.code === 'PGRST116')) {
        console.log(`📝 Creating new user with phone: ${phoneNumber}`);
        const { data: newUser, error: createError } = await supabase
          .from('profiles')
          .insert({
            phone_number: phoneNumber,
            name: name || `User ${phoneNumber.slice(-4)}`,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating user:', createError);
          return null;
        }

        console.log(`✅ Created new user: ${newUser.id} (${newUser.name})`);
        return newUser;
      }

      // If we got here with an error, log it
      if (fetchError) {
        console.error('Unexpected error fetching user:', fetchError);
      }

      return null;
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      return null;
    }
  }

  // Get or create conversation for user
  async getOrCreateConversation(userId: string): Promise<ChatConversation | null> {
    try {
      console.log(`🔍 Looking for conversation for user: ${userId}`);

      // First try to get existing conversation
      const { data: existingConv, error: fetchError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors

      if (existingConv && !fetchError) {
        console.log(`✅ Found existing conversation: ${existingConv.id}`);
        return existingConv;
      }

      // Create new conversation if not found (PGRST116 = no rows returned, which is expected)
      if (!existingConv && (!fetchError || fetchError.code === 'PGRST116')) {
        console.log(`📝 Creating new conversation for user: ${userId}`);
        const { data: newConv, error: createError } = await supabase
          .from('chat_conversations')
          .insert({
            user_id: userId,
            title: 'Daily Reflection Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating conversation:', createError);
          return null;
        }

        console.log(`✅ Created new conversation: ${newConv.id}`);
        return newConv;
      }

      // If we got here with an error, log it
      if (fetchError) {
        console.error('Unexpected error fetching conversation:', fetchError);
      }

      return null;
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return null;
    }
  }

  // Save a chat message
  async saveMessage(
    conversationId: string,
    content: string,
    isBot: boolean,
    aiModel?: 'haiku' | 'sonnet',
    metadata?: any
  ): Promise<ChatMessage | null> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          content,
          is_bot: isBot,
          ai_model: aiModel,
          metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
        return null;
      }

      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return null;
    }
  }

  // Get chat history for a conversation
  async getChatHistory(conversationId: string, limit: number = 200): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  }

  // Get recent conversations for a user
  async getUserConversations(userId: string): Promise<ChatConversation[]> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserConversations:', error);
      return [];
    }
  }

  // Subscribe to real-time message updates
  subscribeToMessages(conversationId: string, callback: (message: ChatMessage) => void) {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as ChatMessage);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }

  // Get chat analytics
  async getChatAnalytics(userId: string): Promise<{
    totalMessages: number;
    totalConversations: number;
    averageResponseTime: number;
    modelUsage: { haiku: number; sonnet: number };
  }> {
    try {
      // Get all user conversations
      const conversations = await this.getUserConversations(userId);
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length === 0) {
        return {
          totalMessages: 0,
          totalConversations: 0,
          averageResponseTime: 0,
          modelUsage: { haiku: 0, sonnet: 0 },
        };
      }

      // Get all messages for user conversations
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .in('conversation_id', conversationIds);

      if (error || !messages) {
        throw error;
      }

      // Calculate analytics
      const totalMessages = messages.length;
      const totalConversations = conversations.length;

      const modelUsage = messages.reduce(
        (acc, msg) => {
          if (msg.ai_model === 'haiku') acc.haiku++;
          else if (msg.ai_model === 'sonnet') acc.sonnet++;
          return acc;
        },
        { haiku: 0, sonnet: 0 }
      );

      const responseTimes = messages
        .filter(msg => msg.metadata?.response_time)
        .map(msg => msg.metadata.response_time);

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      return {
        totalMessages,
        totalConversations,
        averageResponseTime,
        modelUsage,
      };
    } catch (error) {
      console.error('Error getting chat analytics:', error);
      return {
        totalMessages: 0,
        totalConversations: 0,
        averageResponseTime: 0,
        modelUsage: { haiku: 0, sonnet: 0 },
      };
    }
  }

  // Delete all user data
  async deleteAllUserData(userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Starting to delete all data for user: ${userId}`);

      // Get all user conversations
      const conversations = await this.getUserConversations(userId);
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length > 0) {
        // Delete all messages in user's conversations
        const { error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('conversation_id', conversationIds);

        if (messagesError) {
          console.error('Error deleting messages:', messagesError);
          return false;
        }

        console.log(`✅ Deleted all messages for ${conversationIds.length} conversations`);

        // Delete all conversations
        const { error: conversationsError } = await supabase
          .from('chat_conversations')
          .delete()
          .eq('user_id', userId);

        if (conversationsError) {
          console.error('Error deleting conversations:', conversationsError);
          return false;
        }

        console.log(`✅ Deleted all conversations for user`);
      }

      // Delete the user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (profileError) {
        console.error('Error deleting profile:', profileError);
        return false;
      }

      console.log(`✅ Successfully deleted all data for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('Error in deleteAllUserData:', error);
      return false;
    }
  }
}

export const chatDatabase = new ChatDatabaseService();