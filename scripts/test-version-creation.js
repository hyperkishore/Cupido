/**
 * Test if version creation is working correctly
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVersionCreation() {
  try {
    console.log('🔍 Checking version creation function...\n');

    // Get a prompt with multiple versions to test
    const { data: prompts, error: promptError } = await supabase
      .from('prompt_versions')
      .select('prompt_id, version_string')
      .order('prompt_id')
      .limit(5);

    if (promptError) throw promptError;

    console.log('📋 Current prompts in database:');
    const uniquePrompts = {};
    prompts.forEach(p => {
      if (!uniquePrompts[p.prompt_id]) {
        uniquePrompts[p.prompt_id] = [];
      }
      uniquePrompts[p.prompt_id].push(p.version_string);
    });

    Object.entries(uniquePrompts).forEach(([id, versions]) => {
      console.log(`  ${id}: ${versions.join(', ')}`);
    });

    console.log('\n📊 Version creation test:');
    console.log('If the function is fixed, it should base new versions on the LATEST version,');
    console.log('not the ACTIVE version. This prevents duplicate key errors.\n');

    // Get details of one prompt
    const testPromptId = Object.keys(uniquePrompts)[0];
    const { data: allVersions, error: versionError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', testPromptId)
      .order('major_version', { ascending: false })
      .order('minor_version', { ascending: false })
      .order('patch_version', { ascending: false });

    if (versionError) throw versionError;

    console.log(`Test prompt: ${testPromptId}`);
    console.log(`Total versions: ${allVersions.length}`);
    console.log('\nVersion details:');
    allVersions.forEach(v => {
      const activeMarker = v.is_active ? '🟢 ACTIVE' : '⚪ inactive';
      console.log(`  v${v.version_string} - ${activeMarker} (${v.status})`);
    });

    const latestVersion = allVersions[0];
    const activeVersion = allVersions.find(v => v.is_active);

    console.log(`\n📌 Latest version: v${latestVersion.version_string}`);
    console.log(`📌 Active version: ${activeVersion ? 'v' + activeVersion.version_string : 'NONE'}`);

    if (latestVersion.version_string !== activeVersion?.version_string) {
      console.log('\n⚠️  Latest ≠ Active: This is the scenario that caused the duplicate key error!');
      console.log('If the function is fixed, creating a new patch version should create:');
      const [major, minor, patch] = latestVersion.version_string.split('.').map(Number);
      console.log(`  v${major}.${minor}.${patch + 1} (based on LATEST v${latestVersion.version_string})`);
      console.log('\nNOT:');
      if (activeVersion) {
        const [aMajor, aMinor, aPatch] = activeVersion.version_string.split('.').map(Number);
        console.log(`  v${aMajor}.${aMinor}.${aPatch + 1} (based on ACTIVE v${activeVersion.version_string}) ← Would cause duplicate!`);
      }
    } else {
      console.log('\n✅ Latest = Active: Function will work correctly in this case');
    }

    console.log('\n💡 To verify the fix is applied, check the database function:');
    console.log('   It should query: WHERE prompt_id = p_prompt_id ORDER BY major_version DESC...');
    console.log('   NOT: WHERE prompt_id = p_prompt_id AND is_active = TRUE');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testVersionCreation();
