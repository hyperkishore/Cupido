import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';
import { User } from '../../types';

const DB_NAME = 'cupido_app.db';
const CURRENT_USER_KEY = 'cupido_local_current_user';

let database: SQLite.SQLiteDatabase | null = null;

const getDatabase = async () => {
  if (database) return database;
  database = await SQLite.openDatabaseAsync(DB_NAME);
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
};

export const LocalUserRepository = {
  async upsertUser(phoneNumber: string): Promise<User> {
    const db = await getDatabase();
    const normalized = phoneNumber.trim();
    const now = new Date().toISOString();

    await db.runAsync(
      `INSERT INTO users (phone, created_at, last_seen, metadata)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(phone) DO UPDATE SET last_seen = excluded.last_seen`,
      [normalized, now, now, JSON.stringify({})]
    );

    const user: User = {
      id: `local_${normalized}`,
      phoneNumber: normalized,
      createdAt: now,
      streak: 0,
      lastPromptDate: undefined,
    };

    await AsyncStorage.setItem(CURRENT_USER_KEY, normalized);
    return user;
  },

  async getUser(phoneNumber: string): Promise<User | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ phone: string; created_at: string; last_seen: string | null }>(
      'SELECT phone, created_at, last_seen FROM users WHERE phone = ?',
      [phoneNumber.trim()]
    );

    if (!row) return null;

    return {
      id: `local_${row.phone}`,
      phoneNumber: row.phone,
      createdAt: row.created_at,
      lastPromptDate: row.last_seen ?? undefined,
      streak: 0,
    };
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
