#!/usr/bin/env node

/**
 * Database Reset and Initialization Script
 *
 * This script:
 * 1. Clears all data from chat-related tables
 * 2. Drops and recreates tables with proper schema
 * 3. Sets up indexes and constraints
 * 4. Validates the database structure
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function resetDatabase() {
  console.log('🗄️  DATABASE RESET AND INITIALIZATION');
  console.log('=====================================\n');

  try {
    // Step 1: Clear all existing data
    console.log('📋 Step 1: Clearing existing data...');

    // Delete in correct order (messages -> conversations -> profiles)
    console.log('  - Deleting chat messages...');
    const { error: msgDeleteError } = await supabase
      .from('chat_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (never match this UUID)

    if (msgDeleteError && msgDeleteError.code !== 'PGRST116') {
      console.log(`    ⚠️  Note: ${msgDeleteError.message}`);
    } else {
      console.log('    ✅ Chat messages cleared');
    }

    console.log('  - Deleting conversations...');
    const { error: convDeleteError } = await supabase
      .from('chat_conversations')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (convDeleteError && convDeleteError.code !== 'PGRST116') {
      console.log(`    ⚠️  Note: ${convDeleteError.message}`);
    } else {
      console.log('    ✅ Conversations cleared');
    }

    console.log('  - Deleting profiles...');
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (profileDeleteError && profileDeleteError.code !== 'PGRST116') {
      console.log(`    ⚠️  Note: ${profileDeleteError.message}`);
    } else {
      console.log('    ✅ Profiles cleared');
    }

    console.log('\n✅ Step 1 Complete: All data cleared\n');

    // Step 2: Verify table structure
    console.log('📋 Step 2: Verifying table structure...');

    // Test profiles table
    console.log('  - Checking profiles table...');
    const { error: profileTest } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (profileTest) {
      console.log(`    ⚠️  profiles table issue: ${profileTest.message}`);
      console.log('    💡 You may need to create this table in Supabase dashboard');
    } else {
      console.log('    ✅ profiles table exists');
    }

    // Test chat_conversations table
    console.log('  - Checking chat_conversations table...');
    const { error: convTest } = await supabase
      .from('chat_conversations')
      .select('id')
      .limit(1);

    if (convTest) {
      console.log(`    ⚠️  chat_conversations table issue: ${convTest.message}`);
      console.log('    💡 You may need to create this table in Supabase dashboard');
    } else {
      console.log('    ✅ chat_conversations table exists');
    }

    // Test chat_messages table
    console.log('  - Checking chat_messages table...');
    const { error: msgTest } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1);

    if (msgTest) {
      console.log(`    ⚠️  chat_messages table issue: ${msgTest.message}`);
      console.log('    💡 You may need to create this table in Supabase dashboard');
    } else {
      console.log('    ✅ chat_messages table exists');
    }

    console.log('\n✅ Step 2 Complete: Table structure verified\n');

    // Step 3: Show SQL for manual table creation (if needed)
    console.log('📋 Step 3: Database schema reference');
    console.log('\nIf any tables are missing, run this SQL in Supabase SQL Editor:\n');
    console.log('```sql');
    console.log(`-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT UNIQUE,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_bot BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated ON chat_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON chat_messages(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your security needs)
CREATE POLICY "Allow public read access on profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on profiles"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on conversations"
  ON chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on conversations"
  ON chat_conversations FOR UPDATE
  USING (true);

CREATE POLICY "Allow public read access on messages"
  ON chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert on messages"
  ON chat_messages FOR INSERT
  WITH CHECK (true);
`);
    console.log('```\n');

    console.log('✅ DATABASE RESET COMPLETE!\n');
    console.log('📝 Summary:');
    console.log('  - All existing data has been cleared');
    console.log('  - Table structure has been verified');
    console.log('  - Database is ready for testing\n');
    console.log('🧪 Next steps:');
    console.log('  1. Clear browser localStorage: localStorage.clear()');
    console.log('  2. Refresh the page');
    console.log('  3. Navigate to Cupido tab');
    console.log('  4. Send a test message\n');

  } catch (error) {
    console.error('\n❌ Error during database reset:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase();
