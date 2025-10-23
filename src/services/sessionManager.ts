/**
 * Session Manager for Single-Window Enforcement
 * Ensures only one active session per user at a time
 */

import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_ID_KEY = '@cupido_session_id';
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const SESSION_TIMEOUT = 30000; // 30 seconds - consider session dead if no heartbeat

export class SessionManager {
  private sessionId: string | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private userId: string | null = null;
  private onForceLogout?: () => void;

  /**
   * Initialize session manager for a user
   */
  async initialize(userId: string, onForceLogout: () => void) {
    this.userId = userId;
    this.onForceLogout = onForceLogout;
    
    // Generate unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session ID locally
    await AsyncStorage.setItem(SESSION_ID_KEY, this.sessionId);
    
    // Claim the session in database
    await this.claimSession();
    
    // Start heartbeat
    this.startHeartbeat();
    
    // Start listening for session conflicts
    this.startSessionMonitoring();
    
    console.log('📱 Session initialized:', this.sessionId);
  }

  /**
   * Claim the active session for this user
   */
  private async claimSession() {
    if (!this.userId || !this.sessionId) return;

    try {
      // Update or create active session record
      const { error } = await supabase
        .from('active_sessions')
        .upsert({
          user_id: this.userId,
          session_id: this.sessionId,
          last_heartbeat: new Date().toISOString(),
          browser_info: this.getBrowserInfo()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        // If table doesn't exist, log but don't crash
        if (error.message?.includes('active_sessions') || error.code === '42P01') {
          console.warn('⚠️ active_sessions table not found. Single-window enforcement disabled.');
          console.warn('Run the migration in supabase/migrations/create_active_sessions.sql');
        } else {
          console.error('Failed to claim session:', error);
        }
      }
    } catch (error) {
      console.error('Session claim error:', error);
    }
  }

  /**
   * Start sending heartbeats to maintain session
   */
  private startHeartbeat() {
    // Clear existing heartbeat if any
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send immediate heartbeat
    this.sendHeartbeat();

    // Schedule regular heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, HEARTBEAT_INTERVAL);
  }

  /**
   * Send a heartbeat to update last active time
   */
  private async sendHeartbeat() {
    if (!this.userId || !this.sessionId) return;

    try {
      const { error } = await supabase
        .from('active_sessions')
        .update({
          last_heartbeat: new Date().toISOString()
        })
        .eq('user_id', this.userId)
        .eq('session_id', this.sessionId);

      if (error) {
        console.error('Heartbeat failed:', error);
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
    }
  }

  /**
   * Monitor for session conflicts (another window taking over)
   */
  private async startSessionMonitoring() {
    if (!this.userId) return;

    // Check every 5 seconds if our session is still active
    setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('active_sessions')
          .select('session_id, last_heartbeat')
          .eq('user_id', this.userId)
          .single();

        if (error) {
          console.error('Session monitoring error:', error);
          return;
        }

        if (data) {
          // Check if another session has taken over
          if (data.session_id !== this.sessionId) {
            console.warn('🚪 Session taken over by another window:', data.session_id);
            this.handleForceLogout();
          }

          // Check if the session is stale (no recent heartbeat)
          const lastHeartbeat = new Date(data.last_heartbeat).getTime();
          const now = Date.now();
          if (now - lastHeartbeat > SESSION_TIMEOUT && data.session_id === this.sessionId) {
            // Our session is stale, reclaim it
            console.log('♻️ Reclaiming stale session');
            await this.claimSession();
          }
        }
      } catch (error) {
        console.error('Session monitoring error:', error);
      }
    }, 5000);
  }

  /**
   * Handle force logout when another window takes over
   */
  private handleForceLogout() {
    console.log('🚪 Forcing logout - another window is active');
    
    // Clear local session
    this.cleanup();
    
    // Trigger logout callback
    if (this.onForceLogout) {
      this.onForceLogout();
    }
  }

  /**
   * Get browser/device information for debugging
   */
  private getBrowserInfo(): string {
    if (typeof window !== 'undefined' && window.navigator) {
      const userAgent = window.navigator.userAgent;
      const platform = window.navigator.platform;
      
      // Simple browser detection
      let browser = 'Unknown';
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Safari')) browser = 'Safari';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      return `${browser} on ${platform}`;
    }
    
    return 'React Native App';
  }

  /**
   * Clean up session on logout
   */
  async cleanup() {
    // Stop heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Clear active session in database
    if (this.userId && this.sessionId) {
      try {
        await supabase
          .from('active_sessions')
          .delete()
          .eq('user_id', this.userId)
          .eq('session_id', this.sessionId);
      } catch (error) {
        console.error('Session cleanup error:', error);
      }
    }

    // Clear local storage
    try {
      await AsyncStorage.removeItem(SESSION_ID_KEY);
    } catch (error) {
      console.error('Failed to clear session ID:', error);
    }

    this.sessionId = null;
    this.userId = null;
    console.log('🧹 Session cleaned up');
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Check if session is active
   */
  isActive(): boolean {
    return this.sessionId !== null;
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();