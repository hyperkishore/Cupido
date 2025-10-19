/**
 * Migration Script: Tag Existing Cupido Prompts
 *
 * Adds 'cupido' tag to all existing prompts in the prompt_versions table.
 * This differentiates main Cupido conversation prompts from simulator personas.
 *
 * Usage: node tag-cupido-prompts.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function tagCupidoPrompts() {
  console.log('\n' + '='.repeat(80));
  console.log('🏷️  TAGGING CUPIDO PROMPTS');
  console.log('='.repeat(80) + '\n');

  try {
    // Fetch all existing prompts
    console.log('📋 Fetching all prompts from database...');
    const { data: prompts, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('id, prompt_id, prompt_name, tags, category');

    if (fetchError) {
      throw new Error(`Failed to fetch prompts: ${fetchError.message}`);
    }

    if (!prompts || prompts.length === 0) {
      console.log('⚠️  No prompts found in database');
      return;
    }

    console.log(`✅ Found ${prompts.length} prompts\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each prompt
    for (const prompt of prompts) {
      const currentTags = prompt.tags || [];

      // Skip if already has 'cupido' tag
      if (currentTags.includes('cupido')) {
        console.log(`⏭️  Skipping ${prompt.prompt_id} (already tagged)`);
        skippedCount++;
        continue;
      }

      // Skip if already has 'simulator' tag (shouldn't exist yet, but just in case)
      if (currentTags.includes('simulator')) {
        console.log(`⏭️  Skipping ${prompt.prompt_id} (simulator prompt)`);
        skippedCount++;
        continue;
      }

      // Add 'cupido' tag
      const newTags = [...currentTags, 'cupido'];

      console.log(`🏷️  Tagging ${prompt.prompt_id} (${prompt.prompt_name})...`);

      const { error: updateError } = await supabase
        .from('prompt_versions')
        .update({ tags: newTags })
        .eq('id', prompt.id);

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Tagged successfully`);
        updatedCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total prompts: ${prompts.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(80) + '\n');

    if (errorCount > 0) {
      console.error('⚠️  Migration completed with errors');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
tagCupidoPrompts();
