#!/usr/bin/env node

// Simple test to verify the chat API format

async function testChat() {
    const API_URL = 'http://localhost:3001/api/chat';

    console.log('Testing Cupido Chat API...\n');

    // Test 1: Basic message with correct format
    console.log('Test 1: Basic message with app format');
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "Hey! Tell me about yourself.",
                userId: "test_user_1",
                conversationHistory: [],
                systemPrompt: "You are Cupido, an AI companion focused on meaningful self-discovery and relationships."
            })
        });

        const data = await response.json();

        if (data.message) {
            console.log('✅ Response received:', data.message.substring(0, 100) + '...');
        } else if (data.error) {
            console.log('❌ Error:', data.error);
        } else {
            console.log('⚠️  Unexpected response:', JSON.stringify(data));
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('\n---\n');

    // Test 2: Message with conversation history
    console.log('Test 2: Message with conversation history');
    try {
        const conversationHistory = [
            { id: 0, text: "Hello!", sender: "user", timestamp: Date.now() - 60000 },
            { id: 1, text: "Hi there! How are you doing today?", sender: "bot", timestamp: Date.now() - 30000 }
        ];

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "I'm doing well. What's your purpose?",
                userId: "test_user_2",
                conversationHistory: conversationHistory,
                systemPrompt: "You are Cupido, an AI companion focused on meaningful self-discovery and relationships."
            })
        });

        const data = await response.json();

        if (data.message) {
            console.log('✅ Response received:', data.message.substring(0, 100) + '...');
        } else if (data.error) {
            console.log('❌ Error:', data.error);
        } else {
            console.log('⚠️  Unexpected response:', JSON.stringify(data));
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('\n---\n');

    // Test 3: Simulated persona message
    console.log('Test 3: Simulated persona message');
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: "What brings you to Cupido today?",
                userId: "simulator_persona_sarah",
                conversationHistory: [],
                systemPrompt: "You are Sarah, a 28-year-old product manager at Google in San Francisco. You understand that Cupido is an AI companion designed to help you with self-discovery. Be warm and genuine in your responses."
            })
        });

        const data = await response.json();

        if (data.message) {
            console.log('✅ Response received:', data.message.substring(0, 100) + '...');
        } else if (data.error) {
            console.log('❌ Error:', data.error);
        } else {
            console.log('⚠️  Unexpected response:', JSON.stringify(data));
        }
    } catch (error) {
        console.log('❌ Request failed:', error.message);
    }

    console.log('\n✅ All tests completed');
}

// Run tests
testChat().catch(console.error);