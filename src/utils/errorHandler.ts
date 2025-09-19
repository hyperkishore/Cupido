/**
 * Centralized Error Handling and Monitoring
 */

import { environment, debugError, debugLog } from '../config/environment';

export interface ErrorReport {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  userAgent?: string;
  url?: string;
  userId?: string;
  context?: Record<string, any>;
  level: 'error' | 'warning' | 'info';
}

class ErrorHandler {
  private errors: ErrorReport[] = [];
  private maxStoredErrors = 100;

  constructor() {
    this.initializeGlobalHandlers();
  }

  private initializeGlobalHandlers() {
    // Handle unhandled JavaScript errors
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.captureError(event.error || new Error(event.message), {
          type: 'javascript_error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      // Handle unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.captureError(new Error(event.reason), {
          type: 'unhandled_promise_rejection',
        });
      });
    }
  }

  /**
   * Capture and report an error
   */
  captureError(
    error: Error,
    context?: Record<string, any>,
    level: 'error' | 'warning' | 'info' = 'error'
  ): string {
    const errorId = this.generateErrorId();
    
    const errorReport: ErrorReport = {
      id: errorId,
      timestamp: new Date().toISOString(),
      message: error.message || 'Unknown error',
      stack: error.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      context,
      level,
    };

    // Store error locally
    this.storeError(errorReport);

    // Log to console in development
    if (environment.debug.debugMode) {
      debugError('Error captured:', errorReport);
    }

    // Send to monitoring service in production
    if (environment.app.environment === 'production') {
      this.sendToMonitoring(errorReport);
    }

    return errorId;
  }

  /**
   * Capture a custom message
   */
  captureMessage(
    message: string,
    context?: Record<string, any>,
    level: 'error' | 'warning' | 'info' = 'info'
  ): string {
    return this.captureError(new Error(message), context, level);
  }

  /**
   * Store error locally for debugging
   */
  private storeError(error: ErrorReport) {
    this.errors.unshift(error);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxStoredErrors) {
      this.errors = this.errors.slice(0, this.maxStoredErrors);
    }

    // Store in localStorage for persistence
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('cupido_errors', JSON.stringify(this.errors.slice(0, 10)));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Send error to monitoring service (placeholder for real implementation)
   */
  private async sendToMonitoring(error: ErrorReport) {
    try {
      // In production, you would send to Sentry, LogRocket, etc.
      debugLog('Would send to monitoring service:', error);
      
      // Example implementation:
      /*
      if (environment.monitoring.sentryDsn) {
        await fetch('https://sentry.io/api/..., {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(error)
        });
      }
      */
    } catch (e) {
      debugError('Failed to send error to monitoring service:', e);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get stored errors for debugging
   */
  getStoredErrors(): ErrorReport[] {
    return this.errors;
  }

  /**
   * Clear stored errors
   */
  clearStoredErrors(): void {
    this.errors = [];
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('cupido_errors');
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Create an error boundary wrapper
   */
  withErrorBoundary<T>(fn: () => T, fallback?: T): T | undefined {
    try {
      return fn();
    } catch (error) {
      this.captureError(error as Error, { component: 'error_boundary' });
      return fallback;
    }
  }

  /**
   * Async error boundary wrapper
   */
  async withAsyncErrorBoundary<T>(
    fn: () => Promise<T>, 
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.captureError(error as Error, { component: 'async_error_boundary' });
      return fallback;
    }
  }
}

// Global error handler instance
export const errorHandler = new ErrorHandler();

// Convenience functions
export const captureError = (error: Error, context?: Record<string, any>) => 
  errorHandler.captureError(error, context);

export const captureMessage = (message: string, context?: Record<string, any>, level?: 'error' | 'warning' | 'info') =>
  errorHandler.captureMessage(message, context, level);

export const withErrorBoundary = <T>(fn: () => T, fallback?: T) =>
  errorHandler.withErrorBoundary(fn, fallback);

export const withAsyncErrorBoundary = <T>(fn: () => Promise<T>, fallback?: T) =>
  errorHandler.withAsyncErrorBoundary(fn, fallback);

// React Error Boundary HOC
export const createErrorBoundary = (FallbackComponent?: React.ComponentType<{ error?: Error }>) => {
  return class ErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error?: Error }
  > {
    constructor(props: { children: React.ReactNode }) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
      errorHandler.captureError(error, { 
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary' 
      });
    }

    render() {
      if (this.state.hasError) {
        if (FallbackComponent) {
          // Return fallback component implementation
          return null;
        }
        
        return null;
      }

      // Return children in production React component
      return null;
    }
  };
};

export default errorHandler;