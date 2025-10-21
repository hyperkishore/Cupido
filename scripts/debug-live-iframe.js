#!/usr/bin/env node

/**
 * Debug script to inspect what's actually rendered in the iframe
 * This will tell us exactly why tests are failing
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('\n🔍 Debugging Live Iframe Content...\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Listen to all console messages from both parent and iframe
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️ ' : '📋';
      console.log(`${prefix} Console [${type}]: ${text}`);
    });

    console.log('1️⃣  Loading test dashboard...');
    await page.goto('http://localhost:3001/cupido-test-dashboard', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('2️⃣  Waiting 5 seconds for app to initialize...');
    await page.waitForTimeout(5000);

    console.log('3️⃣  Inspecting iframe content...\n');

    const iframeDebugInfo = await page.evaluate(() => {
      const iframe = document.getElementById('live-app-iframe');

      if (!iframe) {
        return { error: 'Iframe element not found in DOM' };
      }

      const win = iframe.contentWindow;
      const doc = iframe.contentDocument || win?.document;

      if (!doc) {
        return { error: 'Cannot access iframe document (CORS issue)' };
      }

      // Check what's in the iframe
      const info = {
        iframeLoaded: true,
        documentReady: doc.readyState,
        title: doc.title,
        bodyHTML: doc.body?.innerHTML?.substring(0, 500),
        rootDiv: !!doc.querySelector('#root'),
        rootHTML: doc.querySelector('#root')?.innerHTML?.substring(0, 500),

        // Check for specific elements
        elementsWithTestId: doc.querySelectorAll('[data-testid]').length,
        testIds: Array.from(doc.querySelectorAll('[data-testid]'))
          .map(el => ({
            testId: el.getAttribute('data-testid'),
            tagName: el.tagName,
            text: el.textContent?.substring(0, 50),
            visible: !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length)
          }))
          .slice(0, 30),

        // Check for chat input specifically
        chatInputExists: !!doc.querySelector('[data-testid="chat-input"]'),
        sendButtonExists: !!doc.querySelector('[data-testid="send-button"]'),

        // Check if app has any text content
        bodyText: doc.body?.textContent?.substring(0, 500),

        // Check for loading screens
        hasLoadingText: doc.body?.textContent?.includes('Loading'),
        hasReflectionText: doc.body?.textContent?.includes('reflection'),

        // Check React root
        reactRootExists: !!doc.querySelector('#root > div'),
        reactRootChildren: doc.querySelector('#root')?.children?.length || 0,

        // Try to find any input elements
        allInputs: doc.querySelectorAll('input, textarea').length,
        inputElements: Array.from(doc.querySelectorAll('input, textarea'))
          .map(el => ({
            type: el.tagName,
            placeholder: el.placeholder,
            id: el.id,
            testId: el.getAttribute('data-testid'),
            name: el.name
          }))
          .slice(0, 10)
      };

      return info;
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('IFRAME DEBUG INFORMATION:');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (iframeDebugInfo.error) {
      console.log('❌ ERROR:', iframeDebugInfo.error);
    } else {
      console.log('📄 Document State:');
      console.log(`   Ready State: ${iframeDebugInfo.documentReady}`);
      console.log(`   Title: ${iframeDebugInfo.title}`);
      console.log(`   Root Div Exists: ${iframeDebugInfo.rootDiv}`);
      console.log(`   React Root Children: ${iframeDebugInfo.reactRootChildren}`);
      console.log('');

      console.log('🎯 Test Elements:');
      console.log(`   Elements with data-testid: ${iframeDebugInfo.elementsWithTestId}`);
      console.log(`   Chat input exists: ${iframeDebugInfo.chatInputExists}`);
      console.log(`   Send button exists: ${iframeDebugInfo.sendButtonExists}`);
      console.log(`   Total input/textarea elements: ${iframeDebugInfo.allInputs}`);
      console.log('');

      console.log('📝 Content Check:');
      console.log(`   Has "Loading" text: ${iframeDebugInfo.hasLoadingText}`);
      console.log(`   Has "reflection" text: ${iframeDebugInfo.hasReflectionText}`);
      console.log('');

      if (iframeDebugInfo.testIds.length > 0) {
        console.log('📋 Found Test IDs:');
        iframeDebugInfo.testIds.forEach(item => {
          console.log(`   - ${item.testId} (${item.tagName}) ${item.visible ? '👁️ ' : '🙈'}`);
          if (item.text) console.log(`     Text: "${item.text}"`);
        });
        console.log('');
      }

      if (iframeDebugInfo.inputElements.length > 0) {
        console.log('⌨️  Input Elements Found:');
        iframeDebugInfo.inputElements.forEach(input => {
          console.log(`   - ${input.type}${input.testId ? ` [testId="${input.testId}"]` : ''}`);
          if (input.placeholder) console.log(`     Placeholder: "${input.placeholder}"`);
        });
        console.log('');
      }

      if (iframeDebugInfo.bodyText && iframeDebugInfo.bodyText.length > 0) {
        console.log('📄 Body Text (first 500 chars):');
        console.log(`   "${iframeDebugInfo.bodyText}"`);
        console.log('');
      }

      if (iframeDebugInfo.rootHTML) {
        console.log('🔍 Root HTML (first 500 chars):');
        console.log(`   ${iframeDebugInfo.rootHTML}`);
        console.log('');
      }
    }

    console.log('═══════════════════════════════════════════════════════════');

    // Test postMessage communication
    console.log('\n4️⃣  Testing postMessage communication...\n');

    const messageTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        const iframe = document.getElementById('live-app-iframe');
        const timeout = setTimeout(() => {
          resolve({ success: false, error: 'Timeout - no response from iframe' });
        }, 5000);

        const messageHandler = (event) => {
          if (event.data.type === 'test-state-response') {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            resolve({
              success: true,
              state: event.data.state
            });
          } else if (event.data.type === 'APP_READY') {
            console.log('Received APP_READY:', event.data);
          }
        };

        window.addEventListener('message', messageHandler);

        // Send test message
        iframe?.contentWindow?.postMessage({
          type: 'test-get-state',
          timestamp: Date.now()
        }, '*');
      });
    });

    console.log('📨 PostMessage Test Result:');
    if (messageTest.success) {
      console.log('   ✅ SUCCESS - App responded!');
      console.log('   State:', JSON.stringify(messageTest.state, null, 2));
    } else {
      console.log('   ❌ FAILED -', messageTest.error);
      console.log('   This means TestBridge is not responding');
    }
    console.log('');

    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n✅ Debug complete!');
    console.log('\n💡 Browser will stay open for manual inspection.');
    console.log('   Press Ctrl+C to exit.\n');

  } catch (error) {
    console.error('\n❌ Error during debug:', error.message);
    if (browser) await browser.close();
    process.exit(1);
  }
})();
