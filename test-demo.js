// Simple test to verify demo mode works
const { DEMO_MODE, DEMO_USER } = require('./src/config/demo');

console.log('🚀 Testing Cupido Demo Mode...\n');

// Test 1: Demo mode is enabled
console.log('✅ Demo mode enabled:', DEMO_MODE);

// Test 2: Demo user data is available
console.log('✅ Demo user loaded:', DEMO_USER.email);
console.log('✅ Streak:', DEMO_USER.streak, 'days');
console.log('✅ Persona traits:', Object.keys(DEMO_USER.persona.traits).length, 'traits');
console.log('✅ Insights:', DEMO_USER.persona.insights.length, 'insights');

// Test 3: Test mock services
console.log('\n🧪 Testing Mock Services...');

// Mock Auth Service
const { MockAuthService } = require('./src/services/demo/mockAuthService');
MockAuthService.getCurrentUser().then(user => {
  console.log('✅ Auth service:', user ? 'Working' : 'Failed');
});

// Mock Prompt Service
const { MockPromptService } = require('./src/services/demo/mockPromptService');
MockPromptService.getTodaysPrompt('demo-user-123').then(prompt => {
  console.log('✅ Prompt service:', prompt ? 'Working' : 'Failed');
});

// Mock Matching Service
const { MockMatchingService } = require('./src/services/demo/mockMatchingService');
MockMatchingService.getMatches('demo-user-123').then(matches => {
  console.log('✅ Matching service:', matches.length, 'matches');
});

console.log('\n🎉 Demo mode setup complete!');
console.log('\n📱 To test the app:');
console.log('   1. Run: npm start');
console.log('   2. Press "w" to open in web browser');
console.log('   3. Or scan QR code with Expo Go app');
console.log('\n👤 Demo login credentials:');
console.log('   Email: demo@cupido.app');
console.log('   Password: any password (demo mode)');