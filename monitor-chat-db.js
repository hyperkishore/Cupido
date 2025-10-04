/**
 * Real-time database monitor for chat messages
 * Shows new messages as they arrive in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fupoylarelcwiewnvoyu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cG95bGFyZWxjd2lld252b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzE2NjEsImV4cCI6MjA3NDY0NzY2MX0.te1p1ZKdK1M3ARrT4sG3b-h-ukV7TIcGFHMI9XtPUi4';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('========================================');
console.log('📊 Chat Database Monitor');
console.log('========================================');
console.log('🔍 Watching for new messages in real-time...');
console.log('📍 Database:', supabaseUrl);
console.log('⏰ Started at:', new Date().toISOString());
console.log('========================================\n');

// Get recent messages first
async function getRecentMessages() {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  console.log('📋 Last 5 messages in database:');
  console.log('========================================');

  if (data.length === 0) {
    console.log('(No messages found)');
  } else {
    data.reverse().forEach((msg, idx) => {
      const time = new Date(msg.created_at).toLocaleTimeString();
      const sender = msg.is_bot ? '🤖 BOT' : '👤 USER';
      const model = msg.ai_model || 'none';
      console.log(`\n${idx + 1}. ${sender} [${time}] [Model: ${model}]`);
      console.log(`   "${msg.content.substring(0, 80)}${msg.content.length > 80 ? '...' : ''}"`);
    });
  }

  console.log('\n========================================');
  console.log('👂 Now listening for new messages...\n');
}

// Subscribe to real-time updates
const subscription = supabase
  .channel('chat_messages_changes')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages'
    },
    (payload) => {
      const msg = payload.new;
      const time = new Date(msg.created_at).toLocaleTimeString();
      const sender = msg.is_bot ? '🤖 BOT' : '👤 USER';
      const model = msg.ai_model || 'none';

      console.log('========================================');
      console.log('🆕 NEW MESSAGE RECEIVED!');
      console.log('========================================');
      console.log(`⏰ Time: ${time}`);
      console.log(`👥 Sender: ${sender}`);
      console.log(`🤖 AI Model: ${model}`);
      console.log(`📝 Content: "${msg.content}"`);
      console.log(`🆔 Message ID: ${msg.id}`);
      console.log(`💬 Conversation ID: ${msg.conversation_id}`);

      // Validate AI model field
      if (msg.is_bot && !msg.ai_model) {
        console.log('⚠️  WARNING: Bot message has no AI model! (Fallback response)');
      } else if (msg.is_bot && msg.ai_model === 'none') {
        console.log('⚠️  WARNING: Bot message marked as "none" model! (Fallback response)');
      } else if (msg.is_bot && (msg.ai_model === 'haiku' || msg.ai_model === 'sonnet')) {
        console.log('✅ SUCCESS: Real AI response detected!');
      }

      console.log('========================================\n');
    }
  )
  .subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      console.log('✅ Connected to database real-time updates\n');
    } else if (status === 'CLOSED') {
      console.log('❌ Connection closed');
    } else if (status === 'CHANNEL_ERROR') {
      console.error('❌ Channel error');
    }
  });

// Show recent messages on start
getRecentMessages();

// Keep process running
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down monitor...');
  subscription.unsubscribe();
  process.exit(0);
});