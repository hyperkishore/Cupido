import { getDatabase } from './client';

const CREATE_TABLES_STATEMENT = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS user_reflections (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    question_id TEXT,
    question_text TEXT,
    answer_text TEXT,
    category TEXT,
    mood TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    hearts INTEGER DEFAULT 0,
    is_liked INTEGER DEFAULT 0,
    voice_used INTEGER DEFAULT 0,
    summary TEXT DEFAULT '',
    insights TEXT DEFAULT ''
  );
  
  CREATE INDEX IF NOT EXISTS idx_user_reflections_user_id ON user_reflections(user_id);

  CREATE TABLE IF NOT EXISTS community_reflections (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT,
    author_name TEXT,
    is_anonymous INTEGER DEFAULT 0,
    question TEXT,
    answer TEXT,
    mood TEXT,
    tags TEXT,
    created_at TEXT NOT NULL,
    community_hearts INTEGER DEFAULT 0,
    has_user_liked INTEGER DEFAULT 0,
    visibility TEXT DEFAULT 'community'
  );

  CREATE TABLE IF NOT EXISTS reflection_prompts (
    id TEXT PRIMARY KEY NOT NULL,
    question TEXT NOT NULL,
    category TEXT,
    context TEXT,
    frequency_weight INTEGER DEFAULT 1,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS reflection_stats (
    user_id TEXT PRIMARY KEY NOT NULL,
    total_points INTEGER DEFAULT 0,
    responses INTEGER DEFAULT 0,
    connected INTEGER DEFAULT 0,
    authenticity_score INTEGER DEFAULT 80,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_reflection_date TEXT
  );
`;

export const initializeSchema = async (): Promise<void> => {
  const db = await getDatabase();
  await db.execAsync(CREATE_TABLES_STATEMENT);

  // Stats will be created per user when needed
};
