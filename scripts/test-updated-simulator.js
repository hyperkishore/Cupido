#!/usr/bin/env node

async function testSimulator() {
    const API_URL = 'http://localhost:3001/api/chat';

    console.log('Testing updated simulator format...\n');

    try {
        const messages = [
            { role: 'system', content: 'You are Cupido, an AI companion focused on meaningful self-discovery and relationships.' },
            { role: 'user', content: 'Hi! Tell me about yourself.' }
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
            console.log('✅ Success! Response:', data.message.substring(0, 100) + '...');
        } else if (data.error) {
            console.log('❌ Error:', data.error);
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }
}

testSimulator().catch(console.error);