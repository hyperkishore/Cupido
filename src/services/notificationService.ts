import { Platform } from 'react-native';

export interface NotificationTrigger {
  id: string;
  type: 'time' | 'context' | 'social';
  message: string;
  scheduledTime?: Date;
  context?: {
    location?: string;
    mood?: string;
    activity?: string;
  };
  social?: {
    friendCount?: number;
    communityActivity?: string;
  };
}

export interface NotificationPreferences {
  enabled: boolean;
  dailyReflectionTime: string; // Format: "19:00"
  quietHours: {
    start: string; // Format: "22:00"
    end: string; // Format: "08:00"
  };
  weekendEnabled: boolean;
  socialNotifications: boolean;
  insightNotifications: boolean;
}

class NotificationService {
  private notifications: NotificationTrigger[] = [];
  private preferences: NotificationPreferences = {
    enabled: true,
    dailyReflectionTime: "19:00",
    quietHours: {
      start: "22:00",
      end: "08:00"
    },
    weekendEnabled: true,
    socialNotifications: true,
    insightNotifications: true
  };

  // Smart notification messages based on BJ Fogg triggers
  private messageTemplates = {
    morning: [
      "What's one thing you're looking forward to today?",
      "How are you feeling as you start this day?",
      "What intention do you want to set for today?"
    ],
    evening: [
      "What made you smile today?",
      "What did you learn about yourself today?",
      "How did you grow today?",
      "What are you grateful for right now?"
    ],
    social: [
      "3 people shared reflections today - what's on your mind?",
      "Sarah just shared something thoughtful. Want to reflect too?",
      "Your reflection yesterday got 5 hearts ♥ Share another thought?"
    ],
    context: [
      "You seem relaxed right now. Perfect time for a quick reflection.",
      "Take a moment to capture this feeling in words.",
      "What insights are coming up for you in this moment?"
    ],
    streak: [
      "You're on a 3-day reflection streak! Keep it going.",
      "7 days of authentic sharing - you're building something beautiful.",
      "Your consistency is inspiring others in the community."
    ]
  };

  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
    }
    // For React Native, handle native notifications here
    return true; // Mock approval for development
  }

  async scheduleNotification(trigger: NotificationTrigger): Promise<void> {
    this.notifications.push(trigger);
    console.log('🔔 Notification scheduled:', trigger.message);
    
    if (Platform.OS === 'web' && 'Notification' in window) {
      // For development, show immediate notification
      this.showNotification(trigger.message);
    }
  }

  private showNotification(message: string): void {
    if (Platform.OS === 'web' && Notification.permission === 'granted') {
      new Notification('Cupido', {
        body: message,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  // Smart scheduling based on user behavior and context
  async scheduleSmartTriggers(): Promise<void> {
    const now = new Date();
    
    // Daily reflection reminder
    const reflectionTime = new Date();
    const [hours, minutes] = this.preferences.dailyReflectionTime.split(':');
    reflectionTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (reflectionTime > now) {
      await this.scheduleNotification({
        id: `daily-${now.getTime()}`,
        type: 'time',
        message: this.getRandomMessage('evening'),
        scheduledTime: reflectionTime
      });
    }

    // Morning intention setting (30 minutes after wake-up simulation)
    const morningTime = new Date();
    morningTime.setHours(8, 30, 0, 0);
    if (morningTime > now) {
      await this.scheduleNotification({
        id: `morning-${now.getTime()}`,
        type: 'time',
        message: this.getRandomMessage('morning'),
        scheduledTime: morningTime
      });
    }

    // Social triggers (simulate community activity)
    setTimeout(() => {
      this.scheduleNotification({
        id: `social-${Date.now()}`,
        type: 'social',
        message: this.getRandomMessage('social'),
        social: {
          friendCount: Math.floor(Math.random() * 5) + 2,
          communityActivity: 'reflection_shared'
        }
      });
    }, Math.random() * 60000 * 30); // Random within 30 minutes
  }

  private getRandomMessage(category: keyof typeof this.messageTemplates): string {
    const messages = this.messageTemplates[category];
    return messages[Math.floor(Math.random() * messages.length)];
  }

  // Habit formation - streak notifications
  async checkStreakMilestones(currentStreak: number): Promise<void> {
    const milestones = [3, 7, 14, 30, 60, 100];
    
    if (milestones.includes(currentStreak)) {
      await this.scheduleNotification({
        id: `streak-${currentStreak}`,
        type: 'social',
        message: `🔥 ${currentStreak} day reflection streak! You're building authentic self-awareness.`,
      });
    }
  }

  // Context-aware triggers (simulate based on time patterns)
  async triggerContextualNotification(): Promise<void> {
    const hour = new Date().getHours();
    let contextMessage = this.getRandomMessage('context');
    
    // Customize based on time of day
    if (hour >= 6 && hour < 12) {
      contextMessage = "Morning clarity: What insights are emerging for you?";
    } else if (hour >= 12 && hour < 17) {
      contextMessage = "Midday pause: How are you feeling in this moment?";
    } else if (hour >= 17 && hour < 22) {
      contextMessage = "Evening reflection: What stood out to you today?";
    }

    await this.scheduleNotification({
      id: `context-${Date.now()}`,
      type: 'context',
      message: contextMessage,
      context: {
        activity: 'contemplative_moment'
      }
    });
  }

  updatePreferences(newPreferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    console.log('📱 Notification preferences updated:', this.preferences);
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // Initialize notification system
  async initialize(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (hasPermission) {
      await this.scheduleSmartTriggers();
      console.log('✅ Smart notification system initialized');
    }
  }
}

export const notificationService = new NotificationService();