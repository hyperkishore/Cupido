const fs = require('fs');

// Read the test config
const testConfig = require('./test-config.js').TEST_CATEGORIES;

// Count total tests
let totalTests = 0;
Object.values(testConfig).forEach(cat => {
  totalTests += cat.tests.length;
});

console.log(`Generating test dashboard with ${totalTests} tests across ${Object.keys(testConfig).length} categories...`);

// Generate test card HTML
function generateTestCard(test) {
  return `
                    <div class="test-card" data-test="${test.id}" onclick="runTest('${test.id}')">
                        <div class="test-header">
                            <div class="test-name">${test.name}</div>
                            <div class="test-status-icon pending">⏸</div>
                        </div>
                        <div class="test-description">
                            ${test.description}
                        </div>
                        <div class="test-module">Module: ${test.module}</div>
                        <div class="test-result"></div>
                    </div>`;
}

// Generate category section HTML
function generateCategorySection(category) {
  const testCards = category.tests.map(generateTestCard).join('\n');

  return `
            <!-- ${category.title} -->
            <div class="test-section">
                <div class="section-header">
                    <span class="section-icon">${category.icon}</span>
                    <span class="section-title">${category.title}</span>
                    <span id="section-${category.id}-status" class="section-status status-pending">Not Started</span>
                </div>
                <div class="test-grid" id="${category.id}-tests">
${testCards}
                </div>
            </div>`;
}

// Generate all category sections
const categorySections = Object.values(testConfig).map(generateCategorySection).join('\n');

console.log('Generated HTML sections successfully');
console.log('Categories:', Object.keys(testConfig).join(', '));
console.log('Total tests:', totalTests);

// Output the sections to a file for manual integration
fs.writeFileSync('test-sections-generated.html', categorySections);
console.log('✅ Wrote test sections to test-sections-generated.html');
