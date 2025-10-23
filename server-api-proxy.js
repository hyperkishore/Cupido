// Add this to your server.js file for secure API calls
// NEVER expose API keys in client code!

const rateLimit = require('express-rate-limit');
const Anthropic = require('@anthropic-ai/sdk');

// Initialize Anthropic client (server-side only!)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // Server environment variable
});

// Rate limiting middleware
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute per IP
  message: 'Too many AI requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

// Daily message limit check
async function checkDailyLimit(req, res, next) {
  const userId = req.body.userId;
  if (!userId) {
    return res.status(400).json({ error: 'User ID required' });
  }

  try {
    // Get user's daily count from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('daily_message_count, last_message_reset')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking daily limit:', error);
      return res.status(500).json({ error: 'Failed to check message limit' });
    }

    // Reset count if it's a new day
    const today = new Date().toISOString().split('T')[0];
    const lastReset = profile.last_message_reset;
    
    if (lastReset !== today) {
      await supabase
        .from('profiles')
        .update({ 
          daily_message_count: 0, 
          last_message_reset: today 
        })
        .eq('id', userId);
      
      profile.daily_message_count = 0;
    }

    // Check if over limit (50 messages per day)
    if (profile.daily_message_count >= 50) {
      return res.status(429).json({ 
        error: 'Daily message limit reached (50 messages). Try again tomorrow!' 
      });
    }

    // Pass the count to next middleware
    req.dailyMessageCount = profile.daily_message_count;
    next();
  } catch (error) {
    console.error('Daily limit check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Secure AI endpoint
app.post('/api/chat', aiRateLimiter, checkDailyLimit, async (req, res) => {
  try {
    const { messages, userId, model = 'haiku' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Sanitize messages (remove any potential injection)
    const sanitizedMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.content).substring(0, 4000) // Limit message length
    }));

    // Call Anthropic API (server-side)
    const completion = await anthropic.messages.create({
      model: model === 'sonnet' ? 
        'claude-3-5-sonnet-20241022' : 
        'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: sanitizedMessages,
      temperature: 0.7,
    });

    // Update daily count
    await supabase
      .from('profiles')
      .update({ 
        daily_message_count: req.dailyMessageCount + 1,
        last_message_time: new Date().toISOString()
      })
      .eq('id', userId);

    // Return response
    res.json({
      message: completion.content[0].text,
      usage: {
        input_tokens: completion.usage.input_tokens,
        output_tokens: completion.usage.output_tokens,
      },
      model: model,
      remaining_today: 49 - req.dailyMessageCount
    });

  } catch (error) {
    console.error('AI API error:', error);
    
    // Don't expose internal errors to client
    if (error.status === 429) {
      res.status(429).json({ error: 'AI service is busy, please try again' });
    } else {
      res.status(500).json({ error: 'Failed to generate response' });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Add to your existing server.js:
/*
const rateLimit = require('express-rate-limit');
// Copy the code above into your server.js
*/