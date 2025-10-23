#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials. Need SUPABASE_SERVICE_ROLE_KEY for migrations');
  console.log('Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running database migrations...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_active_sessions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql doesn't exist, try direct query (only works with service key)
      console.log('Trying alternative migration method...');
      
      // Split the migration into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // For complex statements, we'll need to handle them differently
        if (statement.includes('CREATE TABLE')) {
          console.log('⚠️  Note: Complex migrations require direct database access');
          console.log('Please run the following SQL in your Supabase dashboard:');
          console.log('\n' + migrationSQL);
          return;
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
    console.log('\n📝 Please run the following SQL manually in your Supabase SQL Editor:');
    console.log('Navigate to: https://supabase.com/dashboard/project/_/sql');
    
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_active_sessions.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    console.log('\n--- SQL to run ---\n');
    console.log(migrationSQL);
    console.log('\n--- End SQL ---\n');
  }
}

runMigration();