-- Migration: Add Simulator Testing Fields to conversations table
-- Run this in Supabase SQL Editor

-- Add simulator testing fields
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_simulator_test BOOLEAN DEFAULT false;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS simulator_params JSONB;

-- Add indexes for simulator queries
CREATE INDEX IF NOT EXISTS idx_conversations_is_simulator_test ON conversations(is_simulator_test);
CREATE INDEX IF NOT EXISTS idx_conversations_simulator_params ON conversations USING GIN (simulator_params);

-- Add comments for documentation
COMMENT ON COLUMN conversations.is_simulator_test IS 'Marks if this conversation is part of simulator testing (AI persona testing Cupido AI)';
COMMENT ON COLUMN conversations.simulator_params IS 'Simulator configuration: {persona_id, persona_name, temperature, top_p, max_tokens, speed_multiplier, started_at, paused_at, session_id}';

-- Example simulator_params structure:
-- {
--   "persona_id": "uuid-of-simulator-prompt",
--   "persona_name": "Sarcastic Sarah",
--   "temperature": 0.8,
--   "top_p": 0.95,
--   "max_tokens": 500,
--   "speed_multiplier": 1.0,
--   "started_at": "2025-10-19T12:00:00Z",
--   "paused_at": null,
--   "session_id": "uuid-of-simulator-session",
--   "auto_respond": true,
--   "max_messages": 50
-- }
