#!/usr/bin/env node

// Test the simulator API with the correct format
const API_URL = 'http://localhost:3001/api/chat';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSimulatorAPI() {
    log('\n🚀 Testing Simulator API Format', 'bright');
    log('=====================================', 'bright');

    // Test personas
    const personas = {
        sarah: {
            name: 'Sarah',
            age: 28,
            location: 'San Francisco',
            occupation: 'Product Manager at a tech startup',
            interests: ['hiking', 'photography', 'cooking'],
            bio: 'Living my best life in SF! Love exploring new trails and capturing moments.',
            systemPrompt: `You are Sarah, a 28-year-old product manager at a tech startup in San Francisco. You're friendly, curious, and enjoy deep conversations. You're using Cupido to find meaningful connections.`
        }
    };

    const currentPersona = personas.sarah;

    // Build conversation history
    const conversationHistory = [];

    // Test 1: Initial message from Cupido
    log('\n📝 Test 1: Initial Cupido greeting', 'cyan');
    try {
        const messages = [
            {
                role: 'system',
                content: currentPersona.systemPrompt
            },
            {
                role: 'user',
                content: 'Hey! Tell me a bit about yourself.'
            }
        ];

        log('Request payload:', 'yellow');
        log(JSON.stringify({ messages, modelType: 'sonnet' }, null, 2), 'reset');

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                modelType: 'sonnet'
            })
        });

        const data = await response.json();

        if (data.message) {
            log('✅ Response received:', 'green');
            log(`"${data.message.substring(0, 150)}..."`, 'reset');
            conversationHistory.push(
                { role: 'user', content: 'Hey! Tell me a bit about yourself.' },
                { role: 'assistant', content: data.message }
            );
        } else if (data.error) {
            log(`❌ Error: ${data.error}`, 'red');
            if (data.fallback) {
                log('⚠️  Fallback response triggered', 'yellow');
            }
        }
    } catch (error) {
        log(`❌ Request failed: ${error.message}`, 'red');
    }

    // Test 2: Follow-up conversation
    log('\n📝 Test 2: Follow-up conversation', 'cyan');
    try {
        const messages = [
            {
                role: 'system',
                content: currentPersona.systemPrompt
            },
            ...conversationHistory,
            {
                role: 'user',
                content: 'That sounds interesting! What do you enjoy most about living in San Francisco?'
            }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                modelType: 'sonnet'
            })
        });

        const data = await response.json();

        if (data.message) {
            log('✅ Response received:', 'green');
            log(`"${data.message.substring(0, 150)}..."`, 'reset');
            conversationHistory.push(
                { role: 'user', content: 'That sounds interesting! What do you enjoy most about living in San Francisco?' },
                { role: 'assistant', content: data.message }
            );
        } else if (data.error) {
            log(`❌ Error: ${data.error}`, 'red');
        }
    } catch (error) {
        log(`❌ Request failed: ${error.message}`, 'red');
    }

    // Test 3: Test with large conversation history
    log('\n📝 Test 3: Large conversation history (10 messages)', 'cyan');
    try {
        // Create a larger conversation
        const largeHistory = [];
        for (let i = 0; i < 10; i++) {
            largeHistory.push({
                role: i % 2 === 0 ? 'user' : 'assistant',
                content: `Test message ${i}`
            });
        }

        const messages = [
            {
                role: 'system',
                content: currentPersona.systemPrompt
            },
            ...largeHistory,
            {
                role: 'user',
                content: 'How are you today?'
            }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                modelType: 'sonnet'
            })
        });

        const data = await response.json();

        if (data.message) {
            log('✅ Large history handled successfully', 'green');
            log(`"${data.message.substring(0, 100)}..."`, 'reset');
        } else if (data.error) {
            log(`❌ Error with large history: ${data.error}`, 'red');
        }
    } catch (error) {
        log(`❌ Request failed: ${error.message}`, 'red');
    }

    // Test 4: Test empty/malformed requests
    log('\n📝 Test 4: Error handling for empty content', 'cyan');
    try {
        const messages = [
            {
                role: 'system',
                content: currentPersona.systemPrompt
            },
            {
                role: 'user',
                content: '' // Empty content
            }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: messages,
                modelType: 'sonnet'
            })
        });

        const data = await response.json();

        if (data.message) {
            log('✅ Empty content handled gracefully', 'green');
        } else if (data.error) {
            log(`⚠️  Expected error for empty content: ${data.error}`, 'yellow');
        }
    } catch (error) {
        log(`⚠️  Expected error: ${error.message}`, 'yellow');
    }

    // Summary
    log('\n=====================================', 'bright');
    log('📊 Test Summary', 'bright');
    log('=====================================', 'bright');
    log('All API tests completed. Check logs above for results.', 'green');

    // Check server health
    log('\n🏥 Checking server health...', 'cyan');
    try {
        const healthResponse = await fetch('http://localhost:3001/health');
        const health = await healthResponse.json();

        if (health.ok && health.hasApiKey) {
            log('✅ Server is healthy with API key configured', 'green');
        } else {
            log('⚠️  Server health check failed', 'yellow');
            log(JSON.stringify(health, null, 2), 'reset');
        }
    } catch (error) {
        log(`❌ Server health check failed: ${error.message}`, 'red');
    }

    log('\n✅ Testing complete!', 'bright');
}

// Run tests
testSimulatorAPI().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});