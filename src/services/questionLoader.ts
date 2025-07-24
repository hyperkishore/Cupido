import { supabase } from './supabase';
import { DEMO_MODE } from '../config/demo';
import questionsData from '../data/questions.json';

interface QuestionData {
  theme: string;
  question: string;
  tone: string;
  intended_use_case: string;
  emotional_depth: string;
}

export class QuestionLoaderService {
  static async loadQuestionsToDatabase(): Promise<void> {
    if (DEMO_MODE) {
      console.log('Demo mode: Questions loaded to memory');
      return;
    }

    try {
      // Check if questions already exist
      const { count } = await supabase
        .from('prompts')
        .select('*', { count: 'exact', head: true });

      if (count && count > 0) {
        console.log(`${count} questions already exist in database`);
        return;
      }

      // Transform questions for database format
      const promptsToInsert = questionsData.map((q: QuestionData) => ({
        question: q.question,
        type: 'text', // Default to text, can be updated later
        category: 'daily_reflection',
        theme: q.theme.toLowerCase().replace(/\s+/g, '_'),
        tone: q.tone,
        intended_use_case: q.intended_use_case,
        emotional_depth: q.emotional_depth,
      }));

      // Insert questions in batches
      const batchSize = 50;
      for (let i = 0; i < promptsToInsert.length; i += batchSize) {
        const batch = promptsToInsert.slice(i, i + batchSize);
        
        const { error } = await supabase
          .from('prompts')
          .insert(batch);

        if (error) {
          console.error(`Error inserting batch ${Math.floor(i / batchSize) + 1}:`, error);
          throw error;
        }

        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} (${batch.length} questions)`);
      }

      console.log(`Successfully loaded ${promptsToInsert.length} questions to database`);
      
    } catch (error) {
      console.error('Error loading questions to database:', error);
      throw error;
    }
  }

  static async getQuestionsByTheme(theme: string, limit: number = 10): Promise<any[]> {
    if (DEMO_MODE) {
      return questionsData
        .filter((q: QuestionData) => q.theme.toLowerCase().replace(/\s+/g, '_') === theme.toLowerCase())
        .slice(0, limit);
    }

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('theme', theme.toLowerCase().replace(/\s+/g, '_'))
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getQuestionsByEmotionalDepth(depth: 'low' | 'medium' | 'high', limit: number = 10): Promise<any[]> {
    if (DEMO_MODE) {
      return questionsData
        .filter((q: QuestionData) => q.emotional_depth === depth)
        .slice(0, limit);
    }

    const { data, error } = await supabase
      .from('prompts')
      .select('*')
      .eq('emotional_depth', depth)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  static async getRandomQuestion(excludeIds: string[] = []): Promise<any | null> {
    if (DEMO_MODE) {
      const availableQuestions = questionsData.filter((_, index) => 
        !excludeIds.includes(`demo_${index}`)
      );
      
      if (availableQuestions.length === 0) return null;
      
      const randomIndex = Math.floor(Math.random() * availableQuestions.length);
      const question = availableQuestions[randomIndex];
      
      return {
        id: `demo_${questionsData.indexOf(question)}`,
        question: question.question,
        type: 'text',
        category: 'daily_reflection',
        theme: question.theme.toLowerCase().replace(/\s+/g, '_'),
        tone: question.tone,
        intended_use_case: question.intended_use_case,
        emotional_depth: question.emotional_depth,
        createdAt: new Date().toISOString(),
      };
    }

    let query = supabase
      .from('prompts')
      .select('*');

    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    if (!data || data.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * data.length);
    return data[randomIndex];
  }

  static async getAllThemes(): Promise<string[]> {
    if (DEMO_MODE) {
      const themes = [...new Set(questionsData.map((q: QuestionData) => q.theme))];
      return themes;
    }

    const { data, error } = await supabase
      .from('prompts')
      .select('theme')
      .order('theme');

    if (error) throw error;
    
    const themes = [...new Set(data?.map(item => item.theme) || [])];
    return themes;
  }

  static async getQuestionStats(): Promise<{
    totalQuestions: number;
    themeBreakdown: Record<string, number>;
    depthBreakdown: Record<string, number>;
  }> {
    if (DEMO_MODE) {
      const themeBreakdown: Record<string, number> = {};
      const depthBreakdown: Record<string, number> = {};
      
      questionsData.forEach((q: QuestionData) => {
        const theme = q.theme.toLowerCase().replace(/\s+/g, '_');
        themeBreakdown[theme] = (themeBreakdown[theme] || 0) + 1;
        depthBreakdown[q.emotional_depth] = (depthBreakdown[q.emotional_depth] || 0) + 1;
      });

      return {
        totalQuestions: questionsData.length,
        themeBreakdown,
        depthBreakdown,
      };
    }

    const { data, error } = await supabase
      .from('prompts')
      .select('theme, emotional_depth');

    if (error) throw error;

    const themeBreakdown: Record<string, number> = {};
    const depthBreakdown: Record<string, number> = {};
    
    data?.forEach(item => {
      themeBreakdown[item.theme] = (themeBreakdown[item.theme] || 0) + 1;
      depthBreakdown[item.emotional_depth] = (depthBreakdown[item.emotional_depth] || 0) + 1;
    });

    return {
      totalQuestions: data?.length || 0,
      themeBreakdown,
      depthBreakdown,
    };
  }
}