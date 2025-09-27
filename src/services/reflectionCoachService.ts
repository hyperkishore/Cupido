import { ReflectionAiResult, reflectionAiService } from './reflectionAiService';

export interface CoachContext {
  question: {
    id: string;
    text: string;
    category?: string;
  };
  recentThemes?: string[];
  conversationHistory: Array<{
    role: 'user' | 'coach';
    content: string;
  }>;
}

export interface CoachTurn {
  reply: string;
  aiResult: ReflectionAiResult;
}

const bridgingPhrases = [
  'What that brings to mind is',
  'If you follow that thread a little further',
  'Staying with that feeling for another breath',
  'With that in heart',
];

const buildReply = (aiResult: ReflectionAiResult): string => {
  const bridge = bridgingPhrases[Math.floor(Math.random() * bridgingPhrases.length)];
  const summaryLine = aiResult.summary.length > 0 ? `${aiResult.summary}` : '';
  const affirmationLine = aiResult.affirmation;
  const followUpLine = `${bridge.toLowerCase()} — ${aiResult.followUpQuestion}`;

  return [affirmationLine, summaryLine, followUpLine]
    .filter(Boolean)
    .join('\n\n');
};

export const reflectionCoachService = {
  async createTurn(context: CoachContext, answer: string): Promise<CoachTurn> {
    const aiResult = await reflectionAiService.generateReflection({
      question: context.question,
      answer,
      recentThemes: context.recentThemes,
    });

    return {
      reply: buildReply(aiResult),
      aiResult,
    };
  },
};
