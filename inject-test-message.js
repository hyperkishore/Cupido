// Save this bookmarklet or run in console
javascript:(function() {
    console.log('🧪 TEST: Simulating message send...');

    // Find all tabs and click the one with "Reflect"
    const tabs = Array.from(document.querySelectorAll('[role="tab"], a, button, div')).filter(el =>
        el.textContent && el.textContent.toLowerCase().includes('reflect')
    );

    if (tabs.length > 0) {
        console.log('✅ Found Reflect tab, clicking...');
        tabs[0].click();

        setTimeout(() => {
            // Find input field
            const inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
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
                console.log('✅ Found input field, typing test message...');

                // Set value
                messageInput.value = 'AUTOMATED TEST - This should trigger Claude AI via proxy';

                // Trigger React's onChange
                const event = new Event('input', { bubbles: true });
                messageInput.dispatchEvent(event);

                // Also trigger change event
                const changeEvent = new Event('change', { bubbles: true });
                messageInput.dispatchEvent(changeEvent);

                console.log('✅ Message typed:', messageInput.value);

                setTimeout(() => {
                    // Find and click send button
                    const buttons = Array.from(document.querySelectorAll('button'));
                    let sendButton = null;

                    for (let btn of buttons) {
                        // Check if button has an SVG (send icon) or contains "send" text
                        if (btn.querySelector('svg') ||
                            btn.textContent.toLowerCase().includes('send') ||
                            btn.getAttribute('aria-label')?.toLowerCase().includes('send')) {
                            // Make sure it's not disabled
                            if (!btn.disabled) {
                                sendButton = btn;
                                break;
                            }
                        }
                    }

                    if (sendButton) {
                        console.log('✅ Found send button, clicking...');
                        sendButton.click();
                        console.log('📤 Message sent! Check database monitor and proxy logs.');
                        console.log('⏳ Waiting for AI response...');
                    } else {
                        console.error('❌ Could not find send button');
                        console.log('Available buttons:', buttons.map(b => b.textContent));
                    }
                }, 1000);
            } else {
                console.error('❌ Could not find message input field');
                console.log('Available inputs:', Array.from(inputs).map(i => ({
                    type: i.type,
                    placeholder: i.placeholder
                })));
            }
        }, 2000);
    } else {
        console.error('❌ Could not find Reflect tab');
        console.log('Looking for tabs containing "reflect"...');
    }
})();