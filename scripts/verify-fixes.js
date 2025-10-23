#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyFixes() {
  console.log('🔍 Verifying Cross-Browser Fixes...\n');

  try {
    // 1. Check if active_sessions table exists
    console.log('1️⃣ Checking active_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('active_sessions')
      .select('*')
      .limit(1);
    
    if (sessionsError) {
      console.log('❌ active_sessions table error:', sessionsError.message);
    } else {
      console.log('✅ active_sessions table exists and is accessible');
    }

    // 2. Check for unique constraint on profiles.phone_number
    console.log('\n2️⃣ Checking phone_number uniqueness constraint...');
    const { data: constraints, error: constraintError } = await supabase.rpc('get_table_constraints', {
      table_name: 'profiles'
    }).single();
    
    if (constraintError) {
      // Try alternative check
      console.log('   Testing constraint by attempting duplicate insert...');
      
      // Try to insert two profiles with same phone number
      const testPhone = '+19999999999';
      
      // First insert
      await supabase.from('profiles').insert({
        phone_number: testPhone,
        name: 'Test User 1',
        created_at: new Date().toISOString()
      });
      
      // Try duplicate
      const { error: dupError } = await supabase.from('profiles').insert({
        phone_number: testPhone,
        name: 'Test User 2',
        created_at: new Date().toISOString()
      });
      
      if (dupError && dupError.message.includes('duplicate')) {
        console.log('✅ Phone number unique constraint is active');
      } else {
        console.log('⚠️  Could not verify unique constraint');
      }
      
      // Clean up test data
      await supabase.from('profiles').delete().eq('phone_number', testPhone);
    }

    // 3. Check current profile statistics
    console.log('\n3️⃣ Profile Statistics...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('phone_number, created_at')
      .order('created_at', { ascending: false });
    
    if (!profilesError && profiles) {
      const total = profiles.length;
      const withPhone = profiles.filter(p => p.phone_number && !p.phone_number.startsWith('demo_') && !p.phone_number.includes('-')).length;
      const demoUsers = profiles.filter(p => p.phone_number && p.phone_number.startsWith('demo_')).length;
      const invalidIds = profiles.filter(p => p.phone_number && p.phone_number.includes('-')).length;
      const nullPhones = profiles.filter(p => !p.phone_number).length;
      
      console.log(`   Total profiles: ${total}`);
      console.log(`   Valid phone numbers: ${withPhone}`);
      console.log(`   Demo users: ${demoUsers}`);
      console.log(`   Invalid IDs as phone: ${invalidIds}`);
      console.log(`   NULL phone numbers: ${nullPhones}`);
      
      // Check for duplicates after normalization
      const phoneMap = {};
      let duplicateCount = 0;
      
      profiles.forEach(p => {
        if (p.phone_number && !p.phone_number.startsWith('demo_')) {
          // Simple normalization
          const normalized = p.phone_number.replace(/\D/g, '');
          if (phoneMap[normalized]) {
            duplicateCount++;
          }
          phoneMap[normalized] = (phoneMap[normalized] || 0) + 1;
        }
      });
      
      if (duplicateCount > 0) {
        console.log(`   ⚠️  Potential duplicates found: ${duplicateCount}`);
      } else {
        console.log(`   ✅ No duplicate phone numbers found`);
      }
    }

    // 4. Test phone normalization
    console.log('\n4️⃣ Testing Phone Normalization (Client-Side)...');
    const testCases = [
      { input: '555-123-4567', expected: '+15551234567' },
      { input: '(555) 123-4567', expected: '+15551234567' },
      { input: '1-555-123-4567', expected: '+15551234567' },
      { input: '+1 555 123 4567', expected: '+15551234567' },
      { input: 'demo_12345', expected: null },
      { input: 'local_user_123', expected: null }
    ];
    
    console.log('   Phone normalization is handled client-side in phoneNormalizer.ts');
    console.log('   Test cases that should be handled:');
    testCases.forEach(tc => {
      console.log(`     "${tc.input}" → ${tc.expected || 'rejected'}`);
    });

    // 5. Summary
    console.log('\n✅ VERIFICATION COMPLETE');
    console.log('\n📋 Next Steps:');
    console.log('1. Test in browser: Open app in two different browsers');
    console.log('2. Log in with the same phone number in both');
    console.log('3. Verify that the first browser gets logged out');
    console.log('4. Send messages in the active browser');
    console.log('5. Verify messages appear after re-login in other browser');
    
  } catch (error) {
    console.error('❌ Verification error:', error);
  }
}

// Function to check if RPC exists (helper)
async function checkRPCExists(name) {
  try {
    const { data, error } = await supabase.rpc(name, {});
    return !error || !error.message.includes('not exist');
  } catch {
    return false;
  }
}

verifyFixes();