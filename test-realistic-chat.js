#!/usr/bin/env node

// Test realistic dating app conversation flow
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

async function simulateRealisticConversation() {
    log('\n💬 Simulating Realistic Dating App Conversation', 'bright');
    log('================================================', 'bright');

    const userPrompt = `You are Mike, 32, using a dating app. CRITICAL RULES:
- Write like you're texting, not writing essays
- Keep messages SHORT (5-30 words typical)
- Be casual and natural
- NO scene descriptions, NO internal thoughts
- Just type what a real person would text

About you: Freelance designer in Brooklyn, into indie music and coffee.`;

    const cupidoPrompt = `You are Cupido, helping someone build a meaningful dating profile while discovering themselves. Balance learning their basics with exploring who they are.

⚠️ CRITICAL RULES - MUST FOLLOW:
1. Keep responses to 2-3 SHORT sentences (under 60 words total)
2. End with EXACTLY ONE simple question
3. NEVER ask multiple questions or use multiple question marks
4. Be conversational and curious about their actual life`;

    const conversation = [];

    // First exchange
    log('\n--- Exchange 1 ---', 'cyan');
    const cupidoGreeting = "Hey! I'm Cupido. What brings you here?";
    log(`Cupido: ${cupidoGreeting}`, 'blue');
    conversation.push({ role: 'assistant', content: cupidoGreeting });

    // User's first response
    const userResponse1 = "just trying to meet someone real, you know?";
    log(`Mike: ${userResponse1}`, 'yellow');
    conversation.push({ role: 'user', content: userResponse1 });

    // Cupido response 1
    const response1 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: cupidoPrompt },
                ...conversation
            ],
            modelType: 'sonnet'
        })
    });
    const data1 = await response1.json();
    log(`Cupido: ${data1.message}`, 'blue');
    conversation.push({ role: 'assistant', content: data1.message });

    // Exchange 2
    log('\n--- Exchange 2 ---', 'cyan');
    const userResponse2 = "mike, freelance designer";
    log(`Mike: ${userResponse2}`, 'yellow');
    conversation.push({ role: 'user', content: userResponse2 });

    const response2 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: cupidoPrompt },
                ...conversation
            ],
            modelType: 'sonnet'
        })
    });
    const data2 = await response2.json();
    log(`Cupido: ${data2.message}`, 'blue');
    conversation.push({ role: 'assistant', content: data2.message });

    // Exchange 3
    log('\n--- Exchange 3 ---', 'cyan');
    const userResponse3 = "brooklyn, williamsburg area";
    log(`Mike: ${userResponse3}`, 'yellow');
    conversation.push({ role: 'user', content: userResponse3 });

    const response3 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: userPrompt },
                ...conversation
            ],
            modelType: 'sonnet'
        })
    });
    const data3 = await response3.json();
    log(`Mike: ${data3.message}`, 'yellow');
    conversation.push({ role: 'user', content: data3.message });

    // Exchange 4 - Cupido again
    log('\n--- Exchange 4 ---', 'cyan');
    const response4 = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: cupidoPrompt },
                ...conversation
            ],
            modelType: 'sonnet'
        })
    });
    const data4 = await response4.json();
    log(`Cupido: ${data4.message}`, 'blue');

    // Analysis
    log('\n📊 Conversation Analysis', 'bright');
    log('========================', 'bright');

    // Check message lengths
    const messageLengths = [
        userResponse1.split(' ').length,
        data1.message.split(' ').length,
        userResponse2.split(' ').length,
        data2.message.split(' ').length,
        userResponse3.split(' ').length,
        data3.message.split(' ').length,
        data4.message.split(' ').length
    ];

    log(`\nMessage word counts:`, 'cyan');
    messageLengths.forEach((len, idx) => {
        const isRealistic = len < 50;
        const color = isRealistic ? 'green' : 'red';
        const status = isRealistic ? '✅' : '❌';
        log(`  Message ${idx + 1}: ${len} words ${status}`, color);
    });

    const avgLength = messageLengths.reduce((a, b) => a + b, 0) / messageLengths.length;
    log(`\nAverage message length: ${avgLength.toFixed(1)} words`, avgLength < 30 ? 'green' : 'yellow');

    // Check for narrative elements (bad)
    const narrativePatterns = [
        /I've been thinking/i,
        /It's been/i,
        /I remember when/i,
        /Let me tell you/i,
        /To be honest/i,
        /Actually, /i
    ];

    let hasNarrative = false;
    const allMessages = [data1.message, data2.message, data3.message, data4.message];
    allMessages.forEach((msg, idx) => {
        if (narrativePatterns.some(pattern => pattern.test(msg))) {
            log(`⚠️  Message ${idx + 1} contains narrative elements`, 'yellow');
            hasNarrative = true;
        }
    });

    if (!hasNarrative) {
        log(`✅ No narrative elements detected - feels like texting!`, 'green');
    }

    // Overall assessment
    log('\n🎯 Overall Assessment', 'bright');
    if (avgLength < 30 && !hasNarrative) {
        log('✅ Conversation feels realistic for a dating app!', 'green');
    } else if (avgLength < 50) {
        log('⚠️  Getting better but still a bit verbose', 'yellow');
    } else {
        log('❌ Still too long - needs more work', 'red');
    }
}

// Run the test
simulateRealisticConversation().catch(error => {
    log(`\n❌ Fatal error: ${error.message}`, 'red');
    process.exit(1);
});