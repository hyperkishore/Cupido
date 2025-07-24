import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Types
export const MatchStatus = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  UNMATCHED: 'unmatched'
};

export const ReportType = {
  SPAM: 'spam',
  INAPPROPRIATE: 'inappropriate',
  FAKE: 'fake',
  HARASSMENT: 'harassment',
  OTHER: 'other'
};

// Auth Service
export const authService = {
  async signInWithPhone(phone, countryCode = '+1') {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: countryCode + phone,
      });
      return { data, error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  },

  async verifyOTP(phone, token, countryCode = '+1') {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: countryCode + phone,
        token,
        type: 'sms',
      });
      
      if (data?.user) {
        // Create or update user profile
        await this.createOrUpdateUser(data.user);
      }
      
      return { data, error };
    } catch (error) {
      console.error('OTP verification error:', error);
      return { error };
    }
  },

  async createOrUpdateUser(authUser) {
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: authUser.id,
        phone_number: authUser.phone,
        last_active: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });
    
    return { data, error };
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Reflections Service
export const reflectionsService = {
  async saveReflection(questionId, answer, authenticityScore = 0, isVoice = false, voiceUrl = null) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const reflection = {
      user_id: user.id,
      question_id: questionId,
      answer,
      authenticity_score: authenticityScore,
      word_count: answer.split(' ').length,
      is_voice_note: isVoice,
      voice_url: voiceUrl,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reflections')
      .insert(reflection)
      .select()
      .single();

    if (!error) {
      // Update user streak
      await this.updateUserStreak(user.id);
    }

    return { data, error };
  },

  async updateUserStreak(userId) {
    // Call stored procedure to update streak
    const { data, error } = await supabase
      .rpc('update_user_streak', { p_user_id: userId });
    
    return { data, error };
  },

  async getUserReflections(userId = null, limit = 20, offset = 0) {
    const user = userId || (await authService.getCurrentUser())?.id;
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reflections')
      .select(`
        *,
        questions (
          question,
          category
        )
      `)
      .eq('user_id', user)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async getPublicReflections(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('qa_posts')
      .select(`
        *,
        users (
          display_name,
          profile_photo_url
        ),
        questions (
          question,
          category
        )
      `)
      .eq('is_moderated', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async likeReflection(qaPostId) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        qa_post_id: qaPostId
      });

    if (!error) {
      // Update likes count
      await supabase
        .from('qa_posts')
        .update({ likes: supabase.raw('likes + 1') })
        .eq('id', qaPostId);
    }

    return { data, error };
  },

  async skipQuestion(questionId, reason) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('reflections')
      .insert({
        user_id: user.id,
        question_id: questionId,
        answer: '',
        skip_reason: reason,
        authenticity_score: 0
      });

    return { data, error };
  }
};

// Matching Service
export const matchingService = {
  async findMatches(limit = 10) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Call the matching function
    const { data, error } = await supabase
      .rpc('find_compatible_matches', {
        p_user_id: user.id,
        p_limit: limit
      });

    return { data, error };
  },

  async getActiveMatches() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        user1:users!user1_id (
          id,
          display_name,
          profile_photo_url,
          bio
        ),
        user2:users!user2_id (
          id,
          display_name,
          profile_photo_url,
          bio
        )
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'accepted')
      .order('last_interaction', { ascending: false });

    // Format matches to always show the other user
    const formattedMatches = data?.map(match => ({
      ...match,
      otherUser: match.user1_id === user.id ? match.user2 : match.user1
    }));

    return { data: formattedMatches, error };
  },

  async respondToMatch(matchId, accept) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const status = accept ? 'accepted' : 'rejected';
    
    // Get the match to determine which user is responding
    const { data: match } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', matchId)
      .single();

    if (!match) throw new Error('Match not found');

    const updateField = match.user1_id === user.id ? 'user1_status' : 'user2_status';
    
    const { data, error } = await supabase
      .from('matches')
      .update({
        [updateField]: status,
        status: accept ? 'accepted' : status,
        matched_at: accept ? new Date().toISOString() : null
      })
      .eq('id', matchId);

    return { data, error };
  },

  async unmatch(matchId, reason = null) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('matches')
      .update({
        status: 'unmatched',
        unmatch_reason: reason,
        unmatched_at: new Date().toISOString()
      })
      .eq('id', matchId);

    return { data, error };
  }
};

// Messaging Service
export const messagingService = {
  async sendMessage(matchId, content, type = 'text', mediaUrl = null) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const message = {
      match_id: matchId,
      sender_id: user.id,
      content,
      message_type: type,
      media_url: mediaUrl,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('messages')
      .insert(message)
      .select()
      .single();

    if (!error) {
      // Update last interaction
      await supabase
        .from('matches')
        .update({ 
          last_interaction: new Date().toISOString(),
          interaction_count: supabase.raw('interaction_count + 1')
        })
        .eq('id', matchId);
    }

    return { data, error };
  },

  async getMessages(matchId, limit = 50, before = null) {
    const query = supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id (
          id,
          display_name,
          profile_photo_url
        )
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (before) {
      query.lt('created_at', before);
    }

    const { data, error } = await query;
    
    // Reverse to show oldest first
    return { data: data?.reverse(), error };
  },

  async markMessagesAsRead(matchId) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .is('read_at', null);

    return { data, error };
  },

  subscribeToMessages(matchId, callback) {
    return supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, callback)
      .subscribe();
  }
};

// Moderation Service
export const moderationService = {
  async reportUser(reportedUserId, reportType, description, evidenceUrls = []) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const report = {
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      report_type: reportType,
      description,
      evidence_urls: evidenceUrls,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reports')
      .insert(report);

    return { data, error };
  },

  async reportContent(contentId, contentType, reportType, description) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const report = {
      reporter_id: user.id,
      reported_content_id: contentId,
      content_type: contentType,
      report_type: reportType,
      description,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('reports')
      .insert(report);

    return { data, error };
  },

  async blockUser(blockedUserId, reason = null) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: blockedUserId,
        reason,
        created_at: new Date().toISOString()
      });

    return { data, error };
  },

  async getBlockedUsers() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_blocks')
      .select(`
        *,
        blocked:users!blocked_id (
          id,
          display_name,
          profile_photo_url
        )
      `)
      .eq('blocker_id', user.id);

    return { data, error };
  }
};

// Notification Service
export const notificationService = {
  async getNotifications(limit = 20, offset = 0) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async markAsRead(notificationIds) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in('id', notificationIds)
      .eq('user_id', user.id);

    return { data, error };
  },

  async updateNotificationPreferences(preferences) {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .update({ 
        notification_settings: preferences
      })
      .eq('id', user.id);

    return { data, error };
  },

  subscribeToNotifications(callback) {
    const user = authService.getCurrentUser();
    if (!user) return null;

    return supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, callback)
      .subscribe();
  }
};

// Analytics Service
export const analyticsService = {
  async trackEvent(eventName, eventData = {}) {
    const user = await authService.getCurrentUser();
    
    const event = {
      user_id: user?.id,
      event_name: eventName,
      event_data: eventData,
      platform: 'web',
      created_at: new Date().toISOString()
    };

    // Fire and forget - don't wait for response
    supabase
      .from('analytics_events')
      .insert(event)
      .then(() => {})
      .catch(console.error);
  },

  async getUserStats() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('users')
      .select(`
        streak_count,
        total_reflections,
        points,
        authenticity_score,
        created_at
      `)
      .eq('id', user.id)
      .single();

    return { data, error };
  },

  async getMatchingStats() {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .rpc('get_user_matching_stats', { p_user_id: user.id });

    return { data, error };
  }
};

export default {
  supabase,
  authService,
  reflectionsService,
  matchingService,
  messagingService,
  moderationService,
  notificationService,
  analyticsService
};