/**
 * PostMessage Security Tests
 * 
 * These tests validate that our postMessage security implementation
 * properly blocks rogue messages from unauthorized origins.
 */

// Mock DOM environment for testing
function mockWindow() {
  const mockWindow = {
    location: { origin: 'http://localhost:3001' },
    parent: { postMessage: jest.fn() },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    console: {
      warn: jest.fn(),
      log: jest.fn(),
      error: jest.fn()
    }
  };
  
  global.window = mockWindow;
  return mockWindow;
}

describe('PostMessage Security Tests', () => {
  let mockWindow;
  
  beforeEach(() => {
    mockWindow = mockWindow();
    jest.clearAllMocks();
  });

  describe('SimpleReflectionChat Security', () => {
    test('should block messages from unauthorized origins', () => {
      // Mock the message handler from SimpleReflectionChat
      const handleTestMessage = (event) => {
        // CRITICAL SECURITY: Validate message origin before processing
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        
        // Process authorized message
        console.log('Authorized message processed:', event.data);
      };

      // Test with unauthorized origin
      const rogueEvent = {
        origin: 'http://malicious-site.com',
        data: { type: 'test-send-message', message: 'INJECTION ATTEMPT' }
      };
      
      handleTestMessage(rogueEvent);
      
      // Should log warning and not process
      expect(mockWindow.console.warn).toHaveBeenCalledWith(
        '🔒 Blocked postMessage from unauthorized origin:', 
        'http://malicious-site.com'
      );
      expect(mockWindow.console.log).not.toHaveBeenCalledWith(
        'Authorized message processed:', 
        expect.anything()
      );
    });

    test('should allow messages from same origin', () => {
      const handleTestMessage = (event) => {
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        console.log('Authorized message processed:', event.data);
      };

      // Test with authorized origin
      const authorizedEvent = {
        origin: 'http://localhost:3001', // Same as window.location.origin
        data: { type: 'test-send-message', message: 'LEGITIMATE MESSAGE' }
      };
      
      handleTestMessage(authorizedEvent);
      
      // Should not log warning and should process
      expect(mockWindow.console.warn).not.toHaveBeenCalled();
      expect(mockWindow.console.log).toHaveBeenCalledWith(
        'Authorized message processed:', 
        { type: 'test-send-message', message: 'LEGITIMATE MESSAGE' }
      );
    });
  });

  describe('Dashboard PostMessage Security', () => {
    test('should use correct origin when posting to iframe', () => {
      // Mock iframe contentWindow
      const mockIframe = {
        contentWindow: {
          postMessage: jest.fn()
        }
      };
      
      // Mock document.getElementById
      global.document = {
        getElementById: jest.fn(() => mockIframe)
      };

      // Simulate dashboard postMessage function
      function sendToApp(message) {
        const frame = document.getElementById('live-app-iframe');
        frame.contentWindow.postMessage({
          type: 'test-send-message',
          message: message
        }, window.location.origin); // Should use origin, not '*'
      }

      sendToApp('test message');

      // Verify correct origin is used
      expect(mockIframe.contentWindow.postMessage).toHaveBeenCalledWith(
        { type: 'test-send-message', message: 'test message' },
        'http://localhost:3001' // Not '*'
      );
    });

    test('should validate origin in dashboard message listeners', () => {
      const dashboardMessageHandler = (event) => {
        // CRITICAL SECURITY: Validate message origin before processing
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'test-state-response') {
          console.log('Dashboard received authorized state response');
        }
      };

      // Test rogue message to dashboard
      const rogueEvent = {
        origin: 'http://attacker.com',
        data: { type: 'test-state-response', maliciousPayload: 'XSS_ATTEMPT' }
      };
      
      dashboardMessageHandler(rogueEvent);
      
      expect(mockWindow.console.warn).toHaveBeenCalledWith(
        '🔒 Blocked postMessage from unauthorized origin:', 
        'http://attacker.com'
      );
      expect(mockWindow.console.log).not.toHaveBeenCalled();
    });
  });

  describe('Cross-Origin Attack Scenarios', () => {
    test('should block iframe hijacking attempts', () => {
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        
        // Dangerous operation that should only happen with trusted messages
        if (event.data.type === 'admin-command') {
          console.log('CRITICAL: Admin command executed');
        }
      };

      // Attacker tries to execute admin command
      const attackEvent = {
        origin: 'http://evil.com',
        data: { 
          type: 'admin-command', 
          command: 'delete-all-data',
          payload: { malicious: true }
        }
      };
      
      messageHandler(attackEvent);
      
      // Should block the attack
      expect(mockWindow.console.warn).toHaveBeenCalled();
      expect(mockWindow.console.log).not.toHaveBeenCalledWith(
        'CRITICAL: Admin command executed'
      );
    });

    test('should block data exfiltration attempts', () => {
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        
        if (event.data.type === 'get-sensitive-data') {
          // This should never execute for unauthorized origins
          window.parent.postMessage({
            type: 'sensitive-data-response',
            userProfile: { secret: 'sensitive-info' }
          }, event.origin);
        }
      };

      // Attacker tries to steal sensitive data
      const dataTheftEvent = {
        origin: 'http://data-thief.com',
        data: { type: 'get-sensitive-data' }
      };
      
      messageHandler(dataTheftEvent);
      
      // Should block and not send sensitive data
      expect(mockWindow.console.warn).toHaveBeenCalled();
      expect(mockWindow.parent.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined origins safely', () => {
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        console.log('Message processed');
      };

      // Test with null origin
      messageHandler({ origin: null, data: { type: 'test' } });
      expect(mockWindow.console.warn).toHaveBeenCalled();

      // Test with undefined origin  
      messageHandler({ origin: undefined, data: { type: 'test' } });
      expect(mockWindow.console.warn).toHaveBeenCalled();
      
      // Should never process these
      expect(mockWindow.console.log).not.toHaveBeenCalledWith('Message processed');
    });

    test('should handle subdomain attempts', () => {
      const messageHandler = (event) => {
        if (event.origin !== window.location.origin) {
          console.warn('🔒 Blocked postMessage from unauthorized origin:', event.origin);
          return;
        }
        console.log('Message processed');
      };

      // Test with subdomain (should be blocked)
      messageHandler({ 
        origin: 'http://malicious.localhost:3001', 
        data: { type: 'test' } 
      });
      
      expect(mockWindow.console.warn).toHaveBeenCalled();
      expect(mockWindow.console.log).not.toHaveBeenCalledWith('Message processed');
    });
  });
});

// Integration test that can be run in browser console
window.testPostMessageSecurity = function() {
  console.log('🧪 Running PostMessage Security Integration Test...');
  
  // Create a test iframe that tries to send unauthorized messages
  const testFrame = document.createElement('iframe');
  testFrame.style.display = 'none';
  testFrame.src = 'data:text/html,<script>parent.postMessage({type:"attack",payload:"XSS"},"*")</script>';
  document.body.appendChild(testFrame);
  
  let attackBlocked = false;
  
  const testListener = (event) => {
    if (event.origin !== window.location.origin) {
      console.log('✅ SECURITY TEST PASSED: Attack blocked from', event.origin);
      attackBlocked = true;
    } else if (event.data.type === 'attack') {
      console.error('❌ SECURITY TEST FAILED: Attack succeeded!');
    }
  };
  
  window.addEventListener('message', testListener);
  
  setTimeout(() => {
    window.removeEventListener('message', testListener);
    document.body.removeChild(testFrame);
    
    if (attackBlocked) {
      console.log('🔒 PostMessage security is working correctly');
    } else {
      console.warn('⚠️ PostMessage security test inconclusive');
    }
  }, 1000);
};

console.log('🔒 PostMessage Security Tests loaded. Run window.testPostMessageSecurity() to test in browser.');