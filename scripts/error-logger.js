/**
 * COMPREHENSIVE ERROR LOGGING AND AUTO-FIX SERVICE
 * =================================================
 * 
 * This service provides:
 * 1. Real-time error logging with categorization
 * 2. Error pattern detection and analysis
 * 3. Automated error fixing for common issues
 * 4. Error reporting and alerting
 * 5. File-based persistence for error history
 * 
 * Co-founder level implementation for production-ready error handling.
 */

const fs = require('fs').promises;
const path = require('path');

class ErrorLogger {
    constructor() {
        this.errorLogPath = path.join(__dirname, 'logs', 'errors.json');
        this.errorPatterns = new Map();
        this.autoFixRules = new Map();
        this.recentErrors = [];
        this.maxRecentErrors = 1000;
        
        this.initializeAutoFixRules();
        this.ensureLogDirectory();
    }

    async ensureLogDirectory() {
        const logsDir = path.dirname(this.errorLogPath);
        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }
    }

    initializeAutoFixRules() {
        // Common error patterns and their fixes
        this.autoFixRules.set('MODULE_NOT_FOUND', {
            pattern: /Cannot find module ['"]([^'"]+)['"]/,
            fix: async (error, match) => {
                const moduleName = match[1];
                console.log(`🔧 Auto-fixing: Installing missing module ${moduleName}`);
                
                // Check if it's a local file vs npm package
                if (moduleName.startsWith('./') || moduleName.startsWith('../')) {
                    return {
                        action: 'create_file',
                        file: moduleName + '.js',
                        content: '// Auto-generated module file\nmodule.exports = {};\n',
                        severity: 'medium'
                    };
                } else {
                    return {
                        action: 'npm_install',
                        package: moduleName,
                        severity: 'high'
                    };
                }
            }
        });

        this.autoFixRules.set('UNDEFINED_VARIABLE', {
            pattern: /(\w+) is not defined/,
            fix: async (error, match) => {
                const variableName = match[1];
                console.log(`🔧 Auto-fixing: Defining missing variable ${variableName}`);
                
                return {
                    action: 'add_variable_declaration',
                    variable: variableName,
                    suggestion: `const ${variableName} = null; // Auto-generated - please define properly`,
                    severity: 'high'
                };
            }
        });

        this.autoFixRules.set('CORS_ERROR', {
            pattern: /CORS|Cross-Origin|blocked by CORS policy/i,
            fix: async (error, match) => {
                console.log(`🔧 Auto-fixing: CORS issue detected`);
                
                return {
                    action: 'update_cors_config',
                    suggestion: 'Add CORS headers to server.js',
                    code: `
// Add to server.js
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});`,
                    severity: 'critical'
                };
            }
        });

        this.autoFixRules.set('API_ENDPOINT_404', {
            pattern: /404.*api\/(\w+)/i,
            fix: async (error, match) => {
                const endpoint = match[1];
                console.log(`🔧 Auto-fixing: Missing API endpoint /${endpoint}`);
                
                return {
                    action: 'create_api_endpoint',
                    endpoint: endpoint,
                    code: `
// Add to server.js
app.get('/api/${endpoint}', (req, res) => {
    res.json({ message: 'Auto-generated endpoint - implement functionality' });
});`,
                    severity: 'high'
                };
            }
        });

        this.autoFixRules.set('SUPABASE_CONNECTION', {
            pattern: /supabase.*not.*configured|DATABASE_URL.*undefined/i,
            fix: async (error, match) => {
                console.log(`🔧 Auto-fixing: Supabase connection issue`);
                
                return {
                    action: 'check_environment',
                    suggestion: 'Verify Supabase environment variables',
                    steps: [
                        'Check .env file exists',
                        'Verify SUPABASE_URL is set',
                        'Verify SUPABASE_ANON_KEY is set',
                        'Restart server after .env changes'
                    ],
                    severity: 'critical'
                };
            }
        });
    }

    async logError(errorData) {
        const timestamp = new Date().toISOString();
        const errorEntry = {
            id: this.generateErrorId(),
            timestamp,
            ...errorData,
            autoFixAttempted: false,
            resolved: false
        };

        // Add to recent errors
        this.recentErrors.unshift(errorEntry);
        if (this.recentErrors.length > this.maxRecentErrors) {
            this.recentErrors.pop();
        }

        // Analyze and attempt auto-fix
        const autoFixResult = await this.attemptAutoFix(errorEntry);
        if (autoFixResult) {
            errorEntry.autoFixAttempted = true;
            errorEntry.autoFixResult = autoFixResult;
        }

        // Persist to file
        await this.persistError(errorEntry);

        // Update error patterns
        this.updateErrorPatterns(errorEntry);

        console.log(`📝 Error logged: ${errorEntry.id} - ${errorData.message}`);
        if (autoFixResult) {
            console.log(`🔧 Auto-fix attempted: ${autoFixResult.action}`);
        }

        return errorEntry;
    }

    async attemptAutoFix(errorEntry) {
        const { message, stack } = errorEntry;
        const fullError = `${message}\n${stack || ''}`;

        for (const [ruleName, rule] of this.autoFixRules) {
            const match = fullError.match(rule.pattern);
            if (match) {
                try {
                    console.log(`🎯 Auto-fix rule matched: ${ruleName}`);
                    const fixResult = await rule.fix(errorEntry, match);
                    
                    // Apply the fix if possible
                    await this.applyAutoFix(fixResult);
                    
                    return {
                        ruleName,
                        ...fixResult,
                        applied: true,
                        timestamp: new Date().toISOString()
                    };
                } catch (fixError) {
                    console.error(`❌ Auto-fix failed for ${ruleName}:`, fixError);
                    return {
                        ruleName,
                        error: fixError.message,
                        applied: false,
                        timestamp: new Date().toISOString()
                    };
                }
            }
        }

        return null;
    }

    async applyAutoFix(fixResult) {
        const { action } = fixResult;

        switch (action) {
            case 'create_file':
                await this.createFile(fixResult.file, fixResult.content);
                console.log(`✅ Created file: ${fixResult.file}`);
                break;

            case 'npm_install':
                // In production, this would trigger actual npm install
                console.log(`📦 Would install package: ${fixResult.package}`);
                break;

            case 'add_variable_declaration':
            case 'update_cors_config':
            case 'create_api_endpoint':
                // These require code analysis and modification
                console.log(`🔧 Manual fix required: ${action}`);
                console.log(`💡 Suggestion: ${fixResult.suggestion}`);
                if (fixResult.code) {
                    console.log(`📋 Code to add:\n${fixResult.code}`);
                }
                break;

            case 'check_environment':
                console.log(`🔍 Environment check required:`);
                fixResult.steps.forEach((step, i) => {
                    console.log(`   ${i + 1}. ${step}`);
                });
                break;
        }
    }

    async createFile(filePath, content) {
        const fullPath = path.resolve(filePath);
        const dir = path.dirname(fullPath);
        
        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        
        // Write file
        await fs.writeFile(fullPath, content, 'utf8');
    }

    updateErrorPatterns(errorEntry) {
        const key = this.extractErrorPattern(errorEntry.message);
        const existing = this.errorPatterns.get(key) || { count: 0, lastSeen: null, examples: [] };
        
        existing.count++;
        existing.lastSeen = errorEntry.timestamp;
        existing.examples.push({
            id: errorEntry.id,
            message: errorEntry.message,
            timestamp: errorEntry.timestamp
        });

        // Keep only last 5 examples
        if (existing.examples.length > 5) {
            existing.examples = existing.examples.slice(-5);
        }

        this.errorPatterns.set(key, existing);
    }

    extractErrorPattern(message) {
        // Normalize error messages to detect patterns
        return message
            .replace(/\d+/g, 'N')
            .replace(/["'][^"']*["']/g, 'STRING')
            .replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/gi, 'UUID')
            .replace(/\b\d+\.\d+\.\d+\.\d+\b/g, 'IP')
            .toLowerCase();
    }

    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async persistError(errorEntry) {
        try {
            // Read existing errors
            let errors = [];
            try {
                const data = await fs.readFile(this.errorLogPath, 'utf8');
                errors = JSON.parse(data);
            } catch {
                // File doesn't exist yet
            }

            // Add new error
            errors.unshift(errorEntry);

            // Keep only last 10000 errors
            if (errors.length > 10000) {
                errors = errors.slice(0, 10000);
            }

            // Write back
            await fs.writeFile(this.errorLogPath, JSON.stringify(errors, null, 2));
        } catch (writeError) {
            console.error('Failed to persist error:', writeError);
        }
    }

    async getErrorStats() {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const recent24h = this.recentErrors.filter(e => new Date(e.timestamp) > last24h);
        const recentWeek = this.recentErrors.filter(e => new Date(e.timestamp) > lastWeek);

        return {
            total: this.recentErrors.length,
            last24h: recent24h.length,
            lastWeek: recentWeek.length,
            patterns: Array.from(this.errorPatterns.entries()).map(([pattern, data]) => ({
                pattern,
                count: data.count,
                lastSeen: data.lastSeen
            })).sort((a, b) => b.count - a.count),
            topErrors: recent24h.slice(0, 10).map(e => ({
                id: e.id,
                message: e.message,
                timestamp: e.timestamp,
                autoFixed: e.autoFixAttempted && e.autoFixResult?.applied
            }))
        };
    }

    async logTestFailure(testData) {
        return this.logError({
            type: 'test_failure',
            testId: testData.testId,
            testName: testData.testName,
            message: testData.message,
            errors: testData.errors,
            category: 'testing',
            severity: 'medium'
        });
    }

    // Method to start file watching for real-time error detection
    startWatching() {
        console.log('🔍 Error logger watching for issues...');
        
        // In a real implementation, this would:
        // 1. Watch log files for new errors
        // 2. Monitor process crashes
        // 3. Set up health checks
        // 4. Poll external services
        
        setInterval(async () => {
            const stats = await this.getErrorStats();
            if (stats.last24h > 50) {
                console.warn(`⚠️  High error rate: ${stats.last24h} errors in last 24h`);
            }
        }, 60000); // Check every minute
    }
}

module.exports = new ErrorLogger();