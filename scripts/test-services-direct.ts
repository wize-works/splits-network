/**
 * Direct service test - bypasses API Gateway auth
 */

async function testServices() {
    console.log('🧪 Testing Services Directly (Bypass Auth)\n');

    // Test ATS Service - Applications with filter
    console.log('1️⃣ Testing ATS Service: GET /applications?recruiter_id=test');
    try {
        const response = await fetch('http://localhost:3002/applications?recruiter_id=test');
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Count: ${data.data?.length || 0}\n`);
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test ATS Service - Placements with filter
    console.log('2️⃣ Testing ATS Service: GET /placements?recruiter_id=test');
    try {
        const response = await fetch('http://localhost:3002/placements?recruiter_id=test');
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        console.log(`   📊 Count: ${data.data?.length || 0}\n`);
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test ATS Service - Company GET
    console.log('3️⃣ Testing ATS Service: GET /companies/:id');
    try {
        // Use actual company ID from seed data
        const response = await fetch('http://localhost:3002/companies/01937158-67d7-7e88-901a-7e71a0ba4f3f');
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        if (data.data) {
            console.log(`   🏢 Company: ${data.data.name}\n`);
        }
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    // Test Network Service - Recruiter stats
    console.log('4️⃣ Testing Network Service: GET /recruiters/:id/stats');
    try {
        // Use actual recruiter ID from seed data
        const response = await fetch('http://localhost:3004/recruiters/01937158-6921-7b6c-8f59-a40833a26742/stats');
        const data = await response.json();
        console.log(`   ✅ Status: ${response.status}`);
        if (data.data) {
            console.log(`   📊 Submissions: ${data.data.submissions_count}`);
            console.log(`   📊 Placements: ${data.data.placements_count}`);
            console.log(`   💰 Earnings: $${data.data.total_earnings}\n`);
        }
    } catch (error: any) {
        console.log(`   ❌ Error: ${error.message}\n`);
    }

    console.log('✅ All direct service tests complete!');
}

testServices().catch(console.error);
