#!/usr/bin/env node
/**
 * Daily Metrics Aggregation Cron Job
 * 
 * This script should be run daily (e.g., at midnight) to aggregate marketplace metrics.
 * 
 * Usage:
 *   node daily-metrics-cron.js [date]
 * 
 * Example:
 *   node daily-metrics-cron.js 2025-12-14
 *   node daily-metrics-cron.js  # Defaults to yesterday
 */

import { loadBaseConfig, loadDatabaseConfig } from '@splits-network/shared-config';
import { createLogger } from '@splits-network/shared-logging';
import { AutomationRepository } from './repository';
import { MetricsAggregationService } from './metrics-service';

async function main() {
    const baseConfig = loadBaseConfig('metrics-cron');
    const dbConfig = loadDatabaseConfig();

    const logger = createLogger({
        serviceName: 'metrics-cron',
        level: 'info',
    });

    // Parse target date
    const targetDate = process.argv[2] 
        ? new Date(process.argv[2]) 
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Yesterday by default

    logger.info({ date: targetDate.toISOString().split('T')[0] }, 'Starting metrics aggregation');

    // Initialize services
    const repository = new AutomationRepository(
        dbConfig.supabaseUrl,
        dbConfig.supabaseServiceRoleKey!
    );

    const metricsService = new MetricsAggregationService(repository, logger);

    // Run aggregation
    try {
        await metricsService.aggregateDailyMetrics(targetDate);
        logger.info('Metrics aggregation completed successfully');
        process.exit(0);
    } catch (error) {
        logger.error({ error }, 'Metrics aggregation failed');
        process.exit(1);
    }
}

main().catch((error) => {
    console.error('Unhandled error:', error);
    process.exit(1);
});
