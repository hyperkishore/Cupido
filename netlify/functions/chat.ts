import { Handler } from '@netlify/functions';

interface ChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  modelType: 'haiku' | 'sonnet';
  imageData?: {
    base64: string;
    mimeType: string;
  };
}

export const handler: Handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse request body
    const body: ChatRequest = JSON.parse(event.body || '{}');
    const { messages, modelType = 'sonnet', imageData } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Messages array is required' }),
      };
    }

    // Get API key from environment
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API configuration error' }),
      };
    }

    // Select Claude model
    const modelMap = {
      haiku: 'claude-3-haiku-20240307',
      sonnet: 'claude-3-5-sonnet-20241022'
    };
    const model = modelMap[modelType];

    // Prepare messages for Claude API
    const claudeMessages = messages.filter(msg => msg.role !== 'system').map(msg => {
      if (imageData && msg.role === 'user' && messages.indexOf(msg) === messages.length - 1) {
        // Add image to the last user message
        return {
          role: msg.role,
          content: [
            {
              type: 'text',
              text: msg.content
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageData.mimeType,
                data: imageData.base64
              }
            }
          ]
        };
      }
      return {
        role: msg.role,
        content: msg.content
      };
    });

    // Get system message
    const systemMessage = messages.find(msg => msg.role === 'system')?.content || '';

    // Call Claude API
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        messages: claudeMessages,
        system: systemMessage,
      }),
    });

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text();
      console.error('Claude API error:', claudeResponse.status, errorText);
      return {
        statusCode: claudeResponse.status,
        headers,
        body: JSON.stringify({ 
          error: `Claude API error: ${claudeResponse.status}`,
          details: errorText 
        }),
      };
    }

    const claudeData = await claudeResponse.json();
    
    // Extract message content
    const message = claudeData.content?.[0]?.text || 'Sorry, I had trouble processing that request.';

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message,
        model: modelType,
        usage: claudeData.usage 
      }),
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
    };
  }
};