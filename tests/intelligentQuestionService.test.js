require('./setup/register-ts');
require('./setup/mock-async-storage');
require('./setup/mock-expo-sqlite');
const assert = require('assert');
const { intelligentQuestionService } = require('../src/services/intelligentQuestionService');
const conversationMemoryService = require('../src/services/conversationMemoryService');

conversationMemoryService.getConversationMemory = async () => ({
  totalConversations: 0,
  firstConversationDate: new Date().toISOString(),
  lastConversationDate: new Date().toISOString(),
  conversationHistory: [],
  topicFrequency: {},
  emotionalPatterns: {},
  conversationThemes: {},
  growthMilestones: [],
});

conversationMemoryService.getConversationContext = async () => ({
  recentTopics: [],
  emotionalState: 'neutral',
  conversationDepth: 2,
  preferredQuestionTypes: [],
  avoidedTopics: [],
  lastMentioned: {},
});

conversationMemoryService.generateMemoryReference = async () => undefined;

(async () => {
  await intelligentQuestionService.initialize();
  const result = await intelligentQuestionService.getQuestionWithMemoryContext('');
  assert(result, 'Expected a question to be returned');
  assert(
    result.question.id.startsWith('background_'),
    `Expected introductory background question, received ${result.question.id}`
  );
  console.log('intelligentQuestionService tests passed');
})();
