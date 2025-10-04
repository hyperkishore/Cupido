# Browser Console Test for Reflect Chat

The app has been restarted with cleared cache. Now we need to test if it's working.

## Quick Test Instructions

1. **Open http://localhost:8081 in Chrome** (should already be open)

2. **Open Chrome DevTools** (press `Cmd + Option + I` or F12)

3. **Paste this test script** in the Console tab and press Enter:

```javascript
// Automated Test Script
(async function testReflectChat() {
    console.clear();
    console.log('%c🧪 REFLECT TAB AUTOMATED TEST', 'background: #222; color: #00ff00; font-size: 20px; padding: 10px;');
    console.log('========================================\n');

    // Step 1: Click Reflect tab
    console.log('Step 1: Finding Reflect tab...');
    const tabs = Array.from(document.querySelectorAll('*')).filter(el =>
        el.textContent && el.textContent.trim().toLowerCase().includes('reflect') &&
        (el.tagName === 'A' || el.tagName === 'BUTTON' || el.getAttribute('role') === 'tab')
    );

    if (tabs.length > 0) {
        console.log('✅ Found Reflect tab:', tabs[0]);
        tabs[0].click();
        console.log('✅ Clicked Reflect tab');

        // Step 2: Wait and find input
        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\nStep 2: Finding message input...');
        const inputs = Array.from(document.querySelectorAll('input, textarea'));
        let messageInput = null;

        for (let input of inputs) {
            const placeholder = input.placeholder || '';
            if (placeholder.toLowerCase().includes('thought') ||
                placeholder.toLowerCase().includes('share') ||
                placeholder.toLowerCase().includes('message')) {
                messageInput = input;
                break;
            }
        }

        if (messageInput) {
            console.log('✅ Found message input:', messageInput);

            // Step 3: Type test message
            console.log('\nStep 3: Typing test message...');
            const testMessage = 'AUTOMATED TEST - This message should trigger Claude AI via proxy';

            // Use React's value setter
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                window.HTMLInputElement.prototype,
                'value'
            ).set;
            nativeInputValueSetter.call(messageInput, testMessage);

            // Trigger React onChange
            messageInput.dispatchEvent(new Event('input', { bubbles: true }));

            console.log('✅ Message typed:', messageInput.value);

            // Step 4: Click send button
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('\nStep 4: Finding and clicking send button...');
            const buttons = Array.from(document.querySelectorAll('button'));

            for (let btn of buttons) {
                if ((btn.querySelector('svg') || btn.textContent.toLowerCase().includes('send')) && !btn.disabled) {
                    console.log('✅ Found send button:', btn);
                    btn.click();
                    console.log('📤 SEND BUTTON CLICKED!');
                    console.log('\n========================================');
                    console.log('%c✅ TEST COMPLETE!', 'background: #00ff00; color: #000; font-size: 16px; padding: 10px;');
                    console.log('========================================\n');
                    console.log('📊 Now check:');
                    console.log('  1. Database monitor in terminal (should show ai_model: haiku)');
                    console.log('  2. Proxy server logs at /tmp/proxy-server.log');
                    console.log('  3. This console for AI-related logs');
                    console.log('\n⏳ Waiting for response...\n');

                    // Monitor for response
                    let startTime = Date.now();
                    let checkInterval = setInterval(() => {
                        let elapsed = Math.round((Date.now() - startTime) / 1000);
                        if (elapsed % 2 === 0) {
                            console.log(`⏱️ ${elapsed}s - Waiting for AI response...`);
                        }
                        if (elapsed > 30) {
                            clearInterval(checkInterval);
                            console.error('❌ Timeout: No response after 30 seconds');
                            console.error('Check terminal for errors');
                        }
                    }, 1000);

                    return;
                }
            }

            console.error('❌ Could not find enabled send button');
            console.log('Available buttons:', buttons.map(b => ({
                text: b.textContent,
                disabled: b.disabled,
                hasSVG: !!b.querySelector('svg')
            })));
        } else {
            console.error('❌ Could not find message input');
            console.log('Available inputs:', inputs.map(i => ({
                tag: i.tagName,
                type: i.type,
                placeholder: i.placeholder
            })));
        }
    } else {
        console.error('❌ Could not find Reflect tab');
        console.log('Available elements:', Array.from(document.querySelectorAll('a, button, [role="tab"]'))
            .map(el => el.textContent?.trim().substring(0, 30))
        );
    }
})();
```

## What to Look For

### ✅ Success Signs:

1. **In Browser Console**:
   ```
   🔥 OUTGOING MESSAGE DEBUG START
   📤 User message: AUTOMATED TEST...
   🚀 PROXY CALL STARTING
   ✅ Success: Got X chars from Claude haiku
   ```

2. **In Terminal (Database Monitor)**:
   ```
   🆕 NEW MESSAGE RECEIVED!
   👥 Sender: 🤖 BOT
   🤖 AI Model: haiku  ← KEY INDICATOR
   ✅ SUCCESS: Real AI response detected!
   ```

3. **In Proxy Logs** (`/tmp/proxy-server.log`):
   ```
   🔥 PROXY REQUEST RECEIVED!
   🤖 Proxying to Claude HAIKU
   ✅ Claude response: ...
   ```

### ❌ Failure Signs:

1. **Fallback Response**: "That's really interesting! Tell me more..."
2. **Database shows**: `ai_model: none`
3. **Console shows**: `⚠️ FALLBACK RESPONSE TRIGGERED`
4. **No proxy requests** in `/tmp/proxy-server.log`

## Manual Alternative

If the script doesn't work, you can manually:

1. Click the "Reflect" or "Daily Reflection" tab
2. Type any message
3. Click Send
4. Watch the terminal for database updates

---

**The key test**: Does the database monitor show `ai_model: haiku` or `ai_model: none`?