import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

let SQLite: any = null;
// Only import SQLite on mobile platforms
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite');
}

// Database name - this is the name you requested
export const FEEDBACK_DATABASE_NAME = 'cupido_feedback.db';

export interface FeedbackEntry {
  id?: number;
  timestamp?: string;
  screen_name: string;
  component_id: string;
  component_type: string;
  element_bounds: string; // JSON string with {x, y, width, height}
  feedback_text: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general';
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'archived';
  user_agent?: string;
  device_info?: string; // JSON string with device details
  screenshot_path?: string;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_by?: string;
  tags?: string; // Comma-separated tags
  votes?: number;
  implementation_effort?: 'low' | 'medium' | 'high';
}

export interface FeedbackComment {
  id?: number;
  feedback_id: number;
  comment_text: string;
  author: string;
  created_at?: string;
}

export interface FeedbackAttachment {
  id?: number;
  feedback_id: number;
  file_path: string;
  file_type: string;
  file_size?: number;
  uploaded_at?: string;
}

class FeedbackDatabaseService {
  private db: any = null;

  async initializeDatabase(): Promise<void> {
    try {
      // Skip database initialization on web platform
      if (Platform.OS === 'web') {
        console.log('Skipping SQLite initialization on web platform');
        return;
      }
      
      if (!SQLite) {
        console.warn('SQLite not available on this platform');
        return;
      }
      
      // Open the database
      this.db = await SQLite.openDatabaseAsync(FEEDBACK_DATABASE_NAME);
      
      // Enable foreign keys
      await this.db.execAsync('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
      console.log('Feedback database initialized successfully');
    } catch (error) {
      console.error('Error initializing feedback database:', error);
      // Don't throw error on web platform
      if (Platform.OS !== 'web') {
        throw error;
      }
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const createFeedbackTable = `
      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        screen_name TEXT NOT NULL,
        component_id TEXT NOT NULL,
        component_type TEXT NOT NULL,
        element_bounds TEXT NOT NULL,
        feedback_text TEXT NOT NULL,
        priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high', 'critical')),
        category TEXT DEFAULT 'general' CHECK(category IN ('ui', 'ux', 'bug', 'feature', 'content', 'performance', 'accessibility', 'general')),
        status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'rejected', 'archived')),
        user_agent TEXT,
        device_info TEXT,
        screenshot_path TEXT,
        assigned_to TEXT,
        resolution_notes TEXT,
        resolved_at DATETIME,
        created_by TEXT DEFAULT 'user',
        tags TEXT,
        votes INTEGER DEFAULT 0,
        implementation_effort TEXT CHECK(implementation_effort IN ('low', 'medium', 'high'))
      )
    `;

    const createAttachmentsTable = `
      CREATE TABLE IF NOT EXISTS feedback_attachments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `;

    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS feedback_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feedback_id INTEGER NOT NULL,
        comment_text TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feedback_id) REFERENCES feedback(id) ON DELETE CASCADE
      )
    `;

    // Create indexes
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON feedback(timestamp);
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
      CREATE INDEX IF NOT EXISTS idx_feedback_screen ON feedback(screen_name);
      CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
      CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
    `;

    await this.db.execAsync(createFeedbackTable);
    await this.db.execAsync(createAttachmentsTable);
    await this.db.execAsync(createCommentsTable);
    await this.db.execAsync(createIndexes);
  }

  // Add feedback entry
  async addFeedback(feedback: FeedbackEntry): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
      // Add more device info as needed
    };

    const result = await this.db.runAsync(
      `INSERT INTO feedback (
        screen_name, component_id, component_type, element_bounds, feedback_text,
        priority, category, device_info, user_agent, created_by, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        feedback.screen_name,
        feedback.component_id,
        feedback.component_type,
        feedback.element_bounds,
        feedback.feedback_text,
        feedback.priority || 'medium',
        feedback.category || 'general',
        JSON.stringify(deviceInfo),
        feedback.user_agent || '',
        feedback.created_by || 'user',
        feedback.tags || ''
      ]
    );

    return result.lastInsertRowId;
  }

  // Get all feedback entries
  async getAllFeedback(): Promise<FeedbackEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync('SELECT * FROM feedback ORDER BY timestamp DESC');
    return result as FeedbackEntry[];
  }

  // Get feedback by screen
  async getFeedbackByScreen(screenName: string): Promise<FeedbackEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM feedback WHERE screen_name = ? ORDER BY timestamp DESC',
      [screenName]
    );
    return result as FeedbackEntry[];
  }

  // Get feedback by status
  async getFeedbackByStatus(status: string): Promise<FeedbackEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM feedback WHERE status = ? ORDER BY timestamp DESC',
      [status]
    );
    return result as FeedbackEntry[];
  }

  // Update feedback status
  async updateFeedbackStatus(id: number, status: string, resolution_notes?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const resolvedAt = status === 'completed' ? new Date().toISOString() : null;
    
    await this.db.runAsync(
      'UPDATE feedback SET status = ?, resolution_notes = ?, resolved_at = ? WHERE id = ?',
      [status, resolution_notes || null, resolvedAt, id]
    );
  }

  // Add comment to feedback
  async addComment(comment: FeedbackComment): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO feedback_comments (feedback_id, comment_text, author) VALUES (?, ?, ?)',
      [comment.feedback_id, comment.comment_text, comment.author]
    );

    return result.lastInsertRowId;
  }

  // Get comments for feedback
  async getComments(feedbackId: number): Promise<FeedbackComment[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      'SELECT * FROM feedback_comments WHERE feedback_id = ? ORDER BY created_at ASC',
      [feedbackId]
    );
    return result as FeedbackComment[];
  }

  // Add attachment
  async addAttachment(attachment: FeedbackAttachment): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      'INSERT INTO feedback_attachments (feedback_id, file_path, file_type, file_size) VALUES (?, ?, ?, ?)',
      [attachment.feedback_id, attachment.file_path, attachment.file_type, attachment.file_size || 0]
    );

    return result.lastInsertRowId;
  }

  // Get feedback statistics
  async getFeedbackStats(): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const totalResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM feedback');
    const pendingResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM feedback WHERE status = "pending"');
    const inProgressResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM feedback WHERE status = "in_progress"');
    const completedResult = await this.db.getFirstAsync('SELECT COUNT(*) as count FROM feedback WHERE status = "completed"');

    const categoryResults = await this.db.getAllAsync('SELECT category, COUNT(*) as count FROM feedback GROUP BY category');
    const priorityResults = await this.db.getAllAsync('SELECT priority, COUNT(*) as count FROM feedback GROUP BY priority');

    const by_category: Record<string, number> = {};
    categoryResults.forEach((row: any) => {
      by_category[row.category] = row.count;
    });

    const by_priority: Record<string, number> = {};
    priorityResults.forEach((row: any) => {
      by_priority[row.priority] = row.count;
    });

    return {
      total: (totalResult as any)?.count || 0,
      pending: (pendingResult as any)?.count || 0,
      in_progress: (inProgressResult as any)?.count || 0,
      completed: (completedResult as any)?.count || 0,
      by_category,
      by_priority
    };
  }

  // Export feedback data
  async exportFeedbackData(): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const feedback = await this.getAllFeedback();
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: feedback
    };

    const fileName = `cupido_feedback_${Date.now()}.json`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(exportData, null, 2));
    
    return filePath;
  }

  // Delete feedback entry
  async deleteFeedback(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync('DELETE FROM feedback WHERE id = ?', [id]);
  }

  // Search feedback
  async searchFeedback(query: string): Promise<FeedbackEntry[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM feedback 
       WHERE feedback_text LIKE ? OR component_id LIKE ? OR screen_name LIKE ? 
       ORDER BY timestamp DESC`,
      [`%${query}%`, `%${query}%`, `%${query}%`]
    );
    return result as FeedbackEntry[];
  }
}

// Export singleton instance
export const feedbackDatabase = new FeedbackDatabaseService();