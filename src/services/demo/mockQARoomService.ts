import { QARoom, QAMessage } from '../../types';
import { DEMO_QA_ROOM, DEMO_QA_MESSAGES } from './mockData';

export class MockQARoomService {
  static async createQARoom(matchId: string, users: string[]): Promise<QARoom> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const room: QARoom = {
      id: `room_${Date.now()}`,
      matchId,
      users,
      messages: [],
      createdAt: new Date().toISOString(),
    };
    
    return room;
  }

  static async getQARoom(roomId: string): Promise<QARoom | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    if (roomId === 'room-1') {
      return DEMO_QA_ROOM;
    }
    
    return null;
  }

  static async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    type: 'question' | 'answer'
  ): Promise<QAMessage> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const message: QAMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content,
      type,
      createdAt: new Date().toISOString(),
    };
    
    // Add to demo messages
    DEMO_QA_MESSAGES.push(message);
    
    return message;
  }

  static async getMessages(roomId: string): Promise<QAMessage[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return DEMO_QA_MESSAGES;
  }

  static async revealIdentities(roomId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo, just set the revealed timestamp
    DEMO_QA_ROOM.revealedAt = new Date().toISOString();
  }

  static async getRoomByMatchId(matchId: string): Promise<QARoom | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    if (matchId === 'match-2') {
      return DEMO_QA_ROOM;
    }
    
    return null;
  }

  static async getUserRooms(userId: string): Promise<QARoom[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return [DEMO_QA_ROOM];
  }

  static async getConversationStarters(): Promise<string[]> {
    return [
      "What's something you've learned about yourself this year?",
      "If you could have dinner with anyone, living or dead, who would it be and why?",
      "What's a belief you held as a child that you've since changed your mind about?",
      "What does a perfect day look like to you?",
      "What's something you're passionate about that others might find surprising?",
      "If you could master any skill instantly, what would it be?",
      "What's the most meaningful compliment you've ever received?",
      "What's something you do to recharge when you're feeling drained?",
      "What's a place you've never been but would love to visit?",
      "What's something you're currently curious about?",
    ];
  }

  static async suggestQuestion(roomId: string): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const starters = await this.getConversationStarters();
    const randomIndex = Math.floor(Math.random() * starters.length);
    return starters[randomIndex];
  }

  static async getRoomStats(roomId: string): Promise<{
    totalMessages: number;
    questionsAsked: number;
    answersGiven: number;
    lastActivity: string | null;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const messages = DEMO_QA_MESSAGES;
    const questions = messages.filter(msg => msg.type === 'question');
    const answers = messages.filter(msg => msg.type === 'answer');
    const lastMessage = messages[messages.length - 1];

    return {
      totalMessages: messages.length,
      questionsAsked: questions.length,
      answersGiven: answers.length,
      lastActivity: lastMessage?.createdAt || null,
    };
  }

  static async canRevealIdentities(roomId: string): Promise<boolean> {
    // For demo, allow revealing if there are enough messages
    return DEMO_QA_MESSAGES.length >= 6;
  }

  static async endQARoom(roomId: string): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // For demo, just log the action
    console.log(`QA Room ${roomId} ended`);
  }
}