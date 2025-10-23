#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function showActiveChats() {
  console.log('📱 SHOWING CONVERSATIONS WITH 10+ MESSAGES\n');
  console.log('=' .repeat(80));

  try {
    // Get valid phone users (not demo/test)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .not('phone_number', 'like', 'demo_%')
      .not('phone_number', 'like', 'local_%')
      .not('phone_number', 'is', null)
      .order('last_active', { ascending: false, nullsFirst: false });

    // Filter out UUID phones
    const validUsers = profiles.filter(p => 
      p.phone_number && p.phone_number.length < 20
    );

    let foundActiveChats = false;

    for (const user of validUsers) {
      // Get conversations for this user
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id);

      if (conversations) {
        for (const conv of conversations) {
          // Get message count first
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);

          // If 10+ messages, show the full conversation
          if (count >= 10) {
            foundActiveChats = true;
            
            console.log('\n' + '─'.repeat(80));
            console.log(`👤 USER: ${user.name || 'Anonymous'}`);
            console.log(`📱 Phone: ${user.phone_number}`);
            console.log(`💬 Conversation ID: ${conv.id}`);
            console.log(`📅 Started: ${new Date(conv.created_at).toLocaleString()}`);
            console.log(`📊 Total Messages: ${count}`);
            console.log('─'.repeat(80));
            console.log('\nCHAT FLOW:\n');

            // Get ALL messages for this conversation
            const { data: messages } = await supabase
              .from('chat_messages')
              .select('*')
              .eq('conversation_id', conv.id)
              .order('created_at', { ascending: true });

            if (messages) {
              messages.forEach((msg, index) => {
                const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });
                const sender = msg.is_bot ? '🤖 AI' : '👤 User';
                const prefix = msg.is_bot ? '   ' : '';
                
                console.log(`${prefix}[${time}] ${sender}:`);
                
                // Show full message content with proper formatting
                const lines = msg.content.split('\n');
                lines.forEach(line => {
                  console.log(`${prefix}  ${line}`);
                });
                
                console.log(''); // Empty line between messages
              });
            }
            console.log('=' .repeat(80));
          }
        }
      }
    }

    if (!foundActiveChats) {
      console.log('\n❌ No conversations found with 10+ messages');
      console.log('\nShowing conversations with 5+ messages instead...\n');
      
      // Look for conversations with 5+ messages
      for (const user of validUsers) {
        const { data: conversations } = await supabase
          .from('chat_conversations')
          .select('*')
          .eq('user_id', user.id);

        if (conversations) {
          for (const conv of conversations) {
            const { count } = await supabase
              .from('chat_messages')
              .select('*', { count: 'exact', head: true })
              .eq('conversation_id', conv.id);

            if (count >= 5) {
              console.log('\n' + '─'.repeat(80));
              console.log(`👤 USER: ${user.name || 'Anonymous'}`);
              console.log(`📱 Phone: ${user.phone_number}`);
              console.log(`💬 Total Messages: ${count}`);
              console.log('─'.repeat(80));
              console.log('\nCHAT FLOW:\n');

              const { data: messages } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: true });

              if (messages) {
                messages.forEach(msg => {
                  const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  });
                  const sender = msg.is_bot ? '🤖 AI' : '👤 User';
                  const prefix = msg.is_bot ? '   ' : '';
                  
                  console.log(`${prefix}[${time}] ${sender}:`);
                  
                  const lines = msg.content.split('\n');
                  lines.forEach(line => {
                    console.log(`${prefix}  ${line}`);
                  });
                  
                  console.log('');
                });
              }
              console.log('=' .repeat(80));
            }
          }
        }
      }
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

showActiveChats();