// Script to check for duplicate messages in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('📊 Checking for duplicate AI responses in database...\n');

  // Get the last 20 bot messages
  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('id, content, created_at, conversation_id, is_bot')
    .eq('is_bot', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  console.log(`Found ${messages.length} recent bot messages\n`);

  // Group by conversation and check for duplicates
  const byConversation = {};
  messages.forEach(msg => {
    if (!byConversation[msg.conversation_id]) {
      byConversation[msg.conversation_id] = [];
    }
    byConversation[msg.conversation_id].push(msg);
  });

  let foundDuplicates = false;

  // Check each conversation for duplicate consecutive messages
  for (const [convId, msgs] of Object.entries(byConversation)) {
    console.log(`\nConversation: ${convId}`);
    console.log(`Messages: ${msgs.length}`);

    // Check for identical consecutive messages
    for (let i = 0; i < msgs.length - 1; i++) {
      const currentMsg = msgs[i];
      const nextMsg = msgs[i + 1];

      // Check if messages are similar (same content within 1 second)
      const timeDiff = new Date(currentMsg.created_at) - new Date(nextMsg.created_at);
      const sameContent = currentMsg.content === nextMsg.content;

      if (sameContent && Math.abs(timeDiff) < 2000) {
        foundDuplicates = true;
        console.log('\n🔴 DUPLICATE FOUND:');
        console.log('Message 1:', {
          id: currentMsg.id,
          time: currentMsg.created_at,
          preview: currentMsg.content.substring(0, 80)
        });
        console.log('Message 2:', {
          id: nextMsg.id,
          time: nextMsg.created_at,
          preview: nextMsg.content.substring(0, 80)
        });
        console.log(`Time difference: ${Math.abs(timeDiff)}ms`);
      }
    }

    if (msgs.length > 0) {
      console.log('Latest message preview:', msgs[0].content.substring(0, 100));
    }
  }

  if (!foundDuplicates) {
    console.log('\n✅ No duplicate messages found in database!');
    console.log('This means the duplicate might be a UI rendering issue, not a database issue.');
  } else {
    console.log('\n⚠️ Duplicates detected! The API is being called twice.');
  }
}

checkDuplicates().catch(console.error);
