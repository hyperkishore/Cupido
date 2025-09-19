import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationService } from './notificationService';

export interface ReflectionEntry {
  id: string;
  date: string;
  question: string;
  answer: string;
  voiceUsed: boolean;
  mood?: 'excited' | 'content' | 'thoughtful' | 'contemplative' | 'peaceful';
  tags?: string[];
  hearts: number;
  isLiked: boolean;
  createdAt: Date;
}

export interface StreakData {
  current: number;
  longest: number;
  lastReflectionDate: string;
  milestones: number[];
}

export interface PersonalInsight {
  id: string;
  type: 'pattern' | 'growth' | 'connection' | 'milestone';
  title: string;
  description: string;
  data?: any;
  discoveredAt: Date;
  isNew: boolean;
}

export interface HabitData {
  reflections: ReflectionEntry[];
  streak: StreakData;
  insights: PersonalInsight[];
  preferences: {
    reminderTime: string;
    voicePreference: boolean;
    privacyLevel: 'private' | 'anonymous' | 'community';
  };
  stats: {
    totalReflections: number;
    averageWordsPerReflection: number;
    mostActiveTimeOfDay: string;
    favoriteTopics: string[];
    personalityWords: string[];
  };
}

class HabitTrackingService {
  private readonly STORAGE_KEY = 'cupido_habit_data';
  private habitData: HabitData | null = null;

  // Realistic sample reflections for community feed
  private sampleReflections: Omit<ReflectionEntry, 'id' | 'createdAt'>[] = [
    {
      date: new Date().toISOString().split('T')[0],
      question: "What made you smile today?",
      answer: "Watching my neighbor help an elderly person with groceries. It reminded me that small acts of kindness ripple through our world in ways we rarely see.",
      voiceUsed: true,
      mood: 'content',
      tags: ['kindness', 'community', 'gratitude'],
      hearts: 12,
      isLiked: false
    },
    {
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      question: "What did you learn about yourself today?",
      answer: "I realized I'm more patient than I thought. When my project got delayed, instead of panicking, I found myself naturally adapting and finding solutions.",
      voiceUsed: false,
      mood: 'thoughtful',
      tags: ['patience', 'resilience', 'self-discovery'],
      hearts: 8,
      isLiked: true
    },
    {
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      question: "How did you grow today?",
      answer: "I asked for help with something I've been struggling with alone. It felt vulnerable but also freeing to admit I don't have all the answers.",
      voiceUsed: true,
      mood: 'contemplative',
      tags: ['vulnerability', 'growth', 'connection'],
      hearts: 15,
      isLiked: false
    }
  ];

  async initialize(): Promise<void> {
    await this.loadHabitData();
    if (!this.habitData) {
      await this.createInitialData();
    }
    await this.updateStreakAndInsights();
  }

  private async loadHabitData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.habitData = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.habitData) {
          this.habitData.reflections = this.habitData.reflections.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt)
          }));
          this.habitData.insights = this.habitData.insights.map(i => ({
            ...i,
            discoveredAt: new Date(i.discoveredAt)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading habit data:', error);
    }
  }

  private async saveHabitData(): Promise<void> {
    try {
      if (this.habitData) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.habitData));
      }
    } catch (error) {
      console.error('Error saving habit data:', error);
    }
  }

  private async createInitialData(): Promise<void> {
    const now = new Date();
    
    this.habitData = {
      reflections: this.sampleReflections.map((sample, index) => ({
        ...sample,
        id: `sample_${index}`,
        createdAt: new Date(now.getTime() - (index * 86400000)) // Space them out by days
      })),
      streak: {
        current: 3,
        longest: 7,
        lastReflectionDate: new Date().toISOString().split('T')[0],
        milestones: [3, 7]
      },
      insights: await this.generateInitialInsights(),
      preferences: {
        reminderTime: '19:00',
        voicePreference: true,
        privacyLevel: 'anonymous'
      },
      stats: {
        totalReflections: 3,
        averageWordsPerReflection: 32,
        mostActiveTimeOfDay: 'evening',
        favoriteTopics: ['growth', 'connection', 'gratitude'],
        personalityWords: ['thoughtful', 'curious', 'authentic', 'empathetic']
      }
    };

    await this.saveHabitData();
  }

  private async generateInitialInsights(): Promise<PersonalInsight[]> {
    return [
      {
        id: 'insight_1',
        type: 'pattern',
        title: 'Evening Reflection Pattern',
        description: 'You tend to reflect most deeply in the evening hours. This suggests you process experiences after they\'ve had time to settle.',
        discoveredAt: new Date(),
        isNew: true
      },
      {
        id: 'insight_2',
        type: 'growth',
        title: 'Vulnerability Growth',
        description: 'Your reflections show increasing comfort with vulnerability over the past week. You\'re becoming more open about challenges.',
        discoveredAt: new Date(),
        isNew: true
      }
    ];
  }

  async addReflection(question: string, answer: string, voiceUsed: boolean): Promise<ReflectionEntry> {
    if (!this.habitData) await this.initialize();

    const reflection: ReflectionEntry = {
      id: `reflection_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      question,
      answer,
      voiceUsed,
      hearts: Math.floor(Math.random() * 3) + 1, // Simulate initial hearts
      isLiked: false,
      createdAt: new Date()
    };

    // Add mood and tags based on content analysis
    reflection.mood = this.analyzeMood(answer);
    reflection.tags = this.extractTags(answer);

    this.habitData!.reflections.unshift(reflection);
    this.habitData!.stats.totalReflections++;
    
    await this.updateStreakAndInsights();
    await this.saveHabitData();

    return reflection;
  }

  private analyzeMood(text: string): ReflectionEntry['mood'] {
    const moods: { [key: string]: ReflectionEntry['mood'] } = {
      'excited': 'excited',
      'amazing': 'excited',
      'wonderful': 'excited',
      'grateful': 'content',
      'peaceful': 'peaceful',
      'calm': 'peaceful',
      'thinking': 'thoughtful',
      'learned': 'thoughtful',
      'reflecting': 'contemplative',
      'deep': 'contemplative'
    };

    for (const [word, mood] of Object.entries(moods)) {
      if (text.toLowerCase().includes(word)) {
        return mood;
      }
    }
    return 'thoughtful'; // Default
  }

  private extractTags(text: string): string[] {
    const tagMap: { [key: string]: string } = {
      'grateful': 'gratitude',
      'thank': 'gratitude',
      'appreciate': 'gratitude',
      'learn': 'growth',
      'grow': 'growth',
      'change': 'growth',
      'friend': 'connection',
      'people': 'connection',
      'help': 'connection',
      'kind': 'kindness',
      'compassion': 'kindness',
      'vulnerable': 'vulnerability',
      'honest': 'authenticity',
      'authentic': 'authenticity'
    };

    const tags: string[] = [];
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (tagMap[cleanWord] && !tags.includes(tagMap[cleanWord])) {
        tags.push(tagMap[cleanWord]);
      }
    });

    return tags.slice(0, 3); // Limit to 3 tags
  }

  private async updateStreakAndInsights(): Promise<void> {
    if (!this.habitData) return;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const todayReflection = this.habitData.reflections.find(r => r.date === today);
    const lastDate = this.habitData.streak.lastReflectionDate;

    if (todayReflection) {
      if (lastDate === yesterday) {
        this.habitData.streak.current++;
      } else if (lastDate !== today) {
        this.habitData.streak.current = 1;
      }
      this.habitData.streak.lastReflectionDate = today;
    }

    // Update longest streak
    if (this.habitData.streak.current > this.habitData.streak.longest) {
      this.habitData.streak.longest = this.habitData.streak.current;
    }

    // Check for milestone achievements
    const currentStreak = this.habitData.streak.current;
    if ([3, 7, 14, 30, 60, 100].includes(currentStreak) && 
        !this.habitData.streak.milestones.includes(currentStreak)) {
      this.habitData.streak.milestones.push(currentStreak);
      await notificationService.checkStreakMilestones(currentStreak);
      
      // Add milestone insight
      this.habitData.insights.unshift({
        id: `milestone_${currentStreak}`,
        type: 'milestone',
        title: `${currentStreak} Day Streak Achievement!`,
        description: `You've maintained ${currentStreak} consecutive days of authentic reflection. This consistency is building deep self-awareness.`,
        discoveredAt: new Date(),
        isNew: true
      });
    }

    // Generate new insights periodically
    if (this.habitData.reflections.length % 5 === 0) {
      const newInsight = await this.generatePersonalInsight();
      if (newInsight) {
        this.habitData.insights.unshift(newInsight);
      }
    }
  }

  private async generatePersonalInsight(): Promise<PersonalInsight | null> {
    if (!this.habitData) return null;

    const recentReflections = this.habitData.reflections.slice(0, 5);
    const allTags = recentReflections.flatMap(r => r.tags || []);
    const tagCounts: { [key: string]: number } = {};
    
    allTags.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    const topTag = Object.entries(tagCounts).sort(([,a], [,b]) => b - a)[0];
    
    if (topTag && topTag[1] >= 2) {
      return {
        id: `pattern_${Date.now()}`,
        type: 'pattern',
        title: `${topTag[0].charAt(0).toUpperCase() + topTag[0].slice(1)} Theme`,
        description: `You've been reflecting on ${topTag[0]} frequently. This suggests it's an important area of growth for you right now.`,
        data: { theme: topTag[0], frequency: topTag[1] },
        discoveredAt: new Date(),
        isNew: true
      };
    }

    return null;
  }

  async getHabitData(): Promise<HabitData | null> {
    if (!this.habitData) await this.initialize();
    return this.habitData;
  }

  async getRecentReflections(limit: number = 10): Promise<ReflectionEntry[]> {
    if (!this.habitData) await this.initialize();
    return this.habitData?.reflections.slice(0, limit) || [];
  }

  async getCurrentStreak(): Promise<number> {
    if (!this.habitData) await this.initialize();
    return this.habitData?.streak.current || 0;
  }

  async getPersonalInsights(): Promise<PersonalInsight[]> {
    if (!this.habitData) await this.initialize();
    return this.habitData?.insights || [];
  }

  async markInsightAsRead(insightId: string): Promise<void> {
    if (!this.habitData) return;
    
    const insight = this.habitData.insights.find(i => i.id === insightId);
    if (insight) {
      insight.isNew = false;
      await this.saveHabitData();
    }
  }

  async toggleReflectionLike(reflectionId: string): Promise<void> {
    if (!this.habitData) return;
    
    const reflection = this.habitData.reflections.find(r => r.id === reflectionId);
    if (reflection) {
      reflection.isLiked = !reflection.isLiked;
      reflection.hearts += reflection.isLiked ? 1 : -1;
      await this.saveHabitData();
    }
  }
}

export const habitTrackingService = new HabitTrackingService();