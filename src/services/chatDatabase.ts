import { supabase } from './supabase';
import { DEMO_MODE } from '../config/demo';

export interface ChatConversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  // Context strategy fields
  conversation_summary?: string;
  summary_token_count?: number;
  total_messages?: number;
  total_tokens?: number;
  last_summary_update?: string;
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
    // Context strategy fields
    estimated_tokens?: number;
    message_type?: 'user' | 'assistant' | 'system' | 'image_upload';
    context_weight?: number; // Importance for summary inclusion
    image_references?: string[]; // [Image:id:1234] style references
  };
  created_at: string;
  // Pre-computed for performance
  estimated_tokens?: number;
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

// CONTEXT STRATEGY: Active memory management interfaces
export interface ConversationTurn {
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  estimatedTokens: number;
  metadata?: {
    imageReferences?: string[];
    contextWeight?: number;
    messageType?: string;
  };
}

export interface ConversationContext {
  conversationId: string;
  // Active memory - most recent turns kept verbatim
  recentTurns: ConversationTurn[];
  // Compressed memory - older context summarized
  conversationSummary: string;
  summaryTokenCount: number;
  // Performance tracking
  totalMessages: number;
  totalTokens: number;
  lastSummaryUpdate: string;
  // Configuration
  maxRecentTurns: number;
  maxTokensBeforeSummary: number;
}

export interface ContextAssembly {
  // For Claude prompt
  systemMemory: string; // conversationSummary
  recentMessages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  // Performance metadata
  totalTokensEstimate: number;
  contextStrategy: 'full' | 'summarized' | 'minimal';
}

class ChatDatabaseService {
  // Get or create user profile
  async getOrCreateUser(phoneNumber: string, name?: string, isDemo?: boolean): Promise<UserProfile | null> {
    try {
      // Import normalizer for consistency
      const { normalizePhoneNumber } = await import('../utils/phoneNormalizer');
      
      // Normalize the phone number for database operations
      // This handles both +E.164 and legacy formats
      const normalizedPhone = normalizePhoneNumber(phoneNumber);
      const dbPhone = normalizedPhone || phoneNumber; // Fallback for demo users
      
      console.log(`👤 Looking for user with phone: ${dbPhone}${isDemo ? ' (Demo User)' : ''}`);
      console.log('🔍 Query parameters:', { original: phoneNumber, normalized: dbPhone, name, isDemo });

      // Try BOTH normalized and original to handle legacy data
      // First try normalized
      let { data: existingUser, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone_number', dbPhone)
        .maybeSingle();
      
      // If not found with normalized, try original (for legacy profiles)
      if (!existingUser && normalizedPhone && normalizedPhone !== phoneNumber) {
        console.log('🔍 Trying original phone format for legacy profiles...');
        const legacyResult = await supabase
          .from('profiles')
          .select('*')
          .eq('phone_number', phoneNumber)
          .maybeSingle();
        
        if (legacyResult.data) {
          existingUser = legacyResult.data;
          fetchError = null;
          console.log('✅ Found legacy profile, will update to normalized format');
          
          // Update the legacy profile to use normalized phone
          await supabase
            .from('profiles')
            .update({ phone_number: dbPhone })
            .eq('id', existingUser.id);
        }
      }
      
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
        console.log(`📝 Creating/updating user with phone: ${dbPhone}`);

        // Use UPSERT to handle race conditions and ensure no duplicates
        const { data: upsertData, error: upsertError } = await supabase
          .from('profiles')
          .upsert({
            phone_number: dbPhone,
            name: name || `User ${phoneNumber.slice(-4)}`,
            last_active: new Date().toISOString()
            // Note: Don't set created_at in upsert - let DB handle it on first insert
          }, {
            onConflict: 'phone_number',  // Update if phone exists
            ignoreDuplicates: false       // We want to update last_active
          })
          .select()
          .single();

        if (upsertError) {
          console.error('Error upserting user:', upsertError);
          
          // Fallback: Try to fetch if upsert failed (maybe constraint issue)
          const { data: fallbackUser } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', dbPhone)
            .maybeSingle();
            
          if (fallbackUser) {
            console.log('✅ Found user via fallback after upsert error');
            return fallbackUser;
          }
          
          return null;
        }

        // Check if we got data back from upsert
        const newUser = upsertData;

        if (!newUser) {
          console.error('❌ User creation succeeded but returned null/empty data');

          // Try to fetch the user we just created as a fallback
          console.log('🔍 Attempting to fetch the newly created user...');
          const { data: fetchedUser, error: refetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone_number', dbPhone)
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
            // Let DB handle timestamps via defaults
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
          metadata
          // Don't set created_at - let database handle it with DEFAULT NOW()
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

      // DB trigger handles conversation timestamp update automatically

      return data;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return null;
    }
  }

  // Get chat history for a conversation with pagination support
  async getChatHistory(conversationId: string, limit: number = 200, beforeTimestamp?: string): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId);
      
      // Add timestamp filter for pagination
      if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false }) // Get newest first for pagination
        .limit(limit);

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      // Reverse to maintain chronological order (oldest first)
      return (data || []).reverse();
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
        const enrichedError: any = new Error(error.message || 'Failed to save image attachment');
        if (error.code) enrichedError.code = error.code;
        if (error.details) enrichedError.details = error.details;
        if (error.hint) enrichedError.hint = error.hint;
        enrichedError.originalError = error;
        throw enrichedError;
      }

      console.log(`✅ Saved image attachment: ${data.id}`);
      return data;
    } catch (error) {
      console.error('Error in saveImageAttachment:', error);
      throw error;
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

  async updateMessageMetadata(messageId: string, metadata: any): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .update({ metadata })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message metadata:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateMessageMetadata:', error);
      return false;
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

  // CONTEXT STRATEGY: Token estimation utility
  estimateTokens(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English
    // More accurate than word count, accounts for punctuation and spaces
    const baseTokens = Math.ceil(text.length / 4);
    
    // Adjust for content type
    const hasCode = /```|`[^`]+`/.test(text);
    const hasEmojis = /[\u{1F300}-\u{1F9FF}]/u.test(text);
    const hasLinks = /https?:\/\//.test(text);
    
    let multiplier = 1.0;
    if (hasCode) multiplier += 0.2; // Code uses more tokens
    if (hasEmojis) multiplier += 0.1; // Emojis can be multiple tokens
    if (hasLinks) multiplier += 0.1; // URLs often tokenize unusually
    
    return Math.ceil(baseTokens * multiplier);
  }

  // CONTEXT STRATEGY: Save message with token estimation
  async saveMessageWithTokens(
    conversationId: string,
    content: string,
    isBot: boolean,
    aiModel?: 'haiku' | 'sonnet',
    metadata?: any
  ): Promise<ChatMessage | null> {
    const estimatedTokens = this.estimateTokens(content);
    
    const enrichedMetadata = {
      ...metadata,
      estimated_tokens: estimatedTokens,
      message_type: isBot ? 'assistant' : 'user',
      context_weight: metadata?.context_weight || 1.0
    };

    return this.saveMessage(conversationId, content, isBot, aiModel, enrichedMetadata);
  }

  // CONTEXT STRATEGY: Update conversation summary
  async updateConversationSummary(
    conversationId: string, 
    summary: string, 
    summaryTokenCount: number,
    totalMessages: number,
    totalTokens: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({
          conversation_summary: summary,
          summary_token_count: summaryTokenCount,
          total_messages: totalMessages,
          total_tokens: totalTokens,
          last_summary_update: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      if (error) {
        console.error('Error updating conversation summary:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateConversationSummary:', error);
      return false;
    }
  }

  // CONTEXT STRATEGY: Get conversation with summary
  async getConversationWithSummary(conversationId: string): Promise<ChatConversation | null> {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation with summary:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getConversationWithSummary:', error);
      return null;
    }
  }

  // CONTEXT STRATEGY: Get messages with token estimates for context building
  async getMessagesForContext(
    conversationId: string, 
    limit: number = 20,
    beforeTimestamp?: string
  ): Promise<ConversationTurn[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select('id, content, is_bot, created_at, estimated_tokens, metadata')
        .eq('conversation_id', conversationId);
      
      if (beforeTimestamp) {
        query = query.lt('created_at', beforeTimestamp);
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching messages for context:', error);
        return [];
      }

      // Convert to ConversationTurn format
      return (data || []).reverse().map(msg => ({
        messageId: msg.id,
        role: msg.is_bot ? 'assistant' : 'user',
        content: msg.content,
        timestamp: msg.created_at,
        estimatedTokens: msg.estimated_tokens || this.estimateTokens(msg.content),
        metadata: {
          imageReferences: msg.metadata?.image_references || [],
          contextWeight: msg.metadata?.context_weight || 1.0,
          messageType: msg.metadata?.message_type
        }
      }));
    } catch (error) {
      console.error('Error in getMessagesForContext:', error);
      return [];
    }
  }
}

export const chatDatabase = new ChatDatabaseService();
