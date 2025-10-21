#!/usr/bin/env node

/**
 * Verification script to test that the iframe loads successfully
 * and the test framework can interact with it.
 */

const http = require('http');

function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      resolve({
        url,
        description,
        status: res.statusCode,
        success: res.statusCode === 200
      });
    });

    req.on('error', (error) => {
      reject({ url, description, error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({ url, description, error: 'Request timeout' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('\n🔍 Verifying Iframe Fix...\n');
  console.log('='.repeat(60));

  const tests = [
    {
      url: 'http://localhost:3001/health',
      description: 'Proxy server health check'
    },
    {
      url: 'http://localhost:3001/app',
      description: 'App HTML loads through proxy'
    },
    {
      url: 'http://localhost:3001/app/index.ts.bundle?platform=web&dev=true',
      description: 'Bundle loads through proxy (WASM fix verification)'
    },
    {
      url: 'http://localhost:3001/cupido-test-dashboard',
      description: 'Test dashboard loads'
    },
    {
      url: 'http://localhost:8081/',
      description: 'Expo dev server running'
    },
    {
      url: 'http://localhost:8081/index.ts.bundle?platform=web&dev=true',
      description: 'Bundle loads from Expo directly'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await testEndpoint(test.url, test.description);
      if (result.success) {
        console.log(`✅ ${result.description}`);
        console.log(`   ${result.url} → ${result.status}`);
        passed++;
      } else {
        console.log(`❌ ${result.description}`);
        console.log(`   ${result.url} → ${result.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${error.description}`);
      console.log(`   ${error.url} → Error: ${error.error}`);
      failed++;
    }
    console.log('');
  }

  console.log('='.repeat(60));
  console.log(`\n📊 Results: ${passed}/${tests.length} tests passed\n`);

  if (failed === 0) {
    console.log('✅ All infrastructure tests PASSED!');
    console.log('\n📋 Next Steps:');
    console.log('1. Open http://localhost:3001/cupido-test-dashboard');
    console.log('2. The iframe should load the app correctly');
    console.log('3. Run tests to verify DOM access works');
    console.log('');
    return 0;
  } else {
    console.log('❌ Some tests FAILED!');
    console.log('\nPlease check that:');
    console.log('1. Proxy server is running: node server.js');
    console.log('2. Expo dev server is running: npx expo start --web --port 8081');
    console.log('');
    return 1;
  }
}

runTests().then(code => process.exit(code)).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
