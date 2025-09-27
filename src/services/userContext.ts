/**
 * User Context Service
 * Manages user identification across the app using phone number as the primary identifier
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_USER_KEY = 'cupido_current_user';

class UserContextService {
  private currentUserId: string | null = null;

  /**
   * Initialize the service and load the current user from storage
   */
  async initialize(): Promise<void> {
    try {
      const storedUserId = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (storedUserId) {
        this.currentUserId = storedUserId;
      }
    } catch (error) {
      console.error('Error loading user context:', error);
    }
  }

  /**
   * Set the current user ID (phone number)
   */
  async setCurrentUser(phoneNumber: string): Promise<void> {
    // Normalize phone number to use as user ID
    const userId = this.normalizePhoneNumber(phoneNumber);
    this.currentUserId = userId;
    
    try {
      await AsyncStorage.setItem(CURRENT_USER_KEY, userId);
    } catch (error) {
      console.error('Error saving user context:', error);
    }
  }

  /**
   * Get the current user ID
   */
  getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get the current user ID or throw if not set
   */
  requireCurrentUserId(): string {
    if (!this.currentUserId) {
      throw new Error('No user logged in. Please sign in first.');
    }
    return this.currentUserId;
  }

  /**
   * Clear the current user (logout)
   */
  async clearCurrentUser(): Promise<void> {
    this.currentUserId = null;
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
    } catch (error) {
      console.error('Error clearing user context:', error);
    }
  }

  /**
   * Check if a user is currently logged in
   */
  isLoggedIn(): boolean {
    return this.currentUserId !== null;
  }

  /**
   * Normalize phone number to a consistent format
   * Removes all non-digit characters and adds country code if missing
   */
  private normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let normalized = phoneNumber.replace(/\D/g, '');
    
    // Add US country code if not present (10 digit US numbers)
    if (normalized.length === 10) {
      normalized = '1' + normalized;
    }
    
    return normalized;
  }
}

export const userContextService = new UserContextService();