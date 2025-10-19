#!/usr/bin/env node

/**
 * Direct Simulator Test Runner
 * ===========================
 * Tests simulator functions directly to verify fixes
 */

const fs = require('fs');
const fetch = require('node-fetch');

// Mock browser environment for simulator tests
global.window = {
  simulatorState: {
    isActive: false,
    isPaused: false,
    speed: 1,
    selectedPersonaId: null,
    conversationHistory: [],
    typingDelayMin: 1000,
    typingDelayMax: 3000
  },
  parent: {
    simulatorState: {
      isActive: false,
      isPaused: false,
      speed: 1,
      selectedPersonaId: null,
      conversationHistory: [],
      typingDelayMin: 1000,
      typingDelayMax: 3000
    }
  },
  top: null,
  addEventListener: () => {},
  postMessage: () => {},
  handleCupidoMessage: () => {}
};

global.document = {
  getElementById: () => ({ src: '' }),
  addEventListener: () => {}
};

// Store original console methods to avoid recursion
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

global.console = {
  log: (...args) => originalConsole.log('[TEST]', ...args),
  error: (...args) => originalConsole.error('[TEST]', ...args),
  warn: (...args) => originalConsole.warn('[TEST]', ...args)
};

// Load test functions
console.log('🔄 Loading test functions...');
const testFunctionsCode = fs.readFileSync('./comprehensive-test-functions.js', 'utf8');

// Execute the test functions code
eval(testFunctionsCode);

async function runSimulatorTests() {
  console.log('\n🎯 TESTING SIMULATOR FUNCTIONS');
  console.log('==============================\n');
  
  const simulatorTests = [
    { id: 'simulator-6', fn: testSimulator6 },
    { id: 'simulator-7', fn: testSimulator7 },
    { id: 'simulator-8', fn: testSimulator8 },
    { id: 'simulator-9', fn: testSimulator9 },
    { id: 'simulator-10', fn: testSimulator10 },
    { id: 'simulator-14', fn: testSimulator14 }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of simulatorTests) {
    try {
      console.log(`🔍 Running ${test.id}...`);
      
      if (!test.fn) {
        console.log(`❌ ${test.id}: Test function not found`);
        failed++;
        continue;
      }
      
      const result = await test.fn();
      
      if (result.pass) {
        console.log(`✅ ${test.id}: ${result.message}`);
        passed++;
      } else {
        console.log(`❌ ${test.id}: ${result.message}`);
        if (result.errors) {
          result.errors.forEach(error => console.log(`   Error: ${error}`));
        }
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.id}: Exception - ${error.message}`);
      failed++;
    }
    
    console.log(''); // Empty line for readability
  }
  
  console.log('📊 SIMULATOR TEST RESULTS');
  console.log('=========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (passed > failed) {
    console.log('\n🎉 Simulator tests are mostly working! Fixes successful!');
  } else {
    console.log('\n🔧 More fixes needed for simulator tests');
  }
}

// Run the tests
runSimulatorTests().catch(console.error);