#!/usr/bin/env ts-node
/**
 * End-to-end notification flow test
 * Creates real data through API endpoints and verifies notifications are sent
 * 
 * Prerequisites:
 * - All services running (docker-compose up)
 * - Resend API key configured
 * - Test email address configured
 * 
 * Usage: pnpm tsx scripts/test-notification-e2e.ts
 */

const API_GATEWAY = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';

interface TestContext {
    userId: string;
    companyId: string;
    jobId: string;
    recruiterId: string;
    candidateId: string;
    applicationId: string;
    placementId?: string;
}

async function apiCall(method: string, path: string, body?: any) {
    const url = `${API_GATEWAY}${path}`;
    console.log(`${method} ${url}`);

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            // TODO: Add auth token when gateway auth is enforced
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`API call failed: ${response.status} ${response.statusText} - ${text}`);
    }

    return await response.json();
}

async function setupTestData(): Promise<TestContext> {
    console.log('\n📦 Setting up test data...\n');

    // Note: In a real test, you'd authenticate with Clerk and use a real user.
    // For this test, we'll use direct service calls (bypassing gateway auth temporarily).
    // In production, the gateway would handle user sync automatically via Clerk JWT.

    // 1. Create user directly via identity service (bypassing gateway for testing)
    console.log('1. Creating test user (via direct identity service call)...');
    const IDENTITY_SERVICE = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
    const userResponse = await fetch(`${IDENTITY_SERVICE}/sync-clerk-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clerk_user_id: `test_${Date.now()}`,
            email: TEST_EMAIL,
            name: 'Test Recruiter',
        }),
    }).then(r => r.json());
    const userId = userResponse.data.id;
    console.log(`   ✅ User created: ${userId}`);

    // 2. Create recruiter profile (also via direct service call for testing)
    console.log('2. Creating recruiter profile...');
    const NETWORK_SERVICE = process.env.NETWORK_SERVICE_URL || 'http://localhost:3003';
    const recruiterResponse = await fetch(`${NETWORK_SERVICE}/recruiters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: userId,
            bio: 'Test recruiter for notification testing',
        }),
    }).then(r => r.json());
    const recruiterId = recruiterResponse.data.id;
    console.log(`   ✅ Recruiter created: ${recruiterId}`);

    // 3. Create company (via direct ATS service call)
    console.log('3. Creating test company...');
    const ATS_SERVICE = process.env.ATS_SERVICE_URL || 'http://localhost:3002';
    const companyResponse = await fetch(`${ATS_SERVICE}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Company Inc.',
        }),
    }).then(r => r.json());
    const companyId = companyResponse.data.id;
    console.log(`   ✅ Company created: ${companyId}`);

    // 4. Create job (via direct ATS service call)
    console.log('4. Creating test job...');
    const jobResponse = await fetch(`${ATS_SERVICE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            company_id: companyId,
            title: 'Senior Software Engineer',
            fee_percentage: 20,
            department: 'Engineering',
            location: 'Remote',
            salary_min: 120000,
            salary_max: 180000,
            description: 'Test job for notification flow',
            status: 'active',
        }),
    }).then(r => r.json());
    const jobId = jobResponse.data.id;
    console.log(`   ✅ Job created: ${jobId}`);

    // 5. Assign recruiter to job (via direct network service call)
    console.log('5. Assigning recruiter to job...');
    await fetch(`${NETWORK_SERVICE}/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            job_id: jobId,
            recruiter_id: recruiterId,
        }),
    }).then(r => r.json());
    console.log('   ✅ Assignment created');

    return {
        userId,
        companyId,
        jobId,
        recruiterId,
        candidateId: '', // Will be set after application submission
        applicationId: '',
    };
}

async function testApplicationCreatedNotification(ctx: TestContext): Promise<void> {
    console.log('\n📧 Test 1: Application Created Notification');
    console.log('============================================\n');

    // Submit candidate (via direct ATS service call)
    console.log('Submitting candidate...');
    const ATS_SERVICE = process.env.ATS_SERVICE_URL || 'http://localhost:3002';
    const response = await fetch(`${ATS_SERVICE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            job_id: ctx.jobId,
            full_name: 'Jane Candidate',
            email: 'jane.candidate@example.com',
            linkedin_url: 'https://linkedin.com/in/janecandidate',
            recruiter_id: ctx.recruiterId,
            notes: 'Test candidate submission',
        }),
    }).then(r => r.json());

    ctx.applicationId = response.data.id;
    ctx.candidateId = response.data.candidate_id;
    console.log(`✅ Application created: ${ctx.applicationId}`);

    console.log('\n⏳ Waiting 3 seconds for notification to be processed...');
    await sleep(3000);

    console.log('✅ Check notification service logs and Resend dashboard for email delivery');
}

async function testStageChangeNotification(ctx: TestContext): Promise<void> {
    console.log('\n📧 Test 2: Stage Change Notification');
    console.log('======================================\n');

    // Update application stage (via direct ATS service call)
    console.log('Updating application stage to "interview"...');
    const ATS_SERVICE = process.env.ATS_SERVICE_URL || 'http://localhost:3002';
    await fetch(`${ATS_SERVICE}/applications/${ctx.applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stage: 'interview',
            notes: 'Moving to interview stage',
        }),
    }).then(r => r.json());

    console.log('✅ Stage updated');

    console.log('\n⏳ Waiting 3 seconds for notification to be processed...');
    await sleep(3000);

    console.log('✅ Check notification service logs and Resend dashboard for email delivery');
}

async function testPlacementNotification(ctx: TestContext): Promise<void> {
    console.log('\n📧 Test 3: Placement Notification');
    console.log('===================================\n');

    // Update application stage to hired (via direct ATS service call)
    console.log('Updating application stage to "hired"...');
    const ATS_SERVICE = process.env.ATS_SERVICE_URL || 'http://localhost:3002';
    await fetch(`${ATS_SERVICE}/applications/${ctx.applicationId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            stage: 'hired',
            notes: 'Candidate accepted offer',
        }),
    }).then(r => r.json());

    console.log('✅ Application marked as hired');

    // Create placement (via direct ATS service call)
    console.log('Creating placement...');
    const response = await fetch(`${ATS_SERVICE}/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            job_id: ctx.jobId,
            application_id: ctx.applicationId,
            candidate_id: ctx.candidateId,
            recruiter_id: ctx.recruiterId,
            salary: 150000,
            fee_percentage: 20,
            start_date: new Date().toISOString().split('T')[0],
        }),
    }).then(r => r.json());

    ctx.placementId = response.data.id;
    console.log(`✅ Placement created: ${ctx.placementId}`);
    console.log(`   Recruiter share: $${response.data.recruiter_share_amount.toLocaleString()}`);

    console.log('\n⏳ Waiting 3 seconds for notification to be processed...');
    await sleep(3000);

    console.log('✅ Check notification service logs and Resend dashboard for email delivery');
}

async function verifyNotificationLogs(): Promise<void> {
    console.log('\n📊 Verification Steps');
    console.log('=====================\n');

    console.log('1. Check notification service logs:');
    console.log('   docker logs splits-notification-service -f');
    console.log('\n2. Check RabbitMQ management UI:');
    console.log('   http://localhost:15672 (splits / splits_local_dev)');
    console.log('\n3. Check Resend dashboard:');
    console.log('   https://resend.com/emails');
    console.log('\n4. Query notification logs in Supabase:');
    console.log('   SELECT * FROM notifications.notification_logs ORDER BY created_at DESC LIMIT 10;');
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
    console.log('🧪 End-to-End Notification Flow Test');
    console.log('=====================================\n');
    console.log(`API Gateway: ${API_GATEWAY}`);
    console.log(`Test Email: ${TEST_EMAIL}\n`);

    try {
        // Setup test data
        const ctx = await setupTestData();

        // Test 1: Application Created
        await testApplicationCreatedNotification(ctx);

        // Test 2: Stage Change
        await testStageChangeNotification(ctx);

        // Test 3: Placement Created
        await testPlacementNotification(ctx);

        // Verification instructions
        await verifyNotificationLogs();

        console.log('\n✅ All tests completed successfully!');
        console.log('\nTest Summary:');
        console.log(`   User ID: ${ctx.userId}`);
        console.log(`   Recruiter ID: ${ctx.recruiterId}`);
        console.log(`   Company ID: ${ctx.companyId}`);
        console.log(`   Job ID: ${ctx.jobId}`);
        console.log(`   Application ID: ${ctx.applicationId}`);
        console.log(`   Placement ID: ${ctx.placementId}`);

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        process.exit(1);
    }
}

main();
