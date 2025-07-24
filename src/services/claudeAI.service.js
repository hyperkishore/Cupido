// Mock Claude AI service for demo purposes
// In production, this would use the actual Anthropic SDK

class ClaudeAIService {
  constructor() {
    this.apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY || '';
    // In production, initialize Anthropic SDK here
  }

  async generateReflectionQuestion(userContext) {
    try {
      const previousQuestionsText = userContext?.previousQuestions?.length 
        ? `Previous questions asked: ${userContext.previousQuestions.join(', ')}`
        : '';
      
      const skipContext = userContext?.skipReason 
        ? `The user skipped the last question because: "${userContext.skipReason}". Please generate a different type of question.`
        : '';

      // Mock AI response for demo
      // In production, this would call the Anthropic API
      const mockQuestions = [
        {
          question: "What moment from today would you like to remember?",
          category: "Reflection"
        },
        {
          question: "How did you show kindness to yourself or others today?",
          category: "Personal Growth"
        },
        {
          question: "What challenged you today and how did you respond?",
          category: "Personal Growth"
        },
        {
          question: "What are you grateful for in this moment?",
          category: "Reflection"
        },
        {
          question: "How have your relationships evolved recently?",
          category: "Relationships"
        },
        {
          question: "What's something you've been avoiding that deserves your attention?",
          category: "Personal Growth"
        },
        {
          question: "How do you want to feel tomorrow, and what can you do to support that?",
          category: "Dreams"
        },
        {
          question: "What value did you live out today?",
          category: "Values"
        },
        {
          question: "What surprised you about yourself recently?",
          category: "Reflection"
        },
        {
          question: "How are you different from who you were a year ago?",
          category: "Personal Growth"
        }
      ];
      
      // Filter out previous questions if any
      let availableQuestions = mockQuestions;
      if (userContext?.previousQuestions?.length) {
        availableQuestions = mockQuestions.filter(q => 
          !userContext.previousQuestions.includes(q.question)
        );
      }
      
      // If user skipped for being too personal, choose lighter topics
      if (userContext?.skipReason?.includes('personal') || userContext?.skipReason?.includes('uncomfortable')) {
        availableQuestions = availableQuestions.filter(q => 
          q.category === 'Dreams' || q.question.includes('grateful') || q.question.includes('tomorrow')
        );
      }
      
      const selected = availableQuestions[Math.floor(Math.random() * availableQuestions.length)] || this.getFallbackQuestion();
      return {
        ...selected,
        id: `generated_${Date.now()}`
      };

    } catch (error) {
      console.error('Error generating question:', error);
      return this.getFallbackQuestion();
    }
  }

  async generateFollowUpQuestion(originalQuestion, userResponse) {
    try {
      // Mock follow-up based on keywords in response
      if (userResponse.toLowerCase().includes('difficult') || userResponse.toLowerCase().includes('hard')) {
        return {
          id: `followup_${Date.now()}`,
          question: "What helped you navigate through that difficulty?",
          category: "Personal Growth"
        };
      } else if (userResponse.toLowerCase().includes('happy') || userResponse.toLowerCase().includes('joy')) {
        return {
          id: `followup_${Date.now()}`,
          question: "What made that moment especially meaningful to you?",
          category: "Reflection"
        };
      } else if (userResponse.toLowerCase().includes('grateful') || userResponse.toLowerCase().includes('thankful')) {
        return {
          id: `followup_${Date.now()}`,
          question: "How can you cultivate more of that gratitude in your daily life?",
          category: "Personal Growth"
        };
      } else if (userResponse.toLowerCase().includes('worried') || userResponse.toLowerCase().includes('anxious')) {
        return {
          id: `followup_${Date.now()}`,
          question: "What would it look like to approach this with compassion for yourself?",
          category: "Reflection"
        };
      } else {
        return {
          id: `followup_${Date.now()}`,
          question: "Can you tell me more about what that experience taught you?",
          category: "Reflection"
        };
      }
    } catch (error) {
      console.error('Error generating follow-up:', error);
      return this.getFallbackQuestion();
    }
  }

  getFallbackQuestion() {
    const fallbackQuestions = [
      {
        question: "What's something that made you feel grateful today?",
        category: "Reflection"
      },
      {
        question: "What's a small moment from today that you'd like to remember?",
        category: "Personal Growth"
      },
      {
        question: "How are you feeling right now, in this moment?",
        category: "Reflection"
      },
      {
        question: "What's something you're looking forward to?",
        category: "Dreams"
      },
      {
        question: "What's one way you showed kindness today?",
        category: "Values"
      }
    ];

    const random = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
    
    return {
      id: `fallback_${Date.now()}`,
      question: random.question,
      category: random.category
    };
  }

  async analyzeResponseAuthenticity(response) {
    try {
      // Mock authenticity scoring based on response characteristics
      let score = 50; // Base score
      
      // Length bonus
      if (response.length > 100) score += 10;
      if (response.length > 200) score += 10;
      
      // Personal pronouns
      const personalWords = (response.match(/\b(I|me|my|myself)\b/gi) || []).length;
      score += Math.min(personalWords * 2, 15);
      
      // Emotion words
      const emotionWords = (response.match(/\b(feel|felt|happy|sad|angry|excited|worried|grateful|love|hope|fear)\b/gi) || []).length;
      score += Math.min(emotionWords * 3, 15);
      
      // Specific details (numbers, "when", "because")
      const detailWords = (response.match(/\b(\d+|when|because|yesterday|today|last|specific|remember)\b/gi) || []).length;
      score += Math.min(detailWords * 2, 10);
      
      // Vulnerability indicators
      const vulnerabilityWords = (response.match(/\b(struggle|difficult|challenge|mistake|wrong|sorry|wish)\b/gi) || []).length;
      score += Math.min(vulnerabilityWords * 4, 10);
      
      return Math.min(100, Math.max(0, score));
    } catch (error) {
      console.error('Error analyzing authenticity:', error);
      return 75; // Default score
    }
  }
}

export const claudeAIService = new ClaudeAIService();