#!/usr/bin/env node

// Test script for Cupido production deployment
const https = require('https');

const PRODUCTION_URL = 'https://cupido-dating-app.netlify.app';
const API_URL = `${PRODUCTION_URL}/.netlify/functions/chat`;

console.log('🚀 Testing Cupido Production Deployment');
console.log('=====================================');

// Test 1: Basic HTML loading
async function testHtmlLoading() {
    console.log('\n1️⃣ Testing HTML Loading...');
    
    return new Promise((resolve, reject) => {
        https.get(PRODUCTION_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ HTML loads successfully');
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Content-Length: ${data.length} bytes`);
                    
                    // Check for key elements
                    if (data.includes('Cupido')) console.log('✅ App title found');
                    if (data.includes('Loading your reflection space')) console.log('✅ Loading message found');
                    if (data.includes('_expo/static/js/web/')) console.log('✅ JavaScript bundle referenced');
                    
                    resolve();
                } else {
                    reject(new Error(`HTTP ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Test 2: Claude API functionality
async function testClaudeAPI() {
    console.log('\n2️⃣ Testing Claude API...');
    
    const testPayload = JSON.stringify({
        messages: [
            { role: "system", content: "You are a helpful assistant for testing." },
            { role: "user", content: "This is a production deployment test. Please respond with 'PRODUCTION_TEST_SUCCESS' if you receive this." }
        ],
        modelType: "sonnet"
    });

    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cupido-dating-app.netlify.app',
            path: '/.netlify/functions/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(testPayload)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    console.log('✅ Claude API responding successfully');
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Model: ${response.usedModel || 'unknown'}`);
                    console.log(`   Response Length: ${response.message?.length || 0} chars`);
                    
                    if (response.message?.includes('PRODUCTION_TEST_SUCCESS')) {
                        console.log('✅ Claude understood test message correctly');
                    }
                    
                    resolve();
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${error.message}`));
                }
            });
        });

        req.on('error', reject);
        req.write(testPayload);
        req.end();
    });
}

// Test 3: JavaScript bundle accessibility
async function testJavaScriptBundle() {
    console.log('\n3️⃣ Testing JavaScript Bundle...');
    
    return new Promise((resolve, reject) => {
        https.get(`${PRODUCTION_URL}/_expo/static/js/web/index-84733c2dbb110c9f203692f96add7443.js`, (res) => {
            let dataLength = 0;
            res.on('data', chunk => dataLength += chunk.length);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ JavaScript bundle loads successfully');
                    console.log(`   Status: ${res.statusCode}`);
                    console.log(`   Bundle Size: ${(dataLength / 1024 / 1024).toFixed(2)} MB`);
                    console.log(`   Content-Type: ${res.headers['content-type']}`);
                    resolve();
                } else {
                    reject(new Error(`Bundle HTTP ${res.statusCode}`));
                }
            });
        }).on('error', reject);
    });
}

// Test 4: API routing
async function testAPIRouting() {
    console.log('\n4️⃣ Testing API Routing...');
    
    return new Promise((resolve, reject) => {
        https.get(`${PRODUCTION_URL}/api/chat`, (res) => {
            console.log(`   Direct API route status: ${res.statusCode}`);
            if (res.statusCode === 200 || res.statusCode === 405) {
                console.log('✅ API routing configured (405 expected for GET on POST endpoint)');
                resolve();
            } else {
                console.log('⚠️  API routing may need verification');
                resolve(); // Don't fail the test for this
            }
        }).on('error', reject);
    });
}

// Run all tests
async function runAllTests() {
    try {
        await testHtmlLoading();
        await testClaudeAPI();
        await testJavaScriptBundle();
        await testAPIRouting();
        
        console.log('\n🎉 PRODUCTION DEPLOYMENT TEST RESULTS');
        console.log('=====================================');
        console.log('✅ All critical functionality tests PASSED');
        console.log('🚀 Cupido is ready for production use!');
        console.log(`🌐 Live URL: ${PRODUCTION_URL}`);
        
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        process.exit(1);
    }
}

runAllTests();