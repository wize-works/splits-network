-- Seed script for Splits Network development environment
-- This creates test data for companies, jobs, candidates, applications, and placements

-- Create test companies
INSERT INTO ats.companies (id, name, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'TechCorp Inc', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'StartupXYZ', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'CloudServices Ltd', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'DesignStudio', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test jobs
INSERT INTO ats.jobs (id, company_id, title, department, location, salary_min, salary_max, fee_percentage, description, status, created_at, updated_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Senior React Developer', 'Engineering', 'San Francisco, CA', 140000, 180000, 20, 'We are looking for an experienced React developer to join our growing team. Must have 5+ years of experience with React, TypeScript, and modern frontend tooling.', 'active', NOW() - INTERVAL '20 days', NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Product Manager', 'Product', 'Remote', 120000, 160000, 18, 'Seeking a product manager to lead our core product initiatives. Experience with B2B SaaS required.', 'active', NOW() - INTERVAL '15 days', NOW()),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'DevOps Engineer', 'Engineering', 'New York, NY', 130000, 170000, 22, 'Join our infrastructure team to build and maintain our cloud platform. AWS and Kubernetes experience required.', 'active', NOW() - INTERVAL '8 days', NOW()),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'UX Designer', 'Design', 'Austin, TX', 90000, 120000, 15, 'Creative UX designer needed for consumer-facing products. Strong portfolio required.', 'paused', NOW() - INTERVAL '50 days', NOW()),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Backend Engineer (Go)', 'Engineering', 'San Francisco, CA', 150000, 190000, 20, 'Backend engineer with strong Go experience. Building microservices and APIs.', 'active', NOW() - INTERVAL '5 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- Create test candidates
INSERT INTO ats.candidates (id, email, full_name, linkedin_url, created_at, updated_at) VALUES
('c1111111-1111-1111-1111-111111111111', 'john.doe@example.com', 'John Doe', 'https://linkedin.com/in/johndoe', NOW() - INTERVAL '10 days', NOW()),
('c2222222-2222-2222-2222-222222222222', 'jane.smith@example.com', 'Jane Smith', 'https://linkedin.com/in/janesmith', NOW() - INTERVAL '12 days', NOW()),
('c3333333-3333-3333-3333-333333333333', 'bob.johnson@example.com', 'Bob Johnson', 'https://linkedin.com/in/bobjohnson', NOW() - INTERVAL '7 days', NOW()),
('c4444444-4444-4444-4444-444444444444', 'alice.williams@example.com', 'Alice Williams', 'https://linkedin.com/in/alicewilliams', NOW() - INTERVAL '3 days', NOW()),
('c5555555-5555-5555-5555-555555555555', 'charlie.brown@example.com', 'Charlie Brown', NULL, NOW() - INTERVAL '15 days', NOW()),
('c6666666-6666-6666-6666-666666666666', 'diana.martinez@example.com', 'Diana Martinez', 'https://linkedin.com/in/dianamartinez', NOW() - INTERVAL '8 days', NOW()),
('c7777777-7777-7777-7777-777777777777', 'evan.taylor@example.com', 'Evan Taylor', 'https://linkedin.com/in/evantaylor', NOW() - INTERVAL '4 days', NOW())
ON CONFLICT (email) DO NOTHING;

-- Create test applications
INSERT INTO ats.applications (id, job_id, candidate_id, stage, notes, created_at, updated_at) VALUES
-- Senior React Developer applications
('a1111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c1111111-1111-1111-1111-111111111111', 'interview', 'Strong technical skills, available immediately. Great React expertise.', NOW() - INTERVAL '9 days', NOW() - INTERVAL '2 days'),
('a2222222-2222-2222-2222-222222222222', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c2222222-2222-2222-2222-222222222222', 'offer', 'Excellent culture fit. Passed all technical rounds with flying colors.', NOW() - INTERVAL '11 days', NOW() - INTERVAL '1 day'),
('a3333333-3333-3333-3333-333333333333', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c3333333-3333-3333-3333-333333333333', 'screen', '10 years React experience. Currently at FAANG company.', NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days'),
('a4444444-4444-4444-4444-444444444444', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'c4444444-4444-4444-4444-444444444444', 'submitted', 'Recently relocated to SF. Looking for immediate start.', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Product Manager applications
('a5555555-5555-5555-5555-555555555555', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c5555555-5555-5555-5555-555555555555', 'rejected', 'Not enough B2B SaaS experience', NOW() - INTERVAL '14 days', NOW() - INTERVAL '10 days'),
('a6666666-6666-6666-6666-666666666666', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'c6666666-6666-6666-6666-666666666666', 'interview', 'Great product sense. Previously led B2B product at Series B startup.', NOW() - INTERVAL '7 days', NOW() - INTERVAL '3 days'),

-- DevOps Engineer applications
('a7777777-7777-7777-7777-777777777777', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'c7777777-7777-7777-7777-777777777777', 'screen', 'AWS Solutions Architect certified. 7 years infrastructure experience.', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Create a test placement (hired candidate)
INSERT INTO ats.placements (
    id, 
    job_id, 
    candidate_id, 
    company_id, 
    recruiter_id, 
    application_id,
    hired_at,
    salary,
    fee_percentage,
    fee_amount,
    recruiter_share,
    platform_share,
    created_at,
    updated_at
) VALUES (
    'p1111111-1111-1111-1111-111111111111',
    'dddddddd-dddd-dddd-dddd-dddddddddddd', -- UX Designer role (paused because filled)
    'c1111111-1111-1111-1111-111111111111', -- John Doe
    '44444444-4444-4444-4444-444444444444', -- DesignStudio
    NULL, -- Would be actual recruiter user ID in production
    NULL,
    NOW() - INTERVAL '30 days',
    110000, -- salary
    15, -- fee_percentage from job
    16500, -- fee_amount (110000 * 0.15)
    8250, -- recruiter_share (50% of fee)
    8250, -- platform_share (50% of fee)
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
)
ON CONFLICT (id) DO NOTHING;

-- Summary
SELECT 
    (SELECT COUNT(*) FROM ats.companies) as companies,
    (SELECT COUNT(*) FROM ats.jobs) as jobs,
    (SELECT COUNT(*) FROM ats.candidates) as candidates,
    (SELECT COUNT(*) FROM ats.applications) as applications,
    (SELECT COUNT(*) FROM ats.placements) as placements;
