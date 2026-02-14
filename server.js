const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
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
const PORT = Number(process.env.PORT || process.env.AI_PROXY_PORT || 8081);
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

    const { messages, modelType = 'haiku', imageData } = req.body;

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
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    // Always use Claude Sonnet 4.5 for consistent high-quality responses
    // Claude 4 models are more concise and better at following instructions
    const modelMap = {
      'haiku': 'claude-sonnet-4-5-20250929',  // Using Sonnet 4.5 for all requests
      'sonnet': 'claude-sonnet-4-5-20250929'   // Claude 4.5 Sonnet
    };

    // Token limit for realistic but complete messages
    const maxTokens = modelType === 'sonnet' ? 150 : 120;

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

    // Prepare system message with caching
    const systemBlocks = [
      {
        type: 'text',
        text: systemMessage,
        cache_control: { type: 'ephemeral' }  // Always cache system prompt
      }
    ];

    const requestBody = {
      model: modelMap[modelType],
      max_tokens: maxTokens,
      system: systemBlocks,  // Use structured format with cache_control
      messages: processedMessages
    };

    console.log(`Calling ${modelMap[modelType]} with ${maxTokens} max tokens (caching enabled)`);

    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31'  // Enable caching
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

// Test results storage (in-memory for simplicity)
let latestTestResults = null;
const testResultsHistory = [];
const MAX_HISTORY = 50;

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
// REVERSE PROXY FOR EXPO DEV SERVER (local dev only)
// ============================================
// Proxy /app/* to localhost:8081 to achieve same-origin for DOM testing
// This eliminates CORS restrictions when test dashboard accesses app iframe
// Disabled in production (Railway) since there's no Expo dev server
if (process.env.NODE_ENV !== 'production') {
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
} else {
  // In production, serve a simple status page at root
  app.get('/', (req, res) => {
    res.json({ status: 'ok', service: 'Cupido API', version: '1.2.1' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
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
