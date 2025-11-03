import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { User } from '../../types';

const CURRENT_USER_KEY = 'cupido_local_current_user';
const USERS_STORAGE_KEY = 'cupido_local_users';

// Web doesn't support SQLite, so we use AsyncStorage for web
const isWeb = Platform.OS === 'web';

let database: any = null;

const getDatabase = async () => {
  if (isWeb) {
    // For web, we'll use AsyncStorage as our "database"
    return null;
  }
  
  if (database) return database;
  
  try {
    const SQLite = await import('expo-sqlite');
    database = await SQLite.openDatabaseAsync('cupido_app.db');
    await database.execAsync('PRAGMA foreign_keys = ON');
    await database.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        last_seen TEXT,
        metadata TEXT
      )
    `);
    return database;
  } catch (error) {
    console.warn('SQLite not available, using AsyncStorage fallback');
    return null;
  }
};

export const LocalUserRepository = {
  async upsertUser(phoneNumber: string): Promise<User> {
    // FIXED: Properly normalize phone by stripping non-digits
    const normalized = phoneNumber.replace(/\D/g, ''); // Remove all non-digits
    
    if (!normalized) {
      throw new Error('Invalid phone number');
    }
    
    const now = new Date().toISOString();

    if (isWeb) {
      // Web implementation using AsyncStorage
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};

      const user: User = {
        id: `local_${normalized}`,
        phoneNumber: normalized,
        createdAt: users[normalized]?.createdAt || now,
        streak: users[normalized]?.streak || 0,
        lastPromptDate: now,
      };

      users[normalized] = user;
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      await AsyncStorage.setItem(CURRENT_USER_KEY, normalized);
      
      return user;
    } else {
      // Native implementation using SQLite
      const db = await getDatabase();
      
      if (db) {
        await db.runAsync(
          `INSERT INTO users (phone, created_at, last_seen, metadata)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(phone) DO UPDATE SET last_seen = excluded.last_seen`,
          [normalized, now, now, JSON.stringify({})]
        );
      }

      const user: User = {
        id: `local_${normalized}`,
        phoneNumber: normalized,
        createdAt: now,
        streak: 0,
        lastPromptDate: undefined,
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, normalized);
      return user;
    }
  },

  async getUser(phoneNumber: string): Promise<User | null> {
    const normalized = phoneNumber.trim();

    if (isWeb) {
      // Web implementation using AsyncStorage
      const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      const users = usersJson ? JSON.parse(usersJson) : {};

      if (!users[normalized]) return null;
      return users[normalized];
    } else {
      // Native implementation using SQLite
      const db = await getDatabase();
      
      if (!db) {
        // Fallback to AsyncStorage if SQLite not available
        const usersJson = await AsyncStorage.getItem(USERS_STORAGE_KEY);
        const users = usersJson ? JSON.parse(usersJson) : {};
        return users[normalized] || null;
      }
      
      const row = await db.getFirstAsync<{ phone: string; created_at: string; last_seen: string | null }>(
        'SELECT phone, created_at, last_seen FROM users WHERE phone = ?',
        [normalized]
      );

      if (!row) return null;

      return {
        id: `local_${row.phone}`,
        phoneNumber: row.phone,
        createdAt: row.created_at,
        lastPromptDate: row.last_seen ?? undefined,
        streak: 0,
      };
    }
  },

  async getCurrentUser(): Promise<User | null> {
    const phone = await AsyncStorage.getItem(CURRENT_USER_KEY);
    if (!phone) return null;
    return this.getUser(phone);
  },

  async signOut(): Promise<void> {
    await AsyncStorage.removeItem(CURRENT_USER_KEY);
  }
};
