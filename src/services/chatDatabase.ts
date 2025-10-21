import { supabase } from './supabase';
import { DEMO_MODE } from '../config/demo';

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

export interface ImageAttachment {
  id: string;
  message_id?: string;
  conversation_id: string;
  user_id: string;
  image_data: string;  // Base64 encoded
  mime_type: string;
  file_size?: number;
  width?: number;
  height?: number;
  ai_analysis?: string;
  ai_analysis_metadata?: any;
  created_at: string;
  analyzed_at?: string;
  metadata?: any;
}

class ChatDatabaseService {
  // Get or create user profile
  async getOrCreateUser(phoneNumber: string, name?: string, isDemo?: boolean): Promise<UserProfile | null> {
    try {
      console.log(`👤 Looking for user with phone: ${phoneNumber}${isDemo ? ' (Demo User)' : ''}`);
      console.log('🔍 Query parameters:', { phoneNumber, name, isDemo });

      // First try to get existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', phoneNumber)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors
      
      console.log('📊 Query result:', { existingUser, fetchError });

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
        console.log(`📝 Creating new ${isDemo ? 'DEMO' : ''} user with phone: ${phoneNumber}`);

        // First, try to insert the user
        const { data: insertData, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            phone_number: phoneNumber,
            name: name || `User ${phoneNumber.slice(-4)}`,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString()
          }])
          .select();

        if (insertError) {
          console.error('Error creating user:', insertError);
          return null;
        }

        // Check if we got data back from insert
        const newUser = insertData?.[0];

        if (!newUser) {
          console.error('❌ User creation succeeded but returned null/empty data');

          // Try to fetch the user we just created as a fallback
          console.log('🔍 Attempting to fetch the newly created user...');
          const { data: fetchedUser, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', phoneNumber)
            .maybeSingle();

          if (refetchError) {
            console.error('Error fetching newly created user:', refetchError);
            return null;
          }

          if (fetchedUser) {
            console.log(`✅ Found newly created user on refetch: ${fetchedUser.id} (${fetchedUser.name})`);
            return fetchedUser;
          }

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

        // First, try to insert the conversation
        const { data: insertData, error: insertError } = await supabase
          .from('chat_conversations')
          .insert([{
            user_id: userId,
            title: 'Daily Reflection Chat',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }])
          .select();

        if (insertError) {
          console.error('Error creating conversation:', insertError);
          return null;
        }

        // Check if we got data back from insert
        const newConv = insertData?.[0];

        if (!newConv) {
          console.error('❌ Conversation creation succeeded but returned null/empty data');

          // Try to fetch the conversation we just created as a fallback
          console.log('🔍 Attempting to fetch the newly created conversation...');
          const { data: fetchedConv, error: refetchError } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (refetchError) {
            console.error('Error fetching newly created conversation:', refetchError);
            return null;
          }

          if (fetchedConv) {
            console.log(`✅ Found newly created conversation on refetch: ${fetchedConv.id}`);
            return fetchedConv;
          }

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
        console.error('Error saving message:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          fullError: error
        });
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
        console.error('Error fetching conversations:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          userId: userId,
          fullError: error
        });
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

  // Delete all user data (requires valid Supabase UUID)
  async deleteAllUserData(userId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Starting to delete all data for Supabase user: ${userId}`);
      console.log(`🔍 Database client mode: ${DEMO_MODE ? 'DEMO (fake operations)' : 'REAL (actual Supabase)'}`);
      
      // Check if we're using demo client which won't actually delete anything
      if (DEMO_MODE) {
        console.warn('⚠️ WARNING: Using demo Supabase client - deletions will be fake!');
      }
      
      // Validate this is a proper Supabase UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        console.error('❌ Invalid UUID format for user deletion (expected Supabase UUID):', userId);
        console.error('❌ This function should only be called with valid Supabase UUIDs, not local identifiers');
        return false;
      }
      
      console.log('✅ Valid Supabase UUID confirmed, proceeding with deletion...');

      // Get all user conversations
      const conversations = await this.getUserConversations(userId);
      const conversationIds = conversations.map(c => c.id);

      if (conversationIds.length > 0) {
        console.log(`🔍 Found ${conversationIds.length} conversations to delete:`, conversationIds);
        
        // Delete all messages in user's conversations
        console.log(`🗑️ Step 1: Deleting messages for conversations...`);
        const { data: deletedMessages, error: messagesError } = await supabase
          .from('chat_messages')
          .delete()
          .in('conversation_id', conversationIds)
          .select();

        if (messagesError) {
          console.error('❌ Error deleting messages:', {
            code: messagesError.code,
            message: messagesError.message,
            details: messagesError.details,
            hint: messagesError.hint,
            conversationIds: conversationIds,
            fullError: messagesError
          });
          return false;
        }

        console.log(`✅ Deleted ${deletedMessages?.length || 0} messages for ${conversationIds.length} conversations`);

        // Delete all conversations
        console.log(`🗑️ Step 2: Deleting conversations...`);
        const { data: deletedConversations, error: conversationsError } = await supabase
          .from('chat_conversations')
          .delete()
          .eq('user_id', userId)
          .select();

        if (conversationsError) {
          console.error('❌ Error deleting conversations:', {
            code: conversationsError.code,
            message: conversationsError.message,
            details: conversationsError.details,
            hint: conversationsError.hint,
            userId: userId,
            fullError: conversationsError
          });
          return false;
        }

        console.log(`✅ Deleted ${deletedConversations?.length || 0} conversations for user`);
      } else {
        console.log(`ℹ️ No conversations found for user ${userId}`);
      }

      // Delete the user profile
      console.log(`🗑️ Step 3: Deleting user profile...`);
      const { data: deletedProfile, error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)
        .select();

      if (profileError) {
        console.error('❌ Error deleting profile:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          userId: userId,
          fullError: profileError
        });
        return false;
      }

      console.log(`✅ Deleted ${deletedProfile?.length || 0} user profile records`);
      if (deletedProfile && deletedProfile.length > 0) {
        console.log(`🔍 Deleted profile details:`, deletedProfile[0]);
      } else {
        console.warn(`⚠️ No profile records were deleted for user ${userId}`);
      }

      // Verify deletion by checking if records still exist
      console.log(`🔍 Verifying deletion - checking if records still exist...`);
      
      const remainingConversations = await this.getUserConversations(userId);
      console.log(`🔍 Remaining conversations after deletion: ${remainingConversations.length}`);
      
      const { data: remainingProfile, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (verifyError) {
        console.log(`🔍 Error checking remaining profile:`, verifyError);
      } else {
        console.log(`🔍 Remaining profile after deletion:`, remainingProfile ? 'EXISTS' : 'DELETED');
      }
      
      if (remainingConversations.length > 0 || remainingProfile) {
        console.error(`❌ DELETION FAILED: Records still exist after deletion attempt`);
        console.error(`- Remaining conversations: ${remainingConversations.length}`);
        console.error(`- Profile still exists: ${remainingProfile ? 'YES' : 'NO'}`);
        return false;
      }

      console.log(`✅ Successfully deleted all data for user: ${userId}`);
      return true;

    } catch (error) {
      console.error('Error in deleteAllUserData:', error);
      return false;
    }
  }

  // ============================================
  // IMAGE ATTACHMENT METHODS
  // ============================================

  // Save an image attachment
  async saveImageAttachment(
    conversationId: string,
    userId: string,
    imageData: string,
    mimeType: string,
    messageId?: string,
    metadata?: {
      width?: number;
      height?: number;
      fileName?: string;
      originalSize?: number;
      compressedSize?: number;
      [key: string]: any;
    }
  ): Promise<ImageAttachment | null> {
    try {
      console.log('💾 Saving image attachment:', {
        conversationId,
        userId,
        mimeType,
        messageId,
        metadataKeys: metadata ? Object.keys(metadata) : []
      });

      // Use provided file size or calculate from base64
      const fileSize = metadata?.compressedSize || Math.ceil((imageData.length * 3) / 4);

      const { data, error } = await supabase
        .from('image_attachments')
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          message_id: messageId,
          image_data: imageData,
          mime_type: mimeType,
          file_size: fileSize,
          width: metadata?.width,
          height: metadata?.height,
          metadata: {
            fileName: metadata?.fileName,
            originalSize: metadata?.originalSize,
            compressedSize: metadata?.compressedSize,
            uploadedAt: new Date().toISOString(),
            ...metadata
          },
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving image attachment:', error);
        return null;
      }

      console.log(`✅ Saved image attachment: ${data.id}`);
      return data;
    } catch (error) {
      console.error('Error in saveImageAttachment:', error);
      return null;
    }
  }

  // Get image attachments for a conversation
  async getImageAttachments(conversationId: string, limit: number = 50): Promise<ImageAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('image_attachments')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching image attachments:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getImageAttachments:', error);
      return [];
    }
  }

  // Get a single image attachment by ID
  async getImageAttachment(imageId: string): Promise<ImageAttachment | null> {
    try {
      const { data, error } = await supabase
        .from('image_attachments')
        .select('*')
        .eq('id', imageId)
        .single();

      if (error) {
        console.error('Error fetching image attachment:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getImageAttachment:', error);
      return null;
    }
  }

  // Update image analysis after Claude processes it
  async updateImageAnalysis(
    imageId: string,
    aiAnalysis: string,
    analysisMetadata?: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('image_attachments')
        .update({
          ai_analysis: aiAnalysis,
          ai_analysis_metadata: analysisMetadata,
          analyzed_at: new Date().toISOString(),
        })
        .eq('id', imageId);

      if (error) {
        console.error('Error updating image analysis:', error);
        return false;
      }

      console.log(`✅ Updated image analysis for: ${imageId}`);
      return true;
    } catch (error) {
      console.error('Error in updateImageAnalysis:', error);
      return false;
    }
  }

  // Update image attachment with additional data (like message_id)
  async updateImageAttachment(
    imageId: string,
    updates: Partial<ImageAttachment>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('image_attachments')
        .update(updates)
        .eq('id', imageId);

      if (error) {
        console.error('Error updating image attachment:', error);
        return false;
      }

      console.log(`✅ Updated image attachment: ${imageId}`);
      return true;
    } catch (error) {
      console.error('Error in updateImageAttachment:', error);
      return false;
    }
  }

  // Get image attachments for a specific message
  async getMessageImages(messageId: string): Promise<ImageAttachment[]> {
    try {
      const { data, error } = await supabase
        .from('image_attachments')
        .select('*')
        .eq('message_id', messageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching message images:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMessageImages:', error);
      return [];
    }
  }

  // Clear all messages for a specific conversation (used in simulator mode)
  async clearConversationMessages(conversationId: string): Promise<boolean> {
    try {
      console.log(`🗑️ Clearing all messages for conversation: ${conversationId}`);

      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error clearing conversation messages:', error);
        return false;
      }

      console.log(`✅ Cleared all messages for conversation: ${conversationId}`);
      return true;
    } catch (error) {
      console.error('Error in clearConversationMessages:', error);
      return false;
    }
  }
}

export const chatDatabase = new ChatDatabaseService();