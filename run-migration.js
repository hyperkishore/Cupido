/**
 * Run a specific migration file
 * Usage: node run-migration.js <migration-file>
 * Example: node run-migration.js src/database/migrations/006_fix_version_increment_logic.sql
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)');
  process.exit(1);
}

const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Please specify a migration file');
  console.error('Usage: node run-migration.js <migration-file>');
  console.error('Example: node run-migration.js src/database/migrations/006_fix_version_increment_logic.sql');
  process.exit(1);
}

const migrationPath = path.join(__dirname, migrationFile);

if (!fs.existsSync(migrationPath)) {
  console.error(`❌ Migration file not found: ${migrationPath}`);
  process.exit(1);
}

console.log(`📄 Reading migration: ${migrationFile}`);
const sql = fs.readFileSync(migrationPath, 'utf8');

console.log(`🔌 Connecting to Supabase...`);
const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log(`🚀 Running migration...`);

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql doesn't exist, try direct execution (Supabase limits this)
      console.log('⚠️  RPC method not available, trying alternative...');

      // For function definitions, we can try to extract and run them individually
      // This is a workaround since Supabase doesn't support arbitrary SQL execution
      console.log('📝 Please run this migration manually via Supabase SQL Editor:');
      console.log('   https://supabase.com/dashboard/project/_/sql');
      console.log('\n' + '='.repeat(80));
      console.log(sql);
      console.log('='.repeat(80) + '\n');

      console.log('💡 Or use psql:');
      console.log(`   psql "${supabaseUrl.replace('https://', 'postgresql://postgres:YOUR_PASSWORD@').replace('.supabase.co', '.supabase.co:5432/postgres')}" -f ${migrationFile}`);

      return;
    }

    console.log('✅ Migration completed successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

runMigration();
