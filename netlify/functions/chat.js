const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { messages, modelType = 'haiku' } = JSON.parse(event.body);

    // Use environment variable or the hardcoded fallback
    const apiKey = process.env.ANTHROPIC_API_KEY || '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';

    if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
      console.error('Anthropic API key not configured');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'API key not configured',
          details: 'Please configure ANTHROPIC_API_KEY in Netlify environment variables',
        }),
      };
    }

    console.log('Using Anthropic API with model:', modelType);
    const anthropic = new Anthropic({
      apiKey: apiKey,
    });

    // Always use Claude Sonnet 4.5 (September 2024 version)
    // This is the latest Claude 4 model optimized for long-running agents and coding
    const model = 'claude-sonnet-4-5-20250929';

    // Extract system message and convert to Anthropic format
    const systemMessage = messages.find(msg => msg.role === 'system');
    const conversationMessages = messages.filter(msg => msg.role !== 'system');

    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 150,  // Match the server.js setting for consistency
      temperature: 0.7,
      system: systemMessage?.content || '',
      messages: conversationMessages,
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: response.content[0].text,
        usedModel: modelType,
      }),
    };
  } catch (error) {
    console.error('Error calling Anthropic API:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate response',
        details: error.message,
      }),
    };
  }
};