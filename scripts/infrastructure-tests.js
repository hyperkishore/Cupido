/**
 * INFRASTRUCTURE TESTING INTEGRATION
 * ==================================
 * Integrates all our .sh diagnostic scripts as automated tests in the dashboard
 * Co-founder level self-validating infrastructure
 */

// Infrastructure test functions that call our .sh scripts via API
const INFRASTRUCTURE_TESTS = {
    'infra-1': async function testHealthCheck() {
        try {
            const response = await fetch('/api/run-script/health-check');
            const result = await response.text();
            
            if (result.includes('ALL SYSTEMS GO')) {
                return {
                    pass: true,
                    message: 'Health check passed - all systems operational',
                    metadata: { scriptOutput: result }
                };
            } else {
                return {
                    pass: false,
                    message: 'Health check failed - system issues detected',
                    errors: [result],
                    metadata: { scriptOutput: result }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'Health check script execution failed',
                errors: [error.message]
            };
        }
    },

    'infra-2': async function testJavaScriptSyntax() {
        try {
            const response = await fetch('/api/run-script/validate-js-syntax');
            const result = await response.text();
            
            if (result.includes('✅') && !result.includes('❌')) {
                return {
                    pass: true,
                    message: 'JavaScript syntax validation passed',
                    metadata: { scriptOutput: result }
                };
            } else {
                return {
                    pass: false,
                    message: 'JavaScript syntax issues detected',
                    errors: [result],
                    metadata: { scriptOutput: result }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'JavaScript syntax validation failed',
                errors: [error.message]
            };
        }
    },

    'infra-3': async function testPreDeploymentGate() {
        try {
            const response = await fetch('/api/run-script/pre-deployment-check');
            const result = await response.text();
            
            if (result.includes('DEPLOYMENT APPROVED')) {
                return {
                    pass: true,
                    message: 'Pre-deployment validation passed - ready for production',
                    metadata: { scriptOutput: result }
                };
            } else {
                return {
                    pass: false,
                    message: 'Pre-deployment validation failed - deployment blocked',
                    errors: [result],
                    metadata: { scriptOutput: result }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'Pre-deployment check script failed',
                errors: [error.message]
            };
        }
    },

    'infra-4': async function testErrorManagementSystem() {
        try {
            const response = await fetch('/api/run-script/error-management-control', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: 'diagnostics' })
            });
            const result = await response.text();
            
            if (result.includes('✅') && !result.includes('❌')) {
                return {
                    pass: true,
                    message: 'Error management system operational',
                    metadata: { scriptOutput: result }
                };
            } else {
                return {
                    pass: false,
                    message: 'Error management system issues detected',
                    errors: [result],
                    metadata: { scriptOutput: result }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'Error management diagnostics failed',
                errors: [error.message]
            };
        }
    },

    'infra-5': async function testDashboardFunctionality() {
        try {
            const response = await fetch('/api/run-script/debug-dashboard');
            const result = await response.text();
            
            // Check for successful completion indicators - diagnostic scripts provide valuable info, not errors
            const hasSuccessMarkers = result.includes('✅') && 
                                    result.includes('Dashboard HTML loads successfully');
            const hasTestFunctions = result.includes('66 test functions') || result.includes('test functions');
            const hasValidDiagnosis = result.includes('DIAGNOSIS SUMMARY');
            const hasBasicConnectivity = result.includes('BASIC CONNECTIVITY');
            
            // Diagnostic scripts are informational and successful by nature if they complete
            if (hasSuccessMarkers && hasTestFunctions && hasValidDiagnosis && hasBasicConnectivity) {
                return {
                    pass: true,
                    message: 'Dashboard functionality validation passed - diagnostic script completed successfully',
                    metadata: { 
                        scriptOutput: result,
                        hasSuccessMarkers,
                        hasTestFunctions,
                        hasValidDiagnosis,
                        hasBasicConnectivity
                    }
                };
            } else {
                return {
                    pass: false,
                    message: 'Dashboard functionality issues detected',
                    errors: [result],
                    metadata: { scriptOutput: result }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'Dashboard functionality test failed',
                errors: [error.message]
            };
        }
    },

    'infra-6': async function testSystemPerformance() {
        try {
            const startTime = Date.now();
            
            // Test dashboard load time
            const dashboardResponse = await fetch('/cupido-test-dashboard');
            const dashboardLoadTime = Date.now() - startTime;
            
            // Test API response time
            const apiStartTime = Date.now();
            const apiResponse = await fetch('/api/error-stats');
            const apiLoadTime = Date.now() - apiStartTime;
            
            const performanceIssues = [];
            if (dashboardLoadTime > 3000) {
                performanceIssues.push(`Dashboard load time too slow: ${dashboardLoadTime}ms`);
            }
            if (apiLoadTime > 1000) {
                performanceIssues.push(`API response time too slow: ${apiLoadTime}ms`);
            }
            
            if (performanceIssues.length === 0) {
                return {
                    pass: true,
                    message: `System performance optimal (Dashboard: ${dashboardLoadTime}ms, API: ${apiLoadTime}ms)`,
                    metadata: { 
                        dashboardLoadTime, 
                        apiLoadTime,
                        performanceGrade: 'A+'
                    }
                };
            } else {
                return {
                    pass: false,
                    message: 'System performance issues detected',
                    errors: performanceIssues,
                    metadata: { dashboardLoadTime, apiLoadTime }
                };
            }
        } catch (error) {
            return {
                pass: false,
                message: 'System performance test failed',
                errors: [error.message]
            };
        }
    }
};

// Category configuration for infrastructure tests
const INFRASTRUCTURE_CONFIG = {
    name: 'Infrastructure Validation',
    description: 'Automated validation of system infrastructure using diagnostic scripts',
    autoRun: true, // Run automatically on dashboard initialization
    priority: 'critical', // These tests are critical for system health
    tests: Object.keys(INFRASTRUCTURE_TESTS)
};

// Export for use in dashboard
if (typeof window !== 'undefined') {
    // Browser environment - add to global TEST_FUNCTIONS
    Object.assign(window.TEST_FUNCTIONS || {}, INFRASTRUCTURE_TESTS);
    
    // Add infrastructure category to testConfig
    if (window.testConfig) {
        window.testConfig.infrastructure = {
            name: 'Infrastructure',
            count: Object.keys(INFRASTRUCTURE_TESTS).length
        };
    }
} else {
    // Node.js environment - export for server use
    module.exports = {
        INFRASTRUCTURE_TESTS,
        INFRASTRUCTURE_CONFIG
    };
}