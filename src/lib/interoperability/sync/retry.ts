// ============================================================
// src/lib/interoperability/sync/retry.ts
// Phase 6H: Exponential Backoff Retry & Degraded Mode Handler
// ============================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitter?: boolean;
}

export class DegradedModeManager {
  private endpointFailures = new Map<string, { failureCount: number; lastFailedAt: number }>();
  private failureThreshold: number;
  private cooldownMs: number;

  constructor(failureThreshold = 3, cooldownMs = 60000) {
    this.failureThreshold = failureThreshold;
    this.cooldownMs = cooldownMs;
  }

  /**
   * Reports a failure for a specific endpoint.
   */
  reportFailure(endpoint: string): void {
    const current = this.endpointFailures.get(endpoint) || { failureCount: 0, lastFailedAt: 0 };
    current.failureCount++;
    current.lastFailedAt = Date.now();
    this.endpointFailures.set(endpoint, current);
  }

  /**
   * Reports a success, resetting failure count.
   */
  reportSuccess(endpoint: string): void {
    this.endpointFailures.delete(endpoint);
  }

  /**
   * Checks if an endpoint is considered degraded / circuit-broken.
   */
  isDegraded(endpoint: string): boolean {
    const status = this.endpointFailures.get(endpoint);
    if (!status) return false;

    if (Date.now() - status.lastFailedAt > this.cooldownMs) {
      // Cooldown expired, permit half-open probe
      return false;
    }

    return status.failureCount >= this.failureThreshold;
  }
}

/**
 * Executes an async operation with exponential backoff and jitter.
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 1000;
  const maxDelayMs = options.maxDelayMs ?? 10000;
  const jitter = options.jitter ?? true;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      attempt++;
      if (attempt > maxRetries) {
        throw error;
      }

      let delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
      if (jitter) {
        delay = delay * (0.8 + Math.random() * 0.4);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
