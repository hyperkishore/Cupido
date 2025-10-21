// Automated test script for Cupido chat functionality
// Run this in Chrome DevTools console on http://localhost:8080 or https://cupido-dating-app.netlify.app

console.log('🔍 Starting Cupido Chat Debug...\n');

// Step 1: Check if app loaded
console.log('1. Checking app status...');
const appElement = document.querySelector('#root');
if (appElement) {
    console.log('✅ App root element found');
} else {
    console.error('❌ App root element not found - app may not be loaded');
}

// Step 2: Check localStorage for session
console.log('\n2. Checking localStorage...');
const storageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.includes('cupido')) {
        storageKeys.push(key);
        console.log(`  - ${key}: ${localStorage.getItem(key).substring(0, 50)}...`);
    }
}
if (storageKeys.length === 0) {
    console.warn('⚠️ No Cupido keys in localStorage - new user');
} else {
    console.log(`✅ Found ${storageKeys.length} Cupido keys`);
}

// Step 3: Check for React app
console.log('\n3. Checking React app...');
const reactRoot = document.querySelector('[data-reactroot], #root > div');
if (reactRoot) {
    console.log('✅ React app mounted');

    // Try to find React fiber
    const reactFiberKey = Object.keys(reactRoot).find(key => key.startsWith('__react'));
    if (reactFiberKey) {
        console.log('✅ React fiber found:', reactFiberKey);
    }
} else {
    console.error('❌ React app not found');
}

// Step 4: Check for input and send button
console.log('\n4. Checking chat UI elements...');
const input = document.querySelector('input[placeholder*="Type"], textarea[placeholder*="Type"], input[type="text"], textarea');
const sendButton = document.querySelector('button svg, button[aria-label*="send"], button[disabled], button');

if (input) {
    console.log('✅ Input field found:', input.placeholder || input.type);
    console.log('  - Value:', input.value);
    console.log('  - Disabled:', input.disabled);
} else {
    console.error('❌ Input field not found');
}

if (sendButton) {
    console.log('✅ Send button found');
    console.log('  - Disabled:', sendButton.disabled);
    console.log('  - Class:', sendButton.className);
} else {
    console.error('❌ Send button not found');
}

// Step 5: Monitor network requests
console.log('\n5. Setting up network monitoring...');
const originalFetch = window.fetch;
window.fetch = function(...args) {
    const url = args[0];
    const options = args[1] || {};

    console.log(`📡 FETCH: ${options.method || 'GET'} ${url}`);
    if (options.body) {
        try {
            const body = JSON.parse(options.body);
            console.log('  Body:', body);
        } catch (e) {
            console.log('  Body:', options.body);
        }
    }

    return originalFetch.apply(this, args)
        .then(response => {
            console.log(`  ✅ Response: ${response.status} ${response.ok ? 'OK' : 'ERROR'}`);

            // Clone response to read it
            const cloned = response.clone();
            cloned.json().then(data => {
                console.log('  Data:', data);
            }).catch(() => {
                console.log('  Response is not JSON');
            });

            return response;
        })
        .catch(error => {
            console.error(`  ❌ Error: ${error.message}`);
            throw error;
        });
};
console.log('✅ Network monitoring active');

// Step 6: Test sending a message
console.log('\n6. Testing message send...');

function simulateSendMessage(message) {
    console.log(`\n🚀 Attempting to send: "${message}"`);

    const input = document.querySelector('input[placeholder*="Type"], textarea[placeholder*="Type"], input[type="text"], textarea');
    const sendButton = document.querySelector('button svg, button[aria-label*="send"], button').parentElement || document.querySelector('button');

    if (!input || !sendButton) {
        console.error('❌ Cannot find input or send button');
        return;
    }

    // Set input value
    console.log('Setting input value...');
    input.value = message;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));

    // Check if button is enabled
    setTimeout(() => {
        console.log('Send button disabled:', sendButton.disabled);

        if (!sendButton.disabled) {
            console.log('Clicking send button...');
            sendButton.click();

            // Monitor what happens after click
            setTimeout(() => {
                console.log('Post-send check:');
                console.log('  - Input value:', input.value);
                console.log('  - Button disabled:', sendButton.disabled);

                // Check for new messages in DOM
                const messages = document.querySelectorAll('[class*="message"], [class*="bubble"], [class*="chat"]');
                console.log(`  - Found ${messages.length} message elements`);
            }, 1000);
        } else {
            console.error('❌ Send button is disabled');
        }
    }, 100);
}

// Step 7: Check console errors
console.log('\n7. Checking for errors...');
const originalError = console.error;
console.error = function(...args) {
    console.log('🔴 ERROR CAPTURED:', ...args);
    originalError.apply(console, args);
};

// Step 8: Check API connectivity
console.log('\n8. Testing API connectivity...');

// Detect environment
const hostname = window.location.hostname;
let apiUrl;

if (hostname === 'cupido-dating-app.netlify.app' || hostname.includes('netlify')) {
    apiUrl = '/.netlify/functions/chat';
    console.log('Environment: Netlify production');
} else {
    apiUrl = 'http://localhost:3001/api/chat';
    console.log('Environment: Local development');
}

console.log(`Testing API at: ${apiUrl}`);

fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        messages: [
            { role: 'system', content: 'Reply in 5 words' },
            { role: 'user', content: 'Debug test' }
        ],
        modelType: 'haiku'
    })
})
.then(r => r.json())
.then(data => {
    console.log('✅ API test successful:', data.message || data);
})
.catch(error => {
    console.error('❌ API test failed:', error.message);
});

console.log('\n📋 SUMMARY:');
console.log('- Run simulateSendMessage("test") to test sending');
console.log('- Check network tab for API calls');
console.log('- Check console for [MOBILE DEBUG] logs');
console.log('- All network requests are being monitored');

// Make function available globally
window.simulateSendMessage = simulateSendMessage;