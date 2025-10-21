#!/usr/bin/env node

const puppeteer = require('puppeteer');

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

async function testSimulator() {
    let browser;

    try {
        log('\n🚀 Starting Automated Simulator Test', 'bright');
        log('=====================================', 'bright');

        // Launch browser
        browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: null,
            args: ['--window-size=1920,1080']
        });

        const page = await browser.newPage();

        // Listen to console messages
        page.on('console', msg => {
            const text = msg.text();
            if (text.includes('Error')) {
                log(`[Browser Error] ${text}`, 'red');
            } else if (text.includes('Success') || text.includes('✅')) {
                log(`[Browser] ${text}`, 'green');
            } else {
                log(`[Browser] ${text}`, 'cyan');
            }
        });

        // Listen to page errors
        page.on('pageerror', error => {
            log(`[Page Error] ${error.message}`, 'red');
        });

        // Navigate to simulator
        log('\n📱 Loading simulator...', 'yellow');
        await page.goto('http://localhost:8081/chatsim.html', {
            waitUntil: 'networkidle2'
        });

        // Wait for page to load
        await page.waitForTimeout(2000);

        // Check if simulator loaded
        const title = await page.evaluate(() => document.title);
        log(`✅ Page loaded: ${title}`, 'green');

        // Select a persona
        log('\n👤 Selecting persona: Sarah', 'yellow');
        await page.evaluate(() => {
            const sarahRadio = document.querySelector('input[type="radio"][value="sarah"]');
            if (sarahRadio) {
                sarahRadio.click();
                return true;
            }
            return false;
        });

        // Select a scenario
        log('📋 Selecting scenario: Basic Introduction', 'yellow');
        await page.evaluate(() => {
            const scenarioSelect = document.querySelector('#scenario-select');
            if (scenarioSelect) {
                scenarioSelect.value = 'basic';
                scenarioSelect.dispatchEvent(new Event('change'));
                return true;
            }
            return false;
        });

        // Set simulation parameters
        log('⚙️  Configuring simulation parameters', 'yellow');
        await page.evaluate(() => {
            // Set max messages
            const maxMessagesInput = document.querySelector('#max-messages');
            if (maxMessagesInput) {
                maxMessagesInput.value = '5';
            }

            // Set response delay
            const delayInput = document.querySelector('#response-delay');
            if (delayInput) {
                delayInput.value = '500';
            }
        });

        // Click start button
        log('\n🎬 Starting simulation...', 'bright');
        const simulationStarted = await page.evaluate(() => {
            const startBtn = document.querySelector('#start-btn');
            if (startBtn && !startBtn.disabled) {
                startBtn.click();
                return true;
            }
            return false;
        });

        if (!simulationStarted) {
            throw new Error('Could not start simulation - button disabled or not found');
        }

        // Monitor conversation
        log('💬 Monitoring conversation...', 'yellow');

        // Wait and check for messages periodically
        for (let i = 0; i < 10; i++) {
            await page.waitForTimeout(2000);

            // Get conversation state
            const conversationState = await page.evaluate(() => {
                const messages = document.querySelectorAll('.message');
                const consoleMessages = document.querySelectorAll('#console-messages .log-entry');
                const isSimulating = document.querySelector('#start-btn')?.textContent === 'Stop Simulation';

                return {
                    messageCount: messages.length,
                    lastMessage: messages.length > 0 ? messages[messages.length - 1].textContent : null,
                    consoleCount: consoleMessages.length,
                    lastConsoleMessage: consoleMessages.length > 0 ?
                        consoleMessages[consoleMessages.length - 1].textContent : null,
                    isSimulating: isSimulating,
                    hasErrors: Array.from(consoleMessages).some(m => m.classList.contains('error'))
                };
            });

            log(`\n📊 Status Check ${i + 1}:`, 'cyan');
            log(`   Messages: ${conversationState.messageCount}`, 'reset');
            if (conversationState.lastMessage) {
                log(`   Last: "${conversationState.lastMessage.substring(0, 50)}..."`, 'reset');
            }
            log(`   Console entries: ${conversationState.consoleCount}`, 'reset');
            log(`   Simulating: ${conversationState.isSimulating}`, 'reset');

            if (conversationState.hasErrors) {
                log(`   ⚠️  Errors detected in console`, 'red');

                // Get error details
                const errors = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('#console-messages .error'))
                        .map(e => e.textContent);
                });

                errors.forEach(error => {
                    log(`      Error: ${error}`, 'red');
                });
            }

            // Check if simulation stopped
            if (!conversationState.isSimulating) {
                log('\n✅ Simulation completed', 'green');
                break;
            }

            // Check if stuck
            if (i > 0 && conversationState.messageCount === 0) {
                log('\n⚠️  No messages generated - possible connection issue', 'red');
            }
        }

        // Get final conversation
        const finalConversation = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('.message'))
                .map(msg => ({
                    sender: msg.classList.contains('user') ? 'user' : 'bot',
                    text: msg.textContent
                }));
        });

        log('\n📜 Final Conversation:', 'bright');
        finalConversation.forEach((msg, idx) => {
            const prefix = msg.sender === 'user' ? '👤' : '🤖';
            log(`${idx + 1}. ${prefix} ${msg.text.substring(0, 100)}...`,
                msg.sender === 'user' ? 'yellow' : 'green');
        });

        // Check for issues
        log('\n🔍 Checking for issues...', 'yellow');

        const issues = await page.evaluate(() => {
            const issues = [];

            // Check for fallback messages
            const messages = Array.from(document.querySelectorAll('.message'));
            const hasFallback = messages.some(m =>
                m.textContent.includes('trouble connecting') ||
                m.textContent.includes('help you anyway'));

            if (hasFallback) {
                issues.push('Fallback messages detected - API connection issue');
            }

            // Check for repeated messages
            const messageTexts = messages.map(m => m.textContent);
            const duplicates = messageTexts.filter((text, idx) =>
                messageTexts.indexOf(text) !== idx);

            if (duplicates.length > 0) {
                issues.push(`Duplicate messages detected: ${duplicates.length}`);
            }

            // Check console for errors
            const errorCount = document.querySelectorAll('#console-messages .error').length;
            if (errorCount > 0) {
                issues.push(`Console errors: ${errorCount}`);
            }

            return issues;
        });

        if (issues.length > 0) {
            log('❌ Issues found:', 'red');
            issues.forEach(issue => log(`   - ${issue}`, 'red'));
        } else {
            log('✅ No issues detected', 'green');
        }

        // Test results summary
        log('\n=====================================', 'bright');
        log('📊 Test Summary', 'bright');
        log('=====================================', 'bright');

        log(`Total messages: ${finalConversation.length}`, 'reset');
        log(`User messages: ${finalConversation.filter(m => m.sender === 'user').length}`, 'reset');
        log(`Bot messages: ${finalConversation.filter(m => m.sender === 'bot').length}`, 'reset');
        log(`Issues found: ${issues.length}`, issues.length > 0 ? 'red' : 'green');

        // Keep browser open for inspection
        log('\n⏸️  Browser will remain open for inspection. Press Ctrl+C to exit.', 'yellow');

        // Wait indefinitely
        await new Promise(() => {});

    } catch (error) {
        log(`\n❌ Test failed: ${error.message}`, 'red');
        log(error.stack, 'red');

        if (browser) {
            await browser.close();
        }
        process.exit(1);
    }
}

// Check if puppeteer is installed
try {
    require.resolve('puppeteer');
    testSimulator();
} catch (e) {
    log('❌ Puppeteer not installed. Installing...', 'yellow');
    const { execSync } = require('child_process');
    execSync('npm install puppeteer', { stdio: 'inherit' });
    log('✅ Puppeteer installed. Please run this script again.', 'green');
}