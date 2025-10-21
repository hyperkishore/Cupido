#!/usr/bin/env node

/**
 * SELF-HEALING TEST MONITOR
 * ========================
 * 
 * Automatically monitors test failures and suggests/applies fixes
 * Part of the cupido-test-dashboard self-healing infrastructure
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class TestAutoHealer {
  constructor() {
    this.logsDir = path.join(__dirname, 'logs');
    this.failuresFile = path.join(this.logsDir, 'current-failures.json');
    this.healerLogFile = path.join(this.logsDir, 'auto-healer.log');
    this.pollingInterval = 10000; // 10 seconds
    this.lastProcessedTimestamp = null;
    this.isProcessing = false;
    
    this.log('🔧 Test Auto-Healer initialized');
    this.log(`📁 Monitoring: ${this.failuresFile}`);
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    console.log(logEntry);
    
    // Also write to log file
    try {
      fs.appendFileSync(this.healerLogFile, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to healer log:', error);
    }
  }

  async startPolling() {
    this.log('🔄 Starting background polling for test failures...');
    
    setInterval(async () => {
      if (this.isProcessing) {
        return; // Skip if already processing
      }
      
      try {
        await this.checkForFailures();
      } catch (error) {
        this.log(`❌ Error during failure check: ${error.message}`);
      }
    }, this.pollingInterval);
  }

  async checkForFailures() {
    if (!fs.existsSync(this.failuresFile)) {
      return; // No failures file exists
    }

    try {
      const failures = JSON.parse(fs.readFileSync(this.failuresFile, 'utf8'));
      
      // Skip if no new failures since last processing
      if (this.lastProcessedTimestamp && failures.timestamp === this.lastProcessedTimestamp) {
        return;
      }

      if (failures.failedTests && failures.failedTests.length > 0) {
        this.log(`🚨 ${failures.failedTests.length} test failures detected`);
        await this.analyzeAndSuggestFixes(failures);
        this.lastProcessedTimestamp = failures.timestamp;
      }
    } catch (error) {
      this.log(`❌ Error reading failures file: ${error.message}`);
    }
  }

  async analyzeAndSuggestFixes(failures) {
    this.isProcessing = true;
    
    const fixSuggestions = [];
    
    for (const test of failures.failedTests) {
      const suggestions = await this.analyzeTestFailure(test);
      if (suggestions.length > 0) {
        fixSuggestions.push({
          testId: test.id,
          testName: test.name,
          error: test.message,
          suggestions: suggestions
        });
      }
    }

    if (fixSuggestions.length > 0) {
      await this.presentFixSuggestions(fixSuggestions, failures.totalFailed);
    }
    
    this.isProcessing = false;
  }

  async analyzeTestFailure(test) {
    const suggestions = [];
    const error = test.message || '';
    const errors = test.errors || [];
    
    // Pattern-based error analysis
    if (error.includes('Element not found') || error.includes('data-testid')) {
      suggestions.push({
        type: 'dom_selector',
        severity: 'medium',
        description: 'Update DOM selector - element may have changed',
        action: 'scan_for_similar_elements',
        autoApplicable: false
      });
    }
    
    if (error.includes('Test function not found') || error.includes('undefined')) {
      suggestions.push({
        type: 'missing_function',
        severity: 'high', 
        description: 'Add missing test function to comprehensive-test-functions.js',
        action: 'create_missing_function',
        autoApplicable: true
      });
    }
    
    if (error.includes('Network') || error.includes('fetch') || error.includes('ECONNREFUSED')) {
      suggestions.push({
        type: 'network_issue',
        severity: 'high',
        description: 'Check server connectivity and restart if needed',
        action: 'restart_server',
        autoApplicable: true
      });
    }
    
    if (error.includes('iframe') || error.includes('postMessage')) {
      suggestions.push({
        type: 'iframe_communication',
        severity: 'medium',
        description: 'Fix iframe communication - check TestBridge setup',
        action: 'verify_test_bridge',
        autoApplicable: false
      });
    }
    
    if (error.includes('AsyncStorage') || error.includes('localStorage')) {
      suggestions.push({
        type: 'storage_issue',
        severity: 'low',
        description: 'Clear storage and retry test',
        action: 'clear_storage',
        autoApplicable: true
      });
    }

    return suggestions;
  }

  async presentFixSuggestions(fixSuggestions, totalFailed) {
    this.log(`\n🔍 ANALYSIS COMPLETE: Found ${fixSuggestions.length} fixable issues out of ${totalFailed} failures`);
    
    // Save detailed fix report
    const reportPath = path.join(this.logsDir, 'auto-fix-suggestions.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalFailures: totalFailed,
      analyzedFailures: fixSuggestions.length,
      suggestions: fixSuggestions,
      needsClaudeAnalysis: true
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`📄 Detailed report saved: ${reportPath}`);
    
    // Create Claude Code integration request
    await this.createClaudeCodeRequest(report);
  }

  async createClaudeCodeRequest(report) {
    this.log(`\n🤖 REQUESTING CLAUDE CODE ANALYSIS...`);
    
    // Create a structured request for Claude Code
    const claudeRequest = {
      type: 'test_failure_analysis',
      timestamp: new Date().toISOString(),
      summary: {
        totalFailures: report.totalFailures,
        analyzedFailures: report.analyzedFailures,
        needsAttention: report.suggestions.length > 0
      },
      context: {
        projectPath: __dirname,
        testDashboard: 'cupido-test-dashboard.html',
        testFunctions: 'comprehensive-test-functions.js',
        logFiles: {
          failures: 'logs/current-failures.json',
          suggestions: 'logs/auto-fix-suggestions.json',
          healer: 'logs/auto-healer.log'
        }
      },
      failures: report.suggestions.map(suggestion => ({
        testId: suggestion.testId,
        testName: suggestion.testName,
        error: suggestion.error,
        category: this.categorizeError(suggestion.error),
        urgency: this.assessUrgency(suggestion.error),
        context: this.gatherTestContext(suggestion.testId)
      })),
      requestedActions: [
        'Analyze test failures for root causes',
        'Suggest specific code fixes',
        'Identify if failures are related (common root cause)',
        'Prioritize fixes by impact and complexity',
        'Provide implementation guidance'
      ]
    };

    // Save the Claude Code request
    const requestPath = path.join(this.logsDir, 'claude-code-request.json');
    fs.writeFileSync(requestPath, JSON.stringify(claudeRequest, null, 2));
    
    this.log(`📝 Claude Code request created: ${requestPath}`);
    this.log(`\n🎯 NEXT STEPS:`);
    this.log(`1. Open Claude Code in this directory`);
    this.log(`2. Share this message with Claude:`);
    this.log(`\n${'='.repeat(60)}`);
    this.log(`🔧 AUTOMATIC TEST FAILURE ANALYSIS REQUEST`);
    this.log(`${'='.repeat(60)}`);
    this.log(`I found ${report.totalFailures} test failures. Please analyze:`);
    this.log(`📁 ${requestPath}`);
    this.log(`\nThe auto-healer has done initial pattern matching, but needs`);
    this.log(`your intelligent analysis to determine proper fixes.`);
    this.log(`\nPlease review the failures and suggest specific code changes.`);
    this.log(`${'='.repeat(60)}`);
  }

  categorizeError(error) {
    if (error.includes('Element not found') || error.includes('data-testid')) return 'DOM_SELECTOR';
    if (error.includes('Test function not found')) return 'MISSING_FUNCTION';
    if (error.includes('Network') || error.includes('fetch')) return 'NETWORK';
    if (error.includes('iframe') || error.includes('postMessage')) return 'IFRAME_COMMUNICATION';
    if (error.includes('AsyncStorage') || error.includes('localStorage')) return 'STORAGE';
    if (error.includes('timeout') || error.includes('Timeout')) return 'TIMEOUT';
    return 'UNKNOWN';
  }

  assessUrgency(error) {
    if (error.includes('Test function not found')) return 'HIGH';
    if (error.includes('Network') || error.includes('ECONNREFUSED')) return 'HIGH';
    if (error.includes('Element not found')) return 'MEDIUM';
    if (error.includes('timeout')) return 'MEDIUM';
    return 'LOW';
  }

  gatherTestContext(testId) {
    // Extract test context based on test ID
    const category = testId.split('-')[0];
    return {
      category,
      relatedFiles: this.getRelatedFiles(category),
      testDescription: this.getTestDescription(testId)
    };
  }

  getRelatedFiles(category) {
    const fileMap = {
      'console': ['comprehensive-test-functions.js', 'cupido-test-dashboard.html'],
      'message': ['src/components/TestBridge.tsx', 'src/components/SimpleReflectionChat.tsx'],
      'profile': ['src/components/ChatReflectionInterface.tsx'],
      'database': ['src/utils/chatDatabase.ts'],
      'api': ['server.js'],
      'simulator': ['server.js', 'chatsim.html']
    };
    return fileMap[category] || [];
  }

  getTestDescription(testId) {
    // This would ideally read from the test metadata
    return `Test ${testId} - see comprehensive-test-functions.js for details`;
  }

  async generateClaudePrompt() {
    const requestPath = path.join(this.logsDir, 'claude-code-request.json');
    
    if (!fs.existsSync(requestPath)) {
      this.log('❌ No Claude Code request found. Run monitor first.');
      return;
    }

    const request = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
    
    this.log(`\n🤖 GENERATING CLAUDE CODE PROMPT...`);
    this.log(`\n${'='.repeat(80)}`);
    this.log(`🔧 AUTOMATIC TEST FAILURE ANALYSIS REQUEST`);
    this.log(`${'='.repeat(80)}`);
    this.log(`\nI found ${request.summary.totalFailures} test failures that need analysis.`);
    this.log(`\n📋 FAILURE SUMMARY:`);
    
    request.failures.forEach((failure, index) => {
      this.log(`\n${index + 1}. ${failure.testId} (${failure.urgency} priority)`);
      this.log(`   Name: ${failure.testName}`);
      this.log(`   Error: ${failure.error}`);
      this.log(`   Category: ${failure.category}`);
      this.log(`   Related files: ${failure.context.relatedFiles.join(', ')}`);
    });
    
    this.log(`\n📁 KEY FILES TO REVIEW:`);
    this.log(`   • ${request.context.logFiles.failures}`);
    this.log(`   • ${request.context.testDashboard}`);
    this.log(`   • ${request.context.testFunctions}`);
    
    this.log(`\n🎯 REQUESTED ANALYSIS:`);
    request.requestedActions.forEach((action, index) => {
      this.log(`   ${index + 1}. ${action}`);
    });
    
    this.log(`\n💡 PLEASE:`);
    this.log(`1. Analyze the root causes of these test failures`);
    this.log(`2. Suggest specific code fixes with implementation details`);
    this.log(`3. Identify any common patterns or shared root causes`);
    this.log(`4. Prioritize fixes by impact and complexity`);
    this.log(`5. Apply the fixes and re-run tests to verify`);
    
    this.log(`\n${'='.repeat(80)}`);
    this.log(`Copy the above message to Claude Code for intelligent analysis.`);
    this.log(`${'='.repeat(80)}`);
  }
}

// CLI interface
if (require.main === module) {
  const healer = new TestAutoHealer();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--monitor')) {
    healer.startPolling();
  } else if (args.includes('--generate-prompt')) {
    healer.generateClaudePrompt();
  } else {
    console.log('Test Auto-Healer - Claude Code Integration');
    console.log('Usage:');
    console.log('  node test-auto-healer.js --monitor          # Start background monitoring');
    console.log('  node test-auto-healer.js --generate-prompt  # Generate Claude Code prompt');
    console.log('');
    console.log('Workflow:');
    console.log('1. Run --monitor to detect failures');
    console.log('2. Run --generate-prompt to get Claude Code analysis request');
    console.log('3. Copy the generated message to Claude Code');
    console.log('4. Claude Code will analyze and suggest fixes');
  }
}

module.exports = TestAutoHealer;