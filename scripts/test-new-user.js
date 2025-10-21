// Test script for new/demo user flow
// Run this in Chrome DevTools console

console.log('🧹 Clearing all Cupido data from localStorage...');

// Clear all cupido-related localStorage
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && key.includes('cupido')) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`  Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log(`✅ Cleared ${keysToRemove.length} keys`);
console.log('🔄 Reloading page to test as new user...\n');

// Reload the page
setTimeout(() => {
  window.location.reload();
}, 1000);

// After reload, run this part manually:
/*
console.log('\n🧪 MANUAL TEST STEPS:');
console.log('1. Click on "Cupido" tab');
console.log('2. Type "Hello" in the input');
console.log('3. Press send');
console.log('4. Check console for errors');
console.log('5. Verify message appears and response is received');

// Monitor console for errors
window.addEventListener('error', (e) => {
  console.error('🔴 GLOBAL ERROR:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('🔴 UNHANDLED REJECTION:', e.reason);
});
*/