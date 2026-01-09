/**
 * Retry utility with exponential backoff
 * Use this for all external API calls in edge functions
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  retryableStatusCodes?: number[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(attempt: number, baseDelay: number, maxDelay: number): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.3 * exponentialDelay; // 0-30% jitter
  return Math.min(exponentialDelay + jitter, maxDelay);
}

/**
 * Retry wrapper for fetch calls with exponential backoff
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // Check if we should retry based on status code
      if (!response.ok && opts.retryableStatusCodes.includes(response.status)) {
        if (attempt < opts.maxRetries) {
          const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
          console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms for status ${response.status}`);
          await sleep(delay);
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Network errors are retryable
      if (attempt < opts.maxRetries) {
        const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms due to error: ${lastError.message}`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Retry wrapper for any async function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retryOptions?: RetryOptions
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...retryOptions };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < opts.maxRetries) {
        const delay = calculateDelay(attempt, opts.baseDelayMs, opts.maxDelayMs);
        console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms due to error: ${lastError.message}`);
        await sleep(delay);
        continue;
      }
    }
  }

  throw lastError || new Error("All retry attempts failed");
}

/**
 * Create a circuit breaker for a service
 * Opens after consecutive failures, closes after timeout
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailure = 0;
  private isOpen = false;
  
  constructor(
    private readonly threshold: number = 5,
    private readonly resetTimeMs: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit should be reset
    if (this.isOpen && Date.now() - this.lastFailure > this.resetTimeMs) {
      this.isOpen = false;
      this.failures = 0;
      console.log("Circuit breaker reset");
    }

    if (this.isOpen) {
      throw new Error("Circuit breaker is open - service unavailable");
    }

    try {
      const result = await fn();
      this.failures = 0; // Reset on success
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailure = Date.now();

      if (this.failures >= this.threshold) {
        this.isOpen = true;
        console.log(`Circuit breaker opened after ${this.failures} failures`);
      }

      throw error;
    }
  }

  get state(): "closed" | "open" {
    if (this.isOpen && Date.now() - this.lastFailure > this.resetTimeMs) {
      return "closed";
    }
    return this.isOpen ? "open" : "closed";
  }
}
