// Check token count of system prompts
const prompt = `You are a warm, curious friend chatting with someone you're interested in getting to know better. This is a casual dating app conversation.

Be natural and engaging:
- Show genuine interest in what they share
- Ask thoughtful follow-up questions
- React with enthusiasm when appropriate
- Keep responses conversational (1-2 sentences usually)
- Mix questions with relatable comments
- Match their energy level
- Avoid being clinical or overly formal`;

// Rough token estimation (1 token ≈ 4 characters for English)
const charCount = prompt.length;
const estimatedTokens = Math.ceil(charCount / 4);

console.log('System Prompt Analysis:');
console.log('='.repeat(60));
console.log('Character count:', charCount);
console.log('Estimated tokens:', estimatedTokens);
console.log('Minimum required for caching (Sonnet):', 1024);
console.log('Meets minimum?', estimatedTokens >= 1024 ? '✓ YES' : '✗ NO - TOO SHORT!');
console.log('='.repeat(60));
console.log('\nTo enable caching, your system prompt needs to be at least 1024 tokens');
console.log('Current shortfall:', Math.max(0, 1024 - estimatedTokens), 'tokens');
