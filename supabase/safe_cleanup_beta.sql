-- SAFE Database Cleanup for Beta Launch
-- This preserves REAL USERS and only deletes test data
-- Run this in Supabase SQL editor before beta launch

-- 1. First, let's see what we're about to delete (PREVIEW ONLY)
SELECT 'Demo users to delete:' as category, COUNT(*) as count 
FROM profiles 
WHERE phone_number LIKE 'demo_%';

SELECT 'NULL phone to delete:' as category, COUNT(*) as count 
FROM profiles 
WHERE phone_number IS NULL;

SELECT 'UUID phone to delete:' as category, COUNT(*) as count 
FROM profiles 
WHERE phone_number = '880e8105-a596-4290-a216-aa53bc40fe3a';

SELECT 'KEEPING valid users:' as category, COUNT(*) as count 
FROM profiles 
WHERE phone_number NOT LIKE 'demo_%' 
  AND phone_number IS NOT NULL
  AND phone_number != '880e8105-a596-4290-a216-aa53bc40fe3a';

-- 2. Delete messages from demo conversations ONLY
DELETE FROM chat_messages 
WHERE conversation_id IN (
  SELECT id FROM chat_conversations 
  WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE phone_number LIKE 'demo_%' 
       OR phone_number IS NULL
       OR phone_number = '880e8105-a596-4290-a216-aa53bc40fe3a'
  )
);

-- 3. Delete demo conversations ONLY
DELETE FROM chat_conversations 
WHERE user_id IN (
  SELECT id FROM profiles 
  WHERE phone_number LIKE 'demo_%' 
     OR phone_number IS NULL
     OR phone_number = '880e8105-a596-4290-a216-aa53bc40fe3a'
);

-- 4. Delete demo/test profiles ONLY
DELETE FROM profiles 
WHERE phone_number LIKE 'demo_%' 
   OR phone_number IS NULL
   OR phone_number = '880e8105-a596-4290-a216-aa53bc40fe3a';

-- 5. Clean up stale sessions
DELETE FROM active_sessions 
WHERE last_heartbeat < NOW() - INTERVAL '24 hours';

-- 6. Add rate limiting columns if needed
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS daily_message_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_message_reset DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP DEFAULT NOW();

-- 7. Reset message counts for beta launch
UPDATE profiles 
SET daily_message_count = 0,
    last_message_reset = CURRENT_DATE
WHERE phone_number NOT LIKE 'demo_%';

-- 8. Final verification
SELECT 'Remaining REAL users:' as info, COUNT(*) as count FROM profiles;
SELECT 'Total conversations kept:' as info, COUNT(*) as count FROM chat_conversations;
SELECT 'Total messages kept:' as info, COUNT(*) as count FROM chat_messages;

-- List the kept users for verification
SELECT phone_number, name, created_at, last_active 
FROM profiles 
ORDER BY created_at DESC;

-- Summary: This will DELETE 27 test users and KEEP 14 real users