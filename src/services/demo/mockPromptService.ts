import { Prompt, Response } from '../../types';
import { DEMO_RESPONSES } from './mockData';
import { QuestionLoaderService } from '../questionLoader';

export class MockPromptService {
  private static prompts: string[] = [
    "What made you smile today, and why did it resonate with you?",
    "Describe a moment when you felt most authentically yourself.",
    "What's a belief you held strongly that has evolved over time?",
    "When do you feel most energized and alive?",
    "What's something you're curious about that others might find unusual?",
    "Describe a time when you showed courage in a small way.",
    "What does intimacy mean to you beyond physical connection?",
    "What's a childhood memory that still influences how you see the world?",
    "When do you feel most misunderstood, and what would help?",
    "What's something you've learned about yourself through difficulty?",
    "Describe your ideal Sunday afternoon and why it appeals to you.",
    "What's a compliment you received that surprised you?",
    "When do you feel most creative or inspired?",
    "What's something you do that you wish more people understood?",
    "Describe a place that feels like home to you and why.",
    "What's a fear you're working on overcoming?",
    "When do you feel most connected to others?",
    "What's something you've changed your mind about recently?",
    "Describe a moment when you felt deeply grateful.",
    "What's a quality you admire in others that you're developing in yourself?",
  ];

  static async getTodaysPrompt(userId: string): Promise<Prompt | null> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already responded today
    const hasResponded = DEMO_RESPONSES.some(response => 
      response.userId === userId && response.createdAt.startsWith(today)
    );
    
    if (hasResponded) {
      return null;
    }

    // Get user's used prompt IDs
    const userResponses = DEMO_RESPONSES.filter(r => r.userId === userId);
    const usedPromptIds = userResponses.map(r => r.promptId);

    // Get a random question that hasn't been used by this user
    const question = await QuestionLoaderService.getRandomQuestion(usedPromptIds);
    
    if (!question) {
      // Fallback to any random question if all have been used
      const fallbackQuestion = await QuestionLoaderService.getRandomQuestion([]);
      if (!fallbackQuestion) {
        // Ultimate fallback to legacy prompt system
        const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const promptIndex = dayOfYear % this.prompts.length;
        
        return {
          id: `legacy_prompt_${today}`,
          question: this.prompts[promptIndex],
          type: 'text',
          category: 'daily_reflection',
          createdAt: new Date().toISOString(),
        };
      }
      
      return {
        id: fallbackQuestion.id,
        question: fallbackQuestion.question,
        type: fallbackQuestion.type || 'text',
        category: fallbackQuestion.category || 'daily_reflection',
        theme: fallbackQuestion.theme,
        tone: fallbackQuestion.tone,
        intendedUseCase: fallbackQuestion.intended_use_case,
        emotionalDepth: fallbackQuestion.emotional_depth,
        createdAt: fallbackQuestion.createdAt || new Date().toISOString(),
      };
    }

    return {
      id: question.id,
      question: question.question,
      type: question.type || 'text',
      category: question.category || 'daily_reflection',
      theme: question.theme,
      tone: question.tone,
      intendedUseCase: question.intended_use_case,
      emotionalDepth: question.emotional_depth,
      createdAt: question.createdAt || new Date().toISOString(),
    };
  }

  static async submitResponse(
    userId: string,
    promptId: string,
    content: string,
    type: 'text' | 'voice' = 'text',
    audioUrl?: string
  ): Promise<Response> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const response: Response = {
      id: `resp_${Date.now()}`,
      userId,
      promptId,
      content,
      type,
      audioUrl,
      createdAt: new Date().toISOString(),
    };

    // Add to demo responses
    DEMO_RESPONSES.unshift(response);

    return response;
  }

  static async getUserResponses(userId: string, limit: number = 10): Promise<Response[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return DEMO_RESPONSES.slice(0, limit);
  }
}