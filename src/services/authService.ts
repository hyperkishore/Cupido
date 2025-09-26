import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  age: number;
  location: {
    city: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  authenticityScore: number;
  personalityTraits: string[];
  socialAccounts: {
    instagram?: string;
    spotify?: string;
    twitter?: string;
  };
  preferences: {
    ageRange: [number, number];
    distance: number;
    interests: string[];
  };
  conversationStats: {
    totalMessages: number;
    averageResponseTime: number;
    emotionalDepth: number;
  };
  photos: string[];
  createdAt: Date;
  lastActive: Date;
}

class AuthService {
  private currentUser: UserProfile | null = null;

  async signUp(email: string, password: string, profile: Partial<UserProfile>) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: profile.name,
            age: profile.age,
          }
        }
      });

      if (authError) throw authError;

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user?.id,
          email,
          name: profile.name,
          age: profile.age,
          location: profile.location,
          authenticity_score: 50, // Start at neutral
          personality_traits: [],
          social_accounts: {},
          preferences: {
            ageRange: [18, 99],
            distance: 50,
            interests: []
          },
          conversation_stats: {
            totalMessages: 0,
            averageResponseTime: 0,
            emotionalDepth: 0
          },
          photos: [],
          created_at: new Date(),
          last_active: new Date()
        })
        .select()
        .single();

      if (profileError) throw profileError;

      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      this.currentUser = profileData;

      return { user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
      this.currentUser = profileData;

      // Update last active
      await this.updateLastActive();

      return { user: authData.user, profile: profileData };
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('userProfile');
      this.currentUser = null;
    } catch (error) {
      console.error('Signout error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (this.currentUser) return this.currentUser;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileData) {
        this.currentUser = profileData;
        return profileData;
      }

      return null;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async updateProfile(updates: Partial<UserProfile>) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      this.currentUser = data;
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  async connectInstagram(accessToken: string, username: string) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      // Store Instagram connection
      const updatedSocialAccounts = {
        ...user.socialAccounts,
        instagram: username
      };

      await this.updateProfile({
        socialAccounts: updatedSocialAccounts
      });

      // Fetch Instagram data for personality analysis
      await this.analyzeInstagramProfile(accessToken, username);

      return true;
    } catch (error) {
      console.error('Instagram connection error:', error);
      throw error;
    }
  }

  private async analyzeInstagramProfile(accessToken: string, username: string) {
    // TODO: Implement Instagram API integration
    // Analyze posts, captions, hashtags for personality traits
    // Store insights in user profile
  }

  async updateAuthenticityScore(score: number) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      await this.updateProfile({
        authenticityScore: score
      });

      return score;
    } catch (error) {
      console.error('Update authenticity score error:', error);
      throw error;
    }
  }

  async updateConversationStats(stats: Partial<UserProfile['conversationStats']>) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('No authenticated user');

      const updatedStats = {
        ...user.conversationStats,
        ...stats
      };

      await this.updateProfile({
        conversationStats: updatedStats
      });

      return updatedStats;
    } catch (error) {
      console.error('Update conversation stats error:', error);
      throw error;
    }
  }

  private async updateLastActive() {
    try {
      const user = await this.getCurrentUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({ last_active: new Date() })
        .eq('id', user.id);
    } catch (error) {
      console.error('Update last active error:', error);
    }
  }
}

export const authService = new AuthService();