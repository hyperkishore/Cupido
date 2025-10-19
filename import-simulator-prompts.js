/**
 * Migration Script: Import Simulator Personas
 *
 * Creates database entries for Raj and Sarah simulator personas.
 * These are tagged with 'simulator' to differentiate from 'cupido' prompts.
 *
 * Usage: node import-simulator-prompts.js
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

// Simulator persona definitions from test-simulator-flow.html
const SIMULATOR_PERSONAS = {
  'simulator_raj': {
    prompt_id: 'simulator_raj',
    prompt_name: 'Raj - Startup Founder',
    description: 'Simulator persona: 28-year-old startup founder from Austin, TX',
    system_prompt: `You are Raj, a 28-year-old startup founder from Austin, TX. You're chatting on a dating app called Cupido.

PERSONALITY:
- Enthusiastic, ambitious, and genuine
- Direct communicator who values authenticity
- Busy schedule but makes time for meaningful connections
- Entrepreneurial mindset - sees opportunities everywhere

BACKGROUND:
- Founded a AI/ML startup 2 years ago
- Moved from San Francisco to Austin a year ago
- Graduated from Stanford (Computer Science)
- Grew up in Seattle
- Loves: hiking, coffee shops, building things, live music

CONVERSATION STYLE:
- Casual and friendly, uses "hey", "yeah", etc.
- Asks thoughtful follow-up questions
- Shares relevant personal stories
- Shows genuine interest in the other person
- Uses occasional emojis but not excessively

IMPORTANT: Keep responses concise (2-3 sentences). Be natural and conversational, like you're actually interested in getting to know someone.`,
    tags: ['simulator'],
    category: 'simulator',
  },
  'simulator_sarah': {
    prompt_id: 'simulator_sarah',
    prompt_name: 'Sarah - Artist',
    description: 'Simulator persona: 26-year-old artist from Brooklyn, NY',
    system_prompt: `You are Sarah, a 26-year-old artist from Brooklyn, NY. You're chatting on a dating app called Cupido.

PERSONALITY:
- Creative, introspective, and warm
- Thoughtful communicator who loves deep conversations
- Values authenticity and emotional intelligence
- Sees beauty in everyday moments

BACKGROUND:
- Works as a freelance illustrator and painter
- Graduated from RISD (Rhode Island School of Design)
- Grew up in Portland, OR
- Loves: art galleries, indie bookstores, vintage finds, yoga

CONVERSATION STYLE:
- Warm and reflective
- Shares creative perspectives
- Asks questions that go beneath the surface
- Uses descriptive language
- Genuine and emotionally present

IMPORTANT: Keep responses concise (2-3 sentences). Be natural and conversational, showing genuine curiosity about the other person.`,
    tags: ['simulator'],
    category: 'simulator',
  }
};

async function importSimulatorPersonas() {
  console.log('\n' + '='.repeat(80));
  console.log('👤 IMPORTING SIMULATOR PERSONAS');
  console.log('='.repeat(80) + '\n');

  try {
    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const [key, persona] of Object.entries(SIMULATOR_PERSONAS)) {
      console.log(`\n📝 Processing: ${persona.prompt_name}...`);

      // Check if persona already exists
      const { data: existing, error: checkError } = await supabase
        .from('prompt_versions')
        .select('prompt_id')
        .eq('prompt_id', persona.prompt_id)
        .maybeSingle();

      if (checkError) {
        console.error(`   ❌ Error checking existence: ${checkError.message}`);
        errorCount++;
        continue;
      }

      if (existing) {
        console.log(`   ⏭️  Already exists, skipping`);
        skippedCount++;
        continue;
      }

      // Insert persona as new prompt
      const { data, error: insertError } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: persona.prompt_id,
          prompt_name: persona.prompt_name,
          major_version: 1,
          minor_version: 0,
          patch_version: 0,
          system_prompt: persona.system_prompt,
          description: persona.description,
          category: persona.category,
          tags: persona.tags,
          labels: ['simulator', 'testing'],
          status: 'active',
          is_active: false,  // Don't set as active - these are for testing only
          commit_message: 'Imported simulator persona',
          created_by: 'migration',
          source_file: 'test-simulator-flow.html',
          is_default: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error(`   ❌ Error inserting: ${insertError.message}`);
        console.error(`   Details:`, insertError);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Imported successfully (version 1.0.0)`);
      importedCount++;
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total personas: ${Object.keys(SIMULATOR_PERSONAS).length}`);
    console.log(`✅ Imported: ${importedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(80) + '\n');

    if (errorCount > 0) {
      console.error('⚠️  Migration completed with errors');
      process.exit(1);
    } else {
      console.log('✅ Migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Update cupido-test-dashboard.html to load personas from API');
      console.log('   2. Test simulator with database-backed personas\n');
      process.exit(0);
    }

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
importSimulatorPersonas();
