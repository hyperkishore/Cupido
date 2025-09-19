import AsyncStorage from '@react-native-async-storage/async-storage';
import { ReflectionEntry } from './habitTrackingService';

export interface CommunityReflection extends Omit<ReflectionEntry, 'id'> {
  id: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  communityHearts: number;
  hasUserLiked: boolean;
  comments?: CommunityComment[];
  visibility: 'community' | 'matched_only' | 'private';
}

export interface CommunityComment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: Date;
  hearts: number;
}

export interface MatchProfile {
  id: string;
  name: string;
  age: number;
  compatibilityScore: number;
  sharedThemes: string[];
  recentReflection: string;
  lastActive: Date;
  isOnline: boolean;
}

export interface CommunityStats {
  totalMembers: number;
  activeToday: number;
  reflectionsSharedToday: number;
  heartGivenToday: number;
  userRank: number;
  userHeartCount: number;
}

class CommunityService {
  private readonly STORAGE_KEY = 'cupido_community_data';
  private communityData: {
    reflections: CommunityReflection[];
    matches: MatchProfile[];
    stats: CommunityStats;
    userActivity: {
      heartsGiven: number;
      heartsReceived: number;
      reflectionsShared: number;
      commentsPosted: number;
    };
  } | null = null;

  // Realistic community data that feels authentic
  private sampleCommunityReflections: Omit<CommunityReflection, 'id'>[] = [
    {
      authorId: 'user_sarah',
      authorName: 'Sarah M.',
      isAnonymous: false,
      date: new Date().toISOString().split('T')[0],
      question: "What made you feel most alive today?",
      answer: "Dancing in my kitchen while making dinner. No one was watching, no music was perfect, but I felt completely free and joyful in that moment.",
      voiceUsed: true,
      mood: 'excited',
      tags: ['joy', 'freedom', 'authenticity'],
      hearts: 0,
      isLiked: false,
      communityHearts: 23,
      hasUserLiked: false,
      visibility: 'community',
      createdAt: new Date(Date.now() - 3600000) // 1 hour ago
    },
    {
      authorId: 'user_alex',
      authorName: 'Anonymous',
      isAnonymous: true,
      date: new Date().toISOString().split('T')[0],
      question: "What fear did you face today?",
      answer: "I finally told my best friend about my anxiety. I've been hiding it for months, thinking they'd see me differently. Instead, they shared their own struggles and we both felt less alone.",
      voiceUsed: false,
      mood: 'contemplative',
      tags: ['vulnerability', 'friendship', 'courage'],
      hearts: 0,
      isLiked: false,
      communityHearts: 41,
      hasUserLiked: true,
      visibility: 'community',
      createdAt: new Date(Date.now() - 7200000) // 2 hours ago
    },
    {
      authorId: 'user_jamie',
      authorName: 'Jamie L.',
      isAnonymous: false,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      question: "What small act of kindness touched you today?",
      answer: "A stranger let me merge in heavy traffic and waved. Such a tiny gesture, but it reminded me that we're all just trying to get somewhere and be seen.",
      voiceUsed: true,
      mood: 'content',
      tags: ['kindness', 'connection', 'humanity'],
      hearts: 0,
      isLiked: false,
      communityHearts: 18,
      hasUserLiked: false,
      visibility: 'community',
      createdAt: new Date(Date.now() - 93600000) // Yesterday + 2 hours
    },
    {
      authorId: 'user_morgan',
      authorName: 'Anonymous',
      isAnonymous: true,
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
      question: "How did you surprise yourself today?",
      answer: "I spoke up in a meeting when I usually stay quiet. My idea wasn't groundbreaking, but my voice was heard and that felt powerful.",
      voiceUsed: false,
      mood: 'thoughtful',
      tags: ['courage', 'self-advocacy', 'growth'],
      hearts: 0,
      isLiked: false,
      communityHearts: 32,
      hasUserLiked: false,
      visibility: 'community',
      createdAt: new Date(Date.now() - 100800000) // Yesterday + 4 hours
    },
    {
      authorId: 'user_river',
      authorName: 'River K.',
      isAnonymous: false,
      date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
      question: "What did your heart need today?",
      answer: "Silence. I spent 20 minutes just breathing and listening to nothing. In our noisy world, silence felt like medicine for my soul.",
      voiceUsed: true,
      mood: 'peaceful',
      tags: ['mindfulness', 'peace', 'self-care'],
      hearts: 0,
      isLiked: false,
      communityHearts: 27,
      hasUserLiked: true,
      visibility: 'community',
      createdAt: new Date(Date.now() - 175600000) // 2 days ago + 3 hours
    }
  ];

  private sampleMatches: MatchProfile[] = [
    {
      id: 'match_elena',
      name: 'Elena R.',
      age: 28,
      compatibilityScore: 94,
      sharedThemes: ['growth', 'authenticity', 'mindfulness'],
      recentReflection: "I'm learning that vulnerability isn't weakness—it's the birthplace of courage and connection.",
      lastActive: new Date(Date.now() - 1800000), // 30 min ago
      isOnline: true
    },
    {
      id: 'match_kai',
      name: 'Kai M.',
      age: 32,
      compatibilityScore: 89,
      sharedThemes: ['kindness', 'connection', 'gratitude'],
      recentReflection: "Today I realized that listening—really listening—is one of the most generous gifts we can give.",
      lastActive: new Date(Date.now() - 3600000), // 1 hour ago
      isOnline: false
    },
    {
      id: 'match_alex',
      name: 'Alex T.',
      age: 26,
      compatibilityScore: 87,
      sharedThemes: ['creativity', 'authenticity', 'growth'],
      recentReflection: "There's something beautiful about creating without an audience, just for the pure joy of making something exist.",
      lastActive: new Date(Date.now() - 7200000), // 2 hours ago
      isOnline: false
    }
  ];

  async initialize(): Promise<void> {
    await this.loadCommunityData();
    if (!this.communityData) {
      await this.createInitialData();
    }
    this.simulateCommunityActivity();
  }

  private async loadCommunityData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.communityData = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.communityData) {
          this.communityData.reflections = this.communityData.reflections.map(r => ({
            ...r,
            createdAt: new Date(r.createdAt)
          }));
          this.communityData.matches = this.communityData.matches.map(m => ({
            ...m,
            lastActive: new Date(m.lastActive)
          }));
        }
      }
    } catch (error) {
      console.error('Error loading community data:', error);
    }
  }

  private async saveCommunityData(): Promise<void> {
    try {
      if (this.communityData) {
        await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.communityData));
      }
    } catch (error) {
      console.error('Error saving community data:', error);
    }
  }

  private async createInitialData(): Promise<void> {
    this.communityData = {
      reflections: this.sampleCommunityReflections.map((sample, index) => ({
        ...sample,
        id: `community_${index}`
      })),
      matches: this.sampleMatches,
      stats: {
        totalMembers: 12847,
        activeToday: 2341,
        reflectionsSharedToday: 892,
        heartGivenToday: 4573,
        userRank: 847,
        userHeartCount: 67
      },
      userActivity: {
        heartsGiven: 23,
        heartsReceived: 67,
        reflectionsShared: 8,
        commentsPosted: 12
      }
    };

    await this.saveCommunityData();
  }

  // Simulate realistic community activity
  private simulateCommunityActivity(): void {
    // Randomly update heart counts and add new activity
    setInterval(() => {
      if (this.communityData) {
        // Randomly add hearts to reflections
        this.communityData.reflections.forEach(reflection => {
          if (Math.random() < 0.1) { // 10% chance per interval
            reflection.communityHearts += Math.floor(Math.random() * 3) + 1;
          }
        });

        // Update community stats
        this.communityData.stats.heartGivenToday += Math.floor(Math.random() * 5) + 1;
        this.communityData.stats.reflectionsSharedToday += Math.random() < 0.3 ? 1 : 0;
        
        this.saveCommunityData();
      }
    }, 30000); // Every 30 seconds

    // Simulate new reflections appearing
    setInterval(() => {
      this.addRandomCommunityReflection();
    }, 120000); // Every 2 minutes
  }

  private async addRandomCommunityReflection(): Promise<void> {
    if (!this.communityData) return;

    const questions = [
      "What made you feel understood today?",
      "How did you show kindness to yourself today?",
      "What conversation changed your perspective recently?",
      "What are you learning to let go of?",
      "How did you find beauty in an ordinary moment?"
    ];

    const answers = [
      "My therapist helped me see that my 'overthinking' is actually deep care and thoughtfulness. Reframing changed everything.",
      "I took a bath instead of pushing through exhaustion. Sometimes rest is the most radical act of self-love.",
      "A cashier asked how my day was and really listened to my answer. Connection can happen anywhere.",
      "The need to have everything figured out. Uncertainty is uncomfortable but also full of possibility.",
      "Sunlight streaming through my dirty kitchen window created the most beautiful patterns on the wall."
    ];

    const names = ['Jordan P.', 'Casey L.', 'Taylor M.', 'Anonymous', 'Riley K.'];
    const moods: (typeof this.sampleCommunityReflections)[0]['mood'][] = ['content', 'thoughtful', 'peaceful', 'contemplative'];

    const newReflection: CommunityReflection = {
      id: `community_new_${Date.now()}`,
      authorId: `user_${Date.now()}`,
      authorName: names[Math.floor(Math.random() * names.length)],
      isAnonymous: Math.random() < 0.4,
      date: new Date().toISOString().split('T')[0],
      question: questions[Math.floor(Math.random() * questions.length)],
      answer: answers[Math.floor(Math.random() * answers.length)],
      voiceUsed: Math.random() < 0.6,
      mood: moods[Math.floor(Math.random() * moods.length)],
      tags: ['growth', 'connection', 'authenticity'].slice(0, Math.floor(Math.random() * 3) + 1),
      hearts: 0,
      isLiked: false,
      communityHearts: Math.floor(Math.random() * 5) + 1,
      hasUserLiked: false,
      visibility: 'community',
      createdAt: new Date()
    };

    this.communityData.reflections.unshift(newReflection);
    
    // Keep only the most recent 50 reflections
    if (this.communityData.reflections.length > 50) {
      this.communityData.reflections = this.communityData.reflections.slice(0, 50);
    }

    await this.saveCommunityData();
    console.log('💫 New community reflection added:', newReflection.question);
  }

  async getCommunityFeed(limit: number = 20): Promise<CommunityReflection[]> {
    if (!this.communityData) await this.initialize();
    return this.communityData?.reflections.slice(0, limit) || [];
  }

  async likeReflection(reflectionId: string): Promise<void> {
    if (!this.communityData) return;

    const reflection = this.communityData.reflections.find(r => r.id === reflectionId);
    if (reflection) {
      reflection.hasUserLiked = !reflection.hasUserLiked;
      reflection.communityHearts += reflection.hasUserLiked ? 1 : -1;
      
      this.communityData.userActivity.heartsGiven += reflection.hasUserLiked ? 1 : -1;
      await this.saveCommunityData();
    }
  }

  async getMatches(): Promise<MatchProfile[]> {
    if (!this.communityData) await this.initialize();
    return this.communityData?.matches || [];
  }

  async getCommunityStats(): Promise<CommunityStats> {
    if (!this.communityData) await this.initialize();
    return this.communityData?.stats || {
      totalMembers: 0,
      activeToday: 0,
      reflectionsSharedToday: 0,
      heartGivenToday: 0,
      userRank: 0,
      userHeartCount: 0
    };
  }

  async shareReflectionToCommunity(reflection: ReflectionEntry, isAnonymous: boolean = true): Promise<void> {
    if (!this.communityData) await this.initialize();

    const communityReflection: CommunityReflection = {
      ...reflection,
      id: `community_user_${Date.now()}`,
      authorId: 'current_user',
      authorName: isAnonymous ? 'Anonymous' : 'You',
      isAnonymous,
      communityHearts: 0,
      hasUserLiked: false,
      visibility: 'community'
    };

    this.communityData!.reflections.unshift(communityReflection);
    this.communityData!.userActivity.reflectionsShared++;
    
    await this.saveCommunityData();
    console.log('✨ Reflection shared to community:', reflection.question);
  }

  // Generate compatibility matches based on reflection themes
  async findCompatibleMatches(userThemes: string[]): Promise<MatchProfile[]> {
    if (!this.communityData) await this.initialize();

    // Simulate finding new matches based on themes
    const allMatches = this.communityData?.matches || [];
    
    // Sort by compatibility (shared themes)
    return allMatches.sort((a, b) => {
      const aShared = a.sharedThemes.filter(theme => userThemes.includes(theme)).length;
      const bShared = b.sharedThemes.filter(theme => userThemes.includes(theme)).length;
      return bShared - aShared;
    });
  }

  async getUserActivity() {
    if (!this.communityData) await this.initialize();
    return this.communityData?.userActivity || {
      heartsGiven: 0,
      heartsReceived: 0,
      reflectionsShared: 0,
      commentsPosted: 0
    };
  }
}

export const communityService = new CommunityService();