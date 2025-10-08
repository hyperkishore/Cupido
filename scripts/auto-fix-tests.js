#!/usr/bin/env node

/**
 * Automated Test Fix Loop
 *
 * This script continuously monitors test results from the API and automatically
 * fixes failures using Claude AI analysis.
 *
 * Features:
 * - Polls test results API every 30 seconds
 * - Analyzes test failures with Claude AI
 * - Automatically applies safe fixes
 * - Requests approval for risky changes
 * - Prevents infinite loops with retry limits
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:3001/api/test-results/latest',
    CLAUDE_API_URL: 'http://localhost:3001/api/chat',
    POLL_INTERVAL: 30000, // 30 seconds
    MAX_AUTO_FIX_ATTEMPTS: 3,
    SAFE_FILE_PATTERNS: [
        /\.tsx?$/,
        /\.jsx?$/,
        /\.json$/,
        /\.css$/
    ],
    RISKY_PATTERNS: [
        /server\.js$/,
        /\.env$/,
        /package\.json$/,
        /tsconfig\.json$/
    ]
};

// State tracking
let lastTestRunId = null;
let fixAttempts = {};
let consecutiveFailures = {};

// Utility: Get user input for approvals
function askForApproval(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question(`\n${question} (y/n): `, (answer) => {
            rl.close();
            resolve(answer.toLowerCase() === 'y');
        });
    });
}

// Fetch latest test results
async function fetchLatestTestResults() {
    try {
        const response = await fetch(CONFIG.API_URL);
        if (!response.ok) {
            if (response.status === 404) {
                return null; // No results yet
            }
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('❌ Failed to fetch test results:', error.message);
        return null;
    }
}

// Analyze failures with Claude AI
async function analyzeFailuresWithClaude(testResults) {
    const failedTests = testResults.tests.filter(t => t.status === 'fail');

    if (failedTests.length === 0) {
        return null;
    }

    const analysisPrompt = `You are an expert software debugger analyzing test failures.

Test Results Summary:
- Total: ${testResults.summary.total}
- Passed: ${testResults.summary.passed}
- Failed: ${testResults.summary.failed}

Failed Tests:
${failedTests.map((test, idx) => `
${idx + 1}. ${test.testName} (${test.testId})
   Status: ${test.status}
   Message: ${test.message}
   Errors: ${JSON.stringify(test.errors || [])}
   Metadata: ${JSON.stringify(test.metadata || {})}
`).join('\n')}

Analyze these failures and provide:
1. Root cause of each failure
2. Which file(s) need to be fixed
3. Specific code changes needed
4. Risk level (LOW/MEDIUM/HIGH) for each fix

Format as JSON:
{
  "analysis": "overall analysis",
  "fixes": [
    {
      "testId": "test-id",
      "file": "path/to/file",
      "reason": "why this fix is needed",
      "riskLevel": "LOW|MEDIUM|HIGH",
      "changes": "description of changes"
    }
  ]
}`;

    try {
        const response = await fetch(CONFIG.CLAUDE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: analysisPrompt }
                ],
                modelType: 'sonnet'
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const analysisText = data.message;

        // Try to parse JSON from Claude's response
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }

        return {
            analysis: analysisText,
            fixes: []
        };
    } catch (error) {
        console.error('❌ Failed to analyze with Claude:', error.message);
        return null;
    }
}

// Determine if a fix is safe to auto-apply
function isSafeFix(fix) {
    // Check risk level
    if (fix.riskLevel === 'HIGH') {
        return false;
    }

    // Check file pattern
    const isRiskyFile = CONFIG.RISKY_PATTERNS.some(pattern =>
        pattern.test(fix.file)
    );

    if (isRiskyFile && fix.riskLevel === 'MEDIUM') {
        return false;
    }

    // Check attempt count
    const attemptKey = `${fix.file}:${fix.testId}`;
    if (fixAttempts[attemptKey] >= CONFIG.MAX_AUTO_FIX_ATTEMPTS) {
        return false;
    }

    return true;
}

// Apply a fix to a file
async function applyFix(fix) {
    console.log(`\n🔧 Applying fix to ${fix.file}...`);
    console.log(`   Reason: ${fix.reason}`);
    console.log(`   Risk: ${fix.riskLevel}`);

    // Track attempt
    const attemptKey = `${fix.file}:${fix.testId}`;
    fixAttempts[attemptKey] = (fixAttempts[attemptKey] || 0) + 1;

    // Get detailed fix instructions from Claude
    const fixPrompt = `Generate the exact code changes for this fix:

File: ${fix.file}
Reason: ${fix.reason}
Changes needed: ${fix.changes}

Read the current file content and provide the EXACT old code and new code for the Edit tool.
Format as:
OLD_CODE:
\`\`\`
exact old code here
\`\`\`

NEW_CODE:
\`\`\`
exact new code here
\`\`\``;

    try {
        const response = await fetch(CONFIG.CLAUDE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'user', content: fixPrompt }
                ],
                modelType: 'sonnet'
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.status}`);
        }

        const data = await response.json();
        const instructions = data.message;

        console.log(`\n📝 Fix instructions:\n${instructions}\n`);
        console.log(`⚠️  Manual application required. Please review and apply the fix manually.`);

        return true;
    } catch (error) {
        console.error(`❌ Failed to generate fix:`, error.message);
        return false;
    }
}

// Process test results and apply fixes
async function processTestResults(testResults) {
    // Skip if we've already processed this test run
    if (testResults.id === lastTestRunId) {
        return;
    }

    lastTestRunId = testResults.id;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 NEW TEST RESULTS: ${testResults.summary.passed}/${testResults.summary.total} passed`);
    console.log(`${'='.repeat(60)}`);

    // All tests passed!
    if (testResults.summary.passed === testResults.summary.total) {
        console.log('✅ All tests passing! No fixes needed.');
        // Reset failure tracking
        consecutiveFailures = {};
        return;
    }

    // Analyze failures
    console.log('\n🔍 Analyzing test failures with Claude AI...');
    const analysis = await analyzeFailuresWithClaude(testResults);

    if (!analysis) {
        console.log('⚠️  Could not analyze failures. Will retry on next test run.');
        return;
    }

    console.log(`\n📋 Analysis: ${analysis.analysis}`);
    console.log(`\n🔧 Proposed fixes: ${analysis.fixes.length}`);

    // Process each fix
    for (const fix of analysis.fixes) {
        const safe = isSafeFix(fix);

        if (safe) {
            console.log(`\n✅ AUTO-APPLYING SAFE FIX: ${fix.file}`);
            await applyFix(fix);
        } else {
            console.log(`\n⚠️  RISKY FIX DETECTED: ${fix.file}`);
            console.log(`   Risk: ${fix.riskLevel}`);
            console.log(`   Reason: ${fix.reason}`);

            const approved = await askForApproval('Apply this fix?');
            if (approved) {
                await applyFix(fix);
            } else {
                console.log('❌ Fix skipped by user.');
            }
        }
    }

    console.log('\n✅ Fix application complete. Waiting for next test run...');
}

// Main monitoring loop
async function startMonitoring() {
    console.log('🤖 Automated Test Fix Loop Started');
    console.log('='.repeat(60));
    console.log(`API: ${CONFIG.API_URL}`);
    console.log(`Poll Interval: ${CONFIG.POLL_INTERVAL}ms`);
    console.log(`Max Auto-Fix Attempts: ${CONFIG.MAX_AUTO_FIX_ATTEMPTS}`);
    console.log('='.repeat(60));
    console.log('\nMonitoring test results...\n');

    // Main loop
    setInterval(async () => {
        const testResults = await fetchLatestTestResults();

        if (testResults) {
            await processTestResults(testResults);
        }
    }, CONFIG.POLL_INTERVAL);

    // Also check immediately on startup
    const initialResults = await fetchLatestTestResults();
    if (initialResults) {
        await processTestResults(initialResults);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n🛑 Shutting down automated fix loop...');
    console.log('Fix attempt summary:');
    console.log(JSON.stringify(fixAttempts, null, 2));
    process.exit(0);
});

// Start the monitoring
startMonitoring().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
