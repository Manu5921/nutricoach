/**
 * Performance Utilities
 * Tools for measuring and optimizing performance
 */

export class PerformanceUtils {
  /**
   * Debounce function calls
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  /**
   * Measure execution time
   */
  static async measureTime<T>(
    fn: () => Promise<T> | T,
    label?: string
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    if (label) {
      console.log(`${label}: ${duration.toFixed(2)}ms`);
    }
    
    return { result, duration };
  }

  /**
   * Memoize function results
   */
  static memoize<T extends (...args: any[]) => any>(
    fn: T,
    getKey?: (...args: Parameters<T>) => string
  ): T {
    const cache = new Map<string, ReturnType<T>>();
    
    const defaultGetKey = (...args: Parameters<T>) => JSON.stringify(args);
    const keyFn = getKey || defaultGetKey;
    
    return ((...args: Parameters<T>) => {
      const key = keyFn(...args);
      
      if (cache.has(key)) {
        return cache.get(key);
      }
      
      const result = fn(...args);
      cache.set(key, result);
      return result;
    }) as T;
  }

  /**
   * Batch async operations
   */
  static async batch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize = 5
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Retry with exponential backoff
   */
  static async retry<T>(
    fn: () => Promise<T>,
    options: {
      maxAttempts?: number;
      baseDelay?: number;
      maxDelay?: number;
      factor?: number;
      onRetry?: (attempt: number, error: any) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      onRetry,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          throw error;
        }

        const delay = Math.min(baseDelay * Math.pow(factor, attempt - 1), maxDelay);
        
        if (onRetry) {
          onRetry(attempt, error);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}

export const debounce = PerformanceUtils.debounce;
export const throttle = PerformanceUtils.throttle;
export const measureTime = PerformanceUtils.measureTime;
export const memoize = PerformanceUtils.memoize;
export const batch = PerformanceUtils.batch;
export const retry = PerformanceUtils.retry;