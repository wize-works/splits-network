/**
 * Test script for new API endpoints
 * Tests: placements with filters, applications with filters, recruiter stats, company CRUD
 */

async function testEndpoints() {
    const BASE_URL = 'http://localhost:3000/api';

    console.log('🧪 Testing New API Endpoints\n');

    // Test 1: GET /api/applications with filters
    console.log('1️⃣ Testing GET /api/applications with recruiter_id filter...');
    try {
        const response = await fetch(`${BASE_URL}/applications?recruiter_id=test-recruiter-id`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Applications count: ${data.data?.length || 0}`);
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 2: GET /api/placements with filters
    console.log('\n2️⃣ Testing GET /api/placements with recruiter_id filter...');
    try {
        const response = await fetch(`${BASE_URL}/placements?recruiter_id=test-recruiter-id`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Placements count: ${data.data?.length || 0}`);
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 3: GET /api/placements with date filters
    console.log('\n3️⃣ Testing GET /api/placements with date_from filter...');
    try {
        const dateFrom = '2024-01-01';
        const response = await fetch(`${BASE_URL}/placements?date_from=${dateFrom}`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Placements count: ${data.data?.length || 0}`);
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 4: GET /api/recruiters/:id/stats
    console.log('\n4️⃣ Testing GET /api/recruiters/:id/stats...');
    try {
        // Using a recruiter ID from seed data (if available)
        const response = await fetch(`${BASE_URL}/recruiters/test-recruiter-id/stats`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        if (data.data) {
            console.log(`   📊 Submissions: ${data.data.submissions_count || 0}`);
            console.log(`   📊 Placements: ${data.data.placements_count || 0}`);
            console.log(`   💰 Total Earnings: $${data.data.total_earnings || 0}`);
        }
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    // Test 5: GET /api/companies/:id
    console.log('\n5️⃣ Testing GET /api/companies/:id...');
    try {
        const response = await fetch(`${BASE_URL}/companies/test-company-id`);
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        if (data.data) {
            console.log(`   🏢 Company: ${data.data.name || 'N/A'}`);
        }
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}`);
    }

    console.log('\n✅ Testing complete!');
}

testEndpoints().catch(console.error);
