#!/usr/bin/env node

/**
 * Script to clear all data from Supabase database
 * Run with: node scripts/clear-database.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function clearDatabase() {
  console.log('🗑️  Starting database cleanup...\n');

  try {
    // 1. Delete all chat messages
    console.log('📝 Deleting all chat messages...');
    const { data: messages, error: messagesListError } = await supabase
      .from('chat_messages')
      .select('id')
      .limit(1000);

    if (messages && messages.length > 0) {
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records (id not equal to impossible UUID)

      if (messagesError) {
        console.error('❌ Error deleting messages:', messagesError.message);
      } else {
        console.log(`✅ Deleted ${messages.length} messages`);
      }
    } else {
      console.log('✅ No messages to delete');
    }

    // 2. Delete all conversations
    console.log('\n💬 Deleting all conversations...');
    const { data: conversations, error: convoListError } = await supabase
      .from('chat_conversations')
      .select('id')
      .limit(1000);

    if (conversations && conversations.length > 0) {
      const { error: convoError } = await supabase
        .from('chat_conversations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (convoError) {
        console.error('❌ Error deleting conversations:', convoError.message);
      } else {
        console.log(`✅ Deleted ${conversations.length} conversations`);
      }
    } else {
      console.log('✅ No conversations to delete');
    }

    // 3. Delete all user profiles
    console.log('\n👤 Deleting all user profiles...');
    const { data: users, error: usersListError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1000);

    if (users && users.length > 0) {
      const { error: usersError } = await supabase
        .from('user_profiles')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (usersError) {
        console.error('❌ Error deleting user profiles:', usersError.message);
      } else {
        console.log(`✅ Deleted ${users.length} user profiles`);
      }
    } else {
      console.log('✅ No user profiles to delete');
    }

    // 4. Delete all personality insights
    console.log('\n🧠 Deleting all personality insights...');
    const { data: insights, error: insightsListError } = await supabase
      .from('personality_insights')
      .select('id')
      .limit(1000);

    if (insights && insights.length > 0) {
      const { error: insightsError } = await supabase
        .from('personality_insights')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (insightsError) {
        console.error('❌ Error deleting personality insights:', insightsError.message);
      } else {
        console.log(`✅ Deleted ${insights.length} personality insights`);
      }
    } else {
      console.log('✅ No personality insights to delete');
    }

    // 5. Delete all voice notes
    console.log('\n🎙️  Deleting all voice notes...');
    const { data: voiceNotes, error: voiceNotesListError } = await supabase
      .from('voice_notes')
      .select('id')
      .limit(1000);

    if (voiceNotes && voiceNotes.length > 0) {
      const { error: voiceNotesError } = await supabase
        .from('voice_notes')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (voiceNotesError) {
        console.error('❌ Error deleting voice notes:', voiceNotesError.message);
      } else {
        console.log(`✅ Deleted ${voiceNotes.length} voice notes`);
      }
    } else {
      console.log('✅ No voice notes to delete');
    }

    // 6. Delete all matches
    console.log('\n💝 Deleting all matches...');
    const { data: matches, error: matchesListError } = await supabase
      .from('matches')
      .select('id')
      .limit(1000);

    if (matches && matches.length > 0) {
      const { error: matchesError } = await supabase
        .from('matches')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (matchesError) {
        console.error('❌ Error deleting matches:', matchesError.message);
      } else {
        console.log(`✅ Deleted ${matches.length} matches`);
      }
    } else {
      console.log('✅ No matches to delete');
    }

    // 7. Delete all reflections
    console.log('\n💭 Deleting all reflections...');
    const { data: reflections, error: reflectionsListError } = await supabase
      .from('reflections')
      .select('id')
      .limit(1000);

    if (reflections && reflections.length > 0) {
      const { error: reflectionsError } = await supabase
        .from('reflections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (reflectionsError) {
        console.error('❌ Error deleting reflections:', reflectionsError.message);
      } else {
        console.log(`✅ Deleted ${reflections.length} reflections`);
      }
    } else {
      console.log('✅ No reflections to delete');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Database cleanup completed successfully!');
    console.log('='.repeat(50));

    // Show summary
    console.log('\n📊 Summary:');
    console.log('• All chat messages deleted');
    console.log('• All conversations deleted');
    console.log('• All user profiles deleted');
    console.log('• All personality insights deleted');
    console.log('• All voice notes deleted');
    console.log('• All matches deleted');
    console.log('• All reflections deleted');
    console.log('\n🎉 Your Supabase database is now completely clean!');

  } catch (error) {
    console.error('\n❌ Fatal error during database cleanup:', error.message);
    process.exit(1);
  }
}

// Confirm before proceeding
console.log('⚠️  WARNING: This will delete ALL data from your Supabase database!');
console.log('This action cannot be undone.\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Type "DELETE ALL" to confirm: ', (answer) => {
  if (answer === 'DELETE ALL') {
    clearDatabase()
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else {
    console.log('\n❌ Cancelled. No data was deleted.');
    process.exit(0);
  }
  rl.close();
});