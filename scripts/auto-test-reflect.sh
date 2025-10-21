#!/bin/bash

# Automated test for Reflect tab chat
# This script interacts with Chrome to test the chat functionality

echo "========================================="
echo "🤖 Automated Reflect Tab Test"
echo "========================================="
echo ""

echo "📍 Step 1: Navigating to Cupido app..."
osascript <<EOF
tell application "Google Chrome"
    activate
    tell window 1
        set active tab index to (count of tabs)
    end tell
end tell
EOF

sleep 3

echo "📍 Step 2: Injecting test script into page..."
osascript <<'EOF'
tell application "Google Chrome"
    tell active tab of window 1
        execute javascript "
            console.log('🧪 AUTO-TEST: Starting automated Reflect tab test');

            // Function to click Reflect tab
            function clickReflectTab() {
                const tabs = Array.from(document.querySelectorAll('[role=\"tab\"], a, button')).filter(el =>
                    el.textContent.toLowerCase().includes('reflect')
                );
                if (tabs.length > 0) {
                    console.log('🎯 Found Reflect tab, clicking...');
                    tabs[0].click();
                    return true;
                }
                return false;
            }

            // Function to send test message
            function sendTestMessage() {
                setTimeout(() => {
                    const input = document.querySelector('input[placeholder*=\"thought\"], input[placeholder*=\"Share\"], textarea');
                    if (input) {
                        console.log('✏️ Found input field, typing test message...');
                        input.value = 'This is an automated test message to verify AI integration works correctly';
                        input.dispatchEvent(new Event('input', { bubbles: true }));

                        setTimeout(() => {
                            const sendButton = Array.from(document.querySelectorAll('button')).find(btn =>
                                btn.querySelector('svg') || btn.textContent.toLowerCase().includes('send')
                            );
                            if (sendButton) {
                                console.log('📤 Found send button, clicking...');
                                sendButton.click();
                                console.log('✅ Test message sent! Check database monitor for results.');
                            }
                        }, 1000);
                    }
                }, 2000);
            }

            // Execute test sequence
            if (clickReflectTab()) {
                sendTestMessage();
            } else {
                console.error('❌ Could not find Reflect tab');
            }
        "
    end tell
end tell
EOF

echo ""
echo "✅ Test script injected!"
echo "📊 Monitor the following:"
echo "   1. Browser console for logs starting with '🧪 AUTO-TEST'"
echo "   2. Database monitor for new messages"
echo "   3. Proxy server logs at /tmp/proxy-server.log"
echo ""
echo "⏳ Waiting 10 seconds for test to complete..."
sleep 10

echo ""
echo "📋 Checking proxy server logs..."
echo "========================================="
tail -15 /tmp/proxy-server.log
echo "========================================="

echo ""
echo "✅ Test sequence completed!"
echo "Check the database monitor output for results."