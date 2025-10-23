// @ts-nocheck
import { createClient } from '@supabase/supabase-js';
import { DEMO_MODE } from '../config/demo';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'demo-url';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'demo-key';

// Create a minimal client for demo mode
const createDemoClient = () => ({
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signUp: async () => ({ data: null, error: null }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({ 
      eq: () => ({ 
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      }),
      maybeSingle: async () => ({ data: null, error: null })
    }),
    insert: () => ({ 
      select: () => ({ 
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      }) 
    }),
    upsert: () => ({ 
      select: () => ({ 
        single: async () => ({ data: null, error: null }),
        maybeSingle: async () => ({ data: null, error: null })
      }) 
    }),
    update: () => ({ eq: () => async ({ data: null, error: null }) }),
  }),
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
});

export const supabase = DEMO_MODE ? createDemoClient() : createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          streak: number;
          last_prompt_date: string | null;
          persona_data: any | null;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          streak?: number;
          last_prompt_date?: string | null;
          persona_data?: any | null;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          streak?: number;
          last_prompt_date?: string | null;
          persona_data?: any | null;
        };
      };
      prompts: {
        Row: {
          id: string;
          question: string;
          type: 'text' | 'voice';
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          question: string;
          type: 'text' | 'voice';
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          question?: string;
          type?: 'text' | 'voice';
          category?: string;
          created_at?: string;
        };
      };
      responses: {
        Row: {
          id: string;
          user_id: string;
          prompt_id: string;
          content: string;
          type: 'text' | 'voice';
          audio_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prompt_id: string;
          content: string;
          type: 'text' | 'voice';
          audio_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prompt_id?: string;
          content?: string;
          type?: 'text' | 'voice';
          audio_url?: string | null;
          created_at?: string;
        };
      };
      matches: {
        Row: {
          id: string;
          user_id: string;
          matched_user_id: string;
          compatibility: number;
          status: 'pending' | 'active' | 'ended';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          matched_user_id: string;
          compatibility: number;
          status?: 'pending' | 'active' | 'ended';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          matched_user_id?: string;
          compatibility?: number;
          status?: 'pending' | 'active' | 'ended';
          created_at?: string;
        };
      };
    };
  };
};