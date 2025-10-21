/**
 * Check what tables and columns exist in Supabase
 * This helps determine which migrations have already been run
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase Schema...\n');

  // Check for specific tables
  const tablesToCheck = [
    'profiles',
    'prompt_versions',
    'prompt_git_commits',
    'app_versions',
    'image_attachments',
    'chat_messages',
    'chat_conversations'
  ];

  const results = {
    existingTables: [],
    missingTables: [],
    profileColumns: [],
    promptVersionsColumns: []
  };

  // Check each table
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0); // Just check if table exists

      if (error) {
        if (error.message.includes('does not exist') || error.code === '42P01') {
          results.missingTables.push(table);
          console.log(`❌ ${table} - DOES NOT EXIST`);
        } else {
          console.log(`⚠️  ${table} - Error: ${error.message}`);
        }
      } else {
        results.existingTables.push(table);
        console.log(`✅ ${table} - EXISTS`);
      }
    } catch (err) {
      console.log(`⚠️  ${table} - Error checking: ${err.message}`);
    }
  }

  console.log('\n');

  // Check profiles table columns if it exists
  if (results.existingTables.includes('profiles')) {
    console.log('📋 Checking profiles table columns...');

    const columnsToCheck = [
      'date_of_birth',
      'gender',
      'bio',
      'photos',
      'location',
      'looking_for',
      'relationship_goals',
      'profile_completeness',
      'is_profile_complete'
    ];

    for (const column of columnsToCheck) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(column)
          .limit(0);

        if (error) {
          console.log(`  ❌ ${column} - NOT FOUND`);
        } else {
          results.profileColumns.push(column);
          console.log(`  ✅ ${column} - EXISTS`);
        }
      } catch (err) {
        console.log(`  ❌ ${column} - NOT FOUND`);
      }
    }
  }

  console.log('\n');

  // Check prompt_versions columns if it exists
  if (results.existingTables.includes('prompt_versions')) {
    console.log('📋 Checking prompt_versions table...');

    try {
      const { data, count, error } = await supabase
        .from('prompt_versions')
        .select('prompt_id, prompt_name, version_string, is_active', { count: 'exact' })
        .limit(10);

      if (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
      } else {
        console.log(`  ✅ Table has ${count} prompts`);
        if (data && data.length > 0) {
          console.log('\n  Existing prompts:');
          data.forEach(p => {
            console.log(`    - ${p.prompt_name} (${p.prompt_id}) v${p.version_string} ${p.is_active ? '🟢 active' : '⚪ inactive'}`);
          });
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}`);
    }
  }

  console.log('\n');

  // Check app_versions if it exists
  if (results.existingTables.includes('app_versions')) {
    console.log('📋 Checking app_versions table...');

    try {
      const { data, count, error } = await supabase
        .from('app_versions')
        .select('version_string, is_latest, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.log(`  ⚠️  Error: ${error.message}`);
      } else {
        console.log(`  ✅ Table has ${count} versions`);
        if (data && data.length > 0) {
          console.log('\n  Recent versions:');
          data.forEach(v => {
            console.log(`    - v${v.version_string} ${v.is_latest ? '🟢 latest' : ''} (${new Date(v.created_at).toLocaleDateString()})`);
          });
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}`);
    }
  }

  console.log('\n');

  // Summary and recommendations
  console.log('═══════════════════════════════════════════════════════');
  console.log('📊 SUMMARY & MIGRATION RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log(`✅ Existing tables: ${results.existingTables.length}`);
  results.existingTables.forEach(t => console.log(`   - ${t}`));

  console.log(`\n❌ Missing tables: ${results.missingTables.length}`);
  results.missingTables.forEach(t => console.log(`   - ${t}`));

  console.log('\n🎯 MIGRATIONS TO RUN:\n');

  // Migration 1: 002_add_profile_fields.sql
  if (results.existingTables.includes('profiles')) {
    const missingColumns = [
      'date_of_birth', 'gender', 'bio', 'photos', 'location',
      'looking_for', 'relationship_goals', 'profile_completeness'
    ].filter(col => !results.profileColumns.includes(col));

    if (missingColumns.length > 0) {
      console.log('🔴 Migration 002_add_profile_fields.sql - NEEDED');
      console.log(`   Missing ${missingColumns.length} columns from profiles table`);
      console.log(`   Missing: ${missingColumns.join(', ')}`);
    } else {
      console.log('✅ Migration 002_add_profile_fields.sql - SKIP (already applied)');
    }
  } else {
    console.log('⚠️  Migration 002_add_profile_fields.sql - Cannot check (profiles table missing)');
  }

  // Migration 2: 003_create_prompts_table.sql
  if (results.missingTables.includes('prompt_versions')) {
    console.log('\n🔴 Migration 003_create_prompts_table.sql - NEEDED');
    console.log('   Creates: prompt_versions, prompt_git_commits tables');
  } else {
    console.log('\n✅ Migration 003_create_prompts_table.sql - SKIP (tables exist)');
  }

  // Migration 3: 004_import_prompts.sql
  if (results.existingTables.includes('prompt_versions')) {
    // Already checked count above
    console.log('\n⚠️  Migration 004_import_prompts.sql - CHECK ABOVE');
    console.log('   If 0 prompts exist, run this to import the 3 defaults');
    console.log('   If prompts exist, you can skip this');
  } else {
    console.log('\n⏭️  Migration 004_import_prompts.sql - WAIT');
    console.log('   Run AFTER 003_create_prompts_table.sql');
  }

  // Migration 4: 005_app_versions.sql
  if (results.missingTables.includes('app_versions')) {
    console.log('\n🔴 Migration 005_app_versions.sql - NEEDED');
    console.log('   Creates: app_versions table');
  } else {
    console.log('\n✅ Migration 005_app_versions.sql - SKIP (table exists)');
  }

  // Migration 5: 005_add_visibility_and_deprecate_active.sql
  if (results.existingTables.includes('prompt_versions')) {
    // Check for is_visible column
    try {
      const { error } = await supabase
        .from('prompt_versions')
        .select('is_visible')
        .limit(0);

      if (error) {
        console.log('\n🔴 Migration 005_add_visibility_and_deprecate_active.sql - NEEDED');
        console.log('   Adds: is_visible column to prompt_versions');
      } else {
        console.log('\n✅ Migration 005_add_visibility_and_deprecate_active.sql - SKIP');
      }
    } catch (err) {
      console.log('\n🔴 Migration 005_add_visibility_and_deprecate_active.sql - NEEDED');
    }
  } else {
    console.log('\n⏭️  Migration 005_add_visibility_and_deprecate_active.sql - WAIT');
    console.log('   Run AFTER 003_create_prompts_table.sql');
  }

  // Migration 6: add_image_attachments.sql
  if (results.missingTables.includes('image_attachments')) {
    console.log('\n🔴 Migration add_image_attachments.sql - NEEDED');
    console.log('   Creates: image_attachments table');
  } else {
    console.log('\n✅ Migration add_image_attachments.sql - SKIP (table exists)');
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

checkSchema().catch(console.error);
