const fs = require('fs');

console.log('🔧 Building comprehensive test dashboard...');

// Read current dashboard
const currentDashboard = fs.readFileSync('test-dashboard.html', 'utf8');

// Read generated test sections
const newTestSections = fs.readFileSync('test-sections-generated.html', 'utf8');

// Find the section to replace (from "<!-- Critical Issue" to "<!-- Live Demo -->")
const startMarker = '            <!-- Critical Issue: New User Flow -->';
const endMarker = '        <!-- Live Demo -->';

const startIndex = currentDashboard.indexOf(startMarker);
const endIndex = currentDashboard.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('❌ Could not find markers in test-dashboard.html');
  process.exit(1);
}

// Build the new dashboard
const newDashboard =
  currentDashboard.substring(0, startIndex) +
  newTestSections +
  '\n        ' +
  currentDashboard.substring(endIndex);

// Write the new dashboard
fs.writeFileSync('test-dashboard.html', newDashboard);

console.log('✅ Successfully replaced test sections');
console.log('✅ Test dashboard now has 40 tests across 7 categories');
console.log('\nNext: Adding JavaScript functions for all 40 tests...');
