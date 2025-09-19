-- Cupido Production Database Schema
-- Complete dating app with reflections, matching, and chat

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    first_name TEXT NOT NULL,
    last_name TEXT,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('man', 'woman', 'non-binary', 'other')),
    interested_in TEXT[] DEFAULT ARRAY['man', 'woman'],
    location_city TEXT,
    location_state TEXT,
    location_country TEXT DEFAULT 'US',
    latitude DECIMAL,
    longitude DECIMAL,
    bio TEXT,
    occupation TEXT,
    education TEXT,
    height_cm INTEGER,
    photos TEXT[], -- Array of image URLs
    preferences JSONB DEFAULT '{}',
    personality_vector vector(384), -- For AI matching
    values_vector vector(384),
    interests_tags TEXT[],
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT false,
    is_premium BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stats and streaks
CREATE TABLE user_stats (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    total_reflections INTEGER DEFAULT 0,
    reflection_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_reflection_date DATE,
    total_matches INTEGER DEFAULT 0,
    total_conversations INTEGER DEFAULT 0,
    authenticity_score DECIMAL DEFAULT 0,
    engagement_score DECIMAL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Daily questions
CREATE TABLE daily_questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question TEXT NOT NULL,
    theme TEXT NOT NULL,
    category TEXT NOT NULL,
    tone TEXT,
    emotional_depth TEXT CHECK (emotional_depth IN ('low', 'medium', 'high')),
    tags TEXT[],
    intended_use_case TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User reflections/answers
CREATE TABLE reflections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES daily_questions(id),
    question_text TEXT NOT NULL,
    answer_text TEXT NOT NULL,
    word_count INTEGER,
    sentiment_score DECIMAL,
    authenticity_score DECIMAL,
    topic_tags TEXT[],
    answer_vector vector(384), -- For semantic matching
    is_public BOOLEAN DEFAULT true,
    hearts_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User interactions with reflections
CREATE TABLE reflection_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
    interaction_type TEXT CHECK (interaction_type IN ('like', 'heart', 'comment', 'share')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reflection_id, interaction_type)
);

-- Matches between users
CREATE TABLE matches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    compatibility_score DECIMAL NOT NULL,
    matching_factors JSONB, -- What made them compatible
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'declined', 'blocked')),
    user1_liked BOOLEAN DEFAULT false,
    user2_liked BOOLEAN DEFAULT false,
    matched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Chat conversations
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE,
    user1_unread_count INTEGER DEFAULT 0,
    user2_unread_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'voice', 'reflection_share')),
    attachment_url TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User preferences for question personalization
CREATE TABLE user_question_preferences (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    preferred_themes TEXT[],
    preferred_depth TEXT CHECK (preferred_depth IN ('low', 'medium', 'high')),
    skipped_questions UUID[],
    favorite_questions UUID[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id)
);

-- Indexes for performance
CREATE INDEX idx_users_location ON users(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_users_last_active ON users(last_active DESC);
CREATE INDEX idx_users_personality_vector ON users USING ivfflat (personality_vector vector_cosine_ops);
CREATE INDEX idx_users_values_vector ON users USING ivfflat (values_vector vector_cosine_ops);
CREATE INDEX idx_reflections_user_id ON reflections(user_id);
CREATE INDEX idx_reflections_created_at ON reflections(created_at DESC);
CREATE INDEX idx_reflections_is_public ON reflections(is_public) WHERE is_public = true;
CREATE INDEX idx_reflections_answer_vector ON reflections USING ivfflat (answer_vector vector_cosine_ops);
CREATE INDEX idx_matches_users ON matches(user1_id, user2_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (simplified - expand for production)
CREATE POLICY "Users can view their own data" ON users
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can view public reflections" ON reflections
    FOR SELECT USING (is_public = true OR user_id = auth.uid());

CREATE POLICY "Users can manage their reflections" ON reflections
    FOR ALL USING (user_id = auth.uid());

-- Functions for matching algorithm
CREATE OR REPLACE FUNCTION calculate_compatibility_score(
    user1_id UUID,
    user2_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
    personality_sim DECIMAL;
    values_sim DECIMAL;
    interests_overlap INTEGER;
    age_compatibility DECIMAL;
    location_score DECIMAL;
    final_score DECIMAL;
BEGIN
    -- Calculate personality vector similarity
    SELECT 1 - (u1.personality_vector <=> u2.personality_vector) INTO personality_sim
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;

    -- Calculate values vector similarity  
    SELECT 1 - (u1.values_vector <=> u2.values_vector) INTO values_sim
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;

    -- Calculate interests overlap
    SELECT cardinality(u1.interests_tags & u2.interests_tags) INTO interests_overlap
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;

    -- Age compatibility (prefer within 5-year range)
    SELECT CASE 
        WHEN ABS(EXTRACT(YEAR FROM AGE(u1.date_of_birth)) - EXTRACT(YEAR FROM AGE(u2.date_of_birth))) <= 5 
        THEN 1.0
        ELSE 1.0 - (ABS(EXTRACT(YEAR FROM AGE(u1.date_of_birth)) - EXTRACT(YEAR FROM AGE(u2.date_of_birth))) - 5) * 0.1
    END INTO age_compatibility
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;

    -- Location score (simplified)
    location_score := 0.8; -- Default for now

    -- Weighted final score
    final_score := (
        COALESCE(personality_sim, 0) * 0.30 +
        COALESCE(values_sim, 0) * 0.35 +
        LEAST(interests_overlap * 0.1, 0.2) +
        COALESCE(age_compatibility, 0) * 0.10 +
        location_score * 0.05
    );

    RETURN GREATEST(0, LEAST(1, final_score));
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user stats
CREATE OR REPLACE FUNCTION update_user_stats_on_reflection()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_stats (user_id, total_reflections, last_reflection_date)
    VALUES (NEW.user_id, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO UPDATE SET
        total_reflections = user_stats.total_reflections + 1,
        last_reflection_date = CURRENT_DATE,
        reflection_streak = CASE
            WHEN user_stats.last_reflection_date = CURRENT_DATE - INTERVAL '1 day'
            THEN user_stats.reflection_streak + 1
            WHEN user_stats.last_reflection_date = CURRENT_DATE
            THEN user_stats.reflection_streak
            ELSE 1
        END,
        longest_streak = GREATEST(
            user_stats.longest_streak,
            CASE
                WHEN user_stats.last_reflection_date = CURRENT_DATE - INTERVAL '1 day'
                THEN user_stats.reflection_streak + 1
                ELSE user_stats.reflection_streak
            END
        ),
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stats_after_reflection
    AFTER INSERT ON reflections
    FOR EACH ROW EXECUTE FUNCTION update_user_stats_on_reflection();

-- Sample data for testing
INSERT INTO daily_questions (question, theme, category, tone, emotional_depth, tags, intended_use_case)
SELECT 
    question,
    theme,
    theme as category,
    tone,
    emotional_depth,
    ARRAY[theme],
    intended_use_case
FROM json_to_recordset('
[
  {
    "theme": "Self-Discovery",
    "question": "What'\''s something you'\''ve always been naturally drawn to that others might find puzzling?",
    "tone": "curious",
    "intended_use_case": "personal reflection prompt",
    "emotional_depth": "medium"
  },
  {
    "theme": "Values & Philosophy", 
    "question": "What'\''s a small act of kindness that restored your faith in people?",
    "tone": "hopeful",
    "intended_use_case": "positivity prompt",
    "emotional_depth": "medium"
  },
  {
    "theme": "Dating & Connection",
    "question": "What'\''s the best way someone has ever made you feel seen and understood?",
    "tone": "appreciative",
    "intended_use_case": "relationship quality discussion", 
    "emotional_depth": "high"
  }
]'::json) AS t(
    theme TEXT,
    question TEXT,
    tone TEXT,
    intended_use_case TEXT,
    emotional_depth TEXT
);