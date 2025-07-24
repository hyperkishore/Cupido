import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreamChatService } from '../services/streamChat';
import { useAuth } from './AuthContext';
import { DEMO_MODE } from '../config/demo';

interface ChatContextType {
  chatClient: any;
  isConnected: boolean;
  connecting: boolean;
  initializeChat: () => Promise<void>;
  disconnectChat: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [chatClient, setChatClient] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user && !isConnected && !connecting) {
      initializeChat();
    } else if (!user && isConnected) {
      disconnectChat();
    }
  }, [user, isConnected, connecting]);

  const initializeChat = async () => {
    if (!user || connecting) return;

    if (DEMO_MODE) {
      // In demo mode, simulate connection
      setConnecting(true);
      setTimeout(() => {
        setIsConnected(true);
        setConnecting(false);
      }, 1000);
      return;
    }

    setConnecting(true);
    try {
      const apiKey = process.env.EXPO_PUBLIC_STREAM_API_KEY || 'your_stream_api_key';
      
      const client = await StreamChatService.initialize(apiKey);
      
      // Generate user token (should be done on backend)
      const userToken = await StreamChatService.generateUserToken(user.id);
      
      await StreamChatService.connectUser(
        user.id,
        userToken,
        user.email.split('@')[0] // Use email prefix as display name
      );

      setChatClient(client);
      setIsConnected(true);
    } catch (error) {
      console.error('Error initializing chat:', error);
    } finally {
      setConnecting(false);
    }
  };

  const disconnectChat = async () => {
    if (DEMO_MODE) {
      setChatClient(null);
      setIsConnected(false);
      return;
    }

    if (chatClient) {
      try {
        await StreamChatService.disconnectUser();
        setChatClient(null);
        setIsConnected(false);
      } catch (error) {
        console.error('Error disconnecting chat:', error);
      }
    }
  };

  return (
    <ChatContext.Provider
      value={{
        chatClient,
        isConnected,
        connecting,
        initializeChat,
        disconnectChat,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};