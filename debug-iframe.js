#!/usr/bin/env node

/**
 * Debug script to test iframe communication and DOM access
 */

const puppeteer = require('puppeteer');

(async () => {
  console.log('🔍 Starting iframe debug...\n');

  const browser = await puppeteer.launch({
    headless: false,
    devtools: true,
  });

  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      console.log(`❌ Console Error: ${text}`);
    } else if (type === 'warn') {
      console.log(`⚠️  Console Warn: ${text}`);
    } else if (text.includes('TestBridge') || text.includes('iframe')) {
      console.log(`📋 ${text}`);
    }
  });

  console.log('1. Loading test dashboard...');
  await page.goto('http://localhost:3001/cupido-test-dashboard', {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  console.log('2. Waiting for page to stabilize...');
  await page.waitForTimeout(3000);

  console.log('3. Checking iframe status...');

  const iframeInfo = await page.evaluate(() => {
    const iframe = document.getElementById('live-app-iframe');

    if (!iframe) {
      return { error: 'Iframe not found' };
    }

    try {
      const doc = iframe.contentWindow?.document;

      return {
        src: iframe.src,
        hasContentWindow: !!iframe.contentWindow,
        hasContentDocument: !!doc,
        documentReady: doc?.readyState,
        bodyExists: !!doc?.body,
        bodyChildCount: doc?.body?.children?.length || 0,
        title: doc?.title,
        rootDiv: !!doc?.querySelector('#root'),
        rootChildren: doc?.querySelector('#root')?.children?.length || 0,
        elementsWithTestId: doc?.querySelectorAll('[data-testid]')?.length || 0,
        testIdList: Array.from(doc?.querySelectorAll('[data-testid]') || [])
          .map(el => el.getAttribute('data-testid'))
          .slice(0, 20),
        hasChatInput: !!doc?.querySelector('[data-testid="chat-input"]'),
        hasSendButton: !!doc?.querySelector('[data-testid="send-button"]'),
      };
    } catch (error) {
      return {
        error: 'CORS or security error',
        message: error.message
      };
    }
  });

  console.log('\n📊 Iframe Status:');
  console.log(JSON.stringify(iframeInfo, null, 2));

  console.log('\n4. Testing postMessage communication...');

  const testMessageResponse = await page.evaluate(() => {
    return new Promise((resolve) => {
      const iframe = document.getElementById('live-app-iframe');
      const timeout = setTimeout(() => {
        resolve({ success: false, error: 'Timeout - no response' });
      }, 3000);

      const messageListener = (event) => {
        if (event.data.type === 'test-state-response') {
          clearTimeout(timeout);
          window.removeEventListener('message', messageListener);
          resolve({ success: true, state: event.data.state });
        } else if (event.data.type === 'APP_READY') {
          console.log('APP_READY received:', event.data);
        }
      };

      window.addEventListener('message', messageListener);
      iframe?.contentWindow?.postMessage({ type: 'test-get-state' }, '*');
    });
  });

  console.log('\n📨 PostMessage Test:');
  console.log(JSON.stringify(testMessageResponse, null, 2));

  console.log('\n5. Checking if app loaded in iframe...');

  // Take a screenshot
  await page.screenshot({ path: '/tmp/cupido-debug.png', fullPage: true });
  console.log('📸 Screenshot saved to /tmp/cupido-debug.png');

  console.log('\n✅ Debug complete! Press Ctrl+C to exit or browser will stay open for inspection.');

})().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
