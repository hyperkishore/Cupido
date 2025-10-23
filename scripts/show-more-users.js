#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function showMoreUsers() {
  console.log('📱 SHOWING MORE USER CONVERSATIONS\n');
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

    // Filter out UUID phones and already shown users
    const validUsers = profiles.filter(p => 
      p.phone_number && 
      p.phone_number.length < 20 &&
      !p.phone_number.includes('708953') && // Skip NK (already shown)
      !p.phone_number.includes('868989') && // Skip User 868989 (already shown)
      !p.phone_number.includes('813344')    // Skip User 813344 (already shown)
    );

    console.log(`Found ${validUsers.length} additional users to show\n`);

    for (const user of validUsers) {
      // Get all conversations for this user
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      let totalUserMessages = 0;
      let hasActivity = false;

      if (conversations && conversations.length > 0) {
        for (const conv of conversations) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          
          if (count > 0) {
            hasActivity = true;
            totalUserMessages += count;
          }
        }
      }

      // Only show users with activity
      if (hasActivity) {
        console.log('\n' + '─'.repeat(80));
        console.log(`👤 USER: ${user.name || 'No Name'}`);
        console.log(`📱 Phone: ${user.phone_number.substring(0, 8)}****`);
        console.log(`🆔 User ID: ${user.id.substring(0, 8)}...`);
        console.log(`📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`🕐 Last Active: ${user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}`);
        console.log(`💬 Total Conversations: ${conversations.length}`);
        console.log(`📝 Total Messages: ${totalUserMessages}`);
        
        // Show each conversation
        for (const conv of conversations) {
          const { data: messages, count } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: true })
            .limit(15); // Show first 15 messages

          if (messages && messages.length > 0) {
            console.log('\n  📂 Conversation ' + conv.id.substring(0, 8) + '...');
            console.log(`     Started: ${new Date(conv.created_at).toLocaleString()}`);
            console.log(`     Messages: ${count}\n`);
            
            messages.forEach((msg, idx) => {
              const time = new Date(msg.created_at).toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
              const sender = msg.is_bot ? '🤖 AI' : '👤 User';
              const prefix = msg.is_bot ? '       ' : '     ';
              
              // Show message content (truncated if too long)
              let content = msg.content.replace(/\n/g, ' ');
              if (content.length > 150) {
                content = content.substring(0, 150) + '...';
              }
              
              console.log(`${prefix}[${time}] ${sender}: ${content}`);
            });
            
            if (count > 15) {
              console.log(`\n     ... ${count - 15} more messages in this conversation`);
            }
          }
        }
        console.log('\n' + '=' .repeat(80));
      } else if (user.name || user.created_at) {
        // Show users with profiles but no messages
        console.log('\n' + '─'.repeat(80));
        console.log(`👤 USER: ${user.name || 'No Name'} [NO MESSAGES YET]`);
        console.log(`📱 Phone: ${user.phone_number.substring(0, 8)}****`);
        console.log(`📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
        console.log(`❌ No conversations started yet`);
        console.log('─'.repeat(80));
      }
    }

    // Final summary
    console.log('\n📊 ADDITIONAL USER SUMMARY:');
    console.log(`- Total additional users shown: ${validUsers.length}`);
    
    const activeUsers = validUsers.filter(u => u.last_active);
    console.log(`- Users with activity: ${activeUsers.length}`);
    
    const recentUsers = validUsers.filter(u => {
      if (!u.last_active) return false;
      const lastActive = new Date(u.last_active);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastActive > sevenDaysAgo;
    });
    
    console.log(`- Active in last 7 days: ${recentUsers.length}`);

  } catch (error) {
    console.error('Error:', error);
  }
}

showMoreUsers();