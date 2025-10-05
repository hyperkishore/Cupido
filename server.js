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
// Increase body size limit to 10MB
app.use(express.json({ limit: '10mb' }));

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

    // Process messages - handle both text and images
    const processedMessages = conversationMessages.map(msg => {
      // Check if this message should have image data attached
      if (msg.role === 'user' && imageData && msg.includeImage) {
        // Claude expects images as part of content array
        return {
          role: 'user',
          content: [
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
          ]
        };
      }
      // Regular text message
      return {
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      };
    });

    const requestBody = {
      model: modelMap[modelType],
      max_tokens: maxTokens,
      system: systemMessage,
      messages: processedMessages
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
