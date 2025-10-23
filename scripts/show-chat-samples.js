#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function showChatSamples() {
  console.log('📱 SHOWING SAMPLE CONVERSATIONS FROM ACTIVE USERS\n');
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

    let conversationCount = 0;
    const maxConversations = 3; // Show 3 different users' conversations

    for (const user of validUsers) {
      if (conversationCount >= maxConversations) break;

      // Get conversations for this user
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1); // Get most recent conversation

      if (conversations && conversations.length > 0) {
        const conv = conversations[0];
        
        // Get message count
        const { count } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id);

        // Show conversations with at least 5 messages
        if (count >= 5) {
          conversationCount++;
          
          console.log('\n' + '─'.repeat(80));
          console.log(`👤 USER ${conversationCount}: ${user.name || 'Anonymous'}`);
          console.log(`📱 Phone: ${user.phone_number.substring(0, 7)}****`); // Privacy
          console.log(`📅 Last Active: ${user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Unknown'}`);
          console.log(`💬 Total Messages in Conversation: ${count}`);
          console.log('─'.repeat(80));
          console.log('\nCONVERSATION SAMPLE (First 20 messages):\n');

          // Get first 20 messages
          const { data: messages } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })
            .limit(20);

          if (messages) {
            messages.forEach((msg, index) => {
              const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              const sender = msg.is_bot ? '🤖 AI' : '👤 User';
              const prefix = msg.is_bot ? '   ' : '';
              
              // Truncate long messages for readability
              let content = msg.content;
              if (content.length > 200) {
                content = content.substring(0, 200) + '...';
              }
              
              console.log(`${prefix}[${time}] ${sender}: ${content.replace(/\n/g, ' ')}`);
            });
            
            if (count > 20) {
              console.log(`\n... ${count - 20} more messages in this conversation ...`);
            }
          }
          console.log('\n' + '=' .repeat(80));
        }
      }
    }

    // Summary
    console.log('\n📊 SUMMARY:');
    console.log(`- Showing ${conversationCount} sample conversations from real users`);
    console.log(`- Total valid users in database: ${validUsers.length}`);
    
    // Get total message count across all valid users
    let totalMessages = 0;
    for (const user of validUsers) {
      const { data: convs } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', user.id);
      
      if (convs) {
        for (const conv of convs) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          totalMessages += count || 0;
        }
      }
    }
    
    console.log(`- Total messages across all real users: ${totalMessages}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

showChatSamples();