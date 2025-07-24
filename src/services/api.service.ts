import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getHeaders, API_ERROR_CODES } from '../config/api.config';

export class ApiError extends Error {
  code: string;
  status?: number;
  data?: any;

  constructor(message: string, code: string, status?: number, data?: any) {
    super(message);
    this.code = code;
    this.status = status;
    this.data = data;
  }
}

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  async setToken(token: string | null) {
    this.token = token;
    if (token) {
      await AsyncStorage.setItem('authToken', token);
    } else {
      await AsyncStorage.removeItem('authToken');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = getHeaders(this.token);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new ApiError(
          data.message || 'API request failed',
          data.code || API_ERROR_CODES.SERVER_ERROR,
          response.status,
          data
        );
      }

      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(
        'Network request failed',
        API_ERROR_CODES.NETWORK_ERROR
      );
    }
  }

  // Authentication
  async sendOTP(phoneNumber: string, countryCode: string = '+1') {
    return this.request(API_CONFIG.AUTH.SEND_OTP, {
      method: 'POST',
      body: JSON.stringify({ phoneNumber, countryCode }),
    });
  }

  async verifyOTP(phoneNumber: string, otpCode: string) {
    const response = await this.request<{ token: string; user: any }>(
      API_CONFIG.AUTH.VERIFY_OTP,
      {
        method: 'POST',
        body: JSON.stringify({ phoneNumber, otpCode }),
      }
    );
    
    if (response.token) {
      await this.setToken(response.token);
    }
    
    return response;
  }

  // User Profile
  async getUserProfile() {
    return this.request(API_CONFIG.USER.GET_PROFILE);
  }

  async updateUserProfile(profileData: any) {
    return this.request(API_CONFIG.USER.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // Questions & Reflections
  async getDailyQuestion() {
    return this.request(API_CONFIG.QUESTIONS.GET_DAILY);
  }

  async getCommunityQuestions(page: number = 1, limit: number = 20) {
    return this.request(
      `${API_CONFIG.QUESTIONS.GET_COMMUNITY}?page=${page}&limit=${limit}`
    );
  }

  async submitReflection(questionId: string, answer: string, isPublic: boolean = true) {
    return this.request(API_CONFIG.REFLECTIONS.SUBMIT, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer, isPublic }),
    });
  }

  async likeReflection(reflectionId: string) {
    return this.request(`${API_CONFIG.QUESTIONS.LIKE}/${reflectionId}`, {
      method: 'POST',
    });
  }

  // Social Media
  async connectSocialAccount(platform: string, accessToken: string) {
    return this.request(API_CONFIG.SOCIAL.CONNECT, {
      method: 'POST',
      body: JSON.stringify({ platform, accessToken }),
    });
  }

  async disconnectSocialAccount(platform: string) {
    return this.request(`${API_CONFIG.SOCIAL.DISCONNECT}/${platform}`, {
      method: 'DELETE',
    });
  }

  async getSocialConnections() {
    return this.request(API_CONFIG.SOCIAL.GET_CONNECTIONS);
  }

  // Matching
  async getPotentialMatches() {
    return this.request(API_CONFIG.MATCHING.GET_POTENTIAL_MATCHES);
  }

  async sendMatchRequest(userId: string) {
    return this.request(API_CONFIG.MATCHING.SEND_MATCH_REQUEST, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  }

  // Chat
  async getConversations() {
    return this.request(API_CONFIG.CHAT.GET_CONVERSATIONS);
  }

  async sendMessage(matchId: string, message: string) {
    return this.request(API_CONFIG.CHAT.SEND_MESSAGE, {
      method: 'POST',
      body: JSON.stringify({ matchId, message }),
    });
  }

  // Notifications
  async getNotifications() {
    return this.request(API_CONFIG.NOTIFICATIONS.GET_ALL);
  }

  async markNotificationRead(notificationId: string) {
    return this.request(`${API_CONFIG.NOTIFICATIONS.MARK_READ}/${notificationId}`, {
      method: 'PUT',
    });
  }
}

export default new ApiService();