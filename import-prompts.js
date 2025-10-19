#!/usr/bin/env node

/**
 * Script to import prompts from prompts.json to Supabase
 * Run with: node import-prompts.js
 */

const fs = require('fs');
const path = require('path');

async function importPrompts() {
  try {
    console.log('📥 Reading prompts.json...');

    // Read the prompts.json file
    const promptsPath = path.join(__dirname, 'src', 'config', 'prompts.json');
    const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

    console.log(`Found ${Object.keys(promptsData.prompts).length} prompts to import`);

    // Call the import API
    console.log('\n🚀 Sending to Supabase via API...');

    const response = await fetch('http://localhost:3001/api/prompts/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(promptsData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log(`\n✅ Success! Imported ${result.imported} prompts to Supabase`);
      console.log(`\nPrompts imported:`);
      Object.entries(promptsData.prompts).forEach(([id, prompt]) => {
        console.log(`  - ${prompt.name} (${id})`);
      });
      console.log('\n🎉 All prompts are now in Supabase and ready to use!');
    } else {
      console.error(`\n❌ Import failed: ${result.error || 'Unknown error'}`);
      if (result.details) {
        console.error('Details:', result.details);
      }
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('  1. The proxy server is running (node server.js)');
    console.error('  2. Supabase credentials are in .env');
    console.error('  3. The prompt_versions table exists in Supabase');
    process.exit(1);
  }
}

// Run the import
importPrompts();
