#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function analyzeUsers() {
  console.log('🔍 ANALYZING USER DATA IN DATABASE\n');
  console.log('=' .repeat(80));

  try {
    // Get all profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }

    console.log(`📊 TOTAL PROFILES: ${profiles.length}\n`);
    console.log('=' .repeat(80));

    // Categorize users
    const categories = {
      demo: [],
      local: [],
      nullPhone: [],
      uuid: [],
      valid: [],
      test: []
    };

    profiles.forEach(profile => {
      if (!profile.phone_number) {
        categories.nullPhone.push(profile);
      } else if (profile.phone_number.startsWith('demo_')) {
        categories.demo.push(profile);
      } else if (profile.phone_number.startsWith('local_')) {
        categories.local.push(profile);
      } else if (profile.phone_number.includes('-') && profile.phone_number.length > 20) {
        categories.uuid.push(profile);
      } else if (profile.phone_number.includes('test') || profile.name?.toLowerCase().includes('test')) {
        categories.test.push(profile);
      } else {
        categories.valid.push(profile);
      }
    });

    // Display each category
    console.log('📱 VALID PHONE USERS (' + categories.valid.length + ')');
    console.log('-'.repeat(80));
    for (const user of categories.valid) {
      const { data: convCount } = await supabase
        .from('chat_conversations')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { data: msgCount } = await supabase
        .from('chat_messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convCount?.[0]?.id || 'none');

      console.log(`✅ ${user.name || 'No Name'}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Phone: ${user.phone_number}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log(`   Last Active: ${user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}`);
      console.log(`   Conversations: ${convCount?.length || 0}`);
      console.log(`   Messages: ${msgCount?.length || 0}`);
      console.log('');
    }

    console.log('\n🤖 DEMO USERS (' + categories.demo.length + ')');
    console.log('-'.repeat(80));
    if (categories.demo.length > 0) {
      console.log('Sample entries:');
      categories.demo.slice(0, 3).forEach(user => {
        console.log(`- ${user.phone_number} (${user.name}) - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      });
      if (categories.demo.length > 3) {
        console.log(`... and ${categories.demo.length - 3} more demo users`);
      }
    }

    console.log('\n🔧 LOCAL/DEV USERS (' + categories.local.length + ')');
    console.log('-'.repeat(80));
    categories.local.forEach(user => {
      console.log(`- ${user.phone_number} (${user.name})`);
    });

    console.log('\n❌ NULL PHONE USERS (' + categories.nullPhone.length + ')');
    console.log('-'.repeat(80));
    categories.nullPhone.forEach(user => {
      console.log(`- ID: ${user.id} | Name: ${user.name || 'No Name'}`);
    });

    console.log('\n🆔 UUID-LIKE PHONE USERS (' + categories.uuid.length + ')');
    console.log('-'.repeat(80));
    categories.uuid.forEach(user => {
      console.log(`- ${user.phone_number.substring(0, 30)}... (${user.name})`);
    });

    console.log('\n🧪 TEST USERS (' + categories.test.length + ')');
    console.log('-'.repeat(80));
    categories.test.forEach(user => {
      console.log(`- ${user.phone_number} (${user.name})`);
    });

    // Check for actual activity
    console.log('\n📈 ACTIVITY ANALYSIS');
    console.log('=' .repeat(80));
    
    let activeUsers = 0;
    let totalConversations = 0;
    let totalMessages = 0;

    for (const profile of profiles) {
      const { data: conversations } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('user_id', profile.id);

      if (conversations && conversations.length > 0) {
        activeUsers++;
        totalConversations += conversations.length;

        for (const conv of conversations) {
          const { count } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id);
          
          if (count) totalMessages += count;
        }
      }
    }

    console.log(`👥 Active Users (with conversations): ${activeUsers}`);
    console.log(`💬 Total Conversations: ${totalConversations}`);
    console.log(`📝 Total Messages: ${totalMessages}`);

    // Get recent activity
    console.log('\n⏰ RECENT ACTIVITY (Last 7 Days)');
    console.log('=' .repeat(80));
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: recentMessages, error: recentError } = await supabase
      .from('chat_messages')
      .select('id, created_at, conversation_id')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (recentMessages && recentMessages.length > 0) {
      console.log(`Found ${recentMessages.length} recent messages:`);
      for (const msg of recentMessages.slice(0, 5)) {
        // Get conversation and user info
        const { data: conv } = await supabase
          .from('chat_conversations')
          .select('user_id')
          .eq('id', msg.conversation_id)
          .single();
        
        if (conv) {
          const { data: user } = await supabase
            .from('profiles')
            .select('phone_number, name')
            .eq('id', conv.user_id)
            .single();
          
          if (user) {
            console.log(`  - ${new Date(msg.created_at).toLocaleString()} by ${user.name || user.phone_number}`);
          }
        }
      }
    } else {
      console.log('No messages in the last 7 days');
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('=' .repeat(80));
    console.log('DELETE SAFELY:');
    console.log(`  ✅ ${categories.demo.length} demo users (demo_*))`);
    console.log(`  ✅ ${categories.local.length} local users (local_*)`);
    console.log(`  ✅ ${categories.nullPhone.length} null phone users`);
    console.log(`  ✅ ${categories.uuid.length} UUID-like phone users`);
    console.log('');
    console.log('KEEP:');
    console.log(`  ⚠️  ${categories.valid.length} valid phone users (might be real testers)`);
    console.log(`  ⚠️  ${categories.test.length} test users (check if needed)`);
    console.log('');
    console.log(`TOTAL TO DELETE: ${categories.demo.length + categories.local.length + categories.nullPhone.length + categories.uuid.length}`);
    console.log(`TOTAL TO KEEP: ${categories.valid.length + categories.test.length}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

analyzeUsers();