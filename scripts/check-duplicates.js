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

async function checkDuplicates() {
  console.log('🔍 Checking for duplicate profiles in Supabase...\n');

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

    console.log(`📊 Total profiles found: ${profiles.length}`);
    
    // Group profiles by normalized phone number
    const phoneGroups = {};
    profiles.forEach(profile => {
      if (!profile.phone_number) {
        console.log(`⚠️  Profile ${profile.id} has NULL phone_number`);
        return;
      }
      
      // Normalize phone number (remove non-digits, handle +1)
      const normalized = profile.phone_number
        .replace(/\D/g, '') // Remove all non-digits
        .replace(/^1(\d{10})$/, '$1') // Remove leading 1 for US numbers
        .replace(/^(\d{10})$/, '$1'); // Keep 10-digit numbers as-is
      
      if (!phoneGroups[normalized]) {
        phoneGroups[normalized] = [];
      }
      phoneGroups[normalized].push(profile);
    });

    // Find duplicates
    const duplicates = Object.entries(phoneGroups)
      .filter(([_, profiles]) => profiles.length > 1);

    if (duplicates.length === 0) {
      console.log('✅ No duplicate profiles found!');
    } else {
      console.log(`⚠️  Found ${duplicates.length} phone numbers with duplicate profiles:\n`);
      
      duplicates.forEach(([normalizedPhone, profiles]) => {
        console.log(`📱 Normalized Phone: ${normalizedPhone}`);
        profiles.forEach(profile => {
          console.log(`  - ID: ${profile.id}`);
          console.log(`    Phone: ${profile.phone_number}`);
          console.log(`    Name: ${profile.name}`);
          console.log(`    Created: ${new Date(profile.created_at).toLocaleString()}`);
          console.log(`    Last Active: ${profile.last_active ? new Date(profile.last_active).toLocaleString() : 'Never'}`);
        });
        console.log('');
      });
    }

    // Check for conversations linked to duplicate profiles
    if (duplicates.length > 0) {
      console.log('🔍 Checking conversations for duplicate profiles...\n');
      
      for (const [normalizedPhone, profiles] of duplicates) {
        for (const profile of profiles) {
          const { data: conversations, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('user_id', profile.id);
          
          if (!error && conversations && conversations.length > 0) {
            console.log(`📂 Profile ${profile.id} (${profile.phone_number}) has ${conversations.length} conversation(s)`);
            
            for (const conv of conversations) {
              const { data: messageCount } = await supabase
                .from('chat_messages')
                .select('id', { count: 'exact', head: true })
                .eq('conversation_id', conv.id);
              
              console.log(`   - Conversation ${conv.id}: ${messageCount?.length || 0} messages`);
            }
          }
        }
        console.log('');
      }
    }

    // Check for profiles using authUser.id instead of phone
    console.log('🔍 Checking for profiles using local IDs instead of phone numbers...\n');
    const localIdProfiles = profiles.filter(p => 
      p.phone_number && (
        p.phone_number.startsWith('local_') || 
        p.phone_number.includes('-') ||
        p.phone_number.length > 15 // UUID-like strings
      )
    );

    if (localIdProfiles.length > 0) {
      console.log(`⚠️  Found ${localIdProfiles.length} profiles with non-phone identifiers:`);
      localIdProfiles.forEach(profile => {
        console.log(`  - ID: ${profile.id}, Phone: ${profile.phone_number}`);
      });
    } else {
      console.log('✅ No profiles with local ID identifiers found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDuplicates();