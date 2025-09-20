import AsyncStorage from '@react-native-async-storage/async-storage';
import { personalityInsightsService, PersonalityProfile } from './personalityInsightsService';
import { conversationMemoryService } from './conversationMemoryService';

export interface PersonalitySnapshot {
  id: string;
  date: string;
  traits: {
    name: string;
    percentage: number;
    change: number; // Change since last snapshot
  }[];
  authenticityScore: number;
  authenticityChange: number;
  totalReflections: number;
  insightsSummary: string;
  triggerEvent?: string; // What caused this snapshot
}

export interface PersonalityEvolution {
  snapshots: PersonalitySnapshot[];
  trends: {
    [traitName: string]: {
      direction: 'increasing' | 'decreasing' | 'stable';
      averageChange: number;
      momentum: number; // Rate of change acceleration
    };
  };
  milestones: EvolutionMilestone[];
  growthAreas: string[];
  strengths: string[];
}

export interface EvolutionMilestone {
  id: string;
  type: 'trait_breakthrough' | 'authenticity_milestone' | 'consistency_achievement' | 'growth_recognition';
  title: string;
  description: string;
  date: string;
  snapshotId: string;
  celebratedData: any;
}

class PersonalityEvolutionService {
  private storageKey = 'personality_evolution';
  private evolution: PersonalityEvolution | null = null;
  private lastSnapshotDate: Date | null = null;

  async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        this.evolution = JSON.parse(stored);
        // Convert date strings back to Date objects
        if (this.evolution && this.evolution.snapshots.length > 0) {
          this.lastSnapshotDate = new Date(this.evolution.snapshots[this.evolution.snapshots.length - 1].date);
        }
      } else {
        this.evolution = this.createInitialEvolution();
        await this.saveEvolution();
      }
    } catch (error) {
      console.error('Error initializing personality evolution:', error);
      this.evolution = this.createInitialEvolution();
    }
  }

  private createInitialEvolution(): PersonalityEvolution {
    return {
      snapshots: [],
      trends: {},
      milestones: [],
      growthAreas: [],
      strengths: []
    };
  }

  async capturePersonalitySnapshot(triggerEvent?: string): Promise<PersonalitySnapshot | null> {
    if (!this.evolution) {
      await this.initialize();
    }

    try {
      // Get current personality profile
      const currentProfile = await personalityInsightsService.getPersonalityProfile();
      if (!currentProfile) {
        console.error('No personality profile available for snapshot');
        return null;
      }

      // Check if enough time has passed since last snapshot (at least 1 day)
      if (this.lastSnapshotDate && 
          Date.now() - this.lastSnapshotDate.getTime() < 24 * 60 * 60 * 1000 &&
          !triggerEvent) {
        return null; // Too soon for regular snapshot
      }

      // Get previous snapshot for comparison
      const previousSnapshot = this.evolution!.snapshots.length > 0 ? 
        this.evolution!.snapshots[this.evolution!.snapshots.length - 1] : null;

      // Create new snapshot
      const snapshot: PersonalitySnapshot = {
        id: `snapshot_${Date.now()}`,
        date: new Date().toISOString(),
        traits: currentProfile.traits.map(trait => ({
          name: trait.name,
          percentage: trait.percentage,
          change: previousSnapshot ? 
            trait.percentage - (previousSnapshot.traits.find(t => t.name === trait.name)?.percentage || 0) : 0
        })),
        authenticityScore: currentProfile.authenticityScore,
        authenticityChange: previousSnapshot ? 
          currentProfile.authenticityScore - previousSnapshot.authenticityScore : 0,
        totalReflections: currentProfile.totalReflections,
        insightsSummary: currentProfile.insightsSummary,
        triggerEvent
      };

      // Add snapshot to evolution
      this.evolution!.snapshots.push(snapshot);
      this.lastSnapshotDate = new Date(snapshot.date);

      // Update trends
      this.updateTrends();

      // Check for milestones
      await this.checkEvolutionMilestones(snapshot);

      // Update growth areas and strengths
      this.updateGrowthAnalysis();

      // Save to storage
      await this.saveEvolution();

      return snapshot;
    } catch (error) {
      console.error('Error capturing personality snapshot:', error);
      return null;
    }
  }

  private updateTrends(): void {
    if (!this.evolution || this.evolution.snapshots.length < 2) return;

    const recent = this.evolution.snapshots.slice(-5); // Last 5 snapshots
    const traits = recent[0].traits.map(t => t.name);

    this.evolution.trends = {};

    traits.forEach(traitName => {
      const traitValues = recent.map(snapshot => 
        snapshot.traits.find(t => t.name === traitName)?.percentage || 0
      );

      if (traitValues.length < 2) return;

      // Calculate average change
      const changes = [];
      for (let i = 1; i < traitValues.length; i++) {
        changes.push(traitValues[i] - traitValues[i - 1]);
      }

      const averageChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
      
      // Calculate momentum (acceleration)
      let momentum = 0;
      if (changes.length >= 2) {
        const recentChanges = changes.slice(-2);
        momentum = recentChanges[1] - recentChanges[0];
      }

      // Determine direction
      let direction: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (Math.abs(averageChange) > 0.5) {
        direction = averageChange > 0 ? 'increasing' : 'decreasing';
      }

      this.evolution!.trends[traitName] = {
        direction,
        averageChange,
        momentum
      };
    });
  }

  private async checkEvolutionMilestones(snapshot: PersonalitySnapshot): Promise<void> {
    if (!this.evolution) return;

    const milestones: EvolutionMilestone[] = [];

    // Trait breakthrough (significant positive change)
    snapshot.traits.forEach(trait => {
      if (trait.change >= 10) {
        milestones.push({
          id: `milestone_${Date.now()}_${trait.name}`,
          type: 'trait_breakthrough',
          title: `${trait.name} Breakthrough!`,
          description: `Your ${trait.name.toLowerCase()} has grown significantly by ${trait.change.toFixed(1)} points!`,
          date: snapshot.date,
          snapshotId: snapshot.id,
          celebratedData: { trait: trait.name, change: trait.change }
        });
      }
    });

    // Authenticity milestone
    if (snapshot.authenticityChange >= 5) {
      milestones.push({
        id: `milestone_${Date.now()}_authenticity`,
        type: 'authenticity_milestone',
        title: 'Authenticity Milestone!',
        description: `Your authenticity score has increased by ${snapshot.authenticityChange.toFixed(1)} points!`,
        date: snapshot.date,
        snapshotId: snapshot.id,
        celebratedData: { change: snapshot.authenticityChange, newScore: snapshot.authenticityScore }
      });
    }

    // Consistency achievement
    if (snapshot.totalReflections > 0 && snapshot.totalReflections % 25 === 0) {
      milestones.push({
        id: `milestone_${Date.now()}_consistency`,
        type: 'consistency_achievement',
        title: 'Consistency Champion!',
        description: `You've completed ${snapshot.totalReflections} meaningful reflections!`,
        date: snapshot.date,
        snapshotId: snapshot.id,
        celebratedData: { totalReflections: snapshot.totalReflections }
      });
    }

    // Growth recognition (multiple traits improving)
    const improvingTraits = snapshot.traits.filter(t => t.change > 2).length;
    if (improvingTraits >= 3) {
      milestones.push({
        id: `milestone_${Date.now()}_growth`,
        type: 'growth_recognition',
        title: 'Personal Growth Master!',
        description: `${improvingTraits} different aspects of your personality are flourishing!`,
        date: snapshot.date,
        snapshotId: snapshot.id,
        celebratedData: { improvingTraits }
      });
    }

    this.evolution.milestones.push(...milestones);
  }

  private updateGrowthAnalysis(): void {
    if (!this.evolution || this.evolution.snapshots.length === 0) return;

    const latestSnapshot = this.evolution.snapshots[this.evolution.snapshots.length - 1];
    
    // Identify strengths (top performing traits)
    const sortedTraits = [...latestSnapshot.traits].sort((a, b) => b.percentage - a.percentage);
    this.evolution.strengths = sortedTraits.slice(0, 2).map(t => t.name);

    // Identify growth areas (traits with room for improvement or declining trends)
    this.evolution.growthAreas = [];
    
    sortedTraits.forEach(trait => {
      const trend = this.evolution!.trends[trait.name];
      
      // Low scoring traits are growth areas
      if (trait.percentage < 70) {
        this.evolution!.growthAreas.push(trait.name);
      }
      
      // Declining traits are growth areas
      if (trend && trend.direction === 'decreasing') {
        if (!this.evolution!.growthAreas.includes(trait.name)) {
          this.evolution!.growthAreas.push(trait.name);
        }
      }
    });

    // Limit to top 3 growth areas
    this.evolution.growthAreas = this.evolution.growthAreas.slice(0, 3);
  }

  async getPersonalityEvolution(): Promise<PersonalityEvolution | null> {
    if (!this.evolution) {
      await this.initialize();
    }
    return this.evolution;
  }

  async getRecentSnapshots(limit: number = 10): Promise<PersonalitySnapshot[]> {
    if (!this.evolution) {
      await this.initialize();
    }
    
    return this.evolution?.snapshots
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit) || [];
  }

  async getEvolutionMilestones(): Promise<EvolutionMilestone[]> {
    if (!this.evolution) {
      await this.initialize();
    }
    
    return this.evolution?.milestones
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  }

  async getTraitEvolution(traitName: string): Promise<{
    name: string;
    history: { date: string; percentage: number; change: number }[];
    trend: PersonalityEvolution['trends'][string] | null;
    currentPercentage: number;
  } | null> {
    if (!this.evolution) {
      await this.initialize();
    }

    if (!this.evolution || this.evolution.snapshots.length === 0) return null;

    const history = this.evolution.snapshots.map(snapshot => {
      const trait = snapshot.traits.find(t => t.name === traitName);
      return {
        date: snapshot.date,
        percentage: trait?.percentage || 0,
        change: trait?.change || 0
      };
    });

    const trend = this.evolution.trends[traitName] || null;
    const currentPercentage = history[history.length - 1]?.percentage || 0;

    return {
      name: traitName,
      history,
      trend,
      currentPercentage
    };
  }

  async generatePersonalityInsight(): Promise<string | null> {
    if (!this.evolution) {
      await this.initialize();
    }

    if (!this.evolution || this.evolution.snapshots.length < 2) {
      return null;
    }

    const latestSnapshot = this.evolution.snapshots[this.evolution.snapshots.length - 1];
    const trends = this.evolution.trends;
    const strengths = this.evolution.strengths;
    const growthAreas = this.evolution.growthAreas;

    // Generate insights based on recent changes
    const insights = [];

    // Highlight biggest positive change
    const biggestGrowth = latestSnapshot.traits.reduce((max, trait) => 
      trait.change > max.change ? trait : max
    );

    if (biggestGrowth.change > 2) {
      insights.push(`Your ${biggestGrowth.name.toLowerCase()} has grown significantly by ${biggestGrowth.change.toFixed(1)} points recently.`);
    }

    // Highlight strengths
    if (strengths.length > 0) {
      insights.push(`Your strongest qualities continue to be ${strengths.join(' and ').toLowerCase()}.`);
    }

    // Suggest growth areas
    if (growthAreas.length > 0) {
      insights.push(`Areas where you could focus on growing include ${growthAreas.join(' and ').toLowerCase()}.`);
    }

    // Highlight trends
    const improvingTraits = Object.entries(trends)
      .filter(([_, trend]) => trend.direction === 'increasing')
      .map(([name, _]) => name);

    if (improvingTraits.length > 0) {
      insights.push(`You're showing consistent improvement in ${improvingTraits.join(' and ').toLowerCase()}.`);
    }

    return insights.length > 0 ? insights.join(' ') : null;
  }

  async triggerSnapshotIfNeeded(eventType: 'milestone' | 'significant_change' | 'time_based'): Promise<PersonalitySnapshot | null> {
    const memory = await conversationMemoryService.getConversationMemory();
    
    if (!memory) return null;

    // Trigger snapshot on milestones
    if (eventType === 'milestone' && memory.totalConversations % 10 === 0) {
      return await this.capturePersonalitySnapshot(`${memory.totalConversations} conversations milestone`);
    }

    // Trigger snapshot on significant changes (detected through conversation patterns)
    if (eventType === 'significant_change') {
      const recentConversations = await conversationMemoryService.getRecentConversations(5);
      const vulnerableCount = recentConversations.filter(c => c.emotionalTone === 'vulnerable').length;
      
      if (vulnerableCount >= 3) {
        return await this.capturePersonalitySnapshot('Period of vulnerable sharing');
      }
    }

    // Time-based snapshots (weekly)
    if (eventType === 'time_based') {
      const daysSinceLastSnapshot = this.lastSnapshotDate ? 
        (Date.now() - this.lastSnapshotDate.getTime()) / (1000 * 60 * 60 * 24) : 7;
      
      if (daysSinceLastSnapshot >= 7) {
        return await this.capturePersonalitySnapshot('Weekly progress snapshot');
      }
    }

    return null;
  }

  private async saveEvolution(): Promise<void> {
    if (!this.evolution) return;
    
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.evolution));
    } catch (error) {
      console.error('Error saving personality evolution:', error);
    }
  }

  async resetEvolution(): Promise<void> {
    this.evolution = this.createInitialEvolution();
    this.lastSnapshotDate = null;
    await this.saveEvolution();
  }
}

export const personalityEvolutionService = new PersonalityEvolutionService();