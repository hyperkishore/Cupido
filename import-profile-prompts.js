/**
 * Import Profile-Building Prompts to Supabase
 * Run this to add the profile onboarding prompts to your database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importProfilePrompts() {
  console.log('');
  console.log('================================================================================');
  console.log('📝 IMPORTING PROFILE-BUILDING PROMPTS');
  console.log('================================================================================');
  console.log('');

  try {
    // Read the prompts file
    const promptsData = JSON.parse(
      fs.readFileSync('./profile-building-prompts.json', 'utf8')
    );

    const prompts = promptsData.profileBuildingPrompts;

    console.log(`Found ${prompts.length} prompts to import`);
    console.log('');

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const prompt of prompts) {
      try {
        // Check if prompt already exists
        const { data: existing } = await supabase
          .from('prompts')
          .select('id')
          .eq('id', prompt.id)
          .single();

        if (existing) {
          console.log(`⏭️  Skipping "${prompt.id}" - already exists`);
          skipCount++;
          continue;
        }

        // Insert prompt
        const { error } = await supabase
          .from('prompts')
          .insert({
            id: prompt.id,
            question: prompt.question,
            type: prompt.type,
            category: prompt.category,
            theme: prompt.theme,
            tone: prompt.tone,
            intended_use_case: prompt.intendedUseCase,
            emotional_depth: prompt.emotionalDepth,
            metadata: {
              ...prompt.metadata,
              extractionRules: prompt.extractionRules,
            },
          });

        if (error) {
          console.error(`❌ Error importing "${prompt.id}":`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Imported "${prompt.id}"`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to import "${prompt.id}":`, err.message);
        errorCount++;
      }
    }

    console.log('');
    console.log('================================================================================');
    console.log('IMPORT SUMMARY');
    console.log('================================================================================');
    console.log(`✅ Successfully imported: ${successCount}`);
    console.log(`⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('');

    if (successCount > 0) {
      console.log('🎉 Profile-building prompts are ready to use!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Implement onboarding flow to show these prompts sequentially');
      console.log('2. Use Claude API to extract structured data from user responses');
      console.log('3. Save extracted data to user profile in Supabase');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

importProfilePrompts();
