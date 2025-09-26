// Instagram Integration Service for Cupido

interface InstagramPost {
  id: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl: string;
  caption: string;
  timestamp: Date;
  likes: number;
  comments: number;
  hashtags: string[];
}

interface InstagramReel {
  id: string;
  mediaUrl: string;
  thumbnailUrl: string;
  caption: string;
  duration: number;
  viewCount: number;
  shareUrl: string;
}

interface PersonalityInsights {
  interests: string[];
  lifestyle: string[];
  values: string[];
  emotionalTone: string;
  socialStyle: string;
}

class InstagramService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_ID || '';
    this.clientSecret = process.env.EXPO_PUBLIC_INSTAGRAM_CLIENT_SECRET || '';
    this.redirectUri = process.env.EXPO_PUBLIC_INSTAGRAM_REDIRECT_URI || '';
  }

  // OAuth flow for Instagram authentication
  getAuthorizationUrl(): string {
    const scope = 'user_profile,user_media';
    return `https://api.instagram.com/oauth/authorize?client_id=${this.clientId}&redirect_uri=${this.redirectUri}&scope=${scope}&response_type=code`;
  }

  async exchangeCodeForToken(code: string): Promise<string> {
    try {
      const response = await fetch('https://api.instagram.com/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          grant_type: 'authorization_code',
          redirect_uri: this.redirectUri,
          code: code,
        }),
      });

      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  // Fetch user's Instagram posts
  async fetchUserPosts(accessToken: string, limit: number = 20): Promise<InstagramPost[]> {
    try {
      const fields = 'id,media_type,media_url,caption,timestamp,like_count,comments_count';
      const response = await fetch(
        `https://graph.instagram.com/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
      );

      const data = await response.json();
      
      return data.data.map((post: any) => ({
        id: post.id,
        mediaType: post.media_type,
        mediaUrl: post.media_url,
        caption: post.caption || '',
        timestamp: new Date(post.timestamp),
        likes: post.like_count || 0,
        comments: post.comments_count || 0,
        hashtags: this.extractHashtags(post.caption || '')
      }));
    } catch (error) {
      console.error('Fetch posts error:', error);
      return [];
    }
  }

  // Share Instagram reel in chat
  async shareReel(reelUrl: string, userId: string): Promise<InstagramReel | null> {
    try {
      // Extract reel ID from URL
      const reelId = this.extractReelId(reelUrl);
      if (!reelId) return null;

      // Fetch reel metadata using Instagram's oEmbed API
      const response = await fetch(
        `https://graph.facebook.com/v12.0/instagram_oembed?url=${encodeURIComponent(reelUrl)}&access_token=${this.clientId}`
      );

      const data = await response.json();

      const reel: InstagramReel = {
        id: reelId,
        mediaUrl: reelUrl,
        thumbnailUrl: data.thumbnail_url || '',
        caption: data.title || '',
        duration: 0, // Would need additional API call
        viewCount: 0, // Would need additional API call
        shareUrl: reelUrl
      };

      // Analyze reel for personality insights
      await this.analyzeReelContent(reel, userId);

      return reel;
    } catch (error) {
      console.error('Share reel error:', error);
      return null;
    }
  }

  // Analyze Instagram content for personality insights
  async analyzeUserPersonality(posts: InstagramPost[]): Promise<PersonalityInsights> {
    const allHashtags: string[] = [];
    const allCaptions: string[] = [];
    
    posts.forEach(post => {
      allHashtags.push(...post.hashtags);
      allCaptions.push(post.caption);
    });

    // Analyze hashtags for interests
    const interests = this.categorizeHashtags(allHashtags);
    
    // Analyze captions for emotional tone
    const emotionalTone = this.analyzeEmotionalTone(allCaptions);
    
    // Determine lifestyle from posting patterns
    const lifestyle = this.determineLifestyle(posts);
    
    // Extract values from content themes
    const values = this.extractValues(allCaptions, allHashtags);
    
    // Determine social style from engagement patterns
    const socialStyle = this.determineSocialStyle(posts);

    return {
      interests,
      lifestyle,
      values,
      emotionalTone,
      socialStyle
    };
  }

  private extractHashtags(caption: string): string[] {
    const hashtagRegex = /#\w+/g;
    return caption.match(hashtagRegex) || [];
  }

  private extractReelId(url: string): string | null {
    const reelRegex = /reel\/([A-Za-z0-9_-]+)/;
    const match = url.match(reelRegex);
    return match ? match[1] : null;
  }

  private categorizeHashtags(hashtags: string[]): string[] {
    const categories: { [key: string]: string[] } = {
      travel: ['travel', 'wanderlust', 'explore', 'adventure', 'vacation'],
      fitness: ['fitness', 'gym', 'workout', 'health', 'wellness'],
      food: ['foodie', 'cooking', 'recipe', 'restaurant', 'food'],
      art: ['art', 'creative', 'design', 'photography', 'artist'],
      music: ['music', 'concert', 'festival', 'musician', 'song'],
      nature: ['nature', 'outdoors', 'hiking', 'beach', 'mountains'],
      fashion: ['fashion', 'style', 'ootd', 'outfit', 'shopping'],
      tech: ['tech', 'technology', 'coding', 'startup', 'innovation']
    };

    const interests = new Set<string>();
    
    hashtags.forEach(tag => {
      const normalizedTag = tag.toLowerCase().replace('#', '');
      for (const [category, keywords] of Object.entries(categories)) {
        if (keywords.some(keyword => normalizedTag.includes(keyword))) {
          interests.add(category);
        }
      }
    });

    return Array.from(interests);
  }

  private analyzeEmotionalTone(captions: string[]): string {
    const positiveWords = ['happy', 'love', 'excited', 'grateful', 'blessed', 'amazing', 'beautiful'];
    const negativeWords = ['sad', 'tired', 'stressed', 'angry', 'frustrated', 'worried'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    captions.forEach(caption => {
      const lowerCaption = caption.toLowerCase();
      positiveWords.forEach(word => {
        if (lowerCaption.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (lowerCaption.includes(word)) negativeCount++;
      });
    });

    if (positiveCount > negativeCount * 2) return 'optimistic';
    if (negativeCount > positiveCount * 2) return 'contemplative';
    return 'balanced';
  }

  private determineLifestyle(posts: InstagramPost[]): string[] {
    const lifestyle: string[] = [];
    
    // Analyze posting times
    const postingHours = posts.map(p => p.timestamp.getHours());
    const avgHour = postingHours.reduce((a, b) => a + b, 0) / postingHours.length;
    
    if (avgHour < 9) lifestyle.push('early_bird');
    else if (avgHour > 22) lifestyle.push('night_owl');
    
    // Analyze posting frequency
    const daysBetweenPosts = this.calculateAveragePostingFrequency(posts);
    if (daysBetweenPosts < 3) lifestyle.push('active_sharer');
    else if (daysBetweenPosts > 14) lifestyle.push('private_person');
    
    return lifestyle;
  }

  private calculateAveragePostingFrequency(posts: InstagramPost[]): number {
    if (posts.length < 2) return 30;
    
    const sortedPosts = posts.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const timeDiffs: number[] = [];
    
    for (let i = 1; i < sortedPosts.length; i++) {
      const diff = sortedPosts[i].timestamp.getTime() - sortedPosts[i-1].timestamp.getTime();
      timeDiffs.push(diff / (1000 * 60 * 60 * 24)); // Convert to days
    }
    
    return timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length;
  }

  private extractValues(captions: string[], hashtags: string[]): string[] {
    const values: string[] = [];
    const allText = [...captions, ...hashtags].join(' ').toLowerCase();
    
    const valueKeywords = {
      family: ['family', 'mom', 'dad', 'sister', 'brother', 'parents'],
      career: ['work', 'career', 'professional', 'business', 'entrepreneur'],
      spirituality: ['spiritual', 'meditation', 'mindful', 'soul', 'universe'],
      adventure: ['adventure', 'explore', 'discover', 'journey', 'experience'],
      creativity: ['create', 'creative', 'art', 'design', 'imagine'],
      community: ['community', 'together', 'support', 'help', 'volunteer']
    };
    
    for (const [value, keywords] of Object.entries(valueKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        values.push(value);
      }
    }
    
    return values;
  }

  private determineSocialStyle(posts: InstagramPost[]): string {
    const avgEngagement = posts.reduce((sum, post) => sum + post.likes + post.comments, 0) / posts.length;
    const avgCaptionLength = posts.reduce((sum, post) => sum + post.caption.length, 0) / posts.length;
    
    if (avgEngagement > 100 && avgCaptionLength > 100) return 'influencer';
    if (avgEngagement > 50 && avgCaptionLength < 50) return 'visual_storyteller';
    if (avgCaptionLength > 200) return 'writer';
    if (posts.length > 50) return 'documenter';
    
    return 'casual_sharer';
  }

  private async analyzeReelContent(reel: InstagramReel, userId: string) {
    // Store reel analysis for personality building
    // This would integrate with the authenticity scoring engine
    console.log(`Analyzing reel ${reel.id} for user ${userId}`);
    
    // TODO: Implement video analysis
    // - Analyze audio for music preferences
    // - Analyze visual content for lifestyle indicators
    // - Extract text/captions for sentiment analysis
  }
}

export const instagramService = new InstagramService();