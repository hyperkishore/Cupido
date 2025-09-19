/**
 * Production Supabase Service
 * Complete backend integration for dating app functionality
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../config/environment';

// Types for our database
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  date_of_birth: string;
  gender: 'man' | 'woman' | 'non-binary' | 'other';
  interested_in: string[];
  location_city?: string;
  bio?: string;
  photos: string[];
  personality_vector?: number[];
  values_vector?: number[];
  interests_tags: string[];
  last_active: string;
  is_verified: boolean;
  is_premium: boolean;
  created_at: string;
}

export interface UserStats {
  user_id: string;
  total_reflections: number;
  reflection_streak: number;
  longest_streak: number;
  last_reflection_date?: string;
  total_matches: number;
  authenticity_score: number;
  engagement_score: number;
}

export interface Reflection {
  id: string;
  user_id: string;
  question_id: string;
  question_text: string;
  answer_text: string;
  word_count: number;
  sentiment_score?: number;
  authenticity_score?: number;
  topic_tags: string[];
  answer_vector?: number[];
  is_public: boolean;
  hearts_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    first_name: string;
    photos: string[];
  };
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  compatibility_score: number;
  matching_factors: any;
  status: 'pending' | 'matched' | 'declined' | 'blocked';
  user1_liked: boolean;
  user2_liked: boolean;
  matched_at?: string;
  created_at: string;
  other_user?: User;
}

export interface Conversation {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  last_message_at?: string;
  user1_unread_count: number;
  user2_unread_count: number;
  is_active: boolean;
  created_at: string;
  other_user?: User;
  last_message?: Message;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  message_type: 'text' | 'image' | 'voice' | 'reflection_share';
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
  sender?: {
    first_name: string;
    photos: string[];
  };
}

export interface DailyQuestion {
  id: string;
  question: string;
  theme: string;
  category: string;
  tone: string;
  emotional_depth: 'low' | 'medium' | 'high';
  tags: string[];
  intended_use_case: string;
  is_active: boolean;
}

class SupabaseService {
  private supabase: SupabaseClient;
  private currentUser: User | null = null;

  constructor() {
    this.supabase = createClient(
      environment.supabase.url || 'your_supabase_url',
      environment.supabase.anonKey || 'your_supabase_anon_key'
    );
    
    // Listen for auth changes
    this.supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        this.loadCurrentUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        this.currentUser = null;
      }
    });
  }

  // Authentication
  async signUp(email: string, password: string, userData: Partial<User>) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('No user returned');

    // Create user profile
    const { error: profileError } = await this.supabase
      .from('users')
      .insert({
        id: data.user.id,
        email,
        ...userData,
      });

    if (profileError) throw profileError;

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
    this.currentUser = null;
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;

    const { data: { user } } = await this.supabase.auth.getUser();
    if (!user) return null;

    return this.loadCurrentUser(user.id);
  }

  private async loadCurrentUser(userId: string): Promise<User> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    this.currentUser = data;
    return data;
  }

  // User Management
  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    if (userId === this.currentUser?.id) {
      this.currentUser = data;
    }
    return data;
  }

  async getUserStats(userId: string): Promise<UserStats | null> {
    const { data, error } = await this.supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Not found is OK
    return data;
  }

  // Reflections
  async createReflection(reflection: Omit<Reflection, 'id' | 'created_at' | 'updated_at' | 'hearts_count' | 'comments_count'>) {
    const { data, error } = await this.supabase
      .from('reflections')
      .insert({
        ...reflection,
        word_count: reflection.answer_text.split(' ').length,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getReflections(limit: number = 20, offset: number = 0): Promise<Reflection[]> {
    const { data, error } = await this.supabase
      .from('reflections')
      .select(`
        *,
        user:users(first_name, photos)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return data || [];
  }

  async getUserReflections(userId: string, limit: number = 50): Promise<Reflection[]> {
    const { data, error } = await this.supabase
      .from('reflections')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async likeReflection(userId: string, reflectionId: string) {
    // Insert like interaction
    const { error: interactionError } = await this.supabase
      .from('reflection_interactions')
      .insert({
        user_id: userId,
        reflection_id: reflectionId,
        interaction_type: 'heart',
      });

    if (interactionError) throw interactionError;

    // Update hearts count
    const { error: updateError } = await this.supabase
      .rpc('increment_hearts_count', { reflection_id: reflectionId });

    if (updateError) throw updateError;
  }

  // Questions
  async getDailyQuestions(): Promise<DailyQuestion[]> {
    const { data, error } = await this.supabase
      .from('daily_questions')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  }

  async getPersonalizedQuestion(userId: string): Promise<DailyQuestion | null> {
    // Get user preferences
    const { data: preferences } = await this.supabase
      .from('user_question_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get questions excluding skipped ones
    let query = this.supabase
      .from('daily_questions')
      .select('*')
      .eq('is_active', true);

    if (preferences?.skipped_questions?.length) {
      query = query.not('id', 'in', `(${preferences.skipped_questions.join(',')})`);
    }

    if (preferences?.preferred_themes?.length) {
      query = query.in('theme', preferences.preferred_themes);
    }

    if (preferences?.preferred_depth) {
      query = query.eq('emotional_depth', preferences.preferred_depth);
    }

    const { data, error } = await query.limit(1);
    if (error) throw error;
    return data?.[0] || null;
  }

  // Matching
  async getPotentialMatches(userId: string, limit: number = 10): Promise<User[]> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('User not authenticated');

    // Get users who match preferences and haven't been matched/declined
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .in('gender', user.interested_in)
      .contains('interested_in', [user.gender])
      .not('id', 'in', `(
        SELECT CASE 
          WHEN user1_id = '${userId}' THEN user2_id 
          ELSE user1_id 
        END 
        FROM matches 
        WHERE (user1_id = '${userId}' OR user2_id = '${userId}')
        AND status IN ('matched', 'declined', 'blocked')
      )`)
      .order('last_active', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createMatch(userId1: string, userId2: string) {
    // Calculate compatibility score
    const { data: score, error: scoreError } = await this.supabase
      .rpc('calculate_compatibility_score', {
        user1_id: userId1,
        user2_id: userId2,
      });

    if (scoreError) throw scoreError;

    const { data, error } = await this.supabase
      .from('matches')
      .insert({
        user1_id: userId1,
        user2_id: userId2,
        compatibility_score: score,
        user1_liked: true,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async respondToMatch(matchId: string, userId: string, liked: boolean) {
    const { data: match, error } = await this.supabase
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (error) throw error;

    const isUser2 = match.user2_id === userId;
    const updateField = isUser2 ? 'user2_liked' : 'user1_liked';

    const updates: any = {
      [updateField]: liked,
    };

    // Check if it's a mutual match
    const otherUserLiked = isUser2 ? match.user1_liked : match.user2_liked;
    if (liked && otherUserLiked) {
      updates.status = 'matched';
      updates.matched_at = new Date().toISOString();
    } else if (!liked) {
      updates.status = 'declined';
    }

    const { data: updatedMatch, error: updateError } = await this.supabase
      .from('matches')
      .update(updates)
      .eq('id', matchId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create conversation if matched
    if (updates.status === 'matched') {
      await this.supabase
        .from('conversations')
        .insert({
          match_id: matchId,
          user1_id: match.user1_id,
          user2_id: match.user2_id,
        });
    }

    return updatedMatch;
  }

  async getMatches(userId: string): Promise<Match[]> {
    const { data, error } = await this.supabase
      .from('matches')
      .select(`
        *,
        other_user:users!matches_user2_id_fkey(*)
      `)
      .eq('user1_id', userId)
      .eq('status', 'matched')
      .order('matched_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Chat
  async getConversations(userId: string): Promise<Conversation[]> {
    const { data, error } = await this.supabase
      .from('conversations')
      .select(`
        *,
        other_user:users!conversations_user2_id_fkey(first_name, photos),
        last_message:messages(message_text, created_at, sender_id)
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async sendMessage(conversationId: string, senderId: string, messageText: string) {
    const { data, error } = await this.supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        message_text: messageText,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last_message_at
    await this.supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  }

  async getMessages(conversationId: string, limit: number = 50): Promise<Message[]> {
    const { data, error } = await this.supabase
      .from('messages')
      .select(`
        *,
        sender:users(first_name, photos)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []).reverse();
  }

  // Real-time subscriptions
  subscribeToConversation(conversationId: string, callback: (message: Message) => void) {
    return this.supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
  }

  subscribeToMatches(userId: string, callback: (match: Match) => void) {
    return this.supabase
      .channel(`matches:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${userId}`,
        },
        (payload) => callback(payload.new as Match)
      )
      .subscribe();
  }
}

// Export singleton instance
export const supabaseService = new SupabaseService();
export default supabaseService;