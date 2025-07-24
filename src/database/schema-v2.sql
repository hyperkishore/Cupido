-- Cupido Database Schema V2 - Production Ready
-- PostgreSQL + Supabase with Vector Search

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if needed (for fresh install)
-- DROP SCHEMA public CASCADE;
-- CREATE SCHEMA public;

-- Users table (enhanced)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(50) UNIQUE,
    display_name VARCHAR(100),
    bio TEXT,
    date_of_birth DATE,
    age INTEGER GENERATED ALWAYS AS (DATE_PART('year', AGE(date_of_birth))) STORED,
    gender VARCHAR(20),
    location GEOGRAPHY(POINT),
    city VARCHAR(100),
    country VARCHAR(100),
    profile_photo_url TEXT,
    photos TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    is_premium BOOLEAN DEFAULT FALSE,
    profile_complete BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    preferences JSONB DEFAULT '{}',
    social_links JSONB DEFAULT '{}',
    streak_count INTEGER DEFAULT 0,
    total_reflections INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    last_reflection_date DATE,
    personality_vector VECTOR(384), -- For ML-based matching
    interests_vector VECTOR(384),
    values_vector VECTOR(384)
);

-- Enhanced reflections with embeddings
CREATE TABLE reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id),
    answer TEXT NOT NULL,
    answer_embedding VECTOR(1536), -- OpenAI/Claude embeddings
    authenticity_score INTEGER DEFAULT 0,
    word_count INTEGER,
    is_public BOOLEAN DEFAULT TRUE,
    is_voice_note BOOLEAN DEFAULT FALSE,
    voice_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sentiment JSONB DEFAULT '{}',
    keywords TEXT[],
    topics TEXT[],
    skip_reason VARCHAR(100),
    response_time INTEGER, -- seconds
    language VARCHAR(10) DEFAULT 'en'
);

-- Enhanced questions with AI capabilities
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    category VARCHAR(50),
    subcategory VARCHAR(50),
    difficulty INTEGER DEFAULT 1,
    created_by UUID REFERENCES users(id),
    is_ai_generated BOOLEAN DEFAULT FALSE,
    ai_prompt TEXT, -- Store the prompt used to generate
    is_approved BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    usage_count INTEGER DEFAULT 0,
    skip_count INTEGER DEFAULT 0,
    avg_authenticity_score FLOAT DEFAULT 0,
    avg_response_length INTEGER DEFAULT 0,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    follow_up_questions TEXT[], -- AI suggested follow-ups
    min_words INTEGER DEFAULT 20,
    max_words INTEGER DEFAULT 500
);

-- Enhanced matching with ML scores
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES users(id) ON DELETE CASCADE,
    compatibility_score FLOAT DEFAULT 0,
    personality_match FLOAT DEFAULT 0,
    interests_match FLOAT DEFAULT 0,
    values_match FLOAT DEFAULT 0,
    communication_style_match FLOAT DEFAULT 0,
    match_reasons JSONB DEFAULT '{}',
    common_interests TEXT[],
    common_values TEXT[],
    conversation_starters TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    user1_status VARCHAR(20) DEFAULT 'pending',
    user2_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    matched_at TIMESTAMP WITH TIME ZONE,
    last_interaction TIMESTAMP WITH TIME ZONE,
    interaction_quality_score FLOAT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user1_id, user2_id)
);

-- Enhanced messages with encryption
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT, -- Encrypted
    content_vector VECTOR(384), -- For semantic search
    message_type VARCHAR(20) DEFAULT 'text',
    media_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    sentiment_score FLOAT,
    metadata JSONB DEFAULT '{}'
);

-- Q&A Repository with moderation
CREATE TABLE qa_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES questions(id),
    reflection_id UUID REFERENCES reflections(id),
    user_id UUID REFERENCES users(id),
    answer_preview TEXT,
    full_answer TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_moderated BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'pending',
    moderated_by UUID REFERENCES users(id),
    moderated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tags TEXT[],
    quality_score FLOAT DEFAULT 0
);

-- Content moderation queue
CREATE TABLE moderation_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_type VARCHAR(50), -- reflection, qa_post, message, profile
    content_id UUID,
    content_text TEXT,
    user_id UUID REFERENCES users(id),
    auto_flagged BOOLEAN DEFAULT FALSE,
    auto_flag_reasons TEXT[],
    toxicity_score FLOAT,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    moderator_id UUID REFERENCES users(id),
    action_taken VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Enhanced notifications with channels
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50),
    channel VARCHAR(20) DEFAULT 'in_app', -- in_app, push, email, sms
    title TEXT,
    body TEXT,
    image_url TEXT,
    action_url TEXT,
    data JSONB DEFAULT '{}',
    priority VARCHAR(10) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- User reports with evidence
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    reported_content_id UUID,
    content_type VARCHAR(50),
    report_type VARCHAR(50),
    description TEXT,
    evidence_urls TEXT[],
    screenshot_urls TEXT[],
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    moderator_id UUID REFERENCES users(id),
    moderator_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    action_taken VARCHAR(100),
    appeal_status VARCHAR(20),
    appeal_notes TEXT
);

-- Match recommendations queue
CREATE TABLE match_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommended_user_id UUID REFERENCES users(id),
    score FLOAT,
    reasons JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending', -- pending, shown, accepted, rejected
    shown_at TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, recommended_user_id)
);

-- Daily insights
CREATE TABLE daily_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE,
    insight_type VARCHAR(50),
    title TEXT,
    content TEXT,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, insight_type)
);

-- Conversation quality tracking
CREATE TABLE conversation_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
    date DATE,
    messages_count INTEGER DEFAULT 0,
    avg_response_time INTEGER, -- seconds
    sentiment_score FLOAT,
    engagement_score FLOAT,
    depth_score FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(match_id, date)
);

-- Functions for matching algorithm
CREATE OR REPLACE FUNCTION calculate_compatibility_v2(user1_id UUID, user2_id UUID)
RETURNS TABLE(
    total_score FLOAT,
    personality_score FLOAT,
    interests_score FLOAT,
    values_score FLOAT,
    communication_score FLOAT,
    reasons JSONB
) AS $$
DECLARE
    v_personality_score FLOAT;
    v_interests_score FLOAT;
    v_values_score FLOAT;
    v_communication_score FLOAT;
    v_total_score FLOAT;
    v_reasons JSONB;
BEGIN
    -- Calculate personality match using vector similarity
    SELECT 1 - (u1.personality_vector <=> u2.personality_vector)
    INTO v_personality_score
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;
    
    -- Calculate interests match
    SELECT 1 - (u1.interests_vector <=> u2.interests_vector)
    INTO v_interests_score
    FROM users u1, users u2
    WHERE u1.id = user1_id AND u2.id = user2_id;
    
    -- Calculate values match from reflections
    SELECT AVG(1 - (r1.answer_embedding <=> r2.answer_embedding))
    INTO v_values_score
    FROM reflections r1
    JOIN reflections r2 ON r1.question_id = r2.question_id
    JOIN questions q ON q.id = r1.question_id
    WHERE r1.user_id = user1_id 
    AND r2.user_id = user2_id
    AND q.category IN ('Values', 'Beliefs');
    
    -- Calculate communication style match
    SELECT 
        1 - ABS(AVG(r1.word_count) - AVG(r2.word_count))::FLOAT / GREATEST(AVG(r1.word_count), AVG(r2.word_count))
    INTO v_communication_score
    FROM reflections r1, reflections r2
    WHERE r1.user_id = user1_id AND r2.user_id = user2_id;
    
    -- Calculate weighted total
    v_total_score := (
        COALESCE(v_personality_score, 0.5) * 0.3 +
        COALESCE(v_interests_score, 0.5) * 0.25 +
        COALESCE(v_values_score, 0.5) * 0.35 +
        COALESCE(v_communication_score, 0.5) * 0.1
    ) * 100;
    
    -- Build reasons
    v_reasons := jsonb_build_object(
        'personality_match', COALESCE(v_personality_score * 100, 50),
        'interests_match', COALESCE(v_interests_score * 100, 50),
        'values_match', COALESCE(v_values_score * 100, 50),
        'communication_match', COALESCE(v_communication_score * 100, 50)
    );
    
    RETURN QUERY SELECT 
        v_total_score,
        COALESCE(v_personality_score * 100, 50),
        COALESCE(v_interests_score * 100, 50),
        COALESCE(v_values_score * 100, 50),
        COALESCE(v_communication_score * 100, 50),
        v_reasons;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user vectors when reflections are added
CREATE OR REPLACE FUNCTION update_user_vectors()
RETURNS TRIGGER AS $$
BEGIN
    -- This would call an external API to generate vectors
    -- For now, it's a placeholder
    UPDATE users 
    SET last_active = NOW(),
        total_reflections = total_reflections + 1
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_vectors
AFTER INSERT ON reflections
FOR EACH ROW EXECUTE FUNCTION update_user_vectors();

-- Create indexes for vector similarity search
CREATE INDEX idx_users_personality_vector ON users USING ivfflat(personality_vector vector_cosine_ops);
CREATE INDEX idx_users_interests_vector ON users USING ivfflat(interests_vector vector_cosine_ops);
CREATE INDEX idx_reflections_embedding ON reflections USING ivfflat(answer_embedding vector_cosine_ops);
CREATE INDEX idx_messages_content_vector ON messages USING ivfflat(content_vector vector_cosine_ops);