require('./setup/register-ts');
require('./setup/mock-async-storage');
require('./setup/mock-expo-sqlite');
const assert = require('assert');
const { reflectionAiService } = require('../src/services/reflectionAiService');

(async () => {
  const positive = await reflectionAiService.generateReflection({
    question: { id: 'q1', text: 'What made you smile today?', category: 'SELF-DISCOVERY' },
    answer: 'I felt so happy and grateful walking by the ocean with my best friend. It filled me with joy.',
    recentThemes: ['gratitude'],
  });

  assert.strictEqual(positive.mood, 'uplifted', 'Should classify upbeat responses as uplifted');
  assert.ok(positive.summary.includes('happy') || positive.summary.includes('grateful'));
  assert.ok(positive.tags.includes('gratitude'), 'Tags should include gratitude keyword');
  assert.ok(positive.followUpQuestion.length > 10, 'Follow-up question should have meaningful content');

  const vulnerable = await reflectionAiService.generateReflection({
    question: { id: 'q2', text: 'What felt difficult this week?', category: 'RELATIONSHIP & HEALING' },
    answer: 'It was difficult to admit how scared I was about the conversation. I felt vulnerable but relieved afterward.',
  });

  assert.strictEqual(vulnerable.mood, 'vulnerable', 'Vulnerable tone should be detected');
  assert.ok(vulnerable.tags.includes('vulnerability'));
  assert.notStrictEqual(vulnerable.summary.length, 0, 'Summary should not be empty');

  console.log('reflectionAiService tests passed');
})();
