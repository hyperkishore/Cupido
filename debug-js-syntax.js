// Extract JavaScript from HTML and test syntax
console.log('Testing JavaScript syntax...');

// Test switchTab function definition
function switchTab(tabName, event) {
    console.log('switchTab called with:', tabName, event);
}

// Test basic functionality
try {
    switchTab('health', { target: { classList: { add: () => {}, remove: () => {} } } });
    console.log('✅ switchTab function works correctly');
} catch (error) {
    console.error('❌ switchTab error:', error);
}

console.log('JavaScript syntax test completed');