const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Custom prompts file path
const CUSTOM_PROMPTS_FILE = path.join(__dirname, 'custom-prompts.json');
const DELETED_PROMPTS_FILE = path.join(__dirname, 'deleted-prompts.json');
const { createProxyMiddleware } = require('http-proxy-middleware');

// ============================================
// ENVIRONMENT LOADING WITH VALIDATION
// ============================================
// Load .env file BEFORE anything else
require('dotenv').config();

console.log('\n' + '='.repeat(80));
console.log('🔧 SERVER STARTUP - ENVIRONMENT VALIDATION');
console.log('='.repeat(80));

// Log environment loading status
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file found at:', envPath);
} else {
  console.error('✗ .env file NOT FOUND at:', envPath);
}

// Ensure fetch is available in the Node runtime (Node < 18 support)
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

const app = express();
const PORT = Number(process.env.AI_PROXY_PORT || 3001);
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';

// ============================================
// API KEY VALIDATION - FAIL FAST
// ============================================
console.log('\n📋 Environment Variables Status:');
console.log('-'.repeat(80));
console.log(`PORT: ${PORT}`);
console.log(`ANTHROPIC_API_KEY: ${CLAUDE_API_KEY ? '✓ LOADED (length: ' + CLAUDE_API_KEY.length + ', starts with: ' + CLAUDE_API_KEY.substring(0, 15) + '...)' : '✗ NOT LOADED'}`);
console.log(`CLAUDE_API_URL: ${CLAUDE_API_URL}`);
console.log('-'.repeat(80));

if (!CLAUDE_API_KEY) {
  console.error('\n' + '⚠️ '.repeat(40));
  console.error('❌ CRITICAL ERROR: ANTHROPIC_API_KEY is not set!');
  console.error('⚠️ '.repeat(40));
  console.error('\nThe server will NOT function properly without the API key.');
  console.error('All API requests will return canned/fallback responses.');
  console.error('\nTo fix this issue:');
  console.error('1. Verify .env file exists and contains ANTHROPIC_API_KEY');
  console.error('2. Restart the server using: node server.js');
  console.error('3. Check the startup logs to confirm the key is loaded');
  console.error('\n' + '⚠️ '.repeat(40) + '\n');

  // DO NOT exit - let it run but warn heavily
  // This allows health checks to report the issue
} else {
  console.log('\n✅ API KEY VALIDATION PASSED');
  console.log('✓ ANTHROPIC_API_KEY is properly loaded and ready to use\n');
}

// Enable CORS for all routes
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : true,
}));
// Increase body size limit to 50MB to handle large conversation histories
app.use(express.json({ limit: '50mb' }));

// ============================================
// API ROUTES (must come before proxy middlewares)
// ============================================

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    target: CLAUDE_API_URL,
    hasApiKey: Boolean(CLAUDE_API_KEY),
  });
});

// Claude API proxy endpoint
app.post('/api/chat', async (req, res) => {
  try {
    console.log('🔥 PROXY REQUEST RECEIVED!');

    if (!req.body) {
      console.error('Request body is undefined');
      return res.status(400).json({ error: 'Invalid request body', fallback: true });
    }

    console.log('Body keys:', Object.keys(req.body));

    const { messages, modelType = 'sonnet', imageData, systemPrompt } = req.body;

    // Validate messages array
    if (!messages || !Array.isArray(messages)) {
      console.error('❌ Invalid messages array:', messages);
      return res.status(400).json({
        error: 'Messages must be an array',
        fallback: true,
        message: "I'm having trouble understanding. Could you try again?"
      });
    }

    console.log(`🤖 Proxying to Claude ${modelType.toUpperCase()}`);

    // Claude API configuration
    if (!CLAUDE_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    // Convert messages format for Anthropic
    // Support both systemPrompt parameter (from dashboard simulator) and system role in messages
    const systemMessage = systemPrompt || messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Always use Claude Sonnet 4.5 for consistent high-quality responses
    // Claude 4 models are more concise and better at following instructions
    const modelMap = {
      'sonnet': 'claude-sonnet-4-5-20250929'   // Claude 4.5 Sonnet only
    };

    // Use Sonnet model with fallback for any unrecognized modelType
    const selectedModel = modelMap[modelType] || modelMap['sonnet'];

    // Token limit for complete responses (dating profiles, advice, etc.)
    const maxTokens = 800;  // Allows full responses without truncation

    // ============================================
    // PROMPT CACHING - Dynamic Fresh Window
    // ============================================
    // Calculate optimal fresh window based on conversation length
    const totalMessages = conversationMessages.length;
    let freshWindow;
    if (totalMessages < 100) freshWindow = 50;        // Small convos: more context
    else if (totalMessages < 500) freshWindow = 30;   // Medium: balanced
    else if (totalMessages < 1000) freshWindow = 20;  // Large: efficiency
    else freshWindow = 15;                            // Very long: maximum efficiency

    console.log(`📊 Conversation: ${totalMessages} messages, fresh window: ${freshWindow}`);

    // Process messages - handle both text and images with caching
    const processedMessages = conversationMessages.map((msg, index) => {
      const isCacheBreakpoint = index === totalMessages - freshWindow - 1;

      // Check if this message should have image data attached
      if (msg.role === 'user' && imageData && msg.includeImage) {
        // Claude expects images as part of content array
        const contentBlocks = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mimeType || 'image/jpeg',
              data: imageData.base64
            }
          },
          {
            type: 'text',
            text: msg.content
          }
        ];

        // Add cache_control to last content block if at breakpoint
        if (isCacheBreakpoint) {
          contentBlocks[contentBlocks.length - 1].cache_control = { type: 'ephemeral' };
        }

        return {
          role: 'user',
          content: contentBlocks
        };
      }

      // Regular text message
      const message = {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      };

      // Add cache_control at breakpoint (cache all messages BEFORE this)
      if (isCacheBreakpoint) {
        console.log(`🔖 Cache breakpoint at message ${index + 1}/${totalMessages} (caching ${index + 1} messages)`);
        message.content = [
          {
            type: 'text',
            text: msg.content,
            cache_control: { type: 'ephemeral' }
          }
        ];
      }

      return message;
    });

    // Prepare system message with caching (only if not empty)
    const systemBlocks = systemMessage
      ? [
          {
            type: 'text',
            text: systemMessage,
            cache_control: { type: 'ephemeral' }  // Always cache system prompt
          }
        ]
      : undefined;  // Don't send empty system blocks

    const requestBody = {
      model: selectedModel,
      max_tokens: maxTokens,
      system: systemBlocks,  // Use structured format with cache_control
      messages: processedMessages
    };

    console.log(`Calling ${selectedModel} with ${maxTokens} max tokens (caching enabled)`);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
        // Note: No beta header needed - prompt caching is GA since Dec 2024
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error ${response.status}:`, errorText);
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();

    // ============================================
    // CACHE PERFORMANCE MONITORING
    // ============================================
    const usage = data.usage || {};
    const cacheStats = {
      inputTokens: usage.input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      outputTokens: usage.output_tokens || 0
    };

    const cacheHitRate = cacheStats.inputTokens > 0
      ? ((cacheStats.cacheReadTokens / (cacheStats.inputTokens + cacheStats.cacheReadTokens)) * 100).toFixed(1)
      : 0;

    console.log(`💰 Token Usage:
    - Input: ${cacheStats.inputTokens}
    - Cache Read: ${cacheStats.cacheReadTokens} (${cacheHitRate}% hit rate)
    - Cache Creation: ${cacheStats.cacheCreationTokens}
    - Output: ${cacheStats.outputTokens}`);

    // Calculate cost savings
    const normalCost = (cacheStats.inputTokens + cacheStats.cacheReadTokens) * 0.30 / 1000000; // $0.30/MTok
    const cachedCost = (cacheStats.inputTokens * 0.30 + cacheStats.cacheReadTokens * 0.03 + cacheStats.cacheCreationTokens * 0.375) / 1000000;
    const savings = normalCost - cachedCost;
    const savingsPercent = normalCost > 0 ? ((savings / normalCost) * 100).toFixed(1) : 0;

    console.log(`💵 Cost: $${cachedCost.toFixed(4)} (saved $${savings.toFixed(4)} / ${savingsPercent}% vs no cache)`);

    // Harden response parsing
    let aiResponse = 'Sorry, I had trouble processing that. What else is on your mind?';

    if (data && data.content && Array.isArray(data.content)) {
      // Handle different content types from Claude
      const textBlocks = data.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        aiResponse = textBlocks.map(block => block.text).join(' ');
      }
    }

    console.log(`✅ Claude response: ${aiResponse.substring(0, 100)}...`);

    res.json({
      message: aiResponse,
      usedModel: modelType,
      cacheStats  // Include cache stats in response for monitoring
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      fallback: true
    });
  }
});

// Profile extraction endpoint - uses Haiku for cost efficiency
app.post('/api/extract-profile', async (req, res) => {
  try {
    console.log('👤 PROFILE EXTRACTION REQUEST');

    if (!req.body || !req.body.message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const { message } = req.body;

    if (!CLAUDE_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }

    // Load extraction prompt from Supabase (enhanced 23-field version)
    let extractionPrompt = '';
    let systemPrompt = 'You extract profile data and return only valid JSON. No explanations.';

    if (supabase) {
      try {
        const { data: promptData, error: promptError } = await supabase
          .from('prompt_versions')
          .select('system_prompt')
          .eq('prompt_id', 'profile_extraction_enhanced_v1')
          .order('major_version', { ascending: false })
          .order('minor_version', { ascending: false })
          .order('patch_version', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (promptData && promptData.system_prompt) {
          // Replace placeholder with actual user message
          extractionPrompt = promptData.system_prompt.replace('{{USER_MESSAGE}}', message);
          console.log('✅ Loaded enhanced extraction prompt from Supabase (23 fields)');
        } else {
          console.warn('⚠️ Enhanced prompt not found, using fallback');
          // Fallback to basic extraction if prompt not found
          extractionPrompt = `Extract profile data from: "${message}"\nReturn only valid JSON.`;
        }
      } catch (error) {
        console.error('Error loading extraction prompt:', error);
        // Use fallback prompt
        extractionPrompt = `Extract profile data from: "${message}"\nReturn only valid JSON.`;
      }
    } else {
      // Supabase not available - use fallback
      console.warn('⚠️ Supabase not configured, using basic extraction');
      extractionPrompt = `Extract profile data from: "${message}"\nReturn only valid JSON.`;
    }

    const requestBody = {
      model: 'claude-3-5-haiku-20241022',  // Haiku - fast and cheap
      max_tokens: 300,  // Increased for 23-field extraction
      system: [
        {
          type: 'text',
          text: systemPrompt
        }
      ],
      messages: [
        {
          role: 'user',
          content: extractionPrompt
        }
      ]
    };

    console.log('Calling Haiku for profile extraction');

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Anthropic API error ${response.status}:`, errorText);
      // Return empty object on error - profile extraction is non-critical
      return res.json({ extracted: {} });
    }

    const data = await response.json();

    // Parse response
    let aiResponse = '{}';
    if (data && data.content && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        aiResponse = textBlocks.map(block => block.text).join(' ');
      }
    }

    console.log(`✅ Haiku extraction response: ${aiResponse.substring(0, 100)}...`);

    res.json({
      message: aiResponse,
      extracted: aiResponse  // Return raw text for client-side parsing
    });

  } catch (error) {
    console.error('Profile extraction error:', error);
    // Return empty object - profile extraction failures shouldn't block the app
    res.json({ extracted: {} });
  }
});

// Error logger integration
const errorLogger = require('./error-logger');

// Start error logger file watcher
errorLogger.startWatching();

// Test results storage (in-memory for simplicity)
let latestTestResults = null;
const testResultsHistory = [];
const MAX_HISTORY = 50;

// File-based test logging
function saveTestResultsToFile(testResults) {
  try {
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `test-run-${timestamp}.json`;
    const filepath = path.join(logsDir, filename);
    
    // Save individual test run
    fs.writeFileSync(filepath, JSON.stringify(testResults, null, 2));
    
    // Update latest.json symlink
    const latestPath = path.join(logsDir, 'latest-test-run.json');
    if (fs.existsSync(latestPath)) {
      fs.unlinkSync(latestPath);
    }
    fs.writeFileSync(latestPath, JSON.stringify(testResults, null, 2));
    
    // Update failed tests summary
    const failedTests = testResults.tests ? testResults.tests.filter(t => t.status === 'fail') : [];
    if (failedTests.length > 0) {
      const failedSummary = {
        timestamp: testResults.receivedAt,
        runId: testResults.id,
        totalFailed: failedTests.length,
        totalTests: testResults.summary?.total || 0,
        failedTests: failedTests.map(t => ({
          id: t.id,
          name: t.name,
          message: t.message,
          errors: t.errors || []
        }))
      };
      
      const failedPath = path.join(logsDir, 'current-failures.json');
      fs.writeFileSync(failedPath, JSON.stringify(failedSummary, null, 2));
    }
    
    console.log(`💾 Test results saved to: ${filename}`);
  } catch (error) {
    console.error('Failed to save test results to file:', error);
  }
}

// POST endpoint to receive test results from dashboard
app.post('/api/test-results', (req, res) => {
  try {
    const testResults = req.body;
    latestTestResults = {
      ...testResults,
      receivedAt: new Date().toISOString()
    };

    // Add to history
    testResultsHistory.unshift(latestTestResults);
    if (testResultsHistory.length > MAX_HISTORY) {
      testResultsHistory.pop();
    }

    console.log(`📊 Test results received: ${testResults.summary?.passed}/${testResults.summary?.total} passed`);

    // Save to file system for persistence
    saveTestResultsToFile(latestTestResults);

    res.json({ success: true, message: 'Test results saved' });
  } catch (error) {
    console.error('Error saving test results:', error);
    res.status(500).json({ error: 'Failed to save test results' });
  }
});

// GET endpoint to retrieve latest test results
app.get('/api/test-results/latest', (req, res) => {
  if (!latestTestResults) {
    return res.status(404).json({ error: 'No test results available yet' });
  }
  res.json(latestTestResults);
});

// GET endpoint to retrieve test results history
app.get('/api/test-results/history', (req, res) => {
  res.json({
    history: testResultsHistory,
    count: testResultsHistory.length
  });
});

// GET endpoint to retrieve current failures from file
app.get('/api/test-results/failures', (req, res) => {
  try {
    const failedPath = path.join(__dirname, 'logs', 'current-failures.json');
    if (fs.existsSync(failedPath)) {
      const failedData = JSON.parse(fs.readFileSync(failedPath, 'utf8'));
      res.json(failedData);
    } else {
      res.json({ message: 'No current failures', failedTests: [] });
    }
  } catch (error) {
    console.error('Error reading failures file:', error);
    res.status(500).json({ error: 'Failed to read failures file' });
  }
});

// ============================================
// ERROR LOGGING ENDPOINTS
// ============================================

// POST endpoint to log console errors
app.post('/api/log-error', (req, res) => {
  try {
    const result = errorLogger.logError(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error logging error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
});

// POST endpoint to log test failures
app.post('/api/log-test-failure', (req, res) => {
  try {
    const result = errorLogger.logTestFailure(req.body);
    res.json(result);
  } catch (error) {
    console.error('Error logging test failure:', error);
    res.status(500).json({ error: 'Failed to log test failure' });
  }
});

// GET endpoint to retrieve error statistics
app.get('/api/error-stats', async (req, res) => {
  try {
    const stats = await errorLogger.getErrorStats();
    res.json(stats);
  } catch (error) {
    console.error('Error retrieving error stats:', error);
    res.status(500).json({ error: 'Failed to retrieve error stats' });
  }
});

// Ping service endpoint for health checking
app.get('/api/ping-service/:port', async (req, res) => {
  const port = parseInt(req.params.port);
  
  if (!port || port < 1 || port > 65535) {
    return res.json({ 
      success: false, 
      message: 'Invalid port number' 
    });
  }

  try {
    // Import fetch dynamically for compatibility
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    const response = await fetch(`http://localhost:${port}/`, {
      method: 'HEAD',
      timeout: 5000
    });
    
    res.json({
      success: response.ok,
      message: response.ok 
        ? `Service responding on port ${port}` 
        : `Service returned ${response.status} on port ${port}`
    });
  } catch (error) {
    res.json({
      success: false,
      message: `Connection failed to port ${port}: ${error.message}`
    });
  }
});

// ============================================
// INFRASTRUCTURE TESTING ENDPOINTS
// ============================================

// System health check endpoint - consolidated script
app.get('/api/run-script/system-health', (req, res) => {
  const { exec } = require('child_process');
  exec('./system-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Development environment health endpoint - consolidated script
app.get('/api/run-script/development-health', (req, res) => {
  const { exec } = require('child_process');
  exec('./development-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Testing infrastructure health endpoint - consolidated script
app.get('/api/run-script/testing-health', (req, res) => {
  const { exec } = require('child_process');
  exec('./testing-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Legacy endpoints (maintained for backward compatibility)
// Health check script endpoint (redirects to system-health)
app.get('/api/run-script/health-check', (req, res) => {
  const { exec } = require('child_process');
  exec('./system-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// JavaScript syntax validation script endpoint (redirects to development-health)
app.get('/api/run-script/validate-js-syntax', (req, res) => {
  const { exec } = require('child_process');
  exec('./development-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Pre-deployment check script endpoint (redirects to system-health)
app.get('/api/run-script/pre-deployment-check', (req, res) => {
  const { exec } = require('child_process');
  exec('./system-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Dashboard debug script endpoint (redirects to development-health)
app.get('/api/run-script/debug-dashboard', (req, res) => {
  const { exec } = require('child_process');
  exec('./development-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Error management control script endpoint (redirects to system-health)
app.post('/api/run-script/error-management-control', (req, res) => {
  const { exec } = require('child_process');
  exec('./system-health.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// Additional script endpoints
app.get('/api/run-script/deploy', (req, res) => {
  const { exec } = require('child_process');
  exec('./deploy.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/version-control', (req, res) => {
  const { exec } = require('child_process');
  const action = req.query.action || 'help';
  const comment = req.query.comment || '';
  exec(`./version-control.sh ${action} "${comment}"`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/install-claude-hooks', (req, res) => {
  const { exec } = require('child_process');
  exec('./install-claude-hooks.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/setup-context-automation', (req, res) => {
  const { exec } = require('child_process');
  exec('./setup-context-automation.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/continuous-monitor', (req, res) => {
  const { exec } = require('child_process');
  
  // Set environment variables for Scripts tab execution
  const env = {
    ...process.env,
    CUPIDO_SCRIPT_TAB_MODE: 'true',
    CUPIDO_MAX_ITERATIONS: '2'
  };
  
  exec('./continuous-monitor.sh', { env }, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/debug-browser-reality', (req, res) => {
  const { exec } = require('child_process');
  exec('./debug-browser-reality.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/auto-test-reflect', (req, res) => {
  const { exec } = require('child_process');
  exec('./auto-test-reflect.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/dev-server', (req, res) => {
  const { exec } = require('child_process');
  exec('./dev-server.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/init', (req, res) => {
  const { exec } = require('child_process');
  exec('./init.sh', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// JavaScript utility script endpoints
app.get('/api/run-script/analyze-supabase-data', (req, res) => {
  const { exec } = require('child_process');
  exec('node analyze-supabase-data.js', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/test-simulator', (req, res) => {
  const { exec } = require('child_process');
  exec('node test-simulator.js', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/import-prompts', (req, res) => {
  const { exec } = require('child_process');
  exec('node import-prompts.js', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/check-supabase-schema', (req, res) => {
  const { exec } = require('child_process');
  exec('node check-supabase-schema.js', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/session-logger', (req, res) => {
  const { exec } = require('child_process');
  const action = req.query.action || 'status';
  exec(`node session-logger.js ${action}`, (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

app.get('/api/run-script/auto-init', (req, res) => {
  const { exec } = require('child_process');
  exec('node auto-init.js', (error, stdout, stderr) => {
    if (error) {
      res.status(500).send(`Script error: ${error.message}\n${stderr}`);
      return;
    }
    res.send(stdout);
  });
});

// ============================================
// PROMPT MANAGEMENT ENDPOINTS
// ============================================

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// Initialize Supabase client with SSL fix for Node.js v22
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  try {
    // Create custom fetch with proper SSL handling
    const nodeFetch = require('node-fetch');
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // Temporarily allow self-signed certs
    });

    const customFetch = (url, options = {}) => {
      return nodeFetch(url, {
        ...options,
        agent: url.startsWith('https') ? httpsAgent : undefined
      });
    };

    supabase = createClient(supabaseUrl, supabaseKey, {
      global: { fetch: customFetch }
    });
    console.log('✅ Supabase initialized with node-fetch + SSL agent');
  } catch (fetchError) {
    console.warn('⚠️ node-fetch not available:', fetchError.message);
    supabase = createClient(supabaseUrl, supabaseKey);
  }
}

// Import prompts from prompts.json
app.post('/api/prompts/import', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    console.log('📥 Importing prompts from prompts.json...');

    // Read prompts.json
    const promptsPath = path.join(__dirname, 'src', 'config', 'prompts.json');
    const promptsData = JSON.parse(fs.readFileSync(promptsPath, 'utf8'));

    let importedCount = 0;
    const errors = [];

    for (const [promptId, promptData] of Object.entries(promptsData.prompts)) {
      try {
        // Check if prompt already exists
        const { data: existing } = await supabase
          .from('prompt_versions')
          .select('id')
          .eq('prompt_id', promptId)
          .eq('is_active', true)
          .maybeSingle();

        if (existing && !req.query.force) {
          console.log(`⏭️  Skipping existing prompt: ${promptId}`);
          continue;
        }

        // If force flag is set, deactivate existing prompt
        if (existing && req.query.force) {
          await supabase
            .from('prompt_versions')
            .update({ is_active: false })
            .eq('prompt_id', promptId);
          console.log(`🔄 Deactivating existing prompt: ${promptId}`);
        }

        // Get the active version
        const activeVersionKey = promptData.active_version || 'v1';
        const activeVersionData = promptData.versions[activeVersionKey];

        if (!activeVersionData) {
          errors.push(`No version data for ${promptId}`);
          continue;
        }

        // Insert prompt
        const { error } = await supabase
          .from('prompt_versions')
          .insert({
            prompt_id: promptId,
            prompt_name: promptData.name || promptId,
            major_version: 1,
            minor_version: 0,
            patch_version: 0,
            system_prompt: activeVersionData.system_prompt || activeVersionData,
            description: promptData.description || '',
            category: 'conversation',
            tags: promptData.tags || ['cupido'],
            labels: ['production'],
            status: 'active',
            is_active: true,
            commit_message: activeVersionData.notes || 'Imported from prompts.json',
            created_by: 'migration',
            source_file: '/src/config/prompts.json',
            is_default: true,
          });

        if (error) {
          errors.push(`${promptId}: ${error.message}`);
        } else {
          console.log(`✅ Imported: ${promptId}`);
          importedCount++;
        }
      } catch (err) {
        errors.push(`${promptId}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      imported: importedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error importing prompts:', error);
    res.status(500).json({ error: 'Failed to import prompts', details: error.message });
  }
});

// Helper function to load custom prompts from file
function loadCustomPrompts() {
  try {
    if (fs.existsSync(CUSTOM_PROMPTS_FILE)) {
      const data = fs.readFileSync(CUSTOM_PROMPTS_FILE, 'utf8');
      return JSON.parse(data).prompts || {};
    }
  } catch (error) {
    console.error('Error loading custom prompts:', error);
  }
  return {};
}

// Helper function to save custom prompts to file
function saveCustomPrompts(prompts) {
  try {
    fs.writeFileSync(CUSTOM_PROMPTS_FILE, JSON.stringify({ prompts }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving custom prompts:', error);
    return false;
  }
}

// Helper functions for managing deleted prompts
function loadDeletedPrompts() {
  try {
    if (fs.existsSync(DELETED_PROMPTS_FILE)) {
      const data = fs.readFileSync(DELETED_PROMPTS_FILE, 'utf8');
      return JSON.parse(data).deletedPrompts || [];
    }
  } catch (error) {
    console.error('Error loading deleted prompts:', error);
  }
  return [];
}

function saveDeletedPrompts(deletedList) {
  try {
    fs.writeFileSync(DELETED_PROMPTS_FILE, JSON.stringify({ deletedPrompts: deletedList }, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving deleted prompts:', error);
    return false;
  }
}

function addToDeletedPrompts(promptId) {
  const deletedList = loadDeletedPrompts();
  if (!deletedList.includes(promptId)) {
    deletedList.push(promptId);
    saveDeletedPrompts(deletedList);
  }
}

// List all prompts (including custom prompts from file)
app.get('/api/prompts', async (req, res) => {
  try {
    const allPrompts = [];

    // Load the list of deleted prompts to filter out
    const deletedPrompts = loadDeletedPrompts();

    // Get Supabase prompts if available
    let supabasePromptIds = new Set();
    if (supabase) {
      try {
        console.log('📡 Fetching prompts from Supabase...');
        // Get all prompt_ids (distinct)
        const { data: supabasePrompts, error: allPromptsError } = await supabase
          .from('prompt_versions')
          .select('prompt_id')
          .order('prompt_id');

        console.log('📊 Supabase response:', {
          hasData: !!supabasePrompts,
          count: supabasePrompts?.length,
          error: allPromptsError?.message || 'none'
        });

        if (!allPromptsError && supabasePrompts) {
          // Get unique prompt IDs
          const uniquePromptIds = [...new Set(supabasePrompts.map(p => p.prompt_id))];
          supabasePromptIds = new Set(uniquePromptIds);

          // For each unique prompt, get the latest version info
          const summaries = await Promise.all(
            uniquePromptIds.map(async (promptId) => {
              // Get the most recent version (active or not)
              const { data: latestVersion, error: latestError } = await supabase
                .from('prompt_versions')
                .select('*')
                .eq('prompt_id', promptId)
                .order('major_version', { ascending: false })
                .order('minor_version', { ascending: false })
                .order('patch_version', { ascending: false })
                .limit(1)
                .single();

              if (latestError) return null;

              // Count total versions for this prompt
              const { count } = await supabase
                .from('prompt_versions')
                .select('id', { count: 'exact', head: true })
                .eq('prompt_id', promptId);

              return {
                prompt_id: latestVersion.prompt_id,
                prompt_name: latestVersion.prompt_name,
                active_version: latestVersion.version_string,
                version_count: count || 1,
                category: latestVersion.category,
                description: latestVersion.description,
                is_default: latestVersion.is_default,
                is_active: latestVersion.is_active,
                tags: latestVersion.tags || [],
                system_prompt: latestVersion.system_prompt
              };
            })
          );

          // Add Supabase prompts to the list, filtering out deleted ones
          summaries.filter(s => {
            if (s === null) return false;
            // Check if this prompt is in the deleted list
            const isDeleted = deletedPrompts.includes(s.prompt_id);
            if (isDeleted) {
              console.log(`Filtering out deleted prompt: ${s.prompt_id}`);
            }
            return !isDeleted;
          }).forEach(p => allPrompts.push(p));
        }
      } catch (error) {
        console.error('❌ Error fetching Supabase prompts:', error.message || error);
        console.error('   Full error:', JSON.stringify(error, null, 2));
        // Continue with custom prompts even if Supabase fails
      }
    }
    
    // If no Supabase prompts were loaded, load from local prompts.json
    if (allPrompts.length === 0) {
      const localPromptsPath = path.join(__dirname, 'src', 'config', 'prompts.json');
      if (fs.existsSync(localPromptsPath)) {
        try {
          console.log('📂 Loading prompts from local prompts.json (Supabase fallback)...');
          const promptsData = JSON.parse(fs.readFileSync(localPromptsPath, 'utf8'));
          
          // Convert local prompts format to API format
          for (const [promptId, promptData] of Object.entries(promptsData.prompts)) {
            const activeVersion = promptData.active_version || 'v1';
            const versionData = promptData.versions[activeVersion];
            
            if (versionData && !deletedPrompts.includes(promptId)) {
              allPrompts.push({
                prompt_id: promptId,
                prompt_name: promptData.name,
                active_version: activeVersion,
                version_count: Object.keys(promptData.versions).length,
                category: 'conversation',
                description: promptData.description,
                is_default: promptId === promptsData.active_prompt_id,
                is_active: true,
                tags: promptData.tags || ['cupido'],
                system_prompt: versionData.system_prompt
              });
            }
          }
          
          console.log(`✅ Loaded ${allPrompts.length} prompts from local file`);
        } catch (error) {
          console.error('❌ Error loading local prompts:', error);
        }
      }
    }

    // Load custom prompts from file (only if NOT in Supabase)
    const customPrompts = loadCustomPrompts();
    for (const [id, prompt] of Object.entries(customPrompts)) {
      // Skip if this prompt has been deleted
      if (deletedPrompts.includes(id)) continue;

      // Skip if this prompt already exists in Supabase
      if (supabasePromptIds.has(id)) continue;

      allPrompts.push({
        prompt_id: id,
        prompt_name: prompt.name || 'Custom Prompt',
        active_version: prompt.version || '1.0.0',
        version_count: 1,
        category: prompt.category || 'custom',
        description: prompt.description || '',
        is_default: false,
        is_active: false,
        tags: prompt.tags || ['custom'],
        system_prompt: prompt.content || prompt.system_prompt || ''
      });
    }

    res.json(allPrompts);
  } catch (error) {
    console.error('Error listing prompts:', error);
    res.status(500).json({ error: 'Failed to list prompts', details: error.message });
  }
});

// Get only simulator prompts (convenience endpoint for test dashboard)
app.get('/api/prompts/simulator', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    console.log('🎭 Fetching simulator prompts...');

    // Fetch prompts with 'simulator' tag
    const { data: simulatorPrompts, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .contains('tags', ['simulator'])
      .order('prompt_name');

    if (error) {
      console.error('Error fetching simulator prompts:', error);
      return res.status(500).json({ error: 'Failed to fetch simulator prompts', details: error.message });
    }

    // Transform to simplified format for dashboard
    const formattedPrompts = (simulatorPrompts || []).map(prompt => ({
      id: prompt.prompt_id,
      name: prompt.prompt_name,
      prompt: prompt.system_prompt,
      description: prompt.description,
      version: prompt.version_string,
    }));

    console.log(`✅ Found ${formattedPrompts.length} simulator prompts`);
    res.json(formattedPrompts);
  } catch (error) {
    console.error('Error listing simulator prompts:', error);
    res.status(500).json({ error: 'Failed to list simulator prompts', details: error.message });
  }
});

// Create new prompt
app.post('/api/prompts', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const {
      prompt_id,
      prompt_name,
      description,
      system_prompt,
      category = 'custom',
      is_default = false,
      is_active = false
    } = req.body;

    // Generate prompt_id if not provided
    const finalPromptId = prompt_id || `custom_prompt_${Date.now()}`;
    
    // For custom prompts, save to Supabase (RLS policies now allow this)
    if (finalPromptId.startsWith('custom_prompt_')) {
      // Create the prompt with a basic version
      // Note: version_string is auto-generated by the database, don't set it manually
      const { data, error } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: finalPromptId,
          prompt_name: prompt_name || 'Custom Prompt',
          major_version: 1,
          minor_version: 0,
          patch_version: 0,
          // version_string is auto-generated, don't set it
          system_prompt: system_prompt || '',
          description: description || '',
          category: category,
          tags: [],
          labels: ['custom'],
          status: 'active',
          is_active: false,  // Don't auto-activate custom prompts
          commit_message: 'Created from dashboard',
          created_by: 'dashboard',
          is_default: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({
          error: 'Failed to save prompt to database',
          details: error.message
        });
      } else {
        console.log('✅ Custom prompt saved to Supabase:', prompt_id);

        // Also save to local file as backup
        const customPrompts = loadCustomPrompts();
        customPrompts[finalPromptId] = {
          name: prompt_name,
          description: description,
          content: system_prompt,
          category: category,
          version: '1.0.0',
          created_at: new Date().toISOString()
        };
        saveCustomPrompts(customPrompts);

        res.json({
          success: true,
          prompt_id: finalPromptId,
          prompt: { id: finalPromptId }, // Fix: Client expects data.prompt.id
          message: 'Custom prompt saved to database',
          data: data
        });
      }
      return;
    }

    // For non-custom prompts, attempt to save to Supabase
    const { data, error } = await supabase
      .from('prompt_versions')
      .insert({
        prompt_id: prompt_id,
        prompt_name: prompt_name,
        major_version: 1,
        minor_version: 0,
        patch_version: 0,
        system_prompt: system_prompt || '',
        description: description || '',
        category: category,
        tags: [],
        labels: ['draft'],
        status: 'draft',
        is_active: is_active,
        commit_message: 'Created via dashboard',
        created_by: 'dashboard',
        is_default: is_default,
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      prompt_id: data.prompt_id,
      data: data
    });
  } catch (error) {
    console.error('Error creating prompt:', error);

    // For RLS errors, return success for custom prompts
    if (error.message && error.message.includes('row-level security') &&
        req.body.prompt_id && req.body.prompt_id.startsWith('custom_prompt_')) {
      res.json({
        success: true,
        prompt_id: req.body.prompt_id,
        message: 'Custom prompt created locally (RLS bypass)'
      });
    } else {
      res.status(500).json({ error: 'Failed to create prompt', details: error.message });
    }
  }
});

// Delete a specific version of a prompt
app.delete('/api/prompts/:promptId/versions/:versionString', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId, versionString } = req.params;
    const [major, minor, patch] = versionString.split('.').map(Number);

    console.log(`🗑️  Delete version request: ${promptId} v${versionString}`);

    // Check if this version is currently active
    const { data: versionData, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('is_active, id')
      .eq('prompt_id', promptId)
      .eq('major_version', major)
      .eq('minor_version', minor)
      .eq('patch_version', patch)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (!versionData) {
      return res.status(404).json({ error: 'Version not found' });
    }

    if (versionData.is_active) {
      return res.status(400).json({
        error: 'Cannot delete active version',
        message: 'Please deactivate this version before deleting it'
      });
    }

    // Delete the version
    const { error: deleteError } = await supabase
      .from('prompt_versions')
      .delete()
      .eq('id', versionData.id);

    if (deleteError) throw deleteError;

    console.log(`✅ Deleted version ${promptId} v${versionString}`);
    res.json({ success: true, message: `Version ${versionString} deleted` });

  } catch (error) {
    console.error('Error deleting version:', error);
    res.status(500).json({ error: 'Failed to delete version', details: error.message });
  }
});

// Delete a prompt (all versions)
app.delete('/api/prompts/:promptId', async (req, res) => {
  try {
    const { promptId } = req.params;

    // Add to deleted prompts list to filter from results
    addToDeletedPrompts(promptId);

    // For custom prompts, delete from both Supabase and local file
    if (promptId.startsWith('custom_prompt_')) {
      // Try to delete from Supabase if available
      if (supabase) {
        const { error } = await supabase
          .from('prompt_versions')
          .delete()
          .eq('prompt_id', promptId);

        if (error) {
          console.warn('Failed to delete from Supabase:', error);
          // Even if Supabase delete fails, we've added it to deleted list
        } else {
          console.log(`✅ Deleted ${promptId} from Supabase`);
        }
      }

      // Also delete from local custom prompts file
      const customPrompts = loadCustomPrompts();
      if (customPrompts[promptId]) {
        delete customPrompts[promptId];
        saveCustomPrompts(customPrompts);
        console.log(`✅ Deleted ${promptId} from local file`);
      }

      res.json({ success: true, message: 'Prompt deleted' });
    } else {
      // For non-custom prompts, only delete from Supabase
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase not configured' });
      }

      const { error } = await supabase
        .from('prompt_versions')
        .delete()
        .eq('prompt_id', promptId);

      if (error) throw error;

      res.json({ success: true, message: 'Prompt deleted from database' });
    }
  } catch (error) {
    console.error('Error deleting prompt:', error);
    res.status(500).json({ error: 'Failed to delete prompt', details: error.message });
  }
});

// Get specific prompt
app.get('/api/prompts/:promptId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const { version } = req.query;

    let query = supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId);

    if (version) {
      const [major, minor, patch] = version.split('.').map(Number);
      query = query
        .eq('major_version', major)
        .eq('minor_version', minor)
        .eq('patch_version', patch);
    } else {
      // If no version specified, get the latest version (regardless of active status)
      query = query
        .order('major_version', { ascending: false })
        .order('minor_version', { ascending: false })
        .order('patch_version', { ascending: false })
        .limit(1);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Prompt not found' });

    res.json(data);
  } catch (error) {
    console.error('Error getting prompt:', error);
    res.status(500).json({ error: 'Failed to get prompt', details: error.message });
  }
});

// List versions of a prompt
app.get('/api/prompts/:promptId/versions', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;

    const { data, error } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('major_version', { ascending: false })
      .order('minor_version', { ascending: false })
      .order('patch_version', { ascending: false });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error listing versions:', error);
    res.status(500).json({ error: 'Failed to list versions', details: error.message });
  }
});

// Create new prompt version
app.post('/api/prompts/:promptId/versions', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const {
      promptName,
      systemPrompt,
      versionType = 'patch',
      commitMessage,
      notes,
      createdBy = 'admin',
      activate = false,
      tags,  // Array of tags (e.g., ["cupido"], ["simulator"])
      isDefault,  // Boolean - if true, unset other prompts with same tag
    } = req.body;

    // If isDefault is true, unset other prompts with the same tag as default
    if (isDefault && tags && tags.length > 0) {
      const tag = tags[0];  // Get the first (and typically only) tag
      console.log(`📌 Setting as default for tag: ${tag}`);

      // Unset is_default for all other prompts with this tag
      const { error: unsetError } = await supabase
        .from('prompt_versions')
        .update({ is_default: false })
        .contains('tags', [tag])
        .neq('prompt_id', promptId);

      if (unsetError) {
        console.error('Error unsetting other defaults:', unsetError);
        // Don't fail the request - continue with version creation
      }
    }

    // Call the database function to create version
    const { data: versionId, error } = await supabase.rpc('create_prompt_version', {
      p_prompt_id: promptId,
      p_prompt_name: promptName,
      p_system_prompt: systemPrompt,
      p_version_type: versionType,
      p_commit_message: commitMessage || 'Updated via dashboard',
      p_notes: notes || '',
      p_created_by: createdBy,
      p_activate: activate,
    });

    if (error) throw error;

    // Fetch the created version to get version_string
    const { data: versionData, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (fetchError) throw fetchError;

    // Update tags and isDefault if provided (RPC doesn't handle these yet)
    if (tags !== undefined || isDefault !== undefined) {
      const updateFields = {};
      if (tags !== undefined) {
        updateFields.tags = tags;
      }
      if (isDefault !== undefined) {
        updateFields.is_default = isDefault;
      }

      const { data: updatedData, error: updateError } = await supabase
        .from('prompt_versions')
        .update(updateFields)
        .eq('id', versionId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating tags/isDefault:', updateError);
        // Don't fail - return the version without these fields
      } else {
        // Return the updated version with tags and isDefault
        return res.json({
          success: true,
          versionId: versionId,
          version_string: updatedData.version_string,
          ...updatedData
        });
      }
    }

    res.json({
      success: true,
      versionId: versionId,
      version_string: versionData.version_string,
      ...versionData
    });
  } catch (error) {
    console.error('Error creating version:', error);
    res.status(500).json({ error: 'Failed to create version', details: error.message });
  }
});

// Update existing prompt version (with optional version increment)
app.patch('/api/prompts/:promptId', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const {
      promptName,
      systemPrompt,
      description,
      versionType,  // Optional: 'patch', 'minor', or 'major' to create new version
      commitMessage,
      tags,  // Array of tags (e.g., ["cupido"], ["simulator"])
      isDefault,  // Boolean - if true, unset other prompts with same tag
    } = req.body;

    // Get the most recent version of this prompt
    const { data: latestVersion, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', promptId)
      .order('major_version', { ascending: false })
      .order('minor_version', { ascending: false })
      .order('patch_version', { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error('Error fetching latest version:', fetchError);
      throw fetchError;
    }

    if (!latestVersion) {
      return res.status(404).json({ error: 'Prompt not found' });
    }

    // If isDefault is true, unset other prompts with the same tag as default
    if (isDefault && tags && tags.length > 0) {
      const tag = tags[0];  // Get the first (and typically only) tag
      console.log(`📌 Setting as default for tag: ${tag}`);

      // Unset is_default for all other prompts with this tag
      const { error: unsetError } = await supabase
        .from('prompt_versions')
        .update({ is_default: false })
        .contains('tags', [tag])
        .neq('prompt_id', promptId);

      if (unsetError) {
        console.error('Error unsetting other defaults:', unsetError);
        // Don't fail the request - continue with the update
      }
    }

    // If versionType is provided, create a new version row
    if (versionType) {
      console.log(`📝 Creating new ${versionType} version for ${promptId}`);

      // Calculate new version numbers
      let newMajor = latestVersion.major_version;
      let newMinor = latestVersion.minor_version;
      let newPatch = latestVersion.patch_version;

      if (versionType === 'major') {
        newMajor++;
        newMinor = 0;
        newPatch = 0;
      } else if (versionType === 'minor') {
        newMinor++;
        newPatch = 0;
      } else { // patch
        newPatch++;
      }

      const newVersionString = `${newMajor}.${newMinor}.${newPatch}`;

      // Insert new version row
      const { data, error } = await supabase
        .from('prompt_versions')
        .insert({
          prompt_id: promptId,
          prompt_name: promptName,
          major_version: newMajor,
          minor_version: newMinor,
          patch_version: newPatch,
          system_prompt: systemPrompt,
          description: description,
          category: latestVersion.category,
          tags: tags !== undefined ? tags : latestVersion.tags,
          labels: latestVersion.labels,
          status: latestVersion.status,
          is_active: latestVersion.is_active,
          commit_message: commitMessage || `${versionType} version update`,
          created_by: 'dashboard',
          is_default: isDefault !== undefined ? isDefault : latestVersion.is_default,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating new version:', error);
        throw error;
      }

      console.log(`✅ Created new version ${promptId} v${newVersionString}`);

      res.json({
        success: true,
        version_string: newVersionString,
        ...data
      });
    } else {
      // No version increment - just update the existing row
      console.log(`📝 Updating prompt ${promptId} (no version increment)`);

      // Build update object dynamically to only include provided fields
      const updateFields = {
        prompt_name: promptName,
        system_prompt: systemPrompt,
        description: description,
      };

      if (tags !== undefined) {
        updateFields.tags = tags;
      }

      if (isDefault !== undefined) {
        updateFields.is_default = isDefault;
      }

      const { data, error } = await supabase
        .from('prompt_versions')
        .update(updateFields)
        .eq('id', latestVersion.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating prompt:', error);
        throw error;
      }

      console.log(`✅ Updated prompt ${promptId} v${latestVersion.version_string}`);

      res.json({
        success: true,
        version_string: latestVersion.version_string,
        ...data
      });
    }
  } catch (error) {
    console.error('Error updating prompt:', error);
    res.status(500).json({ error: 'Failed to update prompt', details: error.message });
  }
});

// Set as default prompt (replaces activate endpoint)
app.post('/api/prompts/:promptId/set-default', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const { versionString } = req.body;

    const [major, minor, patch] = versionString.split('.').map(Number);

    // First, set is_default = false on ALL prompts
    const { error: unsetDefaultError } = await supabase
      .from('prompt_versions')
      .update({
        is_default: false,
      })
      .neq('prompt_id', ''); // Update all rows

    if (unsetDefaultError) throw unsetDefaultError;

    // Then set is_default = true on the selected prompt
    const { error } = await supabase
      .from('prompt_versions')
      .update({
        is_default: true,
      })
      .eq('prompt_id', promptId)
      .eq('major_version', major)
      .eq('minor_version', minor)
      .eq('patch_version', patch);

    if (error) throw error;

    console.log(`✓ Set default prompt: ${promptId} v${versionString}`);

    res.json({ success: true, message: `${promptId} is now the default prompt` });
  } catch (error) {
    console.error('Error setting default prompt:', error);
    res.status(500).json({ error: 'Failed to set default prompt', details: error.message });
  }
});

// Toggle prompt activation (replaces toggle-visibility for active state)
app.post('/api/prompts/:promptId/toggle-active', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const { versionString, isActive } = req.body;

    const [major, minor, patch] = versionString.split('.').map(Number);

    // Update is_active on the specified prompt version
    // The database trigger will automatically deactivate other versions of the SAME prompt
    const { error } = await supabase
      .from('prompt_versions')
      .update({
        is_active: isActive,
        status: isActive ? 'active' : 'draft'
      })
      .eq('prompt_id', promptId)
      .eq('major_version', major)
      .eq('minor_version', minor)
      .eq('patch_version', patch);

    if (error) throw error;

    const status = isActive ? 'active' : 'inactive';
    console.log(`✓ Set activation for ${promptId} v${versionString}: ${status}`);

    res.json({ success: true, message: `Prompt is now ${status}`, isActive });
  } catch (error) {
    console.error('Error toggling activation:', error);
    res.json({ error: 'Failed to toggle activation', details: error.message });
  }
});

// Toggle prompt visibility
app.post('/api/prompts/:promptId/toggle-visibility', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const { versionString, isVisible } = req.body;

    const [major, minor, patch] = versionString.split('.').map(Number);

    // Update is_visible on the specified prompt version
    const { error } = await supabase
      .from('prompt_versions')
      .update({
        is_visible: isVisible,
      })
      .eq('prompt_id', promptId)
      .eq('major_version', major)
      .eq('minor_version', minor)
      .eq('patch_version', patch);

    if (error) throw error;

    const status = isVisible ? 'visible' : 'hidden';
    console.log(`✓ Set visibility for ${promptId} v${versionString}: ${status}`);

    res.json({ success: true, message: `Prompt is now ${status}`, isVisible });
  } catch (error) {
    console.error('Error toggling visibility:', error);
    res.status(500).json({ error: 'Failed to toggle visibility', details: error.message });
  }
});

// Activate a version (deprecated - kept for backward compatibility, now just sets is_active)
// TODO: Remove this endpoint after transitioning all clients to use set-default
app.post('/api/prompts/:promptId/activate', async (req, res) => {
  try {
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }

    const { promptId } = req.params;
    const { versionString } = req.body;

    const [major, minor, patch] = versionString.split('.').map(Number);

    // First, deactivate ALL prompts (only change is_active flag)
    const { error: deactivateError } = await supabase
      .from('prompt_versions')
      .update({
        is_active: false,
      })
      .neq('prompt_id', ''); // Update all rows

    if (deactivateError) throw deactivateError;

    // Then activate the selected prompt
    const { error } = await supabase
      .from('prompt_versions')
      .update({
        is_active: true,
      })
      .eq('prompt_id', promptId)
      .eq('major_version', major)
      .eq('minor_version', minor)
      .eq('patch_version', patch);

    if (error) throw error;

    console.log(`✓ Activated prompt ${promptId} v${versionString} (deprecated API)`);

    res.json({ success: true, deprecated: true, message: 'Use /set-default endpoint instead' });
  } catch (error) {
    console.error('Error activating version:', error);
    res.status(500).json({ error: 'Failed to activate version', details: error.message });
  }
});

// Simulator API endpoint for generating responses
app.post('/api/simulator/generate-response', async (req, res) => {
  try {
    console.log('🎭 Simulator response generation request');
    
    const {
      personaPromptId,
      conversationHistory = [],
      userMessage,
      conversationId
    } = req.body;
    
    if (!personaPromptId || !userMessage) {
      return res.status(400).json({ error: 'Missing required fields: personaPromptId and userMessage' });
    }
    
    if (!supabase) {
      return res.status(500).json({ error: 'Supabase not configured' });
    }
    
    if (!CLAUDE_API_KEY) {
      return res.status(500).json({ error: 'Claude API key not configured' });
    }
    
    console.log(`🔍 Fetching persona prompt: ${personaPromptId}`);
    
    // Get the persona prompt from database (use prompt_versions table)
    // For simulator, get the latest version regardless of active status
    const { data: personaPrompt, error: fetchError } = await supabase
      .from('prompt_versions')
      .select('*')
      .eq('prompt_id', personaPromptId)
      .order('major_version', { ascending: false })
      .order('minor_version', { ascending: false })
      .order('patch_version', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError) {
      console.error('Error fetching persona prompt:', fetchError);
      // Check if this might be a fallback persona ID - provide a generic response
      if (fetchError.code === 'PGRST116' || fetchError.message.includes('No rows found')) {
        console.log('🔄 Providing fallback response for unknown persona ID:', personaPromptId);
        return res.json({
          response: "That's really interesting! I'd love to hear more about your thoughts on that.",
          personaName: personaPromptId || 'Assistant',
          fallback: true
        });
      }
      return res.status(404).json({ error: 'Persona prompt not found', details: fetchError.message });
    }
    
    if (!personaPrompt) {
      return res.status(404).json({ error: 'No active persona prompt found' });
    }
    
    console.log(`✅ Found persona: ${personaPrompt.prompt_name}`);
    
    // Prepare messages for Claude API
    const systemPrompt = personaPrompt.system_prompt;
    
    // Build conversation messages (exclude system message)
    const messages = [];
    
    // Add conversation history if provided
    if (conversationHistory && conversationHistory.length > 0) {
      messages.push(...conversationHistory.filter(msg => msg.role !== 'system'));
    }
    
    // Add the new user message
    messages.push({
      role: 'user', 
      content: userMessage
    });
    
    console.log(`🤖 Generating response using Claude with ${messages.length} messages`);
    
    // Generate response using Claude API (reuse existing API call logic)
    const requestBody = {
      model: 'claude-3-5-sonnet-20241022',  // Use Sonnet for consistent persona responses
      max_tokens: 500,  // Reasonable length for simulator responses
      system: [
        {
          type: 'text',
          text: systemPrompt
        }
      ],
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    };

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Claude API error ${response.status}:`, errorText);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract response text
    let simulatorResponse = 'I apologize, but I had trouble generating a response.';
    if (data && data.content && Array.isArray(data.content)) {
      const textBlocks = data.content.filter(block => block.type === 'text');
      if (textBlocks.length > 0) {
        simulatorResponse = textBlocks.map(block => block.text).join(' ');
      }
    }
    
    console.log(`✅ Generated simulator response: ${simulatorResponse.substring(0, 100)}...`);
    
    // Save simulator test data if conversationId provided
    if (conversationId && supabase) {
      try {
        const { error: saveError } = await supabase
          .from('conversations')
          .update({
            is_simulator_test: true,
            simulator_params: {
              persona_prompt_id: personaPromptId,
              persona_name: personaPrompt.prompt_name,
              generated_at: new Date().toISOString(),
              user_message: userMessage,
              simulator_response: simulatorResponse
            }
          })
          .eq('id', conversationId);
          
        if (saveError) {
          console.warn('Failed to save simulator metadata:', saveError);
        } else {
          console.log(`💾 Saved simulator test metadata for conversation ${conversationId}`);
        }
      } catch (saveErr) {
        console.warn('Error saving simulator metadata:', saveErr);
      }
    }
    
    res.json({
      response: simulatorResponse,
      personaName: personaPrompt.prompt_name,
      personaId: personaPromptId,
      timestamp: new Date().toISOString(),
      model: 'claude-3-5-sonnet-20241022'
    });
    
  } catch (error) {
    console.error('Simulator generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate simulator response', 
      details: error.message,
      fallback: true
    });
  }
});

// Serve test dashboard at /test-dashboard
app.get('/test-dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'test-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Test dashboard not found');
  }
});

// Serve comprehensive test functions
app.get('/comprehensive-test-functions.js', (req, res) => {
  const functionsPath = path.join(__dirname, 'comprehensive-test-functions.js');
  if (fs.existsSync(functionsPath)) {
    res.sendFile(functionsPath);
  } else {
    res.status(404).send('Test functions not found');
  }
});

// Serve infrastructure test functions
app.get('/infrastructure-tests.js', (req, res) => {
  const infrastructurePath = path.join(__dirname, 'infrastructure-tests.js');
  if (fs.existsSync(infrastructurePath)) {
    res.sendFile(infrastructurePath);
  } else {
    res.status(404).send('Infrastructure tests not found');
  }
});

// Serve prompt manager
app.get('/promptManager.js', (req, res) => {
  const managerPath = path.join(__dirname, 'promptManager.js');
  if (fs.existsSync(managerPath)) {
    res.sendFile(managerPath);
  } else {
    res.status(404).send('Prompt manager not found');
  }
});

// Serve test dashboard console check
app.get('/test-dashboard-console-check.html', (req, res) => {
  const checkPath = path.join(__dirname, 'test-dashboard-console-check.html');
  if (fs.existsSync(checkPath)) {
    res.sendFile(checkPath);
  } else {
    res.status(404).send('Console check not found');
  }
});

// Serve new Cupido test dashboard
app.get('/cupido-test-dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'cupido-test-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Cupido test dashboard not found');
  }
});

// Serve debug test files
app.get('/debug-test.html', (req, res) => {
  const debugPath = path.join(__dirname, 'debug-test.html');
  if (fs.existsSync(debugPath)) {
    res.sendFile(debugPath);
  } else {
    res.status(404).send('Debug test not found');
  }
});

app.get('/minimal-dashboard-test.html', (req, res) => {
  const minimalPath = path.join(__dirname, 'minimal-dashboard-test.html');
  if (fs.existsSync(minimalPath)) {
    res.sendFile(minimalPath);
  } else {
    res.status(404).send('Minimal dashboard test not found');
  }
});

// =========================
// USER PREFERENCE ENDPOINTS
// =========================

// Get user's selected prompt preference
app.get('/api/user-preferences/selected-prompt', (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    
    // For now, use in-memory storage - in production you'd store this in database
    const selectedPrompt = global.userPreferences?.[userId]?.selectedPromptId || null;
    
    res.json({
      success: true,
      selectedPromptId: selectedPrompt,
      userId: userId
    });
  } catch (error) {
    console.error('Error getting user prompt preference:', error);
    res.status(500).json({ error: 'Failed to get prompt preference', details: error.message });
  }
});

// Set user's selected prompt preference
app.post('/api/user-preferences/selected-prompt', (req, res) => {
  try {
    const { userId = 'default_user', promptId } = req.body;
    
    if (!promptId) {
      return res.status(400).json({ error: 'Missing required field: promptId' });
    }
    
    // Initialize global preferences store if it doesn't exist
    if (!global.userPreferences) {
      global.userPreferences = {};
    }
    
    if (!global.userPreferences[userId]) {
      global.userPreferences[userId] = {};
    }
    
    // Store the preference
    global.userPreferences[userId].selectedPromptId = promptId;
    global.userPreferences[userId].lastUpdated = new Date().toISOString();
    
    console.log(`✅ User ${userId} selected prompt: ${promptId}`);
    
    res.json({
      success: true,
      selectedPromptId: promptId,
      userId: userId,
      message: 'Prompt preference updated successfully'
    });
  } catch (error) {
    console.error('Error setting user prompt preference:', error);
    res.status(500).json({ error: 'Failed to set prompt preference', details: error.message });
  }
});

// Get all user preferences
app.get('/api/user-preferences', (req, res) => {
  try {
    const userId = req.query.userId || 'default_user';
    const userPrefs = global.userPreferences?.[userId] || {};
    
    res.json({
      success: true,
      userId: userId,
      preferences: userPrefs
    });
  } catch (error) {
    console.error('Error getting user preferences:', error);
    res.status(500).json({ error: 'Failed to get user preferences', details: error.message });
  }
});

// ============================================
// HEALTH CHECK API ENDPOINTS
// ============================================

// Get system health status
app.get('/api/health/status', (req, res) => {
  try {
    const healthStatus = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        server: {
          status: 'running',
          port: 3001,
          uptime: process.uptime()
        },
        database: {
          status: 'connected', // We assume Supabase is connected
          type: 'Supabase'
        }
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };
    
    res.json({
      success: true,
      data: healthStatus
    });
  } catch (error) {
    console.error('Error getting health status:', error);
    res.status(500).json({ error: 'Failed to get health status', details: error.message });
  }
});

// Get running processes status
app.get('/api/health/processes', (req, res) => {
  try {
    const { exec } = require('child_process');
    
    // Check for running Node.js processes
    exec('ps aux | grep node', (error, stdout, stderr) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to get process list' });
      }
      
      const processes = stdout.split('\n')
        .filter(line => line.includes('node') && !line.includes('grep'))
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return {
            pid: parts[1],
            cpu: parts[2],
            memory: parts[3],
            command: parts.slice(10).join(' ')
          };
        });
      
      res.json({
        success: true,
        data: processes
      });
    });
  } catch (error) {
    console.error('Error getting processes:', error);
    res.status(500).json({ error: 'Failed to get processes', details: error.message });
  }
});

// Serve revolutionary analytics dashboard
app.get('/analytics-dashboard', (req, res) => {
  const dashboardPath = path.join(__dirname, 'cupido-analytics-dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('Analytics dashboard not found');
  }
});

// Serve analytics engine JavaScript
app.get('/prompt-analytics-engine.js', (req, res) => {
  const analyticsPath = path.join(__dirname, 'prompt-analytics-engine.js');
  if (fs.existsSync(analyticsPath)) {
    res.sendFile(analyticsPath);
  } else {
    res.status(404).send('Analytics engine not found');
  }
});

// Serve template engine JavaScript
app.get('/prompt-template-engine.js', (req, res) => {
  const templatePath = path.join(__dirname, 'prompt-template-engine.js');
  if (fs.existsSync(templatePath)) {
    res.sendFile(templatePath);
  } else {
    res.status(404).send('Template engine not found');
  }
});

// ============================================
// HTML REWRITER FOR /app ROUTE
// ============================================
// Middleware to inject <base> tag into HTML for correct resource loading
const htmlRewriter = require('stream').Transform;
function createHtmlInjector(baseUrl) {
  return new htmlRewriter({
    transform(chunk, encoding, callback) {
      let html = chunk.toString();
      // Inject base tag after <head>
      html = html.replace(/<head>/i, `<head><base href="${baseUrl}/">`);
      callback(null, html);
    }
  });
}

// ============================================
// REVERSE PROXY FOR EXPO DEV SERVER
// ============================================
// Proxy /app/* to localhost:8081 to achieve same-origin for DOM testing
// This eliminates CORS restrictions when test dashboard accesses app iframe
const { Transform } = require('stream');

app.use('/app', createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  ws: true, // Enable WebSocket proxying for Expo hot reload
  pathRewrite: {
    '^/app': '', // Remove /app prefix when forwarding to Expo
  },
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔀 Proxying: ${req.method} ${req.url} → http://localhost:8081${req.url.replace('/app', '')}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    // Remove X-Frame-Options header to allow iframe embedding
    delete proxyRes.headers['x-frame-options'];

    // For HTML responses, modify the content to remove X-Frame-Options meta tag
    const contentType = proxyRes.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      // Create a transform stream to modify HTML on the fly
      const transformStream = new Transform({
        transform(chunk, encoding, callback) {
          let html = chunk.toString();
          // Remove X-Frame-Options DENY meta tag
          html = html.replace(/<meta\s+http-equiv=["']X-Frame-Options["']\s+content=["']DENY["']\s*\/>/gi, '');
          callback(null, html);
        }
      });

      // Update content-length since we're modifying the body
      delete proxyRes.headers['content-length'];

      proxyRes.pipe(transformStream).pipe(res);
    } else {
      // For non-HTML responses (JS, JSON, CSS, etc.), just pipe through
      proxyRes.pipe(res);
    }
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(502).json({ error: 'Proxy error - ensure Expo dev server is running on port 8081' });
  }
}));

// Proxy bundle files and assets at root level to Expo
// This handles cases where base tag doesn't work with absolute paths
app.use('/', createProxyMiddleware({
  target: 'http://localhost:8081',
  changeOrigin: true,
  // Only proxy specific file types (bundles, maps, assets)
  filter: (pathname, req) => {
    // Exclude API routes from proxying
    if (pathname.startsWith('/api/')) {
      return false;
    }
    
    // Exclude our dashboard files from proxying
    const dashboardFiles = [
      'infrastructure-tests.js',
      'comprehensive-test-functions.js', 
      'promptManager.js',
      'error-logger.js',
      'cupido-test-dashboard',
      'debug-test.html',
      'minimal-dashboard-test.html'
    ];
    
    // Don't proxy our dashboard files
    if (dashboardFiles.some(file => pathname.includes(file))) {
      return false;
    }
    
    const shouldProxy = pathname.match(/\.(bundle|map|js|ts)(\?.*)?$/) ||
                       pathname.match(/^\/_expo/) ||
                       pathname === '/';
    if (shouldProxy && pathname !== '/') {
      console.log(`📦 Proxying asset: ${pathname} → http://localhost:8081${pathname}`);
    }
    return shouldProxy;
  },
  logLevel: 'silent', // Reduce noise
  onError: (err, req, res) => {
    console.error(`❌ Asset proxy error for ${req.url}:`, err.message);
    res.status(502).json({ error: 'Failed to load asset from Expo dev server' });
  }
}));

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(80));
  console.log('🚀 SERVER STARTED SUCCESSFULLY');
  console.log('='.repeat(80));
  console.log(`\n📡 Server URL: http://localhost:${PORT}`);
  console.log(`🎯 Claude API: ${CLAUDE_API_URL}`);
  console.log(`🔑 API Key Status: ${CLAUDE_API_KEY ? '✅ LOADED & ACTIVE' : '❌ NOT LOADED - WILL FAIL'}`);
  console.log(`\n📊 Test Dashboards:`);
  console.log(`   • http://localhost:${PORT}/test-dashboard`);
  console.log(`   • http://localhost:${PORT}/cupido-test-dashboard`);
  console.log('\n' + '='.repeat(80) + '\n');

  if (!CLAUDE_API_KEY) {
    console.error('⚠️  WARNING: Server started but API key is missing!');
    console.error('⚠️  Requests will return canned responses instead of real AI responses.\n');
  }
});
