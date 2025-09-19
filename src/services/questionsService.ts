import questionsData from '../data/questions.json';

export interface Question {
  id: string;
  text: string;
  category: string;
  theme: string;
}

class QuestionsService {
  private questions: Question[] = [];

  constructor() {
    this.loadQuestions();
  }

  private loadQuestions() {
    this.questions = questionsData.map((q, index) => ({
      id: `q${index + 1}`,
      text: q.question,
      category: q.theme.toUpperCase().replace(/\s+/g, '_'),
      theme: q.theme,
    }));
  }

  getAllQuestions(): Question[] {
    return this.questions;
  }

  getQuestionById(id: string): Question | null {
    return this.questions.find(q => q.id === id) || null;
  }

  getRandomQuestion(): Question {
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    return this.questions[randomIndex];
  }

  getQuestionsByCategory(category: string): Question[] {
    return this.questions.filter(q => 
      q.theme.toLowerCase().includes(category.toLowerCase())
    );
  }

  getNextReflectionQuestion(previousQuestionIds: string[] = []): Question {
    // Filter out previously answered questions
    const availableQuestions = this.questions.filter(q => 
      !previousQuestionIds.includes(q.id)
    );

    if (availableQuestions.length === 0) {
      // If all questions have been answered, return a random one
      return this.getRandomQuestion();
    }

    // Prioritize relationship and personal growth questions
    const priorityQuestions = availableQuestions.filter(q =>
      q.theme.toLowerCase().includes('relationship') ||
      q.theme.toLowerCase().includes('personal') ||
      q.theme.toLowerCase().includes('self')
    );

    if (priorityQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * priorityQuestions.length);
      return priorityQuestions[randomIndex];
    }

    // Otherwise return any available question
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }

  getDailyQuestion(): Question {
    // Use date as seed for consistent daily question
    const today = new Date().toDateString();
    const seed = today.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const index = Math.abs(seed) % this.questions.length;
    return this.questions[index];
  }
}

export const questionsService = new QuestionsService();