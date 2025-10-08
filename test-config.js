// Comprehensive Test Configuration
// This defines all 40 tests organized into 7 categories

const TEST_CATEGORIES = {
  console: {
    id: 'console',
    icon: '🔴',
    title: 'Console Error Detection',
    description: 'Critical tests that monitor console errors during execution',
    color: '#ff3b30',
    tests: [
      {
        id: 'console-1',
        name: 'No ReferenceErrors',
        description: 'Monitor for ReferenceError during message send (catches bugs like commonLocations)',
        module: 'userProfileService.ts'
      },
      {
        id: 'console-2',
        name: 'No TypeErrors',
        description: 'Monitor for TypeError in state management and rendering',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'console-3',
        name: 'No Uncaught Promises',
        description: 'Detect unhandled promise rejections in async operations',
        module: 'chatAiService.ts'
      },
      {
        id: 'console-4',
        name: 'No Network Errors',
        description: 'Monitor for failed API calls that aren\'t properly handled',
        module: 'simpleChatService.ts'
      },
      {
        id: 'console-5',
        name: 'No Database Errors',
        description: 'Check for Supabase connection or query errors',
        module: 'chatDatabase.ts'
      }
    ]
  },

  message: {
    id: 'message',
    icon: '💬',
    title: 'Message Flow & UI',
    description: 'Tests for message sending, display, and user interaction',
    color: '#007aff',
    tests: [
      {
        id: 'message-1',
        name: 'User Message Appears',
        description: 'Verify user message immediately appears in UI after send',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-2',
        name: 'Message Persistence',
        description: 'User message persists even if DB save fails',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-3',
        name: 'Message Order',
        description: 'Messages display in correct chronological order',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-4',
        name: 'Duplicate Prevention',
        description: 'Prevent duplicate messages from rapid clicking',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-5',
        name: 'Input Field Clears',
        description: 'Input field clears immediately after send',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-6',
        name: 'Scroll to Bottom',
        description: 'Auto-scroll to latest message after send',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-7',
        name: 'Long Message Support',
        description: 'Handle messages over 500 characters without breaking UI',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'message-8',
        name: 'Special Characters',
        description: 'Handle emojis and Unicode characters correctly',
        module: 'SimpleReflectionChat.tsx'
      }
    ]
  },

  profile: {
    id: 'profile',
    icon: '👤',
    title: 'Profile Extraction',
    description: 'Tests for extracting and storing user profile information',
    color: '#5ac8fa',
    tests: [
      {
        id: 'profile-1',
        name: 'Name Extraction',
        description: 'Extract user name from conversational messages',
        module: 'userProfileService.ts'
      },
      {
        id: 'profile-2',
        name: 'Location vs Name',
        description: 'Don\'t confuse city names with user names',
        module: 'userProfileService.ts'
      },
      {
        id: 'profile-3',
        name: 'Age Detection',
        description: 'Extract age when mentioned in conversation',
        module: 'userProfileService.ts'
      },
      {
        id: 'profile-4',
        name: 'Gender Detection',
        description: 'Identify gender preferences from messages',
        module: 'userProfileService.ts'
      },
      {
        id: 'profile-5',
        name: 'Profile Persistence',
        description: 'Profile data persists across page reloads',
        module: 'userProfileService.ts'
      },
      {
        id: 'profile-6',
        name: 'Profile Update',
        description: 'Profile updates without overwriting existing data',
        module: 'userProfileService.ts'
      }
    ]
  },

  database: {
    id: 'database',
    icon: '💾',
    title: 'Database Operations',
    description: 'Tests for Supabase database interactions',
    color: '#34c759',
    tests: [
      {
        id: 'database-1',
        name: 'User Creation',
        description: 'Create new user with unique session ID',
        module: 'chatDatabase.ts'
      },
      {
        id: 'database-2',
        name: 'Conversation Init',
        description: 'Initialize conversation and return valid ID',
        module: 'chatDatabase.ts'
      },
      {
        id: 'database-3',
        name: 'Save User Message',
        description: 'Save user message to database successfully',
        module: 'chatDatabase.ts'
      },
      {
        id: 'database-4',
        name: 'Save AI Message',
        description: 'Save AI response to database with metadata',
        module: 'chatDatabase.ts'
      },
      {
        id: 'database-5',
        name: 'Conversation History',
        description: 'Load conversation history correctly',
        module: 'chatDatabase.ts'
      }
    ]
  },

  error: {
    id: 'error',
    icon: '⚠️',
    title: 'Error Handling & Recovery',
    description: 'Tests for graceful error handling and recovery',
    color: '#ff9500',
    tests: [
      {
        id: 'error-1',
        name: 'Network Failure',
        description: 'Gracefully handle network timeout/disconnection',
        module: 'chatAiService.ts'
      },
      {
        id: 'error-2',
        name: 'API Error Response',
        description: 'Handle API 500/400 errors without crashing',
        module: 'simpleChatService.ts'
      },
      {
        id: 'error-3',
        name: 'Database Failure',
        description: 'Continue functioning if DB save fails',
        module: 'chatDatabase.ts'
      },
      {
        id: 'error-4',
        name: 'Invalid Message',
        description: 'Handle empty or malformed message input',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'error-5',
        name: 'AI Timeout',
        description: 'Handle AI response timeout gracefully',
        module: 'chatAiService.ts'
      },
      {
        id: 'error-6',
        name: 'Retry Mechanism',
        description: 'Allow user to retry failed messages',
        module: 'SimpleReflectionChat.tsx'
      }
    ]
  },

  state: {
    id: 'state',
    icon: '🔄',
    title: 'State Management',
    description: 'Tests for UI state consistency and correctness',
    color: '#af52de',
    tests: [
      {
        id: 'state-1',
        name: 'Send Button State',
        description: 'Send button enables/disables correctly',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'state-2',
        name: 'isSending Reset',
        description: 'isSending always resets even after errors',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'state-3',
        name: 'Typing Indicator',
        description: 'Typing indicator shows and hides at right times',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'state-4',
        name: 'Message Count',
        description: 'Message count updates accurately',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'state-5',
        name: 'Conversation ID',
        description: 'Conversation ID persists correctly',
        module: 'SimpleReflectionChat.tsx'
      },
      {
        id: 'state-6',
        name: 'Loading States',
        description: 'All loading states transition correctly',
        module: 'SimpleReflectionChat.tsx'
      }
    ]
  },

  api: {
    id: 'api',
    icon: '🌐',
    title: 'API & Performance',
    description: 'Tests for API connectivity and performance metrics',
    color: '#ffcc00',
    tests: [
      {
        id: 'api-1',
        name: 'API Connectivity',
        description: 'Server is running and responding to requests',
        module: 'server.js'
      },
      {
        id: 'api-2',
        name: 'Claude API',
        description: 'Claude AI API returns valid responses',
        module: 'chatAiService.ts'
      },
      {
        id: 'api-3',
        name: 'Response Time',
        description: 'API responds within acceptable time (<10s)',
        module: 'simpleChatService.ts'
      },
      {
        id: 'api-4',
        name: 'Model Selection',
        description: 'Correct AI model (Haiku/Sonnet) is used',
        module: 'chatAiService.ts'
      }
    ]
  }
};

// Export for use in test dashboard
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TEST_CATEGORIES };
}
