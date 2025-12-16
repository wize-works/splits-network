/**
 * ATS Sync Worker (Phase 4C)
 * Background worker for processing ATS synchronization queue
 * Handles retry logic, exponential backoff, and periodic scheduling
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createLogger } from '@splits-network/shared-logging';
import { ATSIntegrationService } from './integration-service';
import type { SyncQueueItem } from '@splits-network/shared-types';

interface WorkerConfig {
  supabaseUrl: string;
  supabaseServiceKey: string;
  encryptionSecret: string;
  pollInterval: number; // milliseconds
  batchSize: number;
  maxConcurrent: number;
}

export class ATSSyncWorker {
  private supabase: SupabaseClient<any, 'ats'>;
  private integrationService: ATSIntegrationService;
  private logger: any;
  private config: WorkerConfig;
  private running: boolean = false;
  private processingCount: number = 0;

  constructor(config: WorkerConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: { persistSession: false },
      db: { schema: 'ats' },
    });
    this.integrationService = new ATSIntegrationService(
      config.supabaseUrl,
      config.supabaseServiceKey,
      config.encryptionSecret
    );
    this.logger = createLogger({
      serviceName: 'ats-sync-worker',
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
      prettyPrint: process.env.NODE_ENV === 'development',
    });
  }

  /**
   * Start the worker
   */
  async start() {
    if (this.running) {
      this.logger.warn('Worker already running');
      return;
    }

    this.running = true;
    this.logger.info('Starting ATS sync worker');

    // Start queue processor
    this.processQueue();

    // Start periodic sync scheduler
    this.schedulePeriodicSyncs();
  }

  /**
   * Stop the worker
   */
  async stop() {
    this.logger.info('Stopping ATS sync worker');
    this.running = false;

    // Wait for in-flight operations to complete
    while (this.processingCount > 0) {
      this.logger.info(`Waiting for ${this.processingCount} operations to complete`);
      await this.sleep(1000);
    }

    this.logger.info('Worker stopped');
  }

  /**
   * Main queue processing loop
   */
  private async processQueue() {
    while (this.running) {
      try {
        // Check if we can process more items
        if (this.processingCount >= this.config.maxConcurrent) {
          await this.sleep(1000);
          continue;
        }

        // Fetch pending items
        const items = await this.fetchPendingItems();

        if (items.length === 0) {
          // No items, wait before next poll
          await this.sleep(this.config.pollInterval);
          continue;
        }

        // Process items concurrently
        const promises = items.map((item) => this.processItem(item));
        await Promise.allSettled(promises);

      } catch (error) {
        this.logger.error({ err: error }, 'Queue processing error');
        await this.sleep(5000); // Back off on error
      }
    }
  }

  /**
   * Fetch pending queue items
   */
  private async fetchPendingItems(): Promise<SyncQueueItem[]> {
    const { data, error } = await this.supabase
      .from('sync_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('priority', { ascending: true })
      .order('scheduled_at', { ascending: true })
      .limit(this.config.batchSize);

    if (error) {
      this.logger.error({ err: error }, 'Failed to fetch queue items');
      return [];
    }

    return data || [];
  }

  /**
   * Process a single queue item
   */
  private async processItem(item: SyncQueueItem): Promise<void> {
    this.processingCount++;

    try {
      this.logger.info(
        {
          itemId: item.id,
          entityType: item.entity_type,
          direction: item.direction,
          action: item.action,
        },
        'Processing sync item'
      );

      // Mark as processing
      await this.updateItemStatus(item.id, 'processing', { started_at: new Date().toISOString() });

      // Execute the sync via integration service
      const result = await this.integrationService.executeSync(item.id);

      if (result.success) {
        // Mark as completed
        await this.updateItemStatus(item.id, 'completed', {
          completed_at: new Date().toISOString(),
        });

        this.logger.info(
          {
            itemId: item.id,
          },
          'Sync completed successfully'
        );
      } else {
        // Handle failure with retry logic
        await this.handleFailure(item, result.error?.message || 'Unknown error');
      }
    } catch (error: any) {
      this.logger.error({ err: error, itemId: item.id }, 'Failed to process sync item');
      await this.handleFailure(item, error.message);
    } finally {
      this.processingCount--;
    }
  }

  /**
   * Handle sync failure with exponential backoff
   */
  private async handleFailure(item: SyncQueueItem, errorMessage: string): Promise<void> {
    const newRetryCount = (item.retry_count || 0) + 1;

    if (newRetryCount >= item.max_retries) {
      // Max retries reached, mark as failed
      await this.updateItemStatus(item.id, 'failed', {
        error_message: errorMessage,
        completed_at: new Date().toISOString(),
      });

      this.logger.warn(
        {
          itemId: item.id,
          retries: newRetryCount,
          error: errorMessage,
        },
        'Sync failed after max retries'
      );
    } else {
      // Schedule retry with exponential backoff
      const backoffMinutes = Math.pow(2, newRetryCount - 1); // 1, 2, 4, 8, 16...
      const nextSchedule = new Date(Date.now() + backoffMinutes * 60 * 1000);

      await this.supabase
        .from('ats.sync_queue')
        .update({
          status: 'pending',
          retry_count: newRetryCount,
          error_message: errorMessage,
          scheduled_at: nextSchedule.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

      this.logger.info(
        {
          itemId: item.id,
          retryCount: newRetryCount,
          nextSchedule: nextSchedule.toISOString(),
          backoffMinutes,
        },
        'Scheduled retry with exponential backoff'
      );
    }
  }

  /**
   * Update queue item status
   */
  private async updateItemStatus(
    itemId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    additionalFields: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await this.supabase
      .from('sync_queue')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...additionalFields,
      })
      .eq('id', itemId);

    if (error) {
      this.logger.error({ err: error, itemId }, 'Failed to update item status');
    }
  }

  /**
   * Periodic sync scheduler
   * Checks all active integrations and queues sync jobs every N minutes
   */
  private async schedulePeriodicSyncs() {
    while (this.running) {
      try {
        await this.sleep(5 * 60 * 1000); // Run every 5 minutes

        this.logger.info('Running periodic sync scheduler');

        // Fetch all active integrations
        const { data: integrations, error } = await this.supabase
          .from('integrations')
          .select('*')
          .eq('sync_enabled', true);

        if (error) {
          this.logger.error({ err: error }, 'Failed to fetch integrations for periodic sync');
          continue;
        }

        if (!integrations || integrations.length === 0) {
          this.logger.debug('No active integrations for periodic sync');
          continue;
        }

        // Queue sync jobs for each integration
        for (const integration of integrations) {
          try {
            // Queue inbound sync (import from ATS)
            if (integration.sync_roles || integration.sync_candidates || integration.sync_applications) {
              await this.queuePeriodicSync(integration.id, 'inbound');
            }

            // Queue outbound sync (export to ATS)
            // This is typically event-driven, but we can do a reconciliation sync periodically
            // Uncomment if needed:
            // await this.queuePeriodicSync(integration.id, 'outbound');

          } catch (error: any) {
            this.logger.error(
              { err: error, integrationId: integration.id },
              'Failed to queue periodic sync'
            );
          }
        }

        this.logger.info(`Queued periodic syncs for ${integrations.length} integrations`);

      } catch (error) {
        this.logger.error({ err: error }, 'Periodic sync scheduler error');
      }
    }
  }

  /**
   * Queue a periodic sync job
   */
  private async queuePeriodicSync(integrationId: string, direction: 'inbound' | 'outbound') {
    // Check if there's already a pending sync for this integration/direction
    const { data: existing } = await this.supabase
      .from('sync_queue')
      .select('id')
      .eq('integration_id', integrationId)
      .eq('direction', direction)
      .in('status', ['pending', 'processing'])
      .limit(1)
      .single();

    if (existing) {
      this.logger.debug(
        { integrationId, direction },
        'Skipping periodic sync - already in queue'
      );
      return;
    }

    // Queue new sync
    const { error } = await this.supabase.from('sync_queue').insert({
      integration_id: integrationId,
      entity_type: 'role', // Default to roles for periodic sync
      direction,
      action: 'sync',
      priority: 5, // Normal priority
      status: 'pending',
      scheduled_at: new Date().toISOString(),
      payload: { type: 'periodic_sync' },
    });

    if (error) {
      this.logger.error({ err: error, integrationId, direction }, 'Failed to queue periodic sync');
    } else {
      this.logger.debug({ integrationId, direction }, 'Queued periodic sync');
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    running: boolean;
    processingCount: number;
    queueDepth?: number;
  }> {
    try {
      const { count } = await this.supabase
        .from('sync_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      return {
        healthy: true,
        running: this.running,
        processingCount: this.processingCount,
        queueDepth: count || 0,
      };
    } catch (error) {
      return {
        healthy: false,
        running: this.running,
        processingCount: this.processingCount,
      };
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Standalone worker entry point
 */
async function main() {
  const config: WorkerConfig = {
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    encryptionSecret: process.env.ENCRYPTION_SECRET || 'default-encryption-secret-change-me',
    pollInterval: parseInt(process.env.SYNC_POLL_INTERVAL || '5000', 10), // 5 seconds
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '10', 10),
    maxConcurrent: parseInt(process.env.SYNC_MAX_CONCURRENT || '5', 10),
  };

  const worker = new ATSSyncWorker(config);

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await worker.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await worker.stop();
    process.exit(0);
  });

  // Start worker
  await worker.start();
}

// Run if executed directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Worker crashed:', error);
    process.exit(1);
  });
}
