import { Platform } from 'react-native';

let SQLite: any = null;
let databasePromise: Promise<any> | null = null;

// Only import SQLite on mobile platforms
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// Mock database for web platform
class WebDatabase {
  async executeSqlAsync(query: string, params: any[] = []): Promise<any> {
    console.log('[WebDB] Query:', query, 'Params:', params);
    return { rows: [] };
  }
  
  async runAsync(query: string, params: any[] = []): Promise<any> {
    console.log('[WebDB] Run:', query, 'Params:', params);
    return { lastInsertRowId: 0, changes: 0 };
  }
  
  async closeAsync(): Promise<void> {
    console.log('[WebDB] Database closed');
  }
  
  async getAllAsync(query: string, params: any[] = []): Promise<any[]> {
    console.log('[WebDB] GetAll:', query, 'Params:', params);
    return [];
  }
  
  async getFirstAsync(query: string, params: any[] = []): Promise<any> {
    console.log('[WebDB] GetFirst:', query, 'Params:', params);
    return null;
  }
}

export const getDatabase = async (): Promise<any> => {
  if (!databasePromise) {
    if (Platform.OS === 'web') {
      // Use mock database for web
      databasePromise = Promise.resolve(new WebDatabase());
    } else {
      // Use SQLite for mobile
      databasePromise = SQLite.openDatabaseAsync('cupido.db');
    }
  }
  return databasePromise;
};

export const closeDatabase = async () => {
  if (databasePromise) {
    try {
      const db = await databasePromise;
      await db.closeAsync();
    } catch (error) {
      console.error('Failed to close database', error);
    } finally {
      databasePromise = null;
    }
  }
};
