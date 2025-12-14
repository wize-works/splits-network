#!/usr/bin/env ts-node
/**
 * Integration test script for notification service
 * Tests the complete flow from event publishing to email delivery
 * 
 * Prerequisites:
 * - All services running (docker-compose up)
 * - Seed data loaded (test user, recruiter, company, job)
 * 
 * Usage: pnpm tsx scripts/test-notifications.ts
 */

import amqp from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://splits:splits_local_dev@localhost:5672';
const EXCHANGE = 'splits-network-events';

async function publishTestEvent(eventType: string, payload: any) {
    console.log(`\n📤 Publishing ${eventType} event...`);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

    const event = {
        event_type: eventType,
        payload,
        timestamp: new Date().toISOString(),
        version: '1.0',
    };

    channel.publish(
        EXCHANGE,
        eventType.replace('.', '_'), // routing key
        Buffer.from(JSON.stringify(event)),
        { persistent: true }
    );

    console.log('✅ Event published successfully');

    await channel.close();
    await connection.close();
}

async function main() {
    console.log('🧪 Notification Service Integration Test');
    console.log('=========================================\n');

    try {
        // Test 1: Application Created Event
        console.log('Test 1: Application Created Notification');
        await publishTestEvent('application.created', {
            application_id: 'test-app-id-1',
            job_id: 'test-job-id-1',
            candidate_id: 'test-candidate-id-1',
            recruiter_id: 'test-recruiter-id-1',
        });

        await sleep(2000);

        // Test 2: Application Stage Changed Event
        console.log('\nTest 2: Application Stage Changed Notification');
        await publishTestEvent('application.stage_changed', {
            application_id: 'test-app-id-1',
            job_id: 'test-job-id-1',
            candidate_id: 'test-candidate-id-1',
            old_stage: 'submitted',
            new_stage: 'interview',
        });

        await sleep(2000);

        // Test 3: Placement Created Event
        console.log('\nTest 3: Placement Created Notification');
        await publishTestEvent('placement.created', {
            placement_id: 'test-placement-id-1',
            job_id: 'test-job-id-1',
            candidate_id: 'test-candidate-id-1',
            recruiter_id: 'test-recruiter-id-1',
            salary: 120000,
            recruiter_share: 12000,
        });

        console.log('\n✅ All test events published successfully!');
        console.log('\n📧 Check the notification service logs to verify:');
        console.log('   - Events were received');
        console.log('   - Data was fetched from services');
        console.log('   - Emails were sent via Resend');
        console.log('\n💾 Check the notifications.notification_logs table to verify status');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

main();
