import { supabase } from './supabase';
import { QARoom, QAMessage } from '../types';
import { DEMO_MODE } from '../config/demo';
import { MockQARoomService } from './demo/mockQARoomService';

export class QARoomService {
  static async createQARoom(matchId: string, users: string[]): Promise<QARoom> {
    if (DEMO_MODE) {
      return MockQARoomService.createQARoom(matchId, users);
    }

    const { data, error } = await supabase
      .from('qa_rooms')
      .insert({
        match_id: matchId,
        users,
        messages: [],
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      matchId: data.match_id,
      users: data.users,
      messages: data.messages || [],
      createdAt: data.created_at,
    };
  }

  static async getQARoom(roomId: string): Promise<QARoom | null> {
    if (DEMO_MODE) {
      return MockQARoomService.getQARoom(roomId);
    }

    const { data, error } = await supabase
      .from('qa_rooms')
      .select('*')
      .eq('id', roomId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      matchId: data.match_id,
      users: data.users,
      messages: data.messages || [],
      revealedAt: data.revealed_at,
      createdAt: data.created_at,
    };
  }

  static async sendMessage(
    roomId: string,
    userId: string,
    content: string,
    type: 'question' | 'answer'
  ): Promise<QAMessage> {
    const room = await this.getQARoom(roomId);
    if (!room) {
      throw new Error('QA room not found');
    }

    const message: QAMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      content,
      type,
      createdAt: new Date().toISOString(),
    };

    const updatedMessages = [...room.messages, message];

    const { error } = await supabase
      .from('qa_rooms')
      .update({ messages: updatedMessages })
      .eq('id', roomId);

    if (error) throw error;

    return message;
  }

  static async getMessages(roomId: string): Promise<QAMessage[]> {
    const room = await this.getQARoom(roomId);
    return room?.messages || [];
  }

  static async revealIdentities(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('qa_rooms')
      .update({ 
        revealed_at: new Date().toISOString(),
        status: 'revealed'
      })
      .eq('id', roomId);

    if (error) throw error;
  }

  static async getRoomByMatchId(matchId: string): Promise<QARoom | null> {
    if (DEMO_MODE) {
      return MockQARoomService.getRoomByMatchId(matchId);
    }

    const { data, error } = await supabase
      .from('qa_rooms')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      matchId: data.match_id,
      users: data.users,
      messages: data.messages || [],
      revealedAt: data.revealed_at,
      createdAt: data.created_at,
    };
  }

  static async getUserRooms(userId: string): Promise<QARoom[]> {
    const { data, error } = await supabase
      .from('qa_rooms')
      .select('*')
      .contains('users', [userId])
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data.map(room => ({
      id: room.id,
      matchId: room.match_id,
      users: room.users,
      messages: room.messages || [],
      revealedAt: room.revealed_at,
      createdAt: room.created_at,
    }));
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
      "What's a small act of kindness that made a big impact on you?",
      "If you could solve one problem in the world, what would it be?",
      "What's something you're grateful for today?",
      "What's a memory that always makes you smile?",
      "What's something you've done that you're proud of?",
      "What's a question you wish more people would ask you?",
      "What's something you've changed your mind about recently?",
      "What's a value that's really important to you?",
      "What's something you're looking forward to?",
      "What's the best advice you've ever received?",
    ];
  }

  static async suggestQuestion(roomId: string): Promise<string> {
    const room = await this.getQARoom(roomId);
    if (!room) {
      throw new Error('QA room not found');
    }

    const askedQuestions = room.messages
      .filter(msg => msg.type === 'question')
      .map(msg => msg.content.toLowerCase());

    const starters = await this.getConversationStarters();
    const availableQuestions = starters.filter(
      question => !askedQuestions.includes(question.toLowerCase())
    );

    if (availableQuestions.length === 0) {
      return "What's something else you'd like to know about me?";
    }

    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    return availableQuestions[randomIndex];
  }

  static async getRoomStats(roomId: string): Promise<{
    totalMessages: number;
    questionsAsked: number;
    answersGiven: number;
    lastActivity: string | null;
  }> {
    const room = await this.getQARoom(roomId);
    if (!room) {
      throw new Error('QA room not found');
    }

    const messages = room.messages;
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
    const room = await this.getQARoom(roomId);
    if (!room) return false;

    // Require at least 6 messages (3 questions + 3 answers) before revealing
    const messageCount = room.messages.length;
    const questionsCount = room.messages.filter(msg => msg.type === 'question').length;
    const answersCount = room.messages.filter(msg => msg.type === 'answer').length;

    return messageCount >= 6 && questionsCount >= 3 && answersCount >= 3;
  }

  static async endQARoom(roomId: string): Promise<void> {
    const { error } = await supabase
      .from('qa_rooms')
      .update({ 
        status: 'ended',
        ended_at: new Date().toISOString()
      })
      .eq('id', roomId);

    if (error) throw error;
  }
}