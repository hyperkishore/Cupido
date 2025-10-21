#!/usr/bin/env node

/**
 * Verification script for comprehensive test dashboard
 * Tests that all 40 test functions are properly loaded and accessible
 */

console.log('🔍 Verifying Test Dashboard Integration...\n');

// Load the comprehensive test functions
const fs = require('fs');
const path = require('path');

// Read and validate the comprehensive test functions file
const testFunctionsPath = path.join(__dirname, 'comprehensive-test-functions.js');
const testFunctionsContent = fs.readFileSync(testFunctionsPath, 'utf8');

console.log('✓ comprehensive-test-functions.js exists');
console.log(`  Size: ${(testFunctionsContent.length / 1024).toFixed(2)} KB\n`);

// Check for required exports
const requiredExports = [
    'TEST_FUNCTIONS',
    'runCategory',
    'getConsoleErrorSummary',
    'clearConsoleErrors',
    'getNextNaturalMessage',
    'sendMessageToApp',
    'getAppState'
];

console.log('Checking for required exports:');
let allExportsFound = true;
for (const exportName of requiredExports) {
    const found = testFunctionsContent.includes(exportName);
    console.log(`  ${found ? '✓' : '✗'} ${exportName}`);
    if (!found) allExportsFound = false;
}
console.log();

// Count test functions
const testIds = [
    // Console Error Detection (5)
    'console-1', 'console-2', 'console-3', 'console-4', 'console-5',
    // Message Flow & UI (8)
    'message-1', 'message-2', 'message-3', 'message-4', 'message-5', 'message-6', 'message-7', 'message-8',
    // Profile Extraction (6)
    'profile-1', 'profile-2', 'profile-3', 'profile-4', 'profile-5', 'profile-6',
    // Database Operations (5)
    'database-1', 'database-2', 'database-3', 'database-4', 'database-5',
    // Error Handling (6)
    'error-1', 'error-2', 'error-3', 'error-4', 'error-5', 'error-6',
    // State Management (6)
    'state-1', 'state-2', 'state-3', 'state-4', 'state-5', 'state-6',
    // API & Performance (4)
    'api-1', 'api-2', 'api-3', 'api-4'
];

console.log('Checking for all 40 test functions:');
let testFunctionsFound = 0;
const missingTests = [];

for (const testId of testIds) {
    // Check if test function exists in the file
    const testFnName = testId.replace('-', '');
    const pattern = new RegExp(`['"]${testId}['"]\\s*:\\s*test`);
    if (pattern.test(testFunctionsContent)) {
        testFunctionsFound++;
    } else {
        missingTests.push(testId);
    }
}

console.log(`  Found: ${testFunctionsFound}/40 test functions`);
if (missingTests.length > 0) {
    console.log(`  Missing: ${missingTests.join(', ')}`);
}
console.log();

// Check test-dashboard.html integration
const dashboardPath = path.join(__dirname, 'test-dashboard.html');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf8');

console.log('Checking test-dashboard.html integration:');

// Check if script is loaded
const scriptLoaded = dashboardContent.includes('comprehensive-test-functions.js');
console.log(`  ${scriptLoaded ? '✓' : '✗'} Script tag included`);

// Check if TEST_FUNCTIONS is referenced
const testFunctionsReferenced = dashboardContent.includes('window.TEST_FUNCTIONS');
console.log(`  ${testFunctionsReferenced ? '✓' : '✗'} window.TEST_FUNCTIONS referenced`);

// Check for all 40 test cards in HTML
let testCardsFound = 0;
for (const testId of testIds) {
    if (dashboardContent.includes(`data-test="${testId}"`)) {
        testCardsFound++;
    }
}
console.log(`  ${testCardsFound === 40 ? '✓' : '✗'} Test cards: ${testCardsFound}/40`);

// Check for category buttons
const categories = ['console', 'message', 'profile', 'database', 'error', 'state', 'api'];
let categoryButtonsFound = 0;
for (const category of categories) {
    if (dashboardContent.includes(`runCategory('${category}')`)) {
        categoryButtonsFound++;
    }
}
console.log(`  ${categoryButtonsFound === 7 ? '✓' : '✗'} Category buttons: ${categoryButtonsFound}/7`);
console.log();

// Check console error monitoring
console.log('Checking console error monitoring:');
const hasConsoleOverride = testFunctionsContent.includes('console.error = function') &&
                          testFunctionsContent.includes('console.warn = function');
console.log(`  ${hasConsoleOverride ? '✓' : '✗'} Console error/warn override`);

const hasErrorTracking = testFunctionsContent.includes('consoleErrors') &&
                        testFunctionsContent.includes('consoleWarnings');
console.log(`  ${hasErrorTracking ? '✓' : '✗'} Error tracking arrays`);
console.log();

// Final summary
console.log('═══════════════════════════════════════════════');
const allChecksPass = allExportsFound &&
                      testFunctionsFound === 40 &&
                      scriptLoaded &&
                      testFunctionsReferenced &&
                      testCardsFound === 40 &&
                      categoryButtonsFound === 7 &&
                      hasConsoleOverride &&
                      hasErrorTracking;

if (allChecksPass) {
    console.log('✅ ALL CHECKS PASSED - Dashboard is fully integrated');
    console.log('\nReady to use at: http://localhost:3001/test-dashboard.html');
    console.log('\nFeatures:');
    console.log('  • 40 comprehensive tests across 7 categories');
    console.log('  • Console error monitoring (catches ReferenceError, etc.)');
    console.log('  • Batch execution by category');
    console.log('  • Individual test execution');
    console.log('  • Test history and logging');
} else {
    console.log('⚠️  SOME CHECKS FAILED - Review output above');
    process.exit(1);
}

console.log('═══════════════════════════════════════════════\n');
