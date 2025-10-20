import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * TestBridge - Enables communication between the app and test dashboard
 * Only active when running in an iframe (for testing)
 */
export const TestBridge: React.FC = () => {
  useEffect(() => {
    // Only run on web and when inside an iframe
    if (Platform.OS !== 'web' || window.self === window.top) {
      return;
    }

    console.log('[TestBridge] Initializing test bridge for iframe communication');

    const handleMessage = (event: MessageEvent) => {
      const { type, message, requestId, payload } = event.data;

      console.log('[TestBridge] Received message:', { type, message, requestId, payload });

      switch (type) {
        // Test framework compatibility (comprehensive-test-functions.js format)
        case 'test-get-state':
          // NOTE: SimpleReflectionChat.tsx handles this message type with complete state
          // including userId, conversationId, profile, isSending, etc.
          // We don't respond here to avoid sending duplicate/incomplete responses.
          console.log('[TestBridge] test-get-state received, letting SimpleReflectionChat handle it');
          break;

        case 'test-send-message':
          // NOTE: This handler is intentionally minimal
          // The actual message sending is handled by SimpleReflectionChat.tsx
          // which listens for the same message type and properly uses React state
          console.log('[TestBridge] Forwarding test-send-message to app components...');

          // Just acknowledge receipt - the React component will handle the actual sending
          setTimeout(() => {
            window.parent.postMessage({
              type: 'test-message-sent',
              success: true,
            }, '*');
          }, 500);
          break;

        // New message types for better test support
        case 'GET_APP_STATE':
        case 'getAppState':
          const appState = {
            currentScreen: getCurrentScreen(),
            isLoading: false,
            user: getUserState(),
            messages: getMessagesState(),
          };

          window.parent.postMessage({
            type: 'APP_STATE_RESPONSE',
            requestId,
            payload: appState,
          }, '*');
          break;

        case 'QUERY_DOM':
          const { selector } = payload || {};
          const elements = document.querySelectorAll(selector);

          window.parent.postMessage({
            type: 'DOM_QUERY_RESPONSE',
            requestId,
            payload: {
              found: elements.length > 0,
              count: elements.length,
              elements: Array.from(elements).map(el => ({
                tagName: el.tagName,
                id: el.id,
                className: el.className,
                textContent: el.textContent?.substring(0, 100),
              })),
            },
          }, '*');
          break;

        case 'export-chat':
          // Handle chat export functionality
          console.log('[TestBridge] Export chat requested');
          const chatData = getChatExportData();
          
          window.parent.postMessage({
            type: 'chat-exported',
            requestId,
            success: true,
            payload: chatData,
          }, '*');
          break;

        default:
          console.log('[TestBridge] Unhandled message type:', type);
      }
    };

    // Register message listener
    window.addEventListener('message', handleMessage);

    // Notify parent that app is ready
    window.parent.postMessage({
      type: 'APP_READY',
      payload: {
        timestamp: Date.now(),
        platform: Platform.OS,
      },
    }, '*');

    console.log('[TestBridge] Test bridge ready and listening for messages');

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return null; // This component doesn't render anything
};

// Helper functions to get app state
function getCurrentScreen(): string {
  // Try to determine current screen from the active tab in the DOM
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Check which tab is active by looking for active tab indicators
    const tabs = document.querySelectorAll('[role="tab"]');
    for (const tab of Array.from(tabs)) {
      const isActive = tab.getAttribute('aria-selected') === 'true';
      if (isActive) {
        const tabText = tab.textContent?.toLowerCase() || '';
        if (tabText.includes('reflect')) return 'reflect';
        if (tabText.includes('home')) return 'home';
        if (tabText.includes('match')) return 'matches';
        if (tabText.includes('profile')) return 'profile';
      }
    }

    // Fallback: check if chat interface elements are present (means we're on Reflect)
    if (document.querySelector('[data-testid="chat-input"]')) {
      return 'reflect';
    }
  }
  return 'home';
}

function getUserState() {
  // Try to get user state from local storage
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('cupido_current_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
  return null;
}

function getMessagesState() {
  // Try to get messages from DOM
  const messageElements = document.querySelectorAll('[data-testid*="message"]');
  return {
    count: messageElements.length,
  };
}

function getChatExportData() {
  // Extract chat messages from the DOM
  const messageElements = document.querySelectorAll('[data-testid*="message"]');
  const messages = Array.from(messageElements).map((element, index) => {
    const isUser = element.getAttribute('data-testid')?.includes('user') || 
                   element.closest('[data-testid*="user"]') !== null;
    
    return {
      id: index + 1,
      type: isUser ? 'user' : 'assistant', 
      content: element.textContent?.trim() || '',
      timestamp: new Date().toISOString(),
    };
  });

  const exportData = {
    exportTime: new Date().toISOString(),
    conversationId: localStorage.getItem('cupido_conversation_id') || 'unknown',
    userId: getUserState()?.id || 'anonymous',
    messageCount: messages.length,
    messages: messages,
    format: 'cupido-chat-export-v1',
  };

  // Also trigger download in the current window
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cupido-chat-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return exportData;
}
