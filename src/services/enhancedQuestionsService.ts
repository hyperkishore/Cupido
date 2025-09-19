import questionsData from '../data/questions.json';

export interface EnhancedQuestion {
  id: string;
  theme: string;
  question: string;
  tone: string;
  intendedUseCase: string;
  emotionalDepth: 'low' | 'medium' | 'high';
  category: string; // Simplified category for UI
  color: string; // Theme color for UI
  tags: string[]; // Tags for categorization
  suggestedAnswerTypes: string[]; // Types of answers that work well
  answerPrompts?: string[]; // Prompts to help users answer
}

interface QuestionsByDepth {
  low: EnhancedQuestion[];
  medium: EnhancedQuestion[];
  high: EnhancedQuestion[];
}

class EnhancedQuestionsService {
  private questions: EnhancedQuestion[] = [];
  private questionsByDepth: QuestionsByDepth = { low: [], medium: [], high: [] };
  private questionsByTheme: { [key: string]: EnhancedQuestion[] } = {};

  constructor() {
    this.loadQuestions();
    this.categorizeQuestions();
  }

  private loadQuestions() {
    this.questions = questionsData.map((q, index) => ({
      id: `q${index + 1}`,
      theme: q.theme,
      question: q.question,
      tone: q.tone,
      intendedUseCase: q.intended_use_case,
      emotionalDepth: q.emotional_depth as 'low' | 'medium' | 'high',
      category: this.getSimplifiedCategory(q.theme),
      color: this.getThemeColor(q.theme),
      tags: this.generateTags(q),
      suggestedAnswerTypes: this.generateAnswerTypes(q.question),
      answerPrompts: this.generateAnswerPrompts(q),
    }));
  }

  private getSimplifiedCategory(theme: string): string {
    const categoryMap: { [key: string]: string } = {
      'Self-Discovery': 'SELF',
      'Childhood & Memory': 'MEMORY',
      'Relationship & Healing': 'RELATIONSHIPS',
      'Dating & Connection': 'DATING',
      'Weekly Reflection': 'REFLECTION',
      'Values & Philosophy': 'VALUES',
      'Growth & Change': 'GROWTH',
      'Dreams & Aspirations': 'DREAMS',
      'Communication & Expression': 'COMMUNICATION',
      'Adventure & Exploration': 'ADVENTURE',
      'Creativity & Inspiration': 'CREATIVITY',
      'Identity & Authenticity': 'IDENTITY',
      'Intimacy & Vulnerability': 'INTIMACY',
      'Life Transitions': 'TRANSITIONS',
      'Mindfulness & Presence': 'MINDFULNESS',
      'Purpose & Meaning': 'PURPOSE',
    };
    
    return categoryMap[theme] || 'OTHER';
  }

  private generateTags(q: any): string[] {
    const tags: string[] = [];
    
    // Add depth-based tags
    if (q.emotional_depth === 'high') {
      tags.push('deep', 'vulnerable', 'intimate');
    } else if (q.emotional_depth === 'medium') {
      tags.push('thoughtful', 'reflective');
    } else {
      tags.push('light', 'casual', 'fun');
    }
    
    // Add tone-based tags
    const toneTagMap: Record<string, string[]> = {
      'curious': ['exploration', 'discovery'],
      'nostalgic': ['memory', 'past', 'childhood'],
      'gentle': ['healing', 'soft', 'caring'],
      'vulnerable': ['open', 'honest', 'raw'],
      'contemplative': ['mindful', 'present', 'aware'],
      'reflective': ['introspective', 'thoughtful'],
      'introspective': ['self-aware', 'internal'],
      'playful': ['fun', 'lighthearted', 'creative'],
      'thoughtful': ['considerate', 'deep']
    };
    
    if (toneTagMap[q.tone]) {
      tags.push(...toneTagMap[q.tone]);
    }
    
    // Add theme-based tags
    const themeTagMap: Record<string, string[]> = {
      'Self-Discovery': ['growth', 'identity', 'self'],
      'Childhood & Memory': ['nostalgia', 'past', 'family'],
      'Relationship & Healing': ['connection', 'healing', 'love'],
      'Dating & Connection': ['romance', 'attraction', 'chemistry'],
      'Weekly Reflection': ['mindfulness', 'gratitude', 'weekly'],
      'Values & Philosophy': ['beliefs', 'principles', 'wisdom'],
    };
    
    if (themeTagMap[q.theme]) {
      tags.push(...themeTagMap[q.theme]);
    }
    
    return [...new Set(tags)];
  }

  private generateAnswerTypes(question: string): string[] {
    const types: string[] = [];
    const q = question.toLowerCase();
    
    if (q.includes('tell') || q.includes('describe') || q.includes('share')) {
      types.push('story', 'experience');
    }
    if (q.includes('what') || q.includes('which')) {
      types.push('description', 'choice');
    }
    if (q.includes('how') || q.includes('why')) {
      types.push('explanation', 'reflection');
    }
    if (q.includes('remember') || q.includes('childhood')) {
      types.push('memory', 'nostalgia');
    }
    if (q.includes('feel') || q.includes('emotion')) {
      types.push('feeling', 'emotion');
    }
    if (q.includes('think') || q.includes('believe')) {
      types.push('opinion', 'belief');
    }
    
    if (types.length === 0) {
      types.push('reflection', 'thought');
    }
    
    return types;
  }

  private generateAnswerPrompts(q: any): string[] {
    const prompts: string[] = [];
    
    // Add prompts based on emotional depth
    if (q.emotional_depth === 'high') {
      prompts.push(
        'Take your time with this one',
        'Be honest and vulnerable',
        'Share from your heart'
      );
    } else if (q.emotional_depth === 'medium') {
      prompts.push(
        'Reflect on your experience',
        'Consider what this means to you',
        'Share your perspective'
      );
    } else {
      prompts.push(
        'Have fun with this',
        'Share the first thing that comes to mind',
        'Keep it light and authentic'
      );
    }
    
    // Add theme-specific prompts
    if (q.theme === 'Childhood & Memory') {
      prompts.push('Close your eyes and remember');
    } else if (q.theme === 'Weekly Reflection') {
      prompts.push('Think about this past week');
    } else if (q.theme === 'Dating & Connection') {
      prompts.push('Consider what you are looking for');
    }
    
    return prompts.slice(0, 3);
  }

  private getThemeColor(theme: string): string {
    const colorMap: { [key: string]: string } = {
      'Self-Discovery': '#AF52DE',
      'Childhood & Memory': '#FF9500',
      'Relationship & Healing': '#34C759',
      'Dating & Connection': '#FF6B6B',
      'Weekly Reflection': '#007AFF',
      'Values & Philosophy': '#5856D6',
      'Growth & Change': '#30D158',
      'Dreams & Aspirations': '#64D2FF',
      'Communication & Expression': '#FF375F',
      'Adventure & Exploration': '#FF9F0A',
      'Creativity & Inspiration': '#BF5AF2',
      'Identity & Authenticity': '#FF6482',
      'Intimacy & Vulnerability': '#FF69B4',
      'Life Transitions': '#32ADE6',
      'Mindfulness & Presence': '#40C8E0',
      'Purpose & Meaning': '#6AC4DC',
    };
    
    return colorMap[theme] || '#8E8E93';
  }

  private categorizeQuestions() {
    this.questionsByDepth = { low: [], medium: [], high: [] };
    this.questionsByTheme = {};

    this.questions.forEach(question => {
      // Categorize by depth
      this.questionsByDepth[question.emotionalDepth].push(question);

      // Categorize by theme
      if (!this.questionsByTheme[question.theme]) {
        this.questionsByTheme[question.theme] = [];
      }
      this.questionsByTheme[question.theme].push(question);
    });
  }

  getAllQuestions(): EnhancedQuestion[] {
    return this.questions;
  }

  getQuestionById(id: string): EnhancedQuestion | null {
    return this.questions.find(q => q.id === id) || null;
  }

  getQuestionsByDepth(depth: 'low' | 'medium' | 'high'): EnhancedQuestion[] {
    return this.questionsByDepth[depth];
  }

  getQuestionsByTheme(theme: string): EnhancedQuestion[] {
    return this.questionsByTheme[theme] || [];
  }

  getRandomQuestion(excludeIds: string[] = []): EnhancedQuestion {
    const availableQuestions = this.questions.filter(q => !excludeIds.includes(q.id));
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex] || this.questions[0];
  }

  getDailyQuestion(): EnhancedQuestion {
    // Use date as seed for consistent daily question
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const index = Math.abs(seed) % this.questions.length;
    return this.questions[index];
  }

  getProgressiveQuestion(userLevel: number, answeredIds: string[] = []): EnhancedQuestion {
    // Start with easier questions and progressively get deeper
    let targetDepth: 'low' | 'medium' | 'high';
    
    if (userLevel < 3) {
      targetDepth = 'low';
    } else if (userLevel < 7) {
      targetDepth = 'medium';
    } else {
      targetDepth = 'high';
    }

    const candidateQuestions = this.questionsByDepth[targetDepth].filter(
      q => !answeredIds.includes(q.id)
    );

    if (candidateQuestions.length === 0) {
      // Fall back to any available question
      return this.getRandomQuestion(answeredIds);
    }

    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    return candidateQuestions[randomIndex];
  }

  getThemeBasedQuestion(preferredThemes: string[], answeredIds: string[] = []): EnhancedQuestion {
    const candidateQuestions = this.questions.filter(q => 
      preferredThemes.includes(q.theme) && !answeredIds.includes(q.id)
    );

    if (candidateQuestions.length === 0) {
      return this.getRandomQuestion(answeredIds);
    }

    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    return candidateQuestions[randomIndex];
  }

  getQuestionsForReflectionSession(sessionLength: number, userLevel: number, answeredIds: string[] = []): EnhancedQuestion[] {
    const questions: EnhancedQuestion[] = [];
    const usedIds = [...answeredIds];

    for (let i = 0; i < sessionLength; i++) {
      const question = this.getProgressiveQuestion(userLevel + i, usedIds);
      questions.push(question);
      usedIds.push(question.id);
    }

    return questions;
  }

  getAvailableThemes(): string[] {
    return Object.keys(this.questionsByTheme);
  }

  getQuestionStats() {
    return {
      total: this.questions.length,
      byDepth: {
        low: this.questionsByDepth.low.length,
        medium: this.questionsByDepth.medium.length,
        high: this.questionsByDepth.high.length,
      },
      themes: this.getAvailableThemes().length,
    };
  }

  searchQuestions(searchTerm: string): EnhancedQuestion[] {
    const term = searchTerm.toLowerCase();
    return this.questions.filter(q => 
      q.question.toLowerCase().includes(term) ||
      q.theme.toLowerCase().includes(term) ||
      q.tone.toLowerCase().includes(term) ||
      q.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  getQuestionsByTags(tags: string[]): EnhancedQuestion[] {
    return this.questions.filter(q => 
      tags.some(tag => q.tags.includes(tag))
    );
  }

  getQuestionWithGuidance(questionId: string): {
    question: EnhancedQuestion;
    starterPhrases: string[];
    followUpQuestions: string[];
  } | null {
    const question = this.getQuestionById(questionId);
    if (!question) return null;
    
    // Generate starter phrases based on answer types
    const starterPhrases: string[] = [];
    if (question.suggestedAnswerTypes.includes('story')) {
      starterPhrases.push('I remember when...', 'There was this time...');
    }
    if (question.suggestedAnswerTypes.includes('feeling')) {
      starterPhrases.push('It makes me feel...', 'I experience...');
    }
    if (question.suggestedAnswerTypes.includes('opinion')) {
      starterPhrases.push('I believe that...', 'In my view...');
    }
    if (question.suggestedAnswerTypes.includes('memory')) {
      starterPhrases.push('I can still remember...', 'Looking back...');
    }
    
    // Generate follow-up questions
    const followUpQuestions: string[] = [];
    if (question.theme === 'Self-Discovery') {
      followUpQuestions.push(
        'How has this shaped who you are?',
        'What would you tell your younger self?'
      );
    } else if (question.theme === 'Relationship & Healing') {
      followUpQuestions.push(
        'What did this teach you about love?',
        'How has this changed your relationships?'
      );
    } else {
      followUpQuestions.push(
        'What made this significant for you?',
        'How does this influence your daily life?'
      );
    }
    
    return {
      question,
      starterPhrases: starterPhrases.slice(0, 3),
      followUpQuestions: followUpQuestions.slice(0, 2)
    };
  }
}

export const enhancedQuestionsService = new EnhancedQuestionsService();