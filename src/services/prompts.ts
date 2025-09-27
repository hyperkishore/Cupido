// @ts-nocheck
import { supabase } from './supabase';
import { Prompt, Response } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockPromptService } from './demo/mockPromptService';
import { QuestionLoaderService } from './questionLoader';

export class PromptService {
  private static usedQuestionIds: Set<string> = new Set();

  static async initializeQuestions(): Promise<void> {
    if (!DEMO_MODE) {
      await QuestionLoaderService.loadQuestionsToDatabase();
    }
  }

  static async getTodaysPrompt(userId: string): Promise<Prompt | null> {
    if (DEMO_MODE) {
      return MockPromptService.getTodaysPrompt(userId);
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Check if user already responded today
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00Z`)
      .lt('created_at', `${today}T23:59:59Z`)
      .single();

    if (existingResponse) {
      return null; // User already answered today
    }

    // Get user's previous responses to avoid repeating questions
    const { data: userResponses } = await supabase
      .from('responses')
      .select('prompt_id')
      .eq('user_id', userId);

    const usedPromptIds = userResponses?.map(r => r.prompt_id) || [];

    // Get a random question that hasn't been used
    const question = await QuestionLoaderService.getRandomQuestion(usedPromptIds);
    
    if (!question) {
      // If all questions have been used, reset and get any random question
      const fallbackQuestion = await QuestionLoaderService.getRandomQuestion([]);
      if (!fallbackQuestion) return null;
      
      return {
        id: fallbackQuestion.id,
        question: fallbackQuestion.question,
        type: fallbackQuestion.type || 'text',
        category: fallbackQuestion.category || 'daily_reflection',
        theme: fallbackQuestion.theme,
        tone: fallbackQuestion.tone,
        intendedUseCase: fallbackQuestion.intended_use_case,
        emotionalDepth: fallbackQuestion.emotional_depth,
        createdAt: fallbackQuestion.created_at || new Date().toISOString(),
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
      createdAt: question.created_at || new Date().toISOString(),
    };
  }

  static async submitResponse(
    userId: string,
    promptId: string,
    content: string,
    type: 'text' | 'voice' = 'text',
    audioUrl?: string
  ): Promise<Response> {
    if (DEMO_MODE) {
      return MockPromptService.submitResponse(userId, promptId, content, type, audioUrl);
    }

    const { data, error } = await supabase
      .from('responses')
      .insert({
        user_id: userId,
        prompt_id: promptId,
        content,
        type,
        audio_url: audioUrl,
      })
      .select()
      .single();

    if (error) throw error;

    await this.updateUserStreak(userId);

    return {
      id: data.id,
      userId: data.user_id,
      promptId: data.prompt_id,
      content: data.content,
      type: data.type,
      audioUrl: data.audio_url,
      createdAt: data.created_at,
    };
  }

  private static async updateUserStreak(userId: string) {
    const { data: user } = await supabase
      .from('users')
      .select('streak, last_prompt_date')
      .eq('id', userId)
      .single();

    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const lastPromptDate = user.last_prompt_date?.split('T')[0];
    
    let newStreak = 1;
    
    if (lastPromptDate) {
      const daysDiff = Math.floor((new Date(today).getTime() - new Date(lastPromptDate).getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        newStreak = user.streak + 1;
      } else if (daysDiff > 1) {
        newStreak = 1;
      } else {
        newStreak = user.streak;
      }
    }

    await supabase
      .from('users')
      .update({
        streak: newStreak,
        last_prompt_date: new Date().toISOString(),
      })
      .eq('id', userId);
  }

  static async getUserResponses(userId: string, limit: number = 10): Promise<Response[]> {
    if (DEMO_MODE) {
      return MockPromptService.getUserResponses(userId, limit);
    }

    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data.map(item => ({
      id: item.id,
      userId: item.user_id,
      promptId: item.prompt_id,
      content: item.content,
      type: item.type,
      audioUrl: item.audio_url,
      createdAt: item.created_at,
    }));
  }
}