-- Database Cleanup for Beta Launch
-- Run this in Supabase SQL editor before beta launch

-- 1. First, identify what we're about to delete
SELECT 'Demo profiles to delete:' as info, COUNT(*) as count 
FROM profiles 
WHERE phone_number LIKE 'demo_%' OR phone_number LIKE 'local_%';

SELECT 'NULL phone profiles to delete:' as info, COUNT(*) as count 
FROM profiles 
WHERE phone_number IS NULL;

SELECT 'Invalid UUID-like profiles to delete:' as info, COUNT(*) as count 
FROM profiles 
WHERE LENGTH(phone_number) > 20 AND phone_number LIKE '%-%-%-%';

-- 2. Delete orphaned messages first (from deleted conversations)
DELETE FROM chat_messages 
WHERE conversation_id IN (
  SELECT id FROM chat_conversations 
  WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE phone_number LIKE 'demo_%' 
    OR phone_number LIKE 'local_%'
    OR phone_number IS NULL
    OR (LENGTH(phone_number) > 20 AND phone_number LIKE '%-%-%-%')
  )
);

-- 3. Delete conversations for test profiles
DELETE FROM chat_conversations 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE phone_number LIKE 'demo_%' 
  OR phone_number LIKE 'local_%'
  OR phone_number IS NULL
  OR (LENGTH(phone_number) > 20 AND phone_number LIKE '%-%-%-%')
);

-- 4. Delete test profiles
DELETE FROM profiles 
WHERE phone_number LIKE 'demo_%' 
OR phone_number LIKE 'local_%'
OR phone_number IS NULL
OR (LENGTH(phone_number) > 20 AND phone_number LIKE '%-%-%-%');

-- 5. Clean up stale sessions older than 24 hours
DELETE FROM active_sessions 
WHERE last_heartbeat < NOW() - INTERVAL '24 hours';

-- 6. Add rate limiting columns if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP DEFAULT NOW();

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone_normalized 
ON profiles(phone_number);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
ON chat_messages(conversation_id, created_at DESC);

-- 8. Verify cleanup
SELECT 'Remaining profiles:' as info, COUNT(*) as count FROM profiles;
SELECT 'Remaining conversations:' as info, COUNT(*) as count FROM chat_conversations;
SELECT 'Remaining messages:' as info, COUNT(*) as count FROM chat_messages;

-- 9. Reset daily message counts for existing users
UPDATE profiles SET 
  daily_message_count = 0,
  last_message_reset = CURRENT_DATE;

-- Done! Your database is now clean for beta launch