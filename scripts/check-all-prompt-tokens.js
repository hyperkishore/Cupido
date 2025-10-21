// Check token count of all stored system prompts
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rquhrsxgpkaxofbzqmnw.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxdWhyc3hncGtheG9mYnpxbW53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkzMDAwNTcsImV4cCI6MjA0NDg3NjA1N30.3FDiZnMcXS38gEAi_WHLrKaHu-Yh-dddlcqz-qFUdz4';

const supabase = createClient(supabaseUrl, supabaseKey);

// Rough token estimation (1 token ≈ 4 characters for English)
function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

async function checkAllPrompts() {
  console.log('📊 Checking token counts for all stored prompts...\n');
  console.log('='.repeat(80));

  try {
    // Get all prompts
    const { data: prompts, error } = await supabase
      .from('prompt_versions')
      .select('prompt_id, prompt_name, version_string, system_prompt, is_default, is_active')
      .eq('is_active', true)
      .order('prompt_id');

    if (error) {
      console.error('Error fetching prompts:', error);
      return;
    }

    if (!prompts || prompts.length === 0) {
      console.log('No prompts found in database.');
      return;
    }

    console.log(`Found ${prompts.length} active prompt(s):\n`);

    let promptsAboveThreshold = 0;
    let promptsBelowThreshold = 0;

    prompts.forEach((prompt, index) => {
      const charCount = prompt.system_prompt ? prompt.system_prompt.length : 0;
      const estimatedTokens = estimateTokens(prompt.system_prompt);
      const meetsMinimum = estimatedTokens >= 1024;

      if (meetsMinimum) {
        promptsAboveThreshold++;
      } else {
        promptsBelowThreshold++;
      }

      console.log(`${index + 1}. ${prompt.prompt_name} (${prompt.prompt_id})`);
      console.log(`   Version: ${prompt.version_string}`);
      console.log(`   Status: ${prompt.is_default ? '⭐ DEFAULT' : ''}${prompt.is_active ? ' ✓ ACTIVE' : ''}`);
      console.log(`   Characters: ${charCount.toLocaleString()}`);
      console.log(`   Estimated tokens: ${estimatedTokens.toLocaleString()}`);
      console.log(`   Cacheable: ${meetsMinimum ? '✓ YES (≥1024 tokens)' : '✗ NO (needs ' + (1024 - estimatedTokens) + ' more tokens)'}`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('\n📈 Summary:');
    console.log(`   Total prompts: ${prompts.length}`);
    console.log(`   ✓ Cacheable (≥1024 tokens): ${promptsAboveThreshold}`);
    console.log(`   ✗ Too short (<1024 tokens): ${promptsBelowThreshold}`);
    console.log('\n💡 Note: Prompts need ≥1024 tokens for Anthropic prompt caching to work.');
    console.log('   Caching reduces costs by 90% on cached content!');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAllPrompts().catch(console.error);
