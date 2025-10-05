#!/usr/bin/env node

// Use built-in fetch in Node 18+ or require node-fetch v2
const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args)));

// Test configuration
const PROXY_URL = 'http://localhost:3001/api/chat';
const PERSONAS = ['sarah', 'alex', 'maya'];
const TEST_SCENARIOS = [
    'Basic Introduction',
    'Deep Conversation',
    'Image Sharing',
    'Values & Goals',
    'Family & Background'
];

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

// Test results storage
const testResults = {
    passed: [],
    failed: [],
    errors: []
};

// Helper function to log with color
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Simulate a conversation
async function testConversation(persona, scenario, messageCount = 3) {
    log(`\n=== Testing ${persona} - ${scenario} ===`, 'cyan');

    const messages = [];
    const systemPrompt = `You are ${persona}, a person using the Cupido dating app for self-discovery and meaningful connections. Engage in ${scenario.toLowerCase()} conversation naturally.`;

    // Add system message
    messages.push({
        role: 'system',
        content: systemPrompt
    });

    // Initial user message based on scenario
    const initialMessage = getInitialMessage(scenario);
    messages.push({
        role: 'user',
        content: initialMessage
    });

    log(`User: ${initialMessage}`, 'yellow');

    try {
        // Test conversation flow
        for (let i = 0; i < messageCount; i++) {
            const response = await fetch(PROXY_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: messages,
                    modelType: 'sonnet'
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.error || data.fallback) {
                throw new Error(data.error || 'Received fallback response');
            }

            log(`Bot: ${data.message.substring(0, 100)}...`, 'green');

            // Add bot response to messages
            messages.push({
                role: 'assistant',
                content: data.message
            });

            // Add follow-up user message
            if (i < messageCount - 1) {
                const followUp = getFollowUpMessage(scenario, i);
                messages.push({
                    role: 'user',
                    content: followUp
                });
                log(`User: ${followUp}`, 'yellow');
            }

            // Small delay between messages
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        testResults.passed.push(`${persona} - ${scenario}`);
        log(`✅ Test passed`, 'green');

    } catch (error) {
        testResults.failed.push(`${persona} - ${scenario}`);
        testResults.errors.push({
            test: `${persona} - ${scenario}`,
            error: error.message
        });
        log(`❌ Test failed: ${error.message}`, 'red');
    }
}

// Get initial message based on scenario
function getInitialMessage(scenario) {
    const messages = {
        'Basic Introduction': 'Hey! Tell me a bit about yourself.',
        'Deep Conversation': 'What drives you in life? What are your deeper motivations?',
        'Image Sharing': 'Would you like to share a photo of something meaningful to you?',
        'Values & Goals': 'What values are most important to you in relationships?',
        'Family & Background': 'Tell me about your family and where you come from.'
    };
    return messages[scenario] || 'Hello, how are you?';
}

// Get follow-up message based on scenario
function getFollowUpMessage(scenario, index) {
    const followUps = {
        'Basic Introduction': [
            'That sounds interesting! What do you do for fun?',
            'Nice! How long have you been doing that?'
        ],
        'Deep Conversation': [
            'That resonates with me. How did you discover that about yourself?',
            'Have you always felt that way?'
        ],
        'Image Sharing': [
            "That looks meaningful! What's the story behind it?",
            'I appreciate you sharing that with me.'
        ],
        'Values & Goals': [
            'I value that too. How do you practice that in daily life?',
            'What shaped those values for you?'
        ],
        'Family & Background': [
            'Are you close with your family?',
            'How has that influenced who you are today?'
        ]
    };
    return followUps[scenario]?.[index] || 'Tell me more about that.';
}

// Test payload size handling
async function testPayloadSize() {
    log(`\n=== Testing Large Payload Handling ===`, 'cyan');

    const largeHistory = [];

    // Create a large conversation history
    for (let i = 0; i < 50; i++) {
        largeHistory.push({
            role: i % 2 === 0 ? 'user' : 'assistant',
            content: `This is message ${i}. `.repeat(100) // Long message
        });
    }

    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: largeHistory,
                modelType: 'sonnet'
            })
        });

        if (response.ok) {
            log(`✅ Large payload handled successfully`, 'green');
            testResults.passed.push('Large Payload Test');
        } else {
            throw new Error(`Server returned ${response.status}`);
        }

    } catch (error) {
        log(`❌ Large payload failed: ${error.message}`, 'red');
        testResults.failed.push('Large Payload Test');
        testResults.errors.push({
            test: 'Large Payload Test',
            error: error.message
        });
    }
}

// Main test runner
async function runTests() {
    log('\n🚀 Starting Cupido Chat Simulator Tests', 'bright');
    log('=====================================', 'bright');

    // Test server health
    log('\n=== Testing Server Health ===', 'cyan');
    try {
        const healthResponse = await fetch('http://localhost:3001/health');
        const health = await healthResponse.json();

        if (health.ok && health.hasApiKey) {
            log('✅ Proxy server is healthy', 'green');
            testResults.passed.push('Server Health Check');
        } else {
            throw new Error('Server unhealthy or missing API key');
        }
    } catch (error) {
        log(`❌ Server health check failed: ${error.message}`, 'red');
        testResults.failed.push('Server Health Check');
        testResults.errors.push({
            test: 'Server Health Check',
            error: error.message
        });
        return; // Exit if server is not healthy
    }

    // Test each persona with basic introduction
    for (const persona of PERSONAS) {
        await testConversation(persona, 'Basic Introduction', 2);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Delay between tests
    }

    // Test specific scenarios with Sarah
    for (const scenario of TEST_SCENARIOS.slice(1)) { // Skip Basic Introduction as we already tested it
        await testConversation('sarah', scenario, 2);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test payload size handling
    await testPayloadSize();

    // Print summary
    log('\n=====================================', 'bright');
    log('📊 Test Summary', 'bright');
    log('=====================================', 'bright');
    log(`✅ Passed: ${testResults.passed.length}`, 'green');
    log(`❌ Failed: ${testResults.failed.length}`, 'red');

    if (testResults.passed.length > 0) {
        log('\nPassed Tests:', 'green');
        testResults.passed.forEach(test => log(`  • ${test}`, 'green'));
    }

    if (testResults.failed.length > 0) {
        log('\nFailed Tests:', 'red');
        testResults.failed.forEach(test => log(`  • ${test}`, 'red'));

        log('\nError Details:', 'red');
        testResults.errors.forEach(({ test, error }) => {
            log(`  ${test}: ${error}`, 'red');
        });
    }

    // Monitor proxy server logs
    log('\n=== Monitoring Proxy Server Logs ===', 'cyan');
    log('Check the proxy server terminal for detailed request/response logs', 'yellow');

    // Return exit code
    process.exit(testResults.failed.length > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});