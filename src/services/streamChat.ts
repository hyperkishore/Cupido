// @ts-nocheck
import { StreamChat } from 'stream-chat';
import { supabase } from './supabase';

export class StreamChatService {
  private static client: StreamChat | null = null;

  static async initialize(apiKey: string) {
    if (this.client) return this.client;

    this.client = StreamChat.getInstance(apiKey);
    return this.client;
  }

  static async connectUser(userId: string, userToken: string, userName: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    await this.client.connectUser(
      {
        id: userId,
        name: userName,
        // Keep user info minimal for privacy
        privacy_mode: true,
      },
      userToken
    );
  }

  static async createChannel(matchId: string, userId1: string, userId2: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', matchId, {
      members: [userId1, userId2],
      name: 'Private Match Chat',
      privacy_mode: true,
      // Custom fields for Cupido
      match_id: matchId,
      cupido_channel: true,
    });

    await channel.create();
    return channel;
  }

  static async getChannel(matchId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', matchId);
    await channel.watch();
    return channel;
  }

  static async generateUserToken(userId: string): Promise<string> {
    // This should be called from your backend
    // For now, we'll simulate it with a Supabase function call
    const { data, error } = await supabase.functions.invoke('generate-stream-token', {
      body: { userId }
    });

    if (error) throw error;
    return data.token;
  }

  static async disconnectUser() {
    if (this.client) {
      await this.client.disconnectUser();
    }
  }

  static async getChannels(userId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const filter = {
      type: 'messaging',
      members: { $in: [userId] },
      cupido_channel: true,
    };

    const channels = await this.client.queryChannels(filter, {
      last_message_at: -1,
    });

    return channels;
  }

  static async deleteChannel(channelId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', channelId);
    await channel.delete();
  }

  static async muteChannel(channelId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', channelId);
    await channel.mute();
  }

  static async unmuteChannel(channelId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', channelId);
    await channel.unmute();
  }

  static async addModerationRules(channelId: string) {
    if (!this.client) {
      throw new Error('Stream Chat client not initialized');
    }

    const channel = this.client.channel('messaging', channelId);
    
    // Add custom moderation rules
    await channel.updatePartial({
      set: {
        moderation_enabled: true,
        profanity_filter: true,
        // Custom Cupido rules
        cupido_safe_mode: true,
        max_message_length: 1000,
        link_sharing_disabled: true,
        image_sharing_disabled: true, // For initial privacy
      }
    });
  }
}