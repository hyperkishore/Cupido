/**
 * Test script for Reflect tab chat functionality
 * This simulates exactly what happens in SimpleReflectionChat.tsx
 */

const fetch = require('node-fetch');

async function testProxyConnection() {
  console.log('\n========================================');
  console.log('🧪 Testing Proxy Server Connection');
  console.log('========================================\n');

  const proxyUrl = 'http://localhost:3001/api/chat';

  const testMessage = {
    messages: [
      {
        role: 'system',
        content: 'You are a warm, curious friend chatting with someone on a dating app. Be natural, engaging, and conversational.'
      },
      {
        role: 'user',
        content: 'Hey, how are you?'
      }
    ],
    modelType: 'haiku'
  };

  console.log('📡 Sending request to:', proxyUrl);
  console.log('📦 Payload:', JSON.stringify(testMessage, null, 2));
  console.log('\n⏳ Waiting for response...\n');

  try {
    const startTime = Date.now();

    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testMessage)
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('📥 Response received in', duration, 'ms');
    console.log('📊 Status:', response.status, response.statusText);
    console.log('📋 Headers:', JSON.stringify(Object.fromEntries(response.headers), null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ ERROR: Request failed');
      console.error('Status:', response.status);
      console.error('Body:', errorText);
      process.exit(1);
    }

    const data = await response.json();

    console.log('\n✅ SUCCESS!');
    console.log('========================================');
    console.log('🤖 AI Response:');
    console.log(data.message);
    console.log('\n📊 Metadata:');
    console.log('  - Model used:', data.usedModel);
    console.log('  - Message length:', data.message.length, 'characters');
    console.log('========================================\n');

    // Validate response structure
    if (!data.message || typeof data.message !== 'string') {
      console.error('❌ VALIDATION FAILED: Invalid message format');
      process.exit(1);
    }

    if (!data.usedModel) {
      console.error('❌ VALIDATION FAILED: Missing usedModel field');
      process.exit(1);
    }

    console.log('✅ All validations passed!');
    console.log('✅ Proxy server is working correctly');
    console.log('✅ Chat service should work in the app\n');

    return true;

  } catch (error) {
    console.error('\n❌ CRITICAL ERROR:', error.message);
    console.error('Stack:', error.stack);
    console.error('\n🔍 Troubleshooting:');
    console.error('  1. Is the proxy server running? (node server.js)');
    console.error('  2. Is it listening on port 3001?');
    console.error('  3. Is ANTHROPIC_API_KEY set in environment?');
    console.error('  4. Can you access http://localhost:3001/health?\n');
    process.exit(1);
  }
}

// Run the test
testProxyConnection();