// PASTE THIS INTO BROWSER CONSOLE FOR REAL-TIME DEBUGGING
console.log("🔍 BROWSER DEBUG STARTING...");

console.log("🔍 window.TEST_FUNCTIONS available:", !!window.TEST_FUNCTIONS);
if (window.TEST_FUNCTIONS) {
    console.log("🔍 TEST_FUNCTIONS count:", Object.keys(window.TEST_FUNCTIONS).length);
    console.log("🔍 First few functions:", Object.keys(window.TEST_FUNCTIONS).slice(0, 5));
} else {
    console.log("❌ TEST_FUNCTIONS is not available");
}

console.log("🔍 tests array length:", window.tests ? window.tests.length : "tests array not found");

console.log("🔍 DOM elements:");
console.log("  total-tests element:", document.getElementById('total-tests')?.textContent);
console.log("  passed-tests element:", document.getElementById('passed-tests')?.textContent);
console.log("  pending-tests element:", document.getElementById('pending-tests')?.textContent);

console.log("🔍 testConfig:");
console.log(window.testConfig || "testConfig not found");

console.log("🔍 Checking script tags:");
const scripts = document.querySelectorAll('script[src]');
scripts.forEach((script, i) => {
    console.log(`  Script ${i + 1}: ${script.src}`);
});

console.log("🔍 Manual initialization test:");
if (typeof initializeTests === 'function') {
    console.log("✅ initializeTests function exists");
    console.log("🔄 Calling initializeTests manually...");
    initializeTests();
    console.log("🔍 After manual call - tests array length:", window.tests ? window.tests.length : "tests array not found");
} else {
    console.log("❌ initializeTests function not found");
}

console.log("🔍 BROWSER DEBUG COMPLETE");
