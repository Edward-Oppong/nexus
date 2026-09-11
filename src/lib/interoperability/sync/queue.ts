// ============================================================
// src/lib/interoperability/sync/queue.ts
// Phase 6H: In-Memory / Local Sync Queue with Idempotency Guard
// ============================================================

import type { SyncEvent, SyncOperation, SyncStatus } from '../../../domain/external-source';
import { generateIdempotencyKey } from '../normalization/identifiers';

export interface EnqueueSyncOptions {
  integrationSourceId: string;
  sourceSystem: string;
  externalResourceType: string;
  externalResourceId: string;
  operation: SyncOperation;
  maxAttempts?: number;
}

export class SyncQueue {
  private queue: SyncEvent[] = [];
  private processedKeys = new Set<string>();

  /**
   * Checks if an item has already been successfully processed.
   */
  isProcessed(sourceSystem: string, resourceType: string, resourceId: string): boolean {
    const key = generateIdempotencyKey(sourceSystem, resourceType, resourceId);
    return this.processedKeys.has(key);
  }

  /**
   * Enqueues a sync operation if not already queued or completed.
   */
  enqueue(options: EnqueueSyncOptions): SyncEvent | null {
    const key = generateIdempotencyKey(
      options.sourceSystem,
      options.externalResourceType,
      options.externalResourceId
    );

    if (this.processedKeys.has(key)) {
      return null; // Idempotent skip
    }

    // Check if already in queue pending
    const existing = this.queue.find(
      (item) =>
        item.integrationSourceId === options.integrationSourceId &&
        item.externalResourceType === options.externalResourceType &&
        item.externalResourceId === options.externalResourceId &&
        (item.status === 'PENDING' || item.status === 'PROCESSING')
    );

    if (existing) {
      return existing;
    }

    const event: SyncEvent = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      integrationSourceId: options.integrationSourceId,
      externalResourceType: options.externalResourceType,
      externalResourceId: options.externalResourceId,
      operation: options.operation,
      status: 'PENDING',
      attemptCount: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: new Date().toISOString(),
    };

    this.queue.push(event);
    return event;
  }

  /**
   * Gets pending items eligible for processing.
   */
  getPendingBatch(limit = 10): SyncEvent[] {
    const now = Date.now();
    return this.queue
      .filter((item) => {
        if (item.status !== 'PENDING') return false;
        if (item.nextRetryAt && new Date(item.nextRetryAt).getTime() > now) return false;
        return true;
      })
      .slice(0, limit);
  }

  /**
   * Marks a sync item as completed and records its idempotency key.
   */
  markCompleted(eventId: string, sourceSystem: string): void {
    const item = this.queue.find((i) => i.id === eventId);
    if (!item) return;

    item.status = 'COMPLETED';
    item.processedAt = new Date().toISOString();

    const key = generateIdempotencyKey(
      sourceSystem,
      item.externalResourceType,
      item.externalResourceId
    );
    this.processedKeys.add(key);
  }

  /**
   * Marks a sync item as failed and schedules a retry if attempts remain.
   */
  markFailed(eventId: string, errorMessage: string, retryDelayMs = 5000): void {
    const item = this.queue.find((i) => i.id === eventId);
    if (!item) return;

    item.attemptCount++;
    item.errorMessage = errorMessage;

    if (item.attemptCount >= item.maxAttempts) {
      item.status = 'FAILED';
    } else {
      item.status = 'PENDING';
      item.nextRetryAt = new Date(Date.now() + retryDelayMs * Math.pow(2, item.attemptCount - 1)).toISOString();
    }
  }

  /**
   * Returns all items currently in the queue.
   */
  getAll(): SyncEvent[] {
    return [...this.queue];
  }

  /**
   * Clears completed and skipped entries older than a given time.
   */
  prune(): void {
    this.queue = this.queue.filter(
      (item) => item.status === 'PENDING' || item.status === 'PROCESSING' || item.status === 'FAILED'
    );
  }
}
