import { getDatabase } from '../database/client';
import { initializeSchema } from '../database/schema';
import {
  SAMPLE_USER_REFLECTIONS,
  SAMPLE_COMMUNITY_REFLECTIONS,
} from '../data/sampleReflections';
import { userContextService } from './userContext';

export interface UserReflectionRecord {
  id: string;
  questionId: string;
  questionText: string;
  answerText: string;
  category: string;
  mood?: string | null;
  tags: string[];
  createdAt: string;
  hearts: number;
  isLiked: boolean;
  voiceUsed: boolean;
  summary?: string;
  insights?: string[];
}

export interface CommunityReflectionRecord {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  question: string;
  answer: string;
  mood?: string | null;
  tags: string[];
  createdAt: string;
  communityHearts: number;
  hasUserLiked: boolean;
  visibility: 'community' | 'matched_only' | 'private';
}

export interface ReflectionStatsRecord {
  totalPoints: number;
  responses: number;
  connected: number;
  authenticityScore: number;
  currentStreak: number;
  longestStreak: number;
  lastReflectionDate?: string | null;
}

export interface CreateReflectionInput {
  id?: string;
  questionId: string;
  questionText: string;
  answerText: string;
  category: string;
  mood?: string | null;
  tags?: string[];
  createdAt?: string;
  hearts?: number;
  isLiked?: boolean;
  voiceUsed?: boolean;
  summary?: string;
  insights?: string[];
}

const mapUserRowToRecord = (row: any): UserReflectionRecord => ({
  id: row.id,
  questionId: row.question_id,
  questionText: row.question_text,
  answerText: row.answer_text,
  category: row.category,
  mood: row.mood,
  tags: row.tags ? JSON.parse(row.tags) : [],
  createdAt: row.created_at,
  hearts: row.hearts ?? 0,
  isLiked: Boolean(row.is_liked),
  voiceUsed: Boolean(row.voice_used),
  summary: row.summary || undefined,
  insights: row.insights ? JSON.parse(row.insights) : undefined,
});

const mapCommunityRowToRecord = (row: any): CommunityReflectionRecord => ({
  id: row.id,
  authorId: row.author_id,
  authorName: row.author_name,
  isAnonymous: Boolean(row.is_anonymous),
  question: row.question,
  answer: row.answer,
  mood: row.mood,
  tags: row.tags ? JSON.parse(row.tags) : [],
  createdAt: row.created_at,
  communityHearts: row.community_hearts ?? 0,
  hasUserLiked: Boolean(row.has_user_liked),
  visibility: (row.visibility || 'community') as CommunityReflectionRecord['visibility'],
});

class ReflectionsRepository {
  private initialized = false;
  private initializingPromise: Promise<void> | null = null;
  private useMemoryStore = false;
  private memoryStore: {
    userReflections: UserReflectionRecord[];
    communityReflections: CommunityReflectionRecord[];
    stats: ReflectionStatsRecord;
    prompts: { id: string; question: string; category: string }[];
  } | null = null;

  private ensureMemoryStore() {
    if (!this.memoryStore) {
      const userReflections: UserReflectionRecord[] = SAMPLE_USER_REFLECTIONS.map((reflection) => ({
        id: reflection.id,
        questionId: reflection.questionId,
        questionText: reflection.questionText,
        answerText: reflection.text,
        category: reflection.category,
        mood: null,
        tags: [],
        createdAt: reflection.timestamp,
        hearts: reflection.hearts,
        isLiked: Boolean(reflection.isLiked),
        voiceUsed: false,
        summary: '',
        insights: [],
      }));

      const communityReflections: CommunityReflectionRecord[] = SAMPLE_COMMUNITY_REFLECTIONS.map((reflection) => ({
        id: reflection.id,
        authorId: reflection.authorId,
        authorName: reflection.authorName,
        isAnonymous: reflection.isAnonymous,
        question: reflection.question,
        answer: reflection.answer,
        mood: reflection.mood,
        tags: reflection.tags,
        createdAt: reflection.createdAt,
        communityHearts: reflection.communityHearts,
        hasUserLiked: reflection.hasUserLiked,
        visibility: reflection.visibility,
      }));

      const stats: ReflectionStatsRecord = {
        totalPoints: SAMPLE_USER_REFLECTIONS.length * 5,
        responses: SAMPLE_USER_REFLECTIONS.length,
        connected: 0,
        authenticityScore: 82,
        currentStreak: 12,
        longestStreak: 12,
        lastReflectionDate: SAMPLE_USER_REFLECTIONS[0]?.timestamp ?? new Date().toISOString(),
      };

      const promptSet = new Map<string, { id: string; question: string; category: string }>();
      SAMPLE_USER_REFLECTIONS.forEach((reflection) => {
        promptSet.set(reflection.questionId, {
          id: reflection.questionId,
          question: reflection.questionText,
          category: reflection.category,
        });
      });
      SAMPLE_COMMUNITY_REFLECTIONS.forEach((reflection, index) => {
        const fallbackId = reflection.id || `community_seed_${index}`;
        promptSet.set(fallbackId, {
          id: fallbackId,
          question: reflection.question,
          category: reflection.tags?.[0] ?? 'COMMUNITY',
        });
      });

      this.memoryStore = {
        userReflections,
        communityReflections,
        stats,
        prompts: Array.from(promptSet.values()),
      };
    }

    return this.memoryStore!;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    if (this.initializingPromise) {
      await this.initializingPromise;
      return;
    }

    this.initializingPromise = (async () => {
      try {
        await initializeSchema();
        await this.seedPrompts();
        await this.seedUserReflections();
        await this.seedCommunityReflections();
        this.useMemoryStore = false;

        const sanityCheck = await this.listUserReflections(1);
        if (!sanityCheck.length) {
          this.useMemoryStore = true;
          this.ensureMemoryStore();
        }
      } catch (error) {
        console.warn('SQLite unavailable, using in-memory reflections store', error);
        this.useMemoryStore = true;
        this.ensureMemoryStore();
      } finally {
        this.initialized = true;
      }
    })().finally(() => {
      this.initializingPromise = null;
    });

    await this.initializingPromise;
  }

  private async seedPrompts(): Promise<void> {
    if (this.useMemoryStore) {
      return;
    }
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM reflection_prompts;');
    if (existing?.count && existing.count > 0) {
      return;
    }

    const uniquePrompts = new Map<string, { question: string; category: string }>();

    SAMPLE_USER_REFLECTIONS.forEach((reflection) => {
      uniquePrompts.set(reflection.questionId, {
        question: reflection.questionText,
        category: reflection.category,
      });
    });

    SAMPLE_COMMUNITY_REFLECTIONS.forEach((reflection, index) => {
      const id = reflection.id || `community_seed_${index}`;
      uniquePrompts.set(id, {
        question: reflection.question,
        category: reflection.tags?.[0] ?? 'COMMUNITY',
      });
    });

    const insertStatement = `
      INSERT OR IGNORE INTO reflection_prompts (id, question, category, context, frequency_weight, is_active)
      VALUES (?, ?, ?, ?, ?, 1);
    `;

    for (const [id, value] of uniquePrompts.entries()) {
      await db.runAsync(insertStatement, [
        id,
        value.question,
        value.category,
        null,
        1,
      ]);
    }
  }

  private async seedUserReflections(): Promise<void> {
    if (this.useMemoryStore) {
      return;
    }
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM user_reflections;');
    if (existing?.count && existing.count > 0) {
      return;
    }

    const insertStatement = `
      INSERT INTO user_reflections 
        (id, question_id, question_text, answer_text, category, mood, tags, created_at, hearts, is_liked, voice_used, summary, insights)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const reflection of SAMPLE_USER_REFLECTIONS) {
      await db.runAsync(insertStatement, [
        reflection.id,
        reflection.questionId,
        reflection.questionText,
        reflection.text,
        reflection.category,
        null,
        JSON.stringify([]),
        reflection.timestamp,
        reflection.hearts,
        reflection.isLiked ? 1 : 0,
        0,
        '',
        JSON.stringify([]),
      ]);
    }

    await db.runAsync(
      `UPDATE reflection_stats
       SET responses = ?, total_points = ?, current_streak = ?, longest_streak = ?, last_reflection_date = ?
       WHERE id = 1;`,
      [
        SAMPLE_USER_REFLECTIONS.length,
        SAMPLE_USER_REFLECTIONS.length * 5,
        12,
        12,
        SAMPLE_USER_REFLECTIONS[0]?.timestamp ?? new Date().toISOString(),
      ]
    );
  }

  private async seedCommunityReflections(): Promise<void> {
    if (this.useMemoryStore) {
      return;
    }
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM community_reflections;');
    if (existing?.count && existing.count > 0) {
      return;
    }

    const insertStatement = `
      INSERT INTO community_reflections 
        (id, author_id, author_name, is_anonymous, question, answer, mood, tags, created_at, community_hearts, has_user_liked, visibility)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    for (const reflection of SAMPLE_COMMUNITY_REFLECTIONS) {
      await db.runAsync(insertStatement, [
        reflection.id,
        reflection.authorId,
        reflection.authorName,
        reflection.isAnonymous ? 1 : 0,
        reflection.question,
        reflection.answer,
        reflection.mood,
        JSON.stringify(reflection.tags),
        reflection.createdAt,
        reflection.communityHearts,
        reflection.hasUserLiked ? 1 : 0,
        reflection.visibility,
      ]);
    }
  }

  async listUserReflections(limit = 50): Promise<UserReflectionRecord[]> {
    const userId = userContextService.getCurrentUserId();
    if (!userId) {
      // Return sample data if no user logged in
      if (this.useMemoryStore) {
        const store = this.ensureMemoryStore();
        return [...store.userReflections]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
      }
      return [];
    }
    
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      return [...store.userReflections]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }
    
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM user_reflections WHERE user_id = ? ORDER BY datetime(created_at) DESC LIMIT ?;',
      [userId, limit]
    );
    return rows.map(mapUserRowToRecord);
  }

  async createUserReflection(reflection: CreateReflectionInput): Promise<UserReflectionRecord> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      const createdAt = reflection.createdAt ?? new Date().toISOString();
      const id = reflection.id ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const record: UserReflectionRecord = {
        id,
        questionId: reflection.questionId,
        questionText: reflection.questionText,
        answerText: reflection.answerText,
        category: reflection.category,
        mood: reflection.mood ?? null,
        tags: reflection.tags ?? [],
        createdAt,
        hearts: reflection.hearts ?? 0,
        isLiked: Boolean(reflection.isLiked),
        voiceUsed: Boolean(reflection.voiceUsed),
        summary: reflection.summary,
        insights: reflection.insights,
      };

      store.userReflections.unshift(record);
      await this.incrementStatsAfterReflection(createdAt);
      return record;
    }
    const db = await getDatabase();
    const createdAt = reflection.createdAt ?? new Date().toISOString();
    const id = reflection.id ?? `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const userId = userContextService.requireCurrentUserId();
    
    await db.runAsync(
      `INSERT INTO user_reflections (id, user_id, question_id, question_text, answer_text, category, mood, tags, created_at, hearts, is_liked, voice_used, summary, insights)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        id,
        userId,
        reflection.questionId,
        reflection.questionText,
        reflection.answerText,
        reflection.category,
        reflection.mood ?? null,
        JSON.stringify(reflection.tags ?? []),
        createdAt,
        reflection.hearts ?? 0,
        reflection.isLiked ? 1 : 0,
        reflection.voiceUsed ? 1 : 0,
        reflection.summary ?? '',
        JSON.stringify(reflection.insights ?? []),
      ]
    );

    await this.incrementStatsAfterReflection(createdAt);

    return {
      id,
      questionId: reflection.questionId,
      questionText: reflection.questionText,
      answerText: reflection.answerText,
      category: reflection.category,
      mood: reflection.mood,
      tags: reflection.tags ?? [],
      createdAt,
      hearts: reflection.hearts ?? 0,
      isLiked: Boolean(reflection.isLiked),
      voiceUsed: Boolean(reflection.voiceUsed),
      summary: reflection.summary,
      insights: reflection.insights,
    };
  }

  async toggleUserReflectionLike(id: string): Promise<void> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      store.userReflections = store.userReflections.map((reflection) => {
        if (reflection.id !== id) {
          return reflection;
        }
        const isLiked = reflection.isLiked;
        const newHearts = reflection.hearts + (isLiked ? -1 : 1);
        return {
          ...reflection,
          isLiked: !isLiked,
          hearts: Math.max(newHearts, 0),
        };
      });
      return;
    }
    const db = await getDatabase();
    const record = await db.getFirstAsync<{ hearts: number; is_liked: number }>(
      'SELECT hearts, is_liked FROM user_reflections WHERE id = ?;',
      [id]
    );

    if (!record) {
      return;
    }

    const isLiked = record.is_liked === 1;
    const newHearts = record.hearts + (isLiked ? -1 : 1);

    await db.runAsync(
      'UPDATE user_reflections SET hearts = ?, is_liked = ? WHERE id = ?;',
      [Math.max(newHearts, 0), isLiked ? 0 : 1, id]
    );
  }

  async listCommunityReflections(limit = 20): Promise<CommunityReflectionRecord[]> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      return [...store.communityReflections]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    }
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM community_reflections ORDER BY datetime(created_at) DESC LIMIT ?;',
      [limit]
    );
    return rows.map(mapCommunityRowToRecord);
  }

  async likeCommunityReflection(id: string): Promise<void> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      store.communityReflections = store.communityReflections.map((reflection) => {
        if (reflection.id !== id) {
          return reflection;
        }
        const isLiked = reflection.hasUserLiked;
        const newHearts = reflection.communityHearts + (isLiked ? -1 : 1);
        return {
          ...reflection,
          hasUserLiked: !isLiked,
          communityHearts: Math.max(newHearts, 0),
        };
      });
      return;
    }
    const db = await getDatabase();
    const record = await db.getFirstAsync<{ community_hearts: number; has_user_liked: number }>(
      'SELECT community_hearts, has_user_liked FROM community_reflections WHERE id = ?;',
      [id]
    );

    if (!record) {
      return;
    }

    const isLiked = record.has_user_liked === 1;
    const newHearts = record.community_hearts + (isLiked ? -1 : 1);

    await db.runAsync(
      'UPDATE community_reflections SET community_hearts = ?, has_user_liked = ? WHERE id = ?;',
      [Math.max(newHearts, 0), isLiked ? 0 : 1, id]
    );
  }

  async getStats(): Promise<ReflectionStatsRecord> {
    const userId = userContextService.getCurrentUserId();
    if (!userId) {
      // Return default stats if no user logged in
      return {
        totalPoints: 0,
        responses: 0,
        connected: 0,
        authenticityScore: 80,
        currentStreak: 0,
        longestStreak: 0,
        lastReflectionDate: null,
      };
    }
    
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      return { ...store.stats };
    }
    
    const db = await getDatabase();
    const record = await db.getFirstAsync<any>('SELECT * FROM reflection_stats WHERE user_id = ?;', [userId]);
    
    if (!record) {
      // Create initial stats for new user
      await db.runAsync(
        `INSERT INTO reflection_stats (user_id, total_points, responses, connected, authenticity_score, current_streak, longest_streak)
         VALUES (?, 0, 0, 0, 80, 0, 0);`,
        [userId]
      );
      return {
        totalPoints: 0,
        responses: 0,
        connected: 0,
        authenticityScore: 80,
        currentStreak: 0,
        longestStreak: 0,
        lastReflectionDate: null,
      };
    }
    
    return {
      totalPoints: record.total_points ?? 0,
      responses: record.responses ?? 0,
      connected: record.connected ?? 0,
      authenticityScore: record.authenticity_score ?? 0,
      currentStreak: record.current_streak ?? 0,
      longestStreak: record.longest_streak ?? 0,
      lastReflectionDate: record.last_reflection_date ?? null,
    };
  }

  async listActivePrompts(limit = 50): Promise<{ id: string; question: string; category: string }[]> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      return store.prompts.slice(0, limit);
    }
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT id, question, category FROM reflection_prompts WHERE is_active = 1 LIMIT ?;',
      [limit]
    );

    return rows.map((row) => ({
      id: row.id,
      question: row.question,
      category: row.category,
    }));
  }

  async updateStats(partial: Partial<ReflectionStatsRecord>): Promise<void> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      store.stats = {
        totalPoints: partial.totalPoints ?? store.stats.totalPoints,
        responses: partial.responses ?? store.stats.responses,
        connected: partial.connected ?? store.stats.connected,
        authenticityScore: partial.authenticityScore ?? store.stats.authenticityScore,
        currentStreak: partial.currentStreak ?? store.stats.currentStreak,
        longestStreak: partial.longestStreak ?? store.stats.longestStreak,
        lastReflectionDate: partial.lastReflectionDate ?? store.stats.lastReflectionDate,
      };
      return;
    }
    const db = await getDatabase();
    const current = await this.getStats();

    const userId = userContextService.requireCurrentUserId();
    
    // Ensure stats record exists for user
    await db.runAsync(
      `INSERT OR IGNORE INTO reflection_stats (user_id, total_points, responses, connected, authenticity_score, current_streak, longest_streak)
       VALUES (?, 0, 0, 0, 80, 0, 0);`,
      [userId]
    );
    
    await db.runAsync(
      `UPDATE reflection_stats SET
        total_points = ?,
        responses = ?,
        connected = ?,
        authenticity_score = ?,
        current_streak = ?,
        longest_streak = ?,
        last_reflection_date = ?
      WHERE user_id = ?;`,
      [
        partial.totalPoints ?? current.totalPoints,
        partial.responses ?? current.responses,
        partial.connected ?? current.connected,
        partial.authenticityScore ?? current.authenticityScore,
        partial.currentStreak ?? current.currentStreak,
        partial.longestStreak ?? current.longestStreak,
        partial.lastReflectionDate ?? current.lastReflectionDate ?? new Date().toISOString(),
        userId
      ]
    );
  }

  private async incrementStatsAfterReflection(completedAt: string): Promise<void> {
    if (this.useMemoryStore) {
      const store = this.ensureMemoryStore();
      const completedDate = new Date(completedAt).toISOString();
      const lastDate = store.stats.lastReflectionDate
        ? new Date(store.stats.lastReflectionDate)
        : null;
      const completedDay = new Date(completedAt);
      const isConsecutive =
        lastDate &&
        new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate() + 1).toDateString() ===
          new Date(completedDay.getFullYear(), completedDay.getMonth(), completedDay.getDate()).toDateString();

      const newCurrentStreak = isConsecutive ? store.stats.currentStreak + 1 : 1;
      store.stats = {
        ...store.stats,
        responses: store.stats.responses + 1,
        totalPoints: store.stats.totalPoints + 5,
        currentStreak: newCurrentStreak,
        longestStreak: Math.max(store.stats.longestStreak, newCurrentStreak),
        lastReflectionDate: completedDate,
      };
      return;
    }
    const userId = userContextService.getCurrentUserId();
    if (!userId) return;
    
    const db = await getDatabase();
    
    // Ensure stats record exists for user
    await db.runAsync(
      `INSERT OR IGNORE INTO reflection_stats (user_id, total_points, responses, connected, authenticity_score, current_streak, longest_streak)
       VALUES (?, 0, 0, 0, 80, 0, 0);`,
      [userId]
    );
    
    await db.runAsync(
      `UPDATE reflection_stats SET
        responses = responses + 1,
        total_points = total_points + 5,
        current_streak = CASE
          WHEN last_reflection_date IS NULL THEN 1
          WHEN date(last_reflection_date) = date(?) THEN current_streak
          WHEN date(last_reflection_date, '+1 day') = date(?) THEN current_streak + 1
          ELSE 1
        END,
        longest_streak = CASE
          WHEN current_streak + 1 > longest_streak THEN current_streak + 1
          ELSE longest_streak
        END,
        last_reflection_date = ?
      WHERE user_id = ?;`,
      [completedAt, completedAt, completedAt, userId]
    );
  }

  async updateReflectionMetadata(
    id: string,
    metadata: {
      summary?: string;
      insights?: string[];
      mood?: string | null;
      tags?: string[];
    }
  ): Promise<void> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM user_reflections WHERE id = ?;', [id]);
    if (!existing) {
      return;
    }

    const tagsValue = metadata.tags ? JSON.stringify(metadata.tags) : null;
    const insightsValue = metadata.insights ? JSON.stringify(metadata.insights) : null;
    const summaryValue = metadata.summary ?? null;
    const moodValue = metadata.mood ?? null;

    await db.runAsync(
      `UPDATE user_reflections
       SET summary = COALESCE(?, summary),
           insights = COALESCE(?, insights),
           mood = COALESCE(?, mood),
           tags = CASE WHEN ? IS NULL THEN tags ELSE ? END
       WHERE id = ?;`,
      [
        summaryValue,
        insightsValue,
        moodValue,
        tagsValue,
        tagsValue,
        id,
      ]
    );
  }
}

export const reflectionsRepository = new ReflectionsRepository();
