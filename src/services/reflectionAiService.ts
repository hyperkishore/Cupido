export interface ReflectionAiInput {
  question: {
    id: string;
    text: string;
    category?: string;
  };
  answer: string;
  recentThemes?: string[];
}

export interface ReflectionAiResult {
  summary: string;
  affirmation: string;
  followUpQuestion: string;
  mood: 'uplifted' | 'reflective' | 'vulnerable' | 'energized' | 'uncertain';
  tags: string[];
  insights: string[];
}

interface ReflectionAiProvider {
  generate(input: ReflectionAiInput): Promise<ReflectionAiResult>;
}

const positiveKeywords = ['happy', 'grateful', 'joy', 'excited', 'love', 'proud', 'peaceful'];
const growthKeywords = ['learned', 'growth', 'improve', 'practice', 'progress', 'habit', 'evolving', 'develop'];
const vulnerabilityKeywords = ['anxious', 'afraid', 'fear', 'difficult', 'struggle', 'vulnerable', 'hard', 'scared'];
const energyKeywords = ['energized', 'alive', 'motivated', 'charged', 'driven'];

const categoryFollowUps: Record<string, string[]> = {
  'VALUES & PHILOSOPHY': [
    'What value from this reflection do you want to protect this week?',
    'How does this insight influence the way you want to show up tomorrow?',
    'What would practicing this belief look like in a small way?' 
  ],
  'SELF-DISCOVERY': [
    'What surprised you about what you shared?',
    'What story from your past echoes this feeling?',
    'Where do you notice this part of you showing up the most?' 
  ],
  'RELATIONSHIP & HEALING': [
    'Who might you want to share this with?',
    'What boundary or invitation does this reflection inspire?',
    'How could you give yourself the care you are craving here?' 
  ],
  'DATING & CONNECTION': [
    'What would sharing this with someone new feel like?',
    'How would you want a partner to respond to this part of you?',
    'What connection are you hoping this leads toward?' 
  ],
  'CHILDHOOD & MEMORY': [
    'What detail from that memory feels most alive right now?',
    'How has that moment shaped who you are becoming?',
    'What feeling from that time do you want to reclaim or release?' 
  ],
};

const localAffirmations: Record<ReflectionAiResult['mood'], string[]> = {
  uplifted: [
    'I can feel the warmth in what you shared—thank you for letting it shine.',
    'There is a quiet brightness in your words that feels contagious.',
    'You captured a slice of joy that deserves to be savored.'
  ],
  reflective: [
    "You articulated this with so much clarity—I'm listening deeply.",
    'This reflection shows how thoughtfully you map your inner world.',
    'You are tracing meaning with so much intention—keep going.'
  ],
  vulnerable: [
    'Thank you for trusting this space with something tender.',
    'Your honesty here feels brave and incredibly human.',
    'You allowed yourself to be seen, and that matters.'
  ],
  energized: [
    'Your energy is palpable—I love how alive this makes you feel.',
    'You sound ready to move, create, and invite others into it.',
    "It's inspiring to feel this spark through your words."
  ],
  uncertain: [
    'You honoured the uncertainty without turning away from it.',
    'There is wisdom in naming that you are still figuring it out.',
    'Staying present with the unknown like this takes quiet courage.'
  ],
};

class LocalReflectionAiProvider implements ReflectionAiProvider {
  private detectMood(answer: string): ReflectionAiResult['mood'] {
    const lower = answer.toLowerCase();

    if (vulnerabilityKeywords.some((word) => lower.includes(word))) {
      return 'vulnerable';
    }

    if (energyKeywords.some((word) => lower.includes(word))) {
      return 'energized';
    }

    if (positiveKeywords.some((word) => lower.includes(word))) {
      return 'uplifted';
    }

    if (lower.includes('uncertain') || lower.includes('unsure') || lower.includes('confused')) {
      return 'uncertain';
    }

    return 'reflective';
  }

  private deriveTags(answer: string, category?: string, recentThemes: string[] = []): string[] {
    const tags = new Set<string>();
    const lower = answer.toLowerCase();

    if (category) {
      tags.add(category.toLowerCase().replace(/ & /g, '_').replace(/\s+/g, '_'));
    }

    if (positiveKeywords.some((word) => lower.includes(word))) {
      tags.add('gratitude');
    }

    if (growthKeywords.some((word) => lower.includes(word))) {
      tags.add('growth');
    }

    if (vulnerabilityKeywords.some((word) => lower.includes(word))) {
      tags.add('vulnerability');
    }

    if (lower.includes('friend') || lower.includes('partner') || lower.includes('relationship')) {
      tags.add('connection');
    }

    if (lower.includes('child') || lower.includes('family') || lower.includes('home')) {
      tags.add('roots');
    }

    recentThemes.slice(0, 2).forEach((theme) => tags.add(theme));

    return Array.from(tags);
  }

  private craftSummary(answer: string): string {
    const trimmed = answer.trim();
    if (trimmed.length <= 140) {
      return trimmed;
    }

    const sentences = trimmed.split(/(?<=[.!?])\s+/).filter(Boolean);
    if (sentences.length > 0 && sentences[0].length <= 160) {
      return sentences[0];
    }

    const words = trimmed.split(/\s+/).slice(0, 36);
    return `${words.join(' ')}...`;
  }

  private buildFollowUp(category?: string): string {
    const options = category ? categoryFollowUps[category] : undefined;
    const pool = options && options.length > 0 ? options : [
      'What lingering thought do you want to explore next?',
      'What would support look like after sharing this?',
      'How would you like to feel the next time this comes up?'
    ];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  private craftInsights(answer: string, tags: string[]): string[] {
    const result: string[] = [];
    const lower = answer.toLowerCase();

    if (tags.includes('growth')) {
      result.push('You are noticing the ways you are evolving—naming progress strengthens it.');
    }

    if (tags.includes('vulnerability')) {
      result.push('Vulnerability showed up here; consider what safety you need to keep sharing like this.');
    }

    if (tags.includes('connection')) {
      result.push('Relationships are woven through this reflection—there may be someone you want to invite into it.');
    }

    if (tags.includes('gratitude')) {
      result.push('Gratitude is a recurring thread; capturing these moments could become a grounding ritual.');
    }

    if (result.length === 0) {
      if (lower.includes('today')) {
        result.push('You are tuned into the present moment—notice what is asking for your attention next.');
      }
      result.push('There is meaning in what you shared; consider what small action could honour it.');
    }

    return result.slice(0, 2);
  }

  async generate(input: ReflectionAiInput): Promise<ReflectionAiResult> {
    const mood = this.detectMood(input.answer);
    const tags = this.deriveTags(input.answer, input.question.category, input.recentThemes);
    const summary = this.craftSummary(input.answer);
    const followUpQuestion = this.buildFollowUp(input.question.category);
    const insights = this.craftInsights(input.answer, tags);

    const affirmations = localAffirmations[mood];
    const affirmation = affirmations[Math.floor(Math.random() * affirmations.length)];

    return {
      summary,
      affirmation,
      followUpQuestion,
      mood,
      tags,
      insights,
    };
  }
}

class ReflectionAiService {
  private provider: ReflectionAiProvider;

  constructor(provider?: ReflectionAiProvider) {
    this.provider = provider ?? new LocalReflectionAiProvider();
  }

  async generateReflection(input: ReflectionAiInput): Promise<ReflectionAiResult> {
    return this.provider.generate(input);
  }
}

export const reflectionAiService = new ReflectionAiService();
