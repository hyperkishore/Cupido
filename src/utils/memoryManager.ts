/**
 * Memory Management Utilities
 * 
 * Provides safe timeout/interval management and cleanup to prevent memory leaks
 */
import React from 'react';

interface TimeoutRef {
  id: number;
  cleanup: () => void;
}

interface IntervalRef {
  id: number;
  cleanup: () => void;
}

export class MemoryManager {
  private timeouts = new Set<number>();
  private intervals = new Set<number>();
  private eventListeners = new Set<{ target: EventTarget; type: string; listener: EventListener; options?: AddEventListenerOptions }>();

  /**
   * Safe setTimeout that tracks timeouts for cleanup
   */
  setTimeout(callback: () => void, delay: number): TimeoutRef {
    const id = window.setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, delay);
    
    this.timeouts.add(id);
    
    return {
      id,
      cleanup: () => {
        window.clearTimeout(id);
        this.timeouts.delete(id);
      }
    };
  }

  /**
   * Safe setInterval that tracks intervals for cleanup
   */
  setInterval(callback: () => void, delay: number): IntervalRef {
    const id = window.setInterval(callback, delay);
    this.intervals.add(id);
    
    return {
      id,
      cleanup: () => {
        window.clearInterval(id);
        this.intervals.delete(id);
      }
    };
  }

  /**
   * Safe addEventListener that tracks listeners for cleanup
   */
  addEventListener<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (this: Window, ev: WindowEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  addEventListener<K extends keyof DocumentEventMap>(
    target: Document,
    type: K,
    listener: (this: Document, ev: DocumentEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions
  ): () => void;
  addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ): () => void {
    target.addEventListener(type, listener, options);
    
    const listenerRef = { 
      target, 
      type, 
      listener, 
      options: typeof options === 'boolean' ? { capture: options } : options 
    };
    this.eventListeners.add(listenerRef);
    
    // Return cleanup function
    return () => {
      target.removeEventListener(type, listener, options);
      this.eventListeners.delete(listenerRef);
    };
  }

  /**
   * Clean up all tracked timeouts, intervals, and event listeners
   */
  cleanup() {
    // Clear all timeouts
    this.timeouts.forEach(id => {
      window.clearTimeout(id);
    });
    this.timeouts.clear();

    // Clear all intervals
    this.intervals.forEach(id => {
      window.clearInterval(id);
    });
    this.intervals.clear();

    // Remove all event listeners
    this.eventListeners.forEach(({ target, type, listener, options }) => {
      target.removeEventListener(type, listener, options);
    });
    this.eventListeners.clear();
  }

  /**
   * Get current memory usage stats
   */
  getStats() {
    return {
      timeouts: this.timeouts.size,
      intervals: this.intervals.size,
      eventListeners: this.eventListeners.size,
    };
  }
}

/**
 * React hook for memory management in components
 */
export function useMemoryManager() {
  const managerRef = React.useRef<MemoryManager>();
  
  if (!managerRef.current) {
    managerRef.current = new MemoryManager();
  }

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      managerRef.current?.cleanup();
    };
  }, []);

  return managerRef.current;
}

/**
 * Debounced function wrapper that prevents memory leaks
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cleanup: () => void } {
  let timeoutId: number | null = null;
  
  const debouncedFunc = ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, delay);
  }) as T & { cleanup: () => void };

  debouncedFunc.cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debouncedFunc;
}

/**
 * Throttled function wrapper that prevents memory leaks  
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T & { cleanup: () => void } {
  let lastCallTime = 0;
  let timeoutId: number | null = null;
  
  const throttledFunc = ((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallTime >= delay) {
      lastCallTime = now;
      func(...args);
    } else if (timeoutId === null) {
      timeoutId = window.setTimeout(() => {
        lastCallTime = Date.now();
        timeoutId = null;
        func(...args);
      }, delay - (now - lastCallTime));
    }
  }) as T & { cleanup: () => void };

  throttledFunc.cleanup = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return throttledFunc;
}

/**
 * Global memory manager instance
 */
export const globalMemoryManager = new MemoryManager();

/**
 * Convenience functions using global manager
 */
export const safeSetTimeout = (callback: () => void, delay: number) =>
  globalMemoryManager.setTimeout(callback, delay);

export const safeSetInterval = (callback: () => void, delay: number) =>
  globalMemoryManager.setInterval(callback, delay);

export const safeAddEventListener = (
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
) => globalMemoryManager.addEventListener(target, type, listener, options);

/**
 * WeakMap-based cache that automatically cleans up unused entries
 */
export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, V>();
  
  get(key: K): V | undefined {
    return this.cache.get(key);
  }
  
  set(key: K, value: V): void {
    this.cache.set(key, value);
  }
  
  has(key: K): boolean {
    return this.cache.has(key);
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

export default MemoryManager;