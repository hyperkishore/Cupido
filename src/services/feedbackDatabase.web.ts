// Web-compatible version of feedbackDatabase that uses localStorage instead of SQLite
import { Platform } from 'react-native';

export const FEEDBACK_DATABASE_NAME = 'cupido_feedback.db';

export interface FeedbackEntry {
  id?: number;
  timestamp?: string;
  screen_name: string;
  component_id: string;
  component_type: string;
  element_bounds: string;
  feedback_text: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  category?: 'ui' | 'ux' | 'bug' | 'feature' | 'content' | 'performance' | 'accessibility' | 'general';
  status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | 'archived';
  user_agent?: string;
  device_info?: string;
  screenshot_path?: string;
  assigned_to?: string;
  resolution_notes?: string;
  resolved_at?: string;
  created_by?: string;
  tags?: string;
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
  private feedbackKey = 'cupido_feedback_entries';
  private commentsKey = 'cupido_feedback_comments';
  private attachmentsKey = 'cupido_feedback_attachments';
  private idCounterKey = 'cupido_feedback_id_counter';

  async initializeDatabase(): Promise<void> {
    console.log('Feedback database initialized (web/localStorage version)');
    // Initialize counter if not exists
    if (!localStorage.getItem(this.idCounterKey)) {
      localStorage.setItem(this.idCounterKey, '1');
    }
  }

  private getNextId(): number {
    const currentId = parseInt(localStorage.getItem(this.idCounterKey) || '1');
    const nextId = currentId + 1;
    localStorage.setItem(this.idCounterKey, nextId.toString());
    return currentId;
  }

  private getFeedbackList(): FeedbackEntry[] {
    const data = localStorage.getItem(this.feedbackKey);
    return data ? JSON.parse(data) : [];
  }

  private saveFeedbackList(entries: FeedbackEntry[]): void {
    localStorage.setItem(this.feedbackKey, JSON.stringify(entries));
  }

  async addFeedback(feedback: FeedbackEntry): Promise<number> {
    const deviceInfo = {
      platform: Platform.OS,
      version: Platform.Version,
    };

    const id = this.getNextId();
    const newEntry: FeedbackEntry = {
      ...feedback,
      id,
      timestamp: new Date().toISOString(),
      priority: feedback.priority || 'medium',
      category: feedback.category || 'general',
      status: 'pending',
      device_info: JSON.stringify(deviceInfo),
      created_by: feedback.created_by || 'user',
      votes: 0,
    };

    const entries = this.getFeedbackList();
    entries.push(newEntry);
    this.saveFeedbackList(entries);

    return id;
  }

  async getAllFeedback(): Promise<FeedbackEntry[]> {
    const entries = this.getFeedbackList();
    return entries.sort((a, b) => 
      new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
    );
  }

  async getFeedbackByScreen(screenName: string): Promise<FeedbackEntry[]> {
    const entries = this.getFeedbackList();
    return entries
      .filter(e => e.screen_name === screenName)
      .sort((a, b) => 
        new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
      );
  }

  async getFeedbackByStatus(status: string): Promise<FeedbackEntry[]> {
    const entries = this.getFeedbackList();
    return entries
      .filter(e => e.status === status)
      .sort((a, b) => 
        new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
      );
  }

  async updateFeedbackStatus(id: number, status: string, resolution_notes?: string): Promise<void> {
    const entries = this.getFeedbackList();
    const index = entries.findIndex(e => e.id === id);
    
    if (index !== -1) {
      entries[index].status = status as any;
      entries[index].resolution_notes = resolution_notes;
      if (status === 'completed') {
        entries[index].resolved_at = new Date().toISOString();
      }
      this.saveFeedbackList(entries);
    }
  }

  async addComment(comment: FeedbackComment): Promise<number> {
    const comments = this.getComments();
    const id = this.getNextId();
    const newComment = {
      ...comment,
      id,
      created_at: new Date().toISOString(),
    };
    comments.push(newComment);
    localStorage.setItem(this.commentsKey, JSON.stringify(comments));
    return id;
  }

  private getComments(): FeedbackComment[] {
    const data = localStorage.getItem(this.commentsKey);
    return data ? JSON.parse(data) : [];
  }

  async getComments(feedbackId: number): Promise<FeedbackComment[]> {
    const comments = this.getComments();
    return comments
      .filter(c => c.feedback_id === feedbackId)
      .sort((a, b) => 
        new Date(a.created_at || '').getTime() - new Date(b.created_at || '').getTime()
      );
  }

  async addAttachment(attachment: FeedbackAttachment): Promise<number> {
    const attachments = this.getAttachments();
    const id = this.getNextId();
    const newAttachment = {
      ...attachment,
      id,
      uploaded_at: new Date().toISOString(),
    };
    attachments.push(newAttachment);
    localStorage.setItem(this.attachmentsKey, JSON.stringify(attachments));
    return id;
  }

  private getAttachments(): FeedbackAttachment[] {
    const data = localStorage.getItem(this.attachmentsKey);
    return data ? JSON.parse(data) : [];
  }

  async getFeedbackStats(): Promise<{
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    by_category: Record<string, number>;
    by_priority: Record<string, number>;
  }> {
    const entries = this.getFeedbackList();
    
    const stats = {
      total: entries.length,
      pending: entries.filter(e => e.status === 'pending').length,
      in_progress: entries.filter(e => e.status === 'in_progress').length,
      completed: entries.filter(e => e.status === 'completed').length,
      by_category: {} as Record<string, number>,
      by_priority: {} as Record<string, number>,
    };

    entries.forEach(entry => {
      const category = entry.category || 'general';
      const priority = entry.priority || 'medium';
      
      stats.by_category[category] = (stats.by_category[category] || 0) + 1;
      stats.by_priority[priority] = (stats.by_priority[priority] || 0) + 1;
    });

    return stats;
  }

  async exportFeedbackData(): Promise<string> {
    const feedback = await this.getAllFeedback();
    const exportData = {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: feedback
    };

    // For web, we'll create a blob URL
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    return URL.createObjectURL(blob);
  }

  async deleteFeedback(id: number): Promise<void> {
    const entries = this.getFeedbackList();
    const filtered = entries.filter(e => e.id !== id);
    this.saveFeedbackList(filtered);
  }

  async searchFeedback(query: string): Promise<FeedbackEntry[]> {
    const entries = this.getFeedbackList();
    const lowerQuery = query.toLowerCase();
    
    return entries
      .filter(e => 
        e.feedback_text.toLowerCase().includes(lowerQuery) ||
        e.component_id.toLowerCase().includes(lowerQuery) ||
        e.screen_name.toLowerCase().includes(lowerQuery)
      )
      .sort((a, b) => 
        new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime()
      );
  }
}

// Export singleton instance
export const feedbackDatabase = new FeedbackDatabaseService();