// Real-time monitoring of chat activity
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fupoylarelcwiewnvoyu.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1cG95bGFyZWxjd2lld252b3l1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwNzE2NjEsImV4cCI6MjA3NDY0NzY2MX0.te1p1ZKdK1M3ARrT4sG3b-h-ukV7TIcGFHMI9XtPUi4'
);

console.log('🔍 MONITORING CHAT ACTIVITY - Fresh restart with all fixes');
console.log('📱 App restarted at:', new Date().toLocaleString());
console.log('🌐 Open: http://localhost:8081');
console.log('');

// Monitor new users
const userSubscription = supabase
  .channel('user_changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'profiles' },
    (payload) => {
      const user = payload.new;
      console.log(`👤 NEW USER CREATED:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   ID: ${user.phone_number}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}`);
      console.log('');
      
      // Check if it's a unique session user
      if (user.phone_number.startsWith('user_')) {
        console.log('✅ GOOD: Unique session user (not shared +1234567890)');
      } else {
        console.log('❌ ISSUE: Still using shared phone number');
      }
      console.log('');
    }
  )
  .subscribe();

// Monitor new conversations
const conversationSubscription = supabase
  .channel('conversation_changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
    (payload) => {
      const conv = payload.new;
      console.log(`💬 NEW CONVERSATION:`);
      console.log(`   ID: ${conv.id}`);
      console.log(`   User: ${conv.user_id}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}`);
      console.log('');
    }
  )
  .subscribe();

// Monitor messages - most important!
const messageSubscription = supabase
  .channel('message_changes')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'chat_messages' },
    (payload) => {
      const msg = payload.new;
      const type = msg.is_bot ? 'BOT' : 'USER';
      const preview = msg.content.length > 60 ? msg.content.substring(0, 60) + '...' : msg.content;
      
      console.log(`📨 NEW MESSAGE [${type}]:`);
      console.log(`   Content: "${preview}"`);
      console.log(`   Model: ${msg.ai_model || 'none'}`);
      console.log(`   Time: ${new Date().toLocaleTimeString()}`);
      
      if (msg.is_bot) {
        if (msg.ai_model === 'haiku' || msg.ai_model === 'sonnet') {
          console.log('   🎉 SUCCESS: Claude AI working!');
        } else {
          console.log('   ❌ PROBLEM: Fallback response (no model)');
        }
      }
      console.log('');
    }
  )
  .subscribe();

// Initial status check
async function checkCurrentStatus() {
  console.log('📊 CURRENT STATUS CHECK:');
  
  const { data: users } = await supabase
    .from('profiles')
    .select('phone_number, name, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log(`Users in DB: ${users?.length || 0}`);
  users?.forEach((user, i) => {
    console.log(`  ${i+1}. ${user.name} (${user.phone_number})`);
  });
  
  const { data: messages } = await supabase
    .from('chat_messages')
    .select('is_bot, ai_model, created_at')
    .order('created_at', { ascending: false })
    .limit(3);
  
  console.log(`Recent messages: ${messages?.length || 0}`);
  const latestBot = messages?.find(m => m.is_bot);
  if (latestBot) {
    console.log(`  Latest bot model: ${latestBot.ai_model || 'none'}`);
  }
  console.log('');
  console.log('🎯 NOW TEST THE CHAT - Send a message and watch this monitor!');
  console.log('');
}

checkCurrentStatus();

// Keep monitoring for 2 minutes
setTimeout(() => {
  console.log('⏰ Monitoring complete - stopping listeners');
  userSubscription.unsubscribe();
  conversationSubscription.unsubscribe();
  messageSubscription.unsubscribe();
  process.exit(0);
}, 120000); // 2 minutes