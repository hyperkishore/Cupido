/**
 * Performance Monitoring and Analytics
 */

import { environment, debugLog } from '../config/environment';

export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface UserAction {
  action: string;
  timestamp: number;
  context?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private userActions: UserAction[] = [];
  private pageLoadStart: number;

  constructor() {
    this.pageLoadStart = Date.now();
    this.initializePerformanceObserver();
    this.setupPageLoadMetrics();
  }

  private initializePerformanceObserver() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      try {
        // Observe navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.recordMetric('page_load_time', navEntry.loadEventEnd - navEntry.fetchStart);
              this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart);
              this.recordMetric('first_paint', navEntry.responseEnd - navEntry.fetchStart);
            }
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });

        // Observe paint timing
        const paintObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric(entry.name.replace(/-/g, '_'), entry.startTime);
          });
        });
        paintObserver.observe({ entryTypes: ['paint'] });

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('largest_contentful_paint', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // Observe layout shifts
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          let clsValue = 0;
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.recordMetric('cumulative_layout_shift', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        debugLog('Performance observer setup failed:', error);
      }
    }
  }

  private setupPageLoadMetrics() {
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        const loadTime = Date.now() - this.pageLoadStart;
        this.recordMetric('app_load_time', loadTime);
        
        // Record memory usage if available
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          this.recordMetric('memory_used_mb', memory.usedJSHeapSize / 1048576);
          this.recordMetric('memory_total_mb', memory.totalJSHeapSize / 1048576);
        }
      });
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, context?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      context,
    };

    this.metrics.push(metric);
    debugLog(`Performance metric: ${name} = ${value}ms`, context);

    // Send to analytics in production
    if (environment.app.environment === 'production' && environment.features.analytics) {
      this.sendMetricToAnalytics(metric);
    }
  }

  /**
   * Track user action
   */
  trackAction(action: string, context?: Record<string, any>) {
    const userAction: UserAction = {
      action,
      timestamp: Date.now(),
      context,
    };

    this.userActions.push(userAction);
    debugLog(`User action: ${action}`, context);

    // Send to analytics in production
    if (environment.app.environment === 'production' && environment.features.analytics) {
      this.sendActionToAnalytics(userAction);
    }
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    this.recordMetric(`function_${name}`, duration);
    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    this.recordMetric(`async_function_${name}`, duration);
    return result;
  }

  /**
   * Send metric to analytics service (placeholder)
   */
  private async sendMetricToAnalytics(metric: PerformanceMetric) {
    try {
      // In production, send to analytics service like Mixpanel, PostHog, etc.
      debugLog('Would send metric to analytics:', metric);
      
      // Example implementation:
      /*
      await fetch('/api/analytics/metric', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      });
      */
    } catch (error) {
      debugLog('Failed to send metric to analytics:', error);
    }
  }

  /**
   * Send action to analytics service (placeholder)
   */
  private async sendActionToAnalytics(action: UserAction) {
    try {
      // In production, send to analytics service
      debugLog('Would send action to analytics:', action);
      
      // Example implementation:
      /*
      await fetch('/api/analytics/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(action)
      });
      */
    } catch (error) {
      debugLog('Failed to send action to analytics:', error);
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    return {
      metrics: this.metrics.slice(-20), // Last 20 metrics
      actions: this.userActions.slice(-50), // Last 50 actions
      loadTime: this.metrics.find(m => m.name === 'app_load_time')?.value,
      memoryUsage: this.metrics.find(m => m.name === 'memory_used_mb')?.value,
    };
  }

  /**
   * Clear stored data
   */
  clear() {
    this.metrics = [];
    this.userActions = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const recordMetric = (name: string, value: number, context?: Record<string, any>) =>
  performanceMonitor.recordMetric(name, value, context);

export const trackAction = (action: string, context?: Record<string, any>) =>
  performanceMonitor.trackAction(action, context);

export const measureFunction = <T>(name: string, fn: () => T) =>
  performanceMonitor.measureFunction(name, fn);

export const measureAsyncFunction = <T>(name: string, fn: () => Promise<T>) =>
  performanceMonitor.measureAsyncFunction(name, fn);

// React performance tracking HOC (placeholder for React integration)
export const withPerformanceTracking = <P extends {}>(
  Component: any,
  componentName: string
) => {
  // Performance tracking wrapper - to be implemented with React integration
  return Component;
};

// Performance tracking utilities (non-React dependent)
export const createPerformanceTracker = () => {
  const trackUserInteraction = (action: string, context?: Record<string, any>) => {
    trackAction(action, context);
  };

  const measureOperation = <T>(name: string, fn: () => T) => {
    return measureFunction(name, fn);
  };

  const measureAsyncOperation = <T>(name: string, fn: () => Promise<T>) => {
    return measureAsyncFunction(name, fn);
  };

  return {
    trackUserInteraction,
    measureOperation,
    measureAsyncOperation,
  };
};

export default performanceMonitor;