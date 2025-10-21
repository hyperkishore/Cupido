// CONTEXT STRATEGY: Enhanced response generation with intelligent context management
export const generateResponseWithContext = async (
  userMessage: string, 
  conversationId: string,
  currentConversation: any,
  setIsTyping: (typing: boolean) => void,
  setTypingMessage: (message: string) => void,
  setMessages: any,
  trimMessagesIfNeeded: any,
  setConversationCount: any,
  conversationCount: number,
  conversationContext: any,
  chatDatabase: any,
  chatAiService: any,
  log: any,
  DEBUG: boolean
) => {
  const startTime = performance.now();
  log.debug('[generateResponse] called with context strategy', { 
    messageLength: userMessage.length, 
    conversationId: conversationId || currentConversation?.id,
    component: 'SimpleReflectionChat' 
  });
  
  setIsTyping(true);
  const activeConversationId = conversationId || currentConversation?.id;

  try {
    if (!activeConversationId) {
      throw new Error('No active conversation ID for context management');
    }

    // STEP 1: Add user message to context strategy
    await conversationContext.addTurn(
      activeConversationId,
      'user',
      userMessage,
      {
        messageType: 'user',
        contextWeight: 1.0
      }
    );

    // STEP 2: Assemble optimized context for Claude
    const contextAssembly = await conversationContext.assembleContext(activeConversationId);
    
    log.perf('Context assembly completed', performance.now() - startTime, {
      conversationId: activeConversationId,
      systemMemoryLength: contextAssembly.systemMemory.length,
      recentMessagesCount: contextAssembly.recentMessages.length,
      totalTokensEstimate: contextAssembly.totalTokensEstimate,
      contextStrategy: contextAssembly.contextStrategy
    });

    // STEP 3: Prepare enhanced messages for Claude
    const messagesForClaude = [];
    
    // Add system memory as context (if exists)
    if (contextAssembly.systemMemory.trim()) {
      messagesForClaude.push({
        role: 'system' as const,
        content: `Context from previous conversation: ${contextAssembly.systemMemory}`
      });
    }

    // Add recent conversation turns
    messagesForClaude.push(...contextAssembly.recentMessages);

    if (DEBUG) {
      console.log('🧠 Context Strategy Assembly:', {
        strategy: contextAssembly.contextStrategy,
        totalTokensEstimate: contextAssembly.totalTokensEstimate,
        systemMemoryChars: contextAssembly.systemMemory.length,
        recentTurns: contextAssembly.recentMessages.length,
        messagesForClaude: messagesForClaude.length
      });
    }

    // STEP 4: Call AI with optimized context (30s timeout)
    const aiResponsePromise = chatAiService.generateResponse(
      messagesForClaude,
      'sonnet' // Use more capable model with better context
    );

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI_TIMEOUT: Response took longer than 30s')), 30000)
    );

    const aiResponse = await Promise.race([aiResponsePromise, timeoutPromise]);
    
    // STEP 5: Add natural delay for human-like interaction
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));

    // STEP 6: Save AI response with enhanced metadata
    const savedBotMessage = await chatDatabase.saveMessageWithTokens(
      activeConversationId,
      aiResponse.message,
      true, // is_bot
      aiResponse.usedModel,
      {
        response_time: performance.now() - startTime,
        conversation_count: conversationCount + 1,
        context_strategy: contextAssembly.contextStrategy,
        total_context_tokens: contextAssembly.totalTokensEstimate,
        shouldAskQuestion: aiResponse.shouldAskQuestion
      }
    );

    // STEP 7: Add AI response to context strategy
    if (savedBotMessage) {
      await conversationContext.addTurn(
        activeConversationId,
        'assistant',
        aiResponse.message,
        {
          messageType: 'assistant',
          contextWeight: 1.0,
          aiModel: aiResponse.usedModel
        }
      );
    }

    // STEP 8: Update UI optimistically
    if (!savedBotMessage) {
      log.error('Failed to save AI message to database', undefined, { 
        conversationId: activeConversationId,
        component: 'SimpleReflectionChat' 
      });
      
      // Show message anyway with failed save indicator
      const tempBotMessage = {
        id: `temp_${Date.now()}`,
        text: aiResponse.message,
        isBot: true,
        timestamp: new Date(),
        saveFailed: true
      };
      setMessages((prev: any) => trimMessagesIfNeeded([...prev, tempBotMessage]));
    } else {
      const botMessage = {
        id: savedBotMessage.id,
        text: aiResponse.message,
        isBot: true,
        timestamp: new Date(savedBotMessage.created_at),
      };
      setMessages((prev: any) => {
        // Check for duplicates before adding
        const exists = prev.find((msg: any) => msg.id === savedBotMessage.id);
        if (exists) {
          log.debug('Bot message already exists, not adding duplicate', { 
            messageId: savedBotMessage.id,
            component: 'SimpleReflectionChat' 
          });
          return prev;
        }
        return trimMessagesIfNeeded([...prev, botMessage]);
      });
    }

    // Log performance metrics
    log.perf('Complete response generation', performance.now() - startTime, {
      conversationId: activeConversationId,
      messageLength: aiResponse.message.length,
      contextStrategy: contextAssembly.contextStrategy,
      usedModel: aiResponse.usedModel
    });

    setConversationCount((prev: number) => prev + 1);

  } catch (error: any) {
    log.error('Error in context-aware response generation', error, { 
      conversationId: activeConversationId,
      component: 'SimpleReflectionChat' 
    });

    // Enhanced error handling with context awareness
    let fallbackText = "I apologize, but I'm having trouble responding right now. Could you try rephrasing your message?";

    if (error?.message?.includes('AI_TIMEOUT')) {
      fallbackText = "I'm taking a bit longer than usual to think. Could you try asking again? Sometimes a shorter message helps.";
    } else if (error?.message?.includes('NETWORK') || error?.code === 'NETWORK_ERROR') {
      fallbackText = "I'm having trouble connecting right now. Please check your internet connection and try again.";
    } else if (error?.message?.includes('RATE_LIMIT')) {
      fallbackText = "I need to take a short break. Please wait a moment and try again.";
    } else if (error?.message?.includes('CONTENT_FILTER')) {
      fallbackText = "I can't respond to that type of message. Could you try rephrasing or asking something different?";
    }

    // Save fallback with error context
    if (activeConversationId) {
      try {
        const savedFallback = await chatDatabase.saveMessageWithTokens(
          activeConversationId,
          fallbackText,
          true, // is_bot
          'haiku', // fallback model
          {
            is_error_response: true,
            original_error: error?.message || 'Unknown error',
            conversation_count: conversationCount + 1,
            context_strategy: 'error_fallback'
          }
        );

        if (savedFallback) {
          // Add error response to context (but with lower weight)
          await conversationContext.addTurn(
            activeConversationId,
            'assistant',
            fallbackText,
            {
              messageType: 'error_response',
              contextWeight: 0.3 // Lower weight for error responses
            }
          );

          const fallbackMessage = {
            id: savedFallback.id,
            text: fallbackText,
            isBot: true,
            timestamp: new Date(savedFallback.created_at),
          };
          setMessages((prev: any) => trimMessagesIfNeeded([...prev, fallbackMessage]));
        }
      } catch (dbError) {
        log.error('Failed to save fallback message', dbError, { 
          conversationId: activeConversationId,
          component: 'SimpleReflectionChat' 
        });
        
        // Show fallback without saving
        const fallbackMessage = {
          id: `fallback_${Date.now()}`,
          text: fallbackText,
          isBot: true,
          timestamp: new Date(),
          saveFailed: true
        };
        setMessages((prev: any) => trimMessagesIfNeeded([...prev, fallbackMessage]));
      }
    } else {
      // No conversation ID - show fallback only
      const fallbackMessage = {
        id: `fallback_${Date.now()}`,
        text: fallbackText,
        isBot: true,
        timestamp: new Date(),
        saveFailed: true
      };
      setMessages((prev: any) => trimMessagesIfNeeded([...prev, fallbackMessage]));
    }

    setConversationCount((prev: number) => prev + 1);
  } finally {
    setIsTyping(false);
    setTypingMessage('typing...');
  }
};