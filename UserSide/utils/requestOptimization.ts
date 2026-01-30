/**
 * Debounce and Throttle Utilities
 * Prevents excessive API calls and improves performance
 */

/**
 * Debounce function - delays execution until after wait period of inactivity
 * Use for search inputs, form validation, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func.apply(this, args);
      timeoutId = null;
    }, wait);
  };
}

/**
 * Throttle function - limits execution to once per wait period
 * Use for scroll handlers, resize events, continuous updates
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - lastTime);

    if (remaining <= 0 || remaining > wait) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastTime = now;
      func.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now();
        timeoutId = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * Request deduplication - prevents duplicate concurrent requests
 * Use for API calls that might be triggered multiple times
 */
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if there's already a pending request for this key
  const pending = pendingRequests.get(key);
  if (pending) {
    return pending as Promise<T>;
  }

  // Create new request and track it
  const request = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, request);
  return request;
}

/**
 * Batch multiple requests into one
 * Use for aggregating multiple small requests
 */
export function createBatcher<TInput, TOutput>(
  batchFn: (inputs: TInput[]) => Promise<TOutput[]>,
  options: {
    maxBatchSize?: number;
    maxWaitMs?: number;
  } = {}
) {
  const { maxBatchSize = 10, maxWaitMs = 50 } = options;
  
  let queue: { input: TInput; resolve: (value: TOutput) => void; reject: (error: any) => void }[] = [];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const executeBatch = async () => {
    const batch = queue.splice(0, maxBatchSize);
    if (batch.length === 0) return;

    try {
      const inputs = batch.map(item => item.input);
      const results = await batchFn(inputs);
      
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => item.reject(error));
    }
  };

  const scheduleBatch = () => {
    if (timeoutId) return;
    
    timeoutId = setTimeout(() => {
      timeoutId = null;
      executeBatch();
    }, maxWaitMs);
  };

  return (input: TInput): Promise<TOutput> => {
    return new Promise((resolve, reject) => {
      queue.push({ input, resolve, reject });
      
      if (queue.length >= maxBatchSize) {
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        executeBatch();
      } else {
        scheduleBatch();
      }
    });
  };
}
