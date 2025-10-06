#!/usr/bin/env node

/**
 * Pre-deployment validation script
 * Checks for common deployment issues before pushing to production
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color output for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

let hasErrors = false;
let hasWarnings = false;

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPassed(check) {
  log(`  ✅ ${check}`, 'green');
}

function checkFailed(check, error) {
  log(`  ❌ ${check}: ${error}`, 'red');
  hasErrors = true;
}

function checkWarning(check, warning) {
  log(`  ⚠️  ${check}: ${warning}`, 'yellow');
  hasWarnings = true;
}

// Check 1: No localhost URLs in production code
function checkForLocalhostUrls() {
  log('\n📡 Checking for hardcoded localhost URLs...', 'cyan');

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

  let foundLocalhost = false;

  for (const file of files) {
    // Skip test files and config files
    if (file.includes('.test.') || file.includes('.spec.') || file.includes('environment.ts')) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for localhost URLs but ignore comments
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        if (line.includes('localhost:') && !line.includes('// Allow localhost')) {
          checkWarning(`Localhost URL found`, `${file}:${index + 1}`);
          foundLocalhost = true;
        }
      }
    });
  }

  if (!foundLocalhost) {
    checkPassed('No hardcoded localhost URLs found');
  }
}

// Check 2: Environment variables are configured
function checkEnvironmentVariables() {
  log('\n🔧 Checking environment variables...', 'cyan');

  const requiredEnvVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_AI_PROXY_URL'
  ];

  const envFile = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envFile)) {
    checkFailed('Environment file', '.env file not found');
    return;
  }

  const envContent = fs.readFileSync(envFile, 'utf-8');
  const missingVars = [];

  requiredEnvVars.forEach(varName => {
    if (!envContent.includes(varName)) {
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    checkFailed('Missing environment variables', missingVars.join(', '));
  } else {
    checkPassed('All required environment variables present');
  }
}

// Check 3: Netlify function exists
function checkNetlifyFunction() {
  log('\n☁️  Checking Netlify function...', 'cyan');

  const functionPath = path.join(process.cwd(), 'netlify/functions/chat.js');

  if (!fs.existsSync(functionPath)) {
    checkFailed('Netlify function', 'chat.js not found in netlify/functions/');
  } else {
    // Check if function has API key configured
    const content = fs.readFileSync(functionPath, 'utf-8');

    if (!content.includes('ANTHROPIC_API_KEY')) {
      checkWarning('Netlify function', 'API key configuration not found');
    } else {
      checkPassed('Netlify function configured correctly');
    }
  }
}

// Check 4: No console.log statements in production
function checkForConsoleLogs() {
  log('\n🔍 Checking for console.log statements...', 'cyan');

  const srcDir = path.join(process.cwd(), 'src');
  const files = getAllFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

  let consoleCount = 0;

  for (const file of files) {
    // Skip test files and debug files
    if (file.includes('.test.') || file.includes('.spec.') || file.includes('debug')) {
      continue;
    }

    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for console.log but ignore comments
      if (!line.trim().startsWith('//') && !line.trim().startsWith('*')) {
        if (line.includes('console.log') && !line.includes('// Production-safe')) {
          consoleCount++;
        }
      }
    });
  }

  if (consoleCount > 0) {
    checkWarning('Console.log statements found', `${consoleCount} occurrences`);
  } else {
    checkPassed('No console.log statements in production code');
  }
}

// Check 5: Build succeeds
function checkBuild() {
  log('\n🔨 Testing production build...', 'cyan');

  try {
    execSync('npm run build:production', { stdio: 'ignore' });
    checkPassed('Production build successful');
  } catch (error) {
    checkFailed('Production build', 'Build failed');
  }
}

// Check 6: Package.json has required scripts
function checkPackageScripts() {
  log('\n📦 Checking package.json scripts...', 'cyan');

  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));

  const requiredScripts = ['build', 'build:production', 'test'];
  const missingScripts = [];

  requiredScripts.forEach(script => {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      missingScripts.push(script);
    }
  });

  if (missingScripts.length > 0) {
    checkWarning('Missing scripts', missingScripts.join(', '));
  } else {
    checkPassed('All required scripts present');
  }
}

// Check 7: API endpoint configuration
function checkApiEndpoints() {
  log('\n🌐 Checking API endpoint configuration...', 'cyan');

  const simpleChatService = path.join(process.cwd(), 'src/services/simpleChatService.ts');

  if (fs.existsSync(simpleChatService)) {
    const content = fs.readFileSync(simpleChatService, 'utf-8');

    if (content.includes('netlify.app')) {
      checkPassed('API endpoint properly configured for production');
    } else {
      checkWarning('API endpoint', 'Production endpoint detection not found');
    }
  } else {
    checkWarning('simpleChatService.ts not found', 'Could not verify API configuration');
  }
}

// Helper function to get all files recursively
function getAllFiles(dirPath, extensions, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        arrayOfFiles = getAllFiles(filePath, extensions, arrayOfFiles);
      }
    } else {
      if (extensions.some(ext => file.endsWith(ext))) {
        arrayOfFiles.push(filePath);
      }
    }
  });

  return arrayOfFiles;
}

// Main validation function
function runValidation() {
  log('\n🚀 DEPLOYMENT VALIDATION', 'blue');
  log('========================', 'blue');

  checkForLocalhostUrls();
  checkEnvironmentVariables();
  checkNetlifyFunction();
  checkForConsoleLogs();
  checkApiEndpoints();
  checkPackageScripts();
  checkBuild();

  log('\n========================', 'blue');

  if (hasErrors) {
    log('❌ VALIDATION FAILED - Fix errors before deploying', 'red');
    process.exit(1);
  } else if (hasWarnings) {
    log('⚠️  VALIDATION PASSED WITH WARNINGS', 'yellow');
    log('Review warnings before deploying to production', 'yellow');
  } else {
    log('✅ VALIDATION PASSED - Ready to deploy!', 'green');
  }

  log('');
}

// Run validation
runValidation();