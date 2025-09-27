// @ts-nocheck
import questionsData from '../data/questions.json';

export interface Question {
  theme: string;
  question: string;
  tone: string;
  intended_use_case: string;
  emotional_depth: 'low' | 'medium' | 'high';
}

export interface CategoryQuestion extends Question {
  id: string;
  category: string;
}

class QuestionsService {
  private questions: Question[] = questionsData;
  
  // Map themes to display categories
  private themeToCategory: Record<string, string> = {
    'Self-Discovery': 'SELF-DISCOVERY',
    'Childhood & Memory': 'CHILDHOOD & MEMORY',
    'Relationship & Healing': 'RELATIONSHIP & HEALING',
    'Dating & Connection': 'DATING & CONNECTION',
    'Weekly Reflection': 'WEEKLY REFLECTION',
    'Values & Philosophy': 'VALUES & PHILOSOPHY',
  };

  // Get all questions
  getAllQuestions(): CategoryQuestion[] {
    return this.questions.map((q, index) => ({
      ...q,
      id: `q_${index + 1}`,
      category: this.themeToCategory[q.theme] || q.theme.toUpperCase(),
    }));
  }

  // Get questions by theme
  getQuestionsByTheme(theme: string): CategoryQuestion[] {
    return this.getAllQuestions().filter(q => q.theme === theme);
  }

  // Get questions by emotional depth
  getQuestionsByDepth(depth: 'low' | 'medium' | 'high'): CategoryQuestion[] {
    return this.getAllQuestions().filter(q => q.emotional_depth === depth);
  }

  // Get random question
  getRandomQuestion(): CategoryQuestion {
    const allQuestions = this.getAllQuestions();
    const randomIndex = Math.floor(Math.random() * allQuestions.length);
    return allQuestions[randomIndex];
  }

  // Get daily reflection question (includes demographic questions occasionally)
  getDailyReflectionQuestion(): CategoryQuestion {
    // 30% chance to get a demographic question for data gathering
    const useDemographic = Math.random() < 0.3;
    
    if (useDemographic) {
      const demographicQuestions = this.getDemographicQuestions();
      const randomIndex = Math.floor(Math.random() * demographicQuestions.length);
      return demographicQuestions[randomIndex];
    } else {
      const weeklyReflectionQuestions = this.getQuestionsByTheme('Weekly Reflection');
      const randomIndex = Math.floor(Math.random() * weeklyReflectionQuestions.length);
      return weeklyReflectionQuestions[randomIndex];
    }
  }

  // Get questions for dating/connection
  getConnectionQuestions(): CategoryQuestion[] {
    return this.getQuestionsByTheme('Dating & Connection');
  }

  // Get deep questions for meaningful conversations
  getDeepQuestions(): CategoryQuestion[] {
    return this.getQuestionsByDepth('high');
  }

  // Get lighter questions for ice breakers
  getLightQuestions(): CategoryQuestion[] {
    return this.getQuestionsByDepth('low');
  }

  // Get question by ID
  getQuestionById(id: string): CategoryQuestion | undefined {
    return this.getAllQuestions().find(q => q.id === id);
  }

  // Get recommended questions based on user interaction
  getRecommendedQuestions(userPreferences?: {
    preferredThemes?: string[];
    preferredDepth?: 'low' | 'medium' | 'high';
  }): CategoryQuestion[] {
    let filtered = this.getAllQuestions();

    if (userPreferences?.preferredThemes) {
      filtered = filtered.filter(q => 
        userPreferences.preferredThemes!.includes(q.theme)
      );
    }

    if (userPreferences?.preferredDepth) {
      filtered = filtered.filter(q => 
        q.emotional_depth === userPreferences.preferredDepth
      );
    }

    // Shuffle and return top 10
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 10);
  }

  // Get questions suitable for different relationship stages
  getQuestionsByRelationshipStage(stage: 'getting_to_know' | 'building_trust' | 'deep_intimacy'): CategoryQuestion[] {
    switch (stage) {
      case 'getting_to_know':
        return this.getAllQuestions().filter(q => 
          q.emotional_depth === 'low' || 
          (q.emotional_depth === 'medium' && q.theme === 'Self-Discovery')
        );
      
      case 'building_trust':
        return this.getAllQuestions().filter(q => 
          q.emotional_depth === 'medium' &&
          (q.theme === 'Dating & Connection' || q.theme === 'Values & Philosophy')
        );
      
      case 'deep_intimacy':
        return this.getAllQuestions().filter(q => 
          q.emotional_depth === 'high' &&
          (q.theme === 'Relationship & Healing' || q.theme === 'Values & Philosophy')
        );
      
      default:
        return this.getRandomQuestions(5);
    }
  }

  // Get random selection of questions
  getRandomQuestions(count: number): CategoryQuestion[] {
    const allQuestions = this.getAllQuestions();
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  // Get themed question sets for special occasions
  getThemedQuestions(occasion: 'first_date' | 'deep_conversation' | 'self_reflection' | 'relationship_building'): CategoryQuestion[] {
    switch (occasion) {
      case 'first_date':
        return [
          ...this.getQuestionsByTheme('Childhood & Memory').slice(0, 2),
          ...this.getQuestionsByTheme('Self-Discovery').filter(q => q.emotional_depth === 'low').slice(0, 2),
          ...this.getQuestionsByTheme('Dating & Connection').filter(q => q.emotional_depth === 'low').slice(0, 2),
        ];
      
      case 'deep_conversation':
        return [
          ...this.getQuestionsByTheme('Values & Philosophy').slice(0, 3),
          ...this.getQuestionsByTheme('Relationship & Healing').slice(0, 2),
          ...this.getDeepQuestions().slice(0, 2),
        ];
      
      case 'self_reflection':
        return [
          ...this.getQuestionsByTheme('Self-Discovery').slice(0, 3),
          ...this.getQuestionsByTheme('Weekly Reflection').slice(0, 3),
        ];
      
      case 'relationship_building':
        return [
          ...this.getQuestionsByTheme('Dating & Connection').slice(0, 3),
          ...this.getQuestionsByTheme('Relationship & Healing').slice(0, 2),
        ];
      
      default:
        return this.getRandomQuestions(6);
    }
  }

  // Get basic demographic questions for data gathering
  getDemographicQuestions(): CategoryQuestion[] {
    const demographicQuestions: Question[] = [
      {
        theme: 'Demographics',
        question: 'How many siblings do you have?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics', 
        question: 'Where were you born?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'Which year were you born in?',
        tone: 'casual', 
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'What is your educational background?',
        tone: 'casual',
        intended_use_case: 'demographics', 
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'What field do you work in?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'What city do you currently live in?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'Do you have any pets?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      },
      {
        theme: 'Demographics',
        question: 'What languages do you speak?',
        tone: 'casual',
        intended_use_case: 'demographics',
        emotional_depth: 'low'
      }
    ];

    return demographicQuestions.map((q, index) => ({
      ...q,
      id: `demo_${index + 1}`,
      category: 'DEMOGRAPHICS',
    }));
  }

  // Get questions statistics
  getQuestionsStats() {
    const allQuestions = this.getAllQuestions();
    const themes = [...new Set(allQuestions.map(q => q.theme))];
    const depths = ['low', 'medium', 'high'] as const;
    
    return {
      total: allQuestions.length,
      byTheme: themes.reduce((acc, theme) => {
        acc[theme] = allQuestions.filter(q => q.theme === theme).length;
        return acc;
      }, {} as Record<string, number>),
      byDepth: depths.reduce((acc, depth) => {
        acc[depth] = allQuestions.filter(q => q.emotional_depth === depth).length;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}

export const questionsService = new QuestionsService();