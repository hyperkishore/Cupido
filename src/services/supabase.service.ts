import { createClient } from '@supabase/supabase-js';
import { API_CONFIG } from '../config/api.config';

// Initialize Supabase client
const supabaseUrl = API_CONFIG.SUPABASE_URL;
const supabaseAnonKey = API_CONFIG.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types
export interface User {
  id: string;
  phone_number: string;
  country_code: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  authenticity_score: number;
  social_score: number;
  created_at: string;
  updated_at: string;
}

export interface Reflection {
  id: string;
  user_id: string;
  question_id: string;
  answer_text: string;
  authenticity_score: number;
  created_at: string;
  likes_count: number;
  is_public: boolean;
}

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  status: 'pending' | 'active' | 'declined' | 'unmatched';
  compatibility_score: number;
  matched_at: string;
}

// Supabase service functions
export const SupabaseService = {
  // Auth functions
  async signInWithOTP(phone: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    return { data, error };
  },

  async verifyOTP(phone: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms',
    });
    return { data, error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // User functions
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    return { data, error };
  },

  async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  // Reflections functions
  async getReflections(limit = 20, offset = 0) {
    const { data, error } = await supabase
      .from('reflections')
      .select(`
        *,
        user:users(display_name, avatar_url),
        question:questions(question_text, category)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    return { data, error };
  },

  async submitReflection(reflection: {
    user_id: string;
    question_id: string;
    answer_text: string;
    authenticity_score: number;
    is_public: boolean;
  }) {
    const { data, error } = await supabase
      .from('reflections')
      .insert(reflection)
      .select()
      .single();

    return { data, error };
  },

  async likeReflection(userId: string, reflectionId: string) {
    const { data, error } = await supabase
      .from('likes')
      .insert({ user_id: userId, reflection_id: reflectionId });

    if (!error) {
      // Increment likes count
      await supabase.rpc('increment_likes', { reflection_id: reflectionId });
    }

    return { data, error };
  },

  // Social connections
  async connectSocial(userId: string, platform: string, connectionData: any) {
    const { data, error } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        platform,
        ...connectionData,
      })
      .select()
      .single();

    return { data, error };
  },

  async getSocialConnections(userId: string) {
    const { data, error } = await supabase
      .from('social_connections')
      .select('*')
      .eq('user_id', userId);

    return { data, error };
  },

  // Matching functions
  async getPotentialMatches(userId: string) {
    // This would be a more complex query in production
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .neq('id', userId)
      .gte('authenticity_score', 50)
      .limit(10);

    return { data, error };
  },

  async createMatch(user1Id: string, user2Id: string) {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        user1_id: user1Id,
        user2_id: user2Id,
        status: 'pending',
      })
      .select()
      .single();

    return { data, error };
  },

  // Real-time subscriptions
  subscribeToMessages(matchId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        callback
      )
      .subscribe();
  },

  subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        callback
      )
      .subscribe();
  },
};

// Import AsyncStorage for React Native
import AsyncStorage from '@react-native-async-storage/async-storage';