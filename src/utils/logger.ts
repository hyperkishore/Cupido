/**
 * Production Logging Utilities
 * 
 * Provides production-safe logging with proper error tracking
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  userId?: string;
  sessionId?: string;
  action?: string;
  [key: string]: any;
}

class ProductionLogger {
  private isProduction: boolean;
  private logBuffer: Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> = [];
  private maxBufferSize = 100;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Debug logging - only in development
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(`🔍 [DEBUG] ${message}`, context || '');
      this.addToBuffer('debug', message, context);
    }
  }

  /**
   * Info logging - minimal in production
   */
  info(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(`ℹ️ [INFO] ${message}`, context || '');
    } else {
      // In production, only log critical info
      if (this.isCriticalInfo(message)) {
        console.log(`[INFO] ${message}`);
      }
    }
    this.addToBuffer('info', message, context);
  }

  /**
   * Warning logging - always shown
   */
  warn(message: string, context?: LogContext): void {
    console.warn(`⚠️ [WARN] ${message}`, context || '');
    this.addToBuffer('warn', message, context);
    
    // Send to monitoring in production
    if (this.isProduction) {
      this.sendToMonitoring('warn', message, context);
    }
  }

  /**
   * Error logging - always shown and tracked
   */
  error(message: string, error?: Error, context?: LogContext): void {
    console.error(`❌ [ERROR] ${message}`, error || '', context || '');
    
    const fullContext = {
      ...context,
      stack: error?.stack,
      errorMessage: error?.message,
    };
    
    this.addToBuffer('error', message, fullContext);
    
    // Always send errors to monitoring
    this.sendToMonitoring('error', message, fullContext);
  }

  /**
   * Performance logging
   */
  perf(label: string, duration: number, context?: LogContext): void {
    if (!this.isProduction) {
      console.log(`⚡ [PERF] ${label}: ${duration}ms`, context || '');
    }
    
    // Track performance metrics in production if duration is concerning
    if (duration > 1000) {
      this.warn(`Slow operation: ${label} took ${duration}ms`, context);
    }
  }

  /**
   * User action logging for analytics
   */
  userAction(action: string, context?: LogContext): void {
    const actionContext = {
      ...context,
      action,
      timestamp: new Date().toISOString(),
    };
    
    if (!this.isProduction) {
      console.log(`👤 [USER] ${action}`, actionContext);
    }
    
    this.addToBuffer('info', `User action: ${action}`, actionContext);
    
    // Send user actions to analytics in production
    if (this.isProduction) {
      this.sendToAnalytics(action, actionContext);
    }
  }

  /**
   * Security event logging
   */
  security(event: string, context?: LogContext): void {
    const securityContext = {
      ...context,
      security: true,
      timestamp: new Date().toISOString(),
    };
    
    console.warn(`🔒 [SECURITY] ${event}`, securityContext);
    this.addToBuffer('warn', `Security: ${event}`, securityContext);
    
    // Always send security events to monitoring
    this.sendToMonitoring('warn', `Security event: ${event}`, securityContext);
  }

  /**
   * API call logging
   */
  api(method: string, url: string, status: number, duration: number, context?: LogContext): void {
    const apiContext = {
      ...context,
      method,
      url,
      status,
      duration,
    };
    
    if (!this.isProduction) {
      console.log(`🌐 [API] ${method} ${url} ${status} (${duration}ms)`, apiContext);
    }
    
    // Log API errors and slow requests
    if (status >= 400) {
      this.error(`API Error: ${method} ${url} returned ${status}`, undefined, apiContext);
    } else if (duration > 5000) {
      this.warn(`Slow API call: ${method} ${url} took ${duration}ms`, apiContext);
    }
  }

  /**
   * Get logs for debugging
   */
  getLogs(): Array<{ level: LogLevel; message: string; context?: LogContext; timestamp: string }> {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearLogs(): void {
    this.logBuffer = [];
  }

  private addToBuffer(level: LogLevel, message: string, context?: LogContext): void {
    this.logBuffer.unshift({
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    });
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(0, this.maxBufferSize);
    }
  }

  private isCriticalInfo(message: string): boolean {
    const criticalPatterns = [
      /user.*signed in/i,
      /user.*signed out/i,
      /payment/i,
      /error/i,
      /failed/i,
      /timeout/i,
      /security/i,
    ];
    
    return criticalPatterns.some(pattern => pattern.test(message));
  }

  private async sendToMonitoring(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    try {
      // In a real app, send to Sentry, LogRocket, DataDog, etc.
      if (this.isProduction) {
        // Example implementation:
        /*
        await fetch('/api/monitoring/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            level,
            message,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }),
        });
        */
      }
    } catch (error) {
      // Don't let monitoring failures break the app
      console.error('Failed to send log to monitoring:', error);
    }
  }

  private async sendToAnalytics(action: string, context?: LogContext): Promise<void> {
    try {
      // In a real app, send to Google Analytics, Mixpanel, etc.
      if (this.isProduction) {
        // Example implementation:
        /*
        if (window.gtag) {
          window.gtag('event', action, context);
        }
        */
      }
    } catch (error) {
      // Don't let analytics failures break the app
      console.error('Failed to send analytics:', error);
    }
  }
}

// Global logger instance
export const logger = new ProductionLogger();

// Convenience functions
export const log = {
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) => logger.error(message, error, context),
  perf: (label: string, duration: number, context?: LogContext) => logger.perf(label, duration, context),
  userAction: (action: string, context?: LogContext) => logger.userAction(action, context),
  security: (event: string, context?: LogContext) => logger.security(event, context),
  api: (method: string, url: string, status: number, duration: number, context?: LogContext) => 
    logger.api(method, url, status, duration, context),
};

/**
 * Performance measurement utility
 */
export function measurePerformance<T>(
  label: string,
  fn: () => T,
  context?: LogContext
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    logger.perf(label, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`Performance measurement failed: ${label}`, error as Error, {
      ...context,
      duration,
    });
    throw error;
  }
}

/**
 * Async performance measurement utility
 */
export async function measureAsyncPerformance<T>(
  label: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.perf(label, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`Async performance measurement failed: ${label}`, error as Error, {
      ...context,
      duration,
    });
    throw error;
  }
}

/**
 * Replace console.log in production
 * Use this to gradually replace existing console.log statements
 */
export function productionLog(message: string, ...args: any[]): void {
  if (process.env.NODE_ENV !== 'production') {
    console.log(message, ...args);
  }
  // In production, only log if it's critical
  else if (logger['isCriticalInfo'](message)) {
    console.log(message);
  }
}

export default logger;