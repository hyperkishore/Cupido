-- COMPLETE Database Reset for Production Launch
-- WARNING: This will DELETE ALL DATA - Use with caution!

-- 1. Preview what will be deleted
SELECT 'Total users to delete:' as category, COUNT(*) as count FROM profiles;
SELECT 'Total conversations to delete:' as category, COUNT(*) as count FROM chat_conversations;
SELECT 'Total messages to delete:' as category, COUNT(*) as count FROM chat_messages;
SELECT 'Total sessions to delete:' as category, COUNT(*) as count FROM active_sessions;

-- 2. Delete ALL messages
DELETE FROM chat_messages;

-- 3. Delete ALL conversations
DELETE FROM chat_conversations;

-- 4. Delete ALL profiles
DELETE FROM profiles;

-- 5. Delete ALL active sessions
DELETE FROM active_sessions;

-- 6. Add/Update columns for proper phone number handling
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS normalized_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP DEFAULT NOW();

-- 7. Create unique constraint on normalized phone (country_code + phone_number)
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS profiles_normalized_phone_key;

ALTER TABLE profiles 
ADD CONSTRAINT profiles_normalized_phone_key UNIQUE (normalized_phone);

-- 8. Reset sequences if needed
ALTER SEQUENCE IF EXISTS profiles_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chat_conversations_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS chat_messages_id_seq RESTART WITH 1;

-- 9. Final verification
SELECT 'Remaining users:' as info, COUNT(*) as count FROM profiles;
SELECT 'Remaining conversations:' as info, COUNT(*) as count FROM chat_conversations;
SELECT 'Remaining messages:' as info, COUNT(*) as count FROM chat_messages;
SELECT 'Database reset complete!' as status;