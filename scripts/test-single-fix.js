#!/usr/bin/env node

/**
 * Test Single Function Fix
 * ========================
 * Test the specific simulator-13 function to verify fix
 */

const fs = require('fs');

// Mock environment
global.window = { 
  simulatorState: {}, 
  parent: {}, 
  top: {},
  addEventListener: () => {},
  postMessage: () => {}
};
global.document = { getElementById: () => ({ src: '' }), addEventListener: () => {} };
global.console = { log: () => {}, error: () => {}, warn: () => {} };

// Load test functions
const testFunctionsCode = fs.readFileSync('./comprehensive-test-functions.js', 'utf8');
eval(testFunctionsCode);

async function testSingleFix() {
  console.log('🔍 Testing simulator-13 fix...\n');
  
  try {
    const result = await testSimulator13();
    
    console.log(`Status: ${result.pass ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Message: ${result.message}`);
    
    if (result.errors) {
      console.log(`Errors: ${result.errors.join(', ')}`);
    }
    
    if (result.metadata) {
      console.log(`Metadata:`, result.metadata);
    }
    
    if (result.pass) {
      console.log('\n🎉 Fix successful! Test should now pass in dashboard.');
    } else {
      console.log('\n🔧 Still needs more work.');
    }
    
  } catch (error) {
    console.log(`❌ Exception: ${error.message}`);
  }
}

testSingleFix();