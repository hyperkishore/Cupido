const express = require('express');
const cors = require('cors');

// Ensure fetch is available in the Node runtime (Node < 18 support)
if (typeof globalThis.fetch !== 'function') {
  globalThis.fetch = (...args) =>
    import('node-fetch').then(({ default: fetch }) => fetch(...args));
}

const app = express();
const PORT = Number(process.env.AI_PROXY_PORT || 3001);
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const CLAUDE_API_URL = process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com/v1/messages';

if (!CLAUDE_API_KEY) {
  console.warn(
    '[ClaudeProxy] ANTHROPIC_API_KEY is not set. Requests will fail until the key is configured.'
  );
}

// Enable CORS for all routes
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : true,
}));
app.use(express.json());

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
    console.log('Body:', req.body);
    
    const { messages, modelType = 'haiku' } = req.body;
    
    console.log(`🤖 Proxying to Claude ${modelType.toUpperCase()}`);
    
    // Claude API configuration
    if (!CLAUDE_API_KEY) {
      throw new Error('Missing ANTHROPIC_API_KEY');
    }
    
    // Convert messages format for Anthropic
    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');
    
    // Choose the specific model based on type
    const modelMap = {
      'haiku': 'claude-3-5-haiku-20241022',
      'sonnet': 'claude-3-5-sonnet-20241022'
    };
    
    const maxTokens = modelType === 'sonnet' ? 200 : 100;
    
    const requestBody = {
      model: modelMap[modelType],
      max_tokens: maxTokens,
      system: systemMessage,
      messages: conversationMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    };
    
    console.log(`Calling ${modelMap[modelType]} with ${maxTokens} max tokens`);
    
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
      throw new Error(`Anthropic API error: ${response.status}`);
    }
    
    const data = await response.json();
    
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
      usedModel: modelType
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to get AI response',
      fallback: true
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Proxy server running on http://localhost:${PORT}`);
  console.log(`✅ Ready to proxy Claude API calls to ${CLAUDE_API_URL}`);
});
