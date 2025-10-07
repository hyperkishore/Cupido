import { registerRootComponent } from 'expo';

import App from './App';

// Intercept console logs and forward to parent window (test dashboard)
if (typeof window !== 'undefined' && window.parent !== window) {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;

  console.log = (...args: any[]) => {
    originalLog.apply(console, args);
    try {
      window.parent.postMessage({
        type: 'console-log',
        level: 'info',
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      }, '*');
    } catch (e) {
      // Ignore postMessage errors
    }
  };

  console.error = (...args: any[]) => {
    originalError.apply(console, args);
    try {
      window.parent.postMessage({
        type: 'console-log',
        level: 'error',
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      }, '*');
    } catch (e) {
      // Ignore postMessage errors
    }
  };

  console.warn = (...args: any[]) => {
    originalWarn.apply(console, args);
    try {
      window.parent.postMessage({
        type: 'console-log',
        level: 'warning',
        message: args.map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ')
      }, '*');
    } catch (e) {
      // Ignore postMessage errors
    }
  };
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
