#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeValidUsers() {
  console.log('🔍 DETAILED ANALYSIS OF VALID USERS\n');
  console.log('=' .repeat(80));

  try {
    // Get valid phone users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .not('phone_number', 'like', 'demo_%')
      .not('phone_number', 'like', 'local_%')
      .not('phone_number', 'is', null)
      .order('created_at', { ascending: false });

    // Filter out UUID-like phones
    const validUsers = profiles.filter(p => 
      p.phone_number && p.phone_number.length < 20
    );

    console.log(`📱 Found ${validUsers.length} users with valid phone numbers\n`);

    // Analyze each user
    for (const user of validUsers) {
      console.log('─'.repeat(80));
      console.log(`👤 USER: ${user.name || 'No Name'}`);
      console.log(`📱 Phone: ${user.phone_number}`);
      console.log(`🆔 ID: ${user.id}`);
      console.log(`📅 Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`🕐 Last Active: ${user.last_active ? new Date(user.last_active).toLocaleString() : 'Never'}`);
      
      // Get conversations
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (conversations && conversations.length > 0) {
        console.log(`\n💬 Conversations: ${conversations.length}`);
        
        for (const conv of conversations) {
          // Get message count and samples
          const { data: messages, count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(3);

          console.log(`\n  📂 Conversation ${conv.id.substring(0, 8)}...`);
          console.log(`     Started: ${new Date(conv.created_at).toLocaleDateString()}`);
          console.log(`     Last Update: ${new Date(conv.updated_at).toLocaleDateString()}`);
          console.log(`     Total Messages: ${count || 0}`);
          
          if (messages && messages.length > 0) {
            console.log(`     Recent Messages:`);
            messages.forEach((msg, i) => {
              const preview = msg.content.substring(0, 50).replace(/\n/g, ' ');
              const sender = msg.is_bot ? '🤖 AI' : '👤 User';
              console.log(`       ${sender}: "${preview}${msg.content.length > 50 ? '...' : ''}"`);
            });
          }
        }
      } else {
        console.log('\n❌ No conversations found');
      }
      console.log('');
    }

    // Summary of phone number patterns
    console.log('=' .repeat(80));
    console.log('\n📊 PHONE NUMBER PATTERNS\n');
    
    const patterns = {
      indian: [],
      us: [],
      other: []
    };

    validUsers.forEach(user => {
      const phone = user.phone_number;
      if (phone.startsWith('+91')) {
        patterns.indian.push(user);
      } else if (phone.startsWith('+1') || phone.length === 10 || phone.length === 11) {
        patterns.us.push(user);
      } else {
        patterns.other.push(user);
      }
    });

    console.log(`🇮🇳 Indian Numbers (+91): ${patterns.indian.length}`);
    patterns.indian.forEach(u => console.log(`   - ${u.phone_number} (${u.name || 'No name'})`));
    
    console.log(`\n🇺🇸 US Numbers: ${patterns.us.length}`);
    patterns.us.forEach(u => console.log(`   - ${u.phone_number} (${u.name || 'No name'})`));
    
    console.log(`\n🌍 Other Numbers: ${patterns.other.length}`);
    patterns.other.forEach(u => console.log(`   - ${u.phone_number} (${u.name || 'No name'})`));

    // Activity summary
    console.log('\n' + '=' .repeat(80));
    console.log('\n📈 ACTIVITY SUMMARY\n');
    
    const activeInLast7Days = validUsers.filter(u => {
      if (!u.last_active) return false;
      const lastActive = new Date(u.last_active);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return lastActive > sevenDaysAgo;
    });

    const activeInLast30Days = validUsers.filter(u => {
      if (!u.last_active) return false;
      const lastActive = new Date(u.last_active);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastActive > thirtyDaysAgo;
    });

    console.log(`✅ Active in last 7 days: ${activeInLast7Days.length}`);
    activeInLast7Days.forEach(u => console.log(`   - ${u.phone_number} (${u.name || 'No name'})`));
    
    console.log(`\n📅 Active in last 30 days: ${activeInLast30Days.length}`);
    
    console.log(`\n💤 Inactive (30+ days): ${validUsers.length - activeInLast30Days.length}`);

    // Final recommendation
    console.log('\n' + '=' .repeat(80));
    console.log('\n🎯 FINAL RECOMMENDATION\n');
    console.log('These appear to be REAL USERS who have tested your app:');
    console.log(`- ${patterns.indian.length} Indian phone numbers (your target market?)`);
    console.log(`- ${activeInLast7Days.length} were active in the last week`);
    console.log(`- Total of ${validUsers.reduce((sum, u) => sum + (u.conversations || 0), 0)} real conversations`);
    console.log('\n⚠️  KEEP THESE USERS - They are legitimate testers/early users');
    console.log('✅ DELETE only the demo_* users and NULL phone users');

  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeValidUsers();