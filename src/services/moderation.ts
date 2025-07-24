import { supabase } from './supabase';

export interface ModerationResult {
  isApproved: boolean;
  flagged: string[];
  severity: 'low' | 'medium' | 'high';
  reason?: string;
  suggestedAction: 'allow' | 'warn' | 'block' | 'review';
}

export class ModerationService {
  private static readonly PROFANITY_WORDS = [
    // Basic profanity filter - in production, use a more comprehensive list
    'damn', 'hell', 'shit', 'fuck', 'bitch', 'ass', 'crap'
  ];

  private static readonly HARASSMENT_PATTERNS = [
    /you\s+(are|look|seem)\s+(ugly|stupid|fat|dumb)/i,
    /kill\s+yourself/i,
    /go\s+die/i,
    /nobody\s+likes\s+you/i,
    /you\s+should\s+die/i,
  ];

  private static readonly SPAM_PATTERNS = [
    /(.)\1{4,}/g, // Repeated characters
    /^\s*(.+?)\s*(\1\s*){2,}$/i, // Repeated words
    /click\s+here/i,
    /visit\s+my\s+website/i,
    /buy\s+now/i,
  ];

  private static readonly PERSONAL_INFO_PATTERNS = [
    /\b\d{3}-\d{3}-\d{4}\b/, // Phone numbers
    /\b\d{10}\b/, // Phone numbers without dashes
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email addresses
    /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/, // Credit card numbers
    /\b\d{3}-\d{2}-\d{4}\b/, // SSN
  ];

  private static readonly SEXUAL_CONTENT_PATTERNS = [
    /\b(sex|sexual|nude|naked|porn|xxx|dick|cock|pussy|tits|ass|boobs)\b/i,
    /want\s+to\s+hook\s+up/i,
    /send\s+me\s+pics/i,
    /nudes?/i,
  ];

  static async moderateContent(content: string, userId: string, contentType: 'message' | 'response' | 'profile'): Promise<ModerationResult> {
    const flags: string[] = [];
    let severity: 'low' | 'medium' | 'high' = 'low';
    let suggestedAction: 'allow' | 'warn' | 'block' | 'review' = 'allow';

    // Check for profanity
    if (this.containsProfanity(content)) {
      flags.push('profanity');
      severity = 'medium';
    }

    // Check for harassment
    if (this.containsHarassment(content)) {
      flags.push('harassment');
      severity = 'high';
    }

    // Check for spam
    if (this.containsSpam(content)) {
      flags.push('spam');
      severity = 'medium';
    }

    // Check for personal information
    if (this.containsPersonalInfo(content)) {
      flags.push('personal_info');
      severity = 'medium';
    }

    // Check for sexual content
    if (this.containsSexualContent(content)) {
      flags.push('sexual_content');
      severity = 'high';
    }

    // Check for excessive length
    if (content.length > 2000) {
      flags.push('excessive_length');
      severity = 'low';
    }

    // Determine suggested action based on severity and flags
    if (severity === 'high' || flags.includes('harassment')) {
      suggestedAction = 'block';
    } else if (severity === 'medium' || flags.length > 2) {
      suggestedAction = 'warn';
    } else if (flags.length > 0) {
      suggestedAction = 'review';
    }

    const result: ModerationResult = {
      isApproved: suggestedAction === 'allow',
      flagged: flags,
      severity,
      suggestedAction,
    };

    // Log moderation result
    await this.logModerationResult(userId, content, contentType, result);

    return result;
  }

  private static containsProfanity(content: string): boolean {
    const lowercaseContent = content.toLowerCase();
    return this.PROFANITY_WORDS.some(word => lowercaseContent.includes(word));
  }

  private static containsHarassment(content: string): boolean {
    return this.HARASSMENT_PATTERNS.some(pattern => pattern.test(content));
  }

  private static containsSpam(content: string): boolean {
    return this.SPAM_PATTERNS.some(pattern => pattern.test(content));
  }

  private static containsPersonalInfo(content: string): boolean {
    return this.PERSONAL_INFO_PATTERNS.some(pattern => pattern.test(content));
  }

  private static containsSexualContent(content: string): boolean {
    return this.SEXUAL_CONTENT_PATTERNS.some(pattern => pattern.test(content));
  }

  private static async logModerationResult(
    userId: string,
    content: string,
    contentType: string,
    result: ModerationResult
  ): Promise<void> {
    try {
      await supabase
        .from('moderation_logs')
        .insert({
          user_id: userId,
          content_type: contentType,
          content_hash: this.hashContent(content),
          flagged_reasons: result.flagged,
          severity: result.severity,
          suggested_action: result.suggestedAction,
          is_approved: result.isApproved,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error logging moderation result:', error);
    }
  }

  private static hashContent(content: string): string {
    // Simple hash function for content (in production, use crypto hash)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  static async getUserModerationHistory(userId: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase
      .from('moderation_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching moderation history:', error);
      return [];
    }

    return data || [];
  }

  static async getUserRiskScore(userId: string): Promise<number> {
    const history = await this.getUserModerationHistory(userId, 100);
    
    if (history.length === 0) return 0;

    let riskScore = 0;
    const recentHistory = history.slice(0, 20); // Last 20 moderation events

    recentHistory.forEach(log => {
      if (log.severity === 'high') riskScore += 10;
      else if (log.severity === 'medium') riskScore += 5;
      else if (log.severity === 'low') riskScore += 1;

      // Extra penalty for harassment
      if (log.flagged_reasons.includes('harassment')) riskScore += 20;
    });

    // Normalize to 0-100 scale
    return Math.min(riskScore, 100);
  }

  static async isUserRestricted(userId: string): Promise<boolean> {
    const riskScore = await this.getUserRiskScore(userId);
    return riskScore > 70; // Restrict users with high risk scores
  }

  static async reportUser(reporterUserId: string, reportedUserId: string, reason: string, evidence?: string): Promise<void> {
    try {
      await supabase
        .from('user_reports')
        .insert({
          reporter_user_id: reporterUserId,
          reported_user_id: reportedUserId,
          reason,
          evidence,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error reporting user:', error);
      throw error;
    }
  }

  static async getContentSuggestions(originalContent: string, flags: string[]): Promise<string[]> {
    const suggestions: string[] = [];

    if (flags.includes('profanity')) {
      suggestions.push('Consider using more positive language to create a welcoming environment.');
    }

    if (flags.includes('personal_info')) {
      suggestions.push('For your safety, avoid sharing personal information like phone numbers or addresses.');
    }

    if (flags.includes('sexual_content')) {
      suggestions.push('Cupido focuses on emotional connections. Keep conversations appropriate and respectful.');
    }

    if (flags.includes('harassment')) {
      suggestions.push('Please be kind and respectful. Harassment is not tolerated on Cupido.');
    }

    if (flags.includes('spam')) {
      suggestions.push('Keep your messages genuine and conversational. Avoid repetitive content.');
    }

    if (flags.includes('excessive_length')) {
      suggestions.push('Consider breaking long messages into smaller, more digestible parts.');
    }

    return suggestions;
  }

  static async cleanContent(content: string): Promise<string> {
    let cleanedContent = content;

    // Remove personal information
    cleanedContent = cleanedContent.replace(this.PERSONAL_INFO_PATTERNS[0], '[PHONE_REDACTED]');
    cleanedContent = cleanedContent.replace(this.PERSONAL_INFO_PATTERNS[1], '[PHONE_REDACTED]');
    cleanedContent = cleanedContent.replace(this.PERSONAL_INFO_PATTERNS[2], '[EMAIL_REDACTED]');

    // Replace profanity with asterisks
    this.PROFANITY_WORDS.forEach(word => {
      const regex = new RegExp(word, 'gi');
      cleanedContent = cleanedContent.replace(regex, '*'.repeat(word.length));
    });

    return cleanedContent;
  }

  static async getModerationStats(): Promise<{
    totalModerated: number;
    blocked: number;
    warned: number;
    flaggedToday: number;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('moderation_logs')
      .select('suggested_action, created_at')
      .gte('created_at', `${today}T00:00:00Z`)
      .lte('created_at', `${today}T23:59:59Z`);

    if (error) {
      console.error('Error fetching moderation stats:', error);
      return { totalModerated: 0, blocked: 0, warned: 0, flaggedToday: 0 };
    }

    const blocked = data.filter(log => log.suggested_action === 'block').length;
    const warned = data.filter(log => log.suggested_action === 'warn').length;

    return {
      totalModerated: data.length,
      blocked,
      warned,
      flaggedToday: data.length,
    };
  }
}