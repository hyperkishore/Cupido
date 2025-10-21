/**
 * CONVERSATION CONTEXT STRATEGY
 * 
 * Manages active memory for conversations to provide Claude with full context
 * while maintaining excellent performance through intelligent summarization.
 */

import { chatDatabase } from './chatDatabase';
import { chatAiService } from './chatAiService';
import { log } from '../utils/logger';
import type { 
  ConversationContext, 
  ConversationTurn, 
  ContextAssembly,
  ChatConversation 
} from './chatDatabase';

export class ConversationContextService {
  private contexts = new Map<string, ConversationContext>();
  
  // Configuration constants
  private readonly DEFAULT_MAX_RECENT_TURNS = 8; // Keep 8 most recent exchanges
  private readonly DEFAULT_MAX_TOKENS_BEFORE_SUMMARY = 2000; // Trigger summary at 2K tokens
  private readonly MAX_SUMMARY_TOKENS = 400; // Cap summary length
  private readonly SUMMARY_OVERLAP_TURNS = 2; // Keep 2 turns for context continuity

  /**
   * Initialize context for a conversation
   */
  async initializeContext(conversationId: string): Promise<ConversationContext> {
    log.debug('Initializing conversation context', { conversationId });
    
    // Check if context already exists in memory
    if (this.contexts.has(conversationId)) {
      return this.contexts.get(conversationId)!;
    }

    // Load conversation with existing summary
    const conversation = await chatDatabase.getConversationWithSummary(conversationId);
    
    // Load recent messages for active memory
    const recentMessages = await chatDatabase.getMessagesForContext(
      conversationId, 
      this.DEFAULT_MAX_RECENT_TURNS * 2 // Load extra to account for filtering
    );

    const context: ConversationContext = {
      conversationId,
      recentTurns: recentMessages.slice(-this.DEFAULT_MAX_RECENT_TURNS),
      conversationSummary: conversation?.conversation_summary || '',
      summaryTokenCount: conversation?.summary_token_count || 0,
      totalMessages: conversation?.total_messages || recentMessages.length,
      totalTokens: conversation?.total_tokens || this.calculateTotalTokens(recentMessages),
      lastSummaryUpdate: conversation?.last_summary_update || new Date().toISOString(),
      maxRecentTurns: this.DEFAULT_MAX_RECENT_TURNS,
      maxTokensBeforeSummary: this.DEFAULT_MAX_TOKENS_BEFORE_SUMMARY
    };

    this.contexts.set(conversationId, context);
    
    log.perf('Context initialization completed', performance.now(), {
      conversationId,
      recentTurns: context.recentTurns.length,
      summaryTokens: context.summaryTokenCount,
      totalTokens: context.totalTokens
    });

    return context;
  }

  /**
   * Add a new turn to the conversation context
   */
  async addTurn(
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: any
  ): Promise<void> {
    const context = await this.ensureContext(conversationId);
    
    const estimatedTokens = chatDatabase.estimateTokens(content);
    const turn: ConversationTurn = {
      messageId: `temp_${Date.now()}_${role}`,
      role,
      content,
      timestamp: new Date().toISOString(),
      estimatedTokens,
      metadata: {
        contextWeight: metadata?.contextWeight || 1.0,
        imageReferences: metadata?.imageReferences || [],
        messageType: metadata?.messageType || role
      }
    };

    // Add to recent turns
    context.recentTurns.push(turn);
    context.totalMessages += 1;
    context.totalTokens += estimatedTokens;

    // Check if we need to refresh summary
    const recentTokens = this.calculateTotalTokens(context.recentTurns);
    if (context.recentTurns.length > context.maxRecentTurns || 
        recentTokens > context.maxTokensBeforeSummary) {
      await this.refreshSummary(context);
    }

    log.debug('Added turn to conversation context', {
      conversationId,
      role,
      contentLength: content.length,
      estimatedTokens,
      recentTurns: context.recentTurns.length,
      totalTokens: context.totalTokens
    });
  }

  /**
   * Update turn with actual message ID after database save
   */
  updateTurnMessageId(conversationId: string, tempId: string, actualId: string): void {
    const context = this.contexts.get(conversationId);
    if (!context) return;

    const turn = context.recentTurns.find(t => t.messageId === tempId);
    if (turn) {
      turn.messageId = actualId;
      log.debug('Updated turn message ID', { conversationId, tempId, actualId });
    }
  }

  /**
   * Assemble context for Claude prompt
   */
  async assembleContext(conversationId: string): Promise<ContextAssembly> {
    const context = await this.ensureContext(conversationId);
    
    // Prepare system memory block
    let systemMemory = '';
    if (context.conversationSummary.trim()) {
      systemMemory = `Previous conversation context: ${context.conversationSummary.trim()}`;
    }

    // Prepare recent messages for Claude
    const recentMessages = context.recentTurns.map(turn => ({
      role: turn.role,
      content: this.processContentForClaude(turn.content, turn.metadata)
    }));

    const totalTokensEstimate = context.summaryTokenCount + 
      this.calculateTotalTokens(context.recentTurns);

    const contextStrategy = this.determineContextStrategy(context);

    log.debug('Assembled context for Claude', {
      conversationId,
      systemMemoryLength: systemMemory.length,
      recentMessagesCount: recentMessages.length,
      totalTokensEstimate,
      contextStrategy
    });

    return {
      systemMemory,
      recentMessages,
      totalTokensEstimate,
      contextStrategy
    };
  }

  /**
   * Refresh conversation summary by merging older turns
   */
  private async refreshSummary(context: ConversationContext): Promise<void> {
    log.debug('Starting summary refresh', { 
      conversationId: context.conversationId,
      recentTurns: context.recentTurns.length 
    });

    try {
      // Determine how many turns to summarize
      const turnsToSummarize = Math.max(
        context.recentTurns.length - context.maxRecentTurns + this.SUMMARY_OVERLAP_TURNS,
        0
      );

      if (turnsToSummarize === 0) {
        log.debug('No turns need summarization', { conversationId: context.conversationId });
        return;
      }

      // Extract turns to summarize
      const turnsForSummary = context.recentTurns.slice(0, turnsToSummarize);
      const remainingTurns = context.recentTurns.slice(turnsToSummarize - this.SUMMARY_OVERLAP_TURNS);

      // Create summary prompt
      const summaryPrompt = this.createSummaryPrompt(
        context.conversationSummary,
        turnsForSummary
      );

      // Generate new summary using AI
      const newSummaryResponse = await chatAiService.generateResponse(
        summaryPrompt,
        [], // Empty conversation history for summarization
        0   // Reset conversation count for summarization
      );

      const newSummary = this.extractSummaryFromResponse(newSummaryResponse.message);
      const newSummaryTokens = chatDatabase.estimateTokens(newSummary);

      // Update context
      context.conversationSummary = newSummary;
      context.summaryTokenCount = newSummaryTokens;
      context.recentTurns = remainingTurns;
      context.lastSummaryUpdate = new Date().toISOString();

      // Persist to database
      await chatDatabase.updateConversationSummary(
        context.conversationId,
        newSummary,
        newSummaryTokens,
        context.totalMessages,
        context.totalTokens
      );

      log.perf('Summary refresh completed', performance.now(), {
        conversationId: context.conversationId,
        summarizedTurns: turnsToSummarize,
        remainingTurns: remainingTurns.length,
        newSummaryTokens,
        totalTokens: context.totalTokens
      });

    } catch (error) {
      log.error('Failed to refresh summary', error, { 
        conversationId: context.conversationId 
      });
    }
  }

  /**
   * Create prompt for summarization
   */
  private createSummaryPrompt(
    existingSummary: string, 
    turnsToSummarize: ConversationTurn[]
  ): string {
    let prompt = `Please create a concise summary that captures the key context and progression of this conversation.\n\n`;
    
    if (existingSummary.trim()) {
      prompt += `Previous context: ${existingSummary.trim()}\n\n`;
    }
    
    prompt += `Recent conversation to incorporate:\n`;
    turnsToSummarize.forEach((turn, index) => {
      const speaker = turn.role === 'user' ? 'User' : 'Assistant';
      // Truncate very long messages for summarization
      const content = turn.content.length > 500 
        ? turn.content.substring(0, 500) + '...'
        : turn.content;
      prompt += `${speaker}: ${content}\n`;
    });
    
    prompt += `\nProvide a flowing narrative summary (max 300 words) that preserves:
1. Key topics discussed and decisions made
2. Important context about the user's situation or preferences  
3. The emotional tone and relationship dynamic
4. Any ongoing tasks or plans mentioned

Focus on what would be most helpful for continuing the conversation naturally.`;

    return prompt;
  }

  /**
   * Extract clean summary from AI response
   */
  private extractSummaryFromResponse(response: string): string {
    // Remove any leading prompts or instructions that might have been echoed
    let summary = response.trim();
    
    // Remove common AI response prefixes
    const prefixes = [
      'Here is a summary:',
      'Summary:',
      'Based on the conversation:',
      'The conversation summary:'
    ];
    
    for (const prefix of prefixes) {
      if (summary.toLowerCase().startsWith(prefix.toLowerCase())) {
        summary = summary.substring(prefix.length).trim();
        break;
      }
    }
    
    // Enforce token limit
    const maxLength = this.MAX_SUMMARY_TOKENS * 4; // Rough character estimate
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength);
      // Try to end at a sentence
      const lastSentence = summary.lastIndexOf('.');
      if (lastSentence > maxLength * 0.8) {
        summary = summary.substring(0, lastSentence + 1);
      }
    }
    
    return summary;
  }

  /**
   * Process content for Claude (handle image references, etc.)
   */
  private processContentForClaude(content: string, metadata?: any): string {
    let processedContent = content;
    
    // Add lightweight image references
    if (metadata?.imageReferences?.length > 0) {
      const imageRefs = metadata.imageReferences
        .map((ref: string) => `[Image:${ref}]`)
        .join(' ');
      processedContent = `${imageRefs} ${processedContent}`.trim();
    }
    
    return processedContent;
  }

  /**
   * Determine optimal context strategy based on conversation size
   */
  private determineContextStrategy(context: ConversationContext): 'full' | 'summarized' | 'minimal' {
    const totalTokens = context.summaryTokenCount + this.calculateTotalTokens(context.recentTurns);
    
    if (totalTokens < 1000) {
      return 'full';
    } else if (totalTokens < 3000) {
      return 'summarized';
    } else {
      return 'minimal';
    }
  }

  /**
   * Calculate total tokens for a set of turns
   */
  private calculateTotalTokens(turns: ConversationTurn[]): number {
    return turns.reduce((total, turn) => total + turn.estimatedTokens, 0);
  }

  /**
   * Ensure context exists for conversation
   */
  private async ensureContext(conversationId: string): Promise<ConversationContext> {
    if (!this.contexts.has(conversationId)) {
      return await this.initializeContext(conversationId);
    }
    return this.contexts.get(conversationId)!;
  }

  /**
   * Get context stats for debugging
   */
  getContextStats(conversationId: string): any {
    const context = this.contexts.get(conversationId);
    if (!context) return null;

    return {
      conversationId: context.conversationId,
      recentTurns: context.recentTurns.length,
      summaryTokenCount: context.summaryTokenCount,
      totalMessages: context.totalMessages,
      totalTokens: context.totalTokens,
      lastSummaryUpdate: context.lastSummaryUpdate,
      recentTokens: this.calculateTotalTokens(context.recentTurns)
    };
  }

  /**
   * Clear context from memory (for memory management)
   */
  clearContext(conversationId: string): void {
    this.contexts.delete(conversationId);
    log.debug('Cleared conversation context from memory', { conversationId });
  }
}

export const conversationContext = new ConversationContextService();