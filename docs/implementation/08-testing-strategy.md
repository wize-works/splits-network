# Testing Strategy - Candidate Application Workflow

**Document:** 08 - Testing Strategy  
**Created:** December 19, 2025

---

## Overview

Comprehensive testing approach covering unit tests, integration tests, end-to-end tests, and validation scenarios for the candidate application workflow.

---

## 1. Testing Layers

### 1.1 Unit Tests

**Scope:** Individual functions and methods in isolation  
**Tools:** Jest, TypeScript  
**Coverage Target:** >80%

**Locations:**
- `services/ats-service/src/__tests__/`
- `services/network-service/src/__tests__/`
- `apps/candidate/src/__tests__/`
- `apps/portal/src/__tests__/`

---

### 1.2 Integration Tests

**Scope:** Service-to-service communication, database interactions  
**Tools:** Jest, Supertest, Testcontainers  
**Coverage Target:** >70%

**Locations:**
- `services/ats-service/src/__tests__/integration/`
- `services/api-gateway/src/__tests__/integration/`

---

### 1.3 End-to-End Tests

**Scope:** Full user workflows from UI to database  
**Tools:** Playwright, Cypress  
**Coverage Target:** Critical paths only

**Locations:**
- `apps/candidate/e2e/`
- `apps/portal/e2e/`

---

### 1.4 Manual Testing

**Scope:** UX, edge cases, exploratory  
**Tools:** Browser dev tools, test data  
**Coverage:** All user-facing features

---

## 2. Unit Test Specifications

### 2.1 ATS Service - Application Service Tests

**File:** `services/ats-service/src/services/applications/__tests__/service.test.ts`

```typescript
describe('ApplicationService', () => {
  describe('submitCandidateApplication', () => {
    it('should create application with no recruiter when candidate has no active recruiter', async () => {
      // Mock: getActiveRecruiterForCandidate returns null
      // Mock: checkDuplicateApplication returns false
      // Mock: createApplication succeeds
      // Assert: application.recruiter_id is null
      // Assert: application.stage is 'applied'
      // Assert: event emitted: application.submitted_to_company
    });

    it('should create application with recruiter when candidate has active recruiter', async () => {
      // Mock: getActiveRecruiterForCandidate returns recruiter
      // Mock: checkDuplicateApplication returns false
      // Mock: createApplication succeeds
      // Assert: application.recruiter_id is set
      // Assert: application.stage is 'recruiter_review'
      // Assert: event emitted: application.submitted_to_recruiter
    });

    it('should reject duplicate application', async () => {
      // Mock: checkDuplicateApplication returns true
      // Assert: throws error with code 'DUPLICATE_APPLICATION'
      // Assert: no database writes
      // Assert: no events emitted
    });

    it('should validate required fields', async () => {
      // Test missing candidate_id → error
      // Test missing job_id → error
      // Test missing document_ids → error
      // Test missing primary_resume_id → error
    });

    it('should save pre-screen answers when provided', async () => {
      // Mock: job has 2 questions
      // Provide answers for both
      // Assert: createPreScreenAnswers called with correct data
      // Assert: answers linked to application
    });

    it('should link documents to application', async () => {
      // Provide 3 document IDs
      // Assert: createApplicationDocuments called 3 times
      // Assert: primary_resume flag set correctly
    });

    it('should delete draft after successful submission', async () => {
      // Mock: draft exists
      // Submit application
      // Assert: deleteDraftApplication called
    });
  });

  describe('recruiterSubmitApplication', () => {
    it('should update application stage and submit to company', async () => {
      // Mock: application in 'recruiter_review' stage
      // Mock: recruiter owns application
      // Call recruiterSubmitApplication
      // Assert: stage updated to 'applied'
      // Assert: submitted_at timestamp set
      // Assert: recruiter_notes saved
      // Assert: event emitted: application.submitted_to_company
    });

    it('should reject if recruiter does not own application', async () => {
      // Mock: application belongs to different recruiter
      // Assert: throws error with code 'UNAUTHORIZED'
    });

    it('should reject if application not in recruiter_review stage', async () => {
      // Mock: application already in 'applied' stage
      // Assert: throws error with code 'INVALID_STAGE'
    });
  });

  describe('requestPreScreen', () => {
    it('should assign recruiter and update application', async () => {
      // Mock: application has no recruiter
      // Mock: company owns job
      // Provide recruiter_id (manual assignment)
      // Assert: application.recruiter_id updated
      // Assert: application.stage updated to 'prescreen_requested'
      // Assert: event emitted: prescreen.requested
    });

    it('should auto-assign recruiter when not specified', async () => {
      // Mock: application has no recruiter
      // Mock: getAvailableRecruiters returns list
      // Call without recruiter_id (auto-assign)
      // Assert: recruiter assigned via algorithm
      // Assert: application updated
    });

    it('should reject if company does not own job', async () => {
      // Mock: job belongs to different company
      // Assert: throws error with code 'UNAUTHORIZED'
    });
  });
});
```

---

### 2.2 Network Service - Recruiter Assignment Tests

**File:** `services/network-service/src/services/assignments/__tests__/service.test.ts`

```typescript
describe('AssignmentService', () => {
  describe('getActiveRecruiterForCandidate', () => {
    it('should return recruiter when active relationship exists', async () => {
      // Mock: recruiter_candidates row with valid start_date and end_date
      // Assert: returns recruiter object
    });

    it('should return null when relationship expired', async () => {
      // Mock: recruiter_candidates row with end_date in past
      // Assert: returns null
    });

    it('should return null when no relationship exists', async () => {
      // Mock: no recruiter_candidates row
      // Assert: returns null
    });
  });

  describe('createCandidateRoleAssignment', () => {
    it('should create job-specific fiscal tracking record', async () => {
      // Call with candidate_id, job_id, recruiter_id
      // Assert: row inserted into candidate_role_assignments
      // Assert: assigned_at timestamp set
    });
  });
});
```

---

### 2.3 UI Component Tests

**File:** `apps/candidate/src/app/(authenticated)/jobs/[id]/apply/__tests__/application-wizard.test.tsx`

```typescript
describe('ApplicationWizard', () => {
  it('should render step 1 (documents) on mount', () => {
    // Render with mock data
    // Assert: step indicator shows step 1
    // Assert: document selection UI visible
  });

  it('should advance to step 2 when documents selected', async () => {
    // Select resume and mark as primary
    // Click "Continue"
    // Assert: step 2 (questions) rendered
  });

  it('should save draft when navigating between steps', async () => {
    // Mock: saveDraft API call
    // Navigate step 1 → step 2
    // Assert: saveDraft called with correct payload
  });

  it('should pre-populate from draft when resuming', () => {
    // Render with draft data
    // Assert: selected documents checked
    // Assert: primary resume marked
    // Assert: question answers filled
  });

  it('should show validation error when required question unanswered', () => {
    // Navigate to step 2
    // Leave required question blank
    // Click "Continue"
    // Assert: error message displayed
    // Assert: button disabled
  });

  it('should submit application successfully', async () => {
    // Complete all steps
    // Click "Submit Application"
    // Mock: submitApplication succeeds
    // Assert: redirect to /applications?success=true
  });

  it('should show error message on submission failure', async () => {
    // Complete all steps
    // Click "Submit Application"
    // Mock: submitApplication fails
    // Assert: error alert displayed
    // Assert: form remains on review step
  });
});
```

---

## 3. Integration Test Specifications

### 3.1 Full Submission Flow (No Recruiter)

**File:** `services/ats-service/src/__tests__/integration/application-submission.test.ts`

```typescript
describe('Application Submission Integration', () => {
  let app: FastifyInstance;
  let db: SupabaseClient;

  beforeAll(async () => {
    app = await buildTestServer();
    db = createSupabaseClient();
    await seedTestData(db);
  });

  it('should complete full submission flow for candidate without recruiter', async () => {
    // 1. Create test candidate (no recruiter relationship)
    const candidate = await db.from('ats.candidates').insert({ ... }).select().single();

    // 2. Create test job with pre-screen questions
    const job = await db.from('ats.jobs').insert({ ... }).select().single();
    const questions = await db.from('ats.job_pre_screen_questions').insert([...]).select();

    // 3. Upload test documents
    const resume = await db.from('ats.candidate_documents').insert({ ... }).select().single();

    // 4. Submit application via API
    const response = await app.inject({
      method: 'POST',
      url: '/api/applications/submit',
      headers: { Authorization: `Bearer ${candidateToken}` },
      payload: {
        job_id: job.id,
        document_ids: [resume.id],
        primary_resume_id: resume.id,
        pre_screen_answers: [
          { question_id: questions[0].id, answer: { text: 'Yes' } },
        ],
      },
    });

    // 5. Assert response
    expect(response.statusCode).toBe(201);
    expect(response.json().data.application.recruiter_id).toBeNull();
    expect(response.json().data.application.stage).toBe('applied');

    // 6. Verify database records
    const application = await db.from('ats.applications')
      .select('*')
      .eq('id', response.json().data.application.id)
      .single();
    expect(application.stage).toBe('applied');

    const answers = await db.from('ats.job_pre_screen_answers')
      .select('*')
      .eq('application_id', application.id);
    expect(answers.length).toBe(1);

    const documents = await db.from('documents')
      .select('*')
      .eq('entity_type', 'application')
      .eq('entity_id', application.id);
    expect(documents.length).toBe(1);
    expect(documents[0].is_primary_resume).toBe(true);

    // 7. Verify event emitted (check RabbitMQ or mock)
    // ... event verification logic
  });
});
```

---

### 3.2 Full Submission Flow (With Recruiter)

```typescript
it('should route application to recruiter when active relationship exists', async () => {
  // 1. Create candidate with active recruiter relationship
  const candidate = await db.from('ats.candidates').insert({ ... }).select().single();
  const recruiter = await db.from('network.recruiters').insert({ ... }).select().single();
  await db.from('network.recruiter_candidates').insert({
    recruiter_id: recruiter.id,
    candidate_id: candidate.id,
    start_date: new Date().toISOString(),
    end_date: addMonths(new Date(), 12).toISOString(),
  });

  // 2. Create job
  const job = await db.from('ats.jobs').insert({ ... }).select().single();

  // 3. Submit application
  const response = await app.inject({
    method: 'POST',
    url: '/api/applications/submit',
    payload: { job_id: job.id, document_ids: [...], ... },
  });

  // 4. Assert routing to recruiter
  expect(response.statusCode).toBe(201);
  expect(response.json().data.application.recruiter_id).toBe(recruiter.id);
  expect(response.json().data.application.stage).toBe('recruiter_review');
  expect(response.json().data.application.submitted_at).toBeNull();

  // 5. Verify event: application.submitted_to_recruiter
});
```

---

### 3.3 Recruiter Approval Flow

```typescript
it('should allow recruiter to approve and submit application', async () => {
  // 1. Create application in 'recruiter_review' stage
  const application = await db.from('ats.applications').insert({
    recruiter_id: recruiterId,
    stage: 'recruiter_review',
    ...
  }).select().single();

  // 2. Recruiter approves via API
  const response = await app.inject({
    method: 'POST',
    url: `/api/applications/${application.id}/recruiter-submit`,
    headers: { Authorization: `Bearer ${recruiterToken}` },
    payload: {
      recruiterNotes: 'Strong candidate, highly recommend',
    },
  });

  // 3. Assert update
  expect(response.statusCode).toBe(200);
  const updated = await db.from('ats.applications')
    .select('*')
    .eq('id', application.id)
    .single();
  expect(updated.stage).toBe('applied');
  expect(updated.submitted_at).not.toBeNull();

  // 4. Verify candidate_role_assignment created
  const assignment = await db.from('network.candidate_role_assignments')
    .select('*')
    .eq('application_id', application.id)
    .single();
  expect(assignment).toBeDefined();

  // 5. Verify event: application.submitted_to_company
});
```

---

### 3.4 Draft Persistence

```typescript
it('should save and load draft application', async () => {
  // 1. Save draft
  const saveResponse = await app.inject({
    method: 'POST',
    url: `/api/applications/draft/${jobId}`,
    headers: { Authorization: `Bearer ${candidateToken}` },
    payload: {
      step: 1,
      documents: { selected: [doc1, doc2], primary_resume_id: doc1 },
      pre_screen_answers: {},
    },
  });
  expect(saveResponse.statusCode).toBe(200);

  // 2. Load draft
  const loadResponse = await app.inject({
    method: 'GET',
    url: `/api/applications/draft/${jobId}`,
    headers: { Authorization: `Bearer ${candidateToken}` },
  });
  expect(loadResponse.statusCode).toBe(200);
  const draft = loadResponse.json().data;
  expect(draft.draft_data.step).toBe(1);
  expect(draft.draft_data.documents.selected).toEqual([doc1, doc2]);
});
```

---

## 4. End-to-End Test Specifications

### 4.1 Candidate Application Journey (Playwright)

**File:** `apps/candidate/e2e/application-flow.spec.ts`

```typescript
test.describe('Candidate Application Flow', () => {
  test('should complete full application as candidate without recruiter', async ({ page }) => {
    // 1. Sign in
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'candidate@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Navigate to job
    await page.goto('/jobs');
    await page.click('text=Software Engineer');

    // 3. Start application
    await page.click('button:has-text("Apply Now")');
    await expect(page).toHaveURL(/\/jobs\/.*\/apply/);

    // 4. Step 1: Select documents
    await page.check('input[type="checkbox"][data-doc-id="resume-1"]');
    await page.click('button:has-text("Set as Primary")');
    await page.click('button:has-text("Continue")');

    // 5. Step 2: Answer questions
    await page.fill('textarea[name="question-1"]', 'I have 5 years of experience in React.');
    await page.click('input[type="radio"][value="yes"]');
    await page.click('button:has-text("Continue to Review")');

    // 6. Step 3: Review and submit
    await expect(page.locator('text=Software Engineer')).toBeVisible();
    await expect(page.locator('text=resume-1.pdf')).toBeVisible();
    await page.click('button:has-text("Submit Application")');

    // 7. Verify success
    await expect(page).toHaveURL(/\/applications\?success=true/);
    await expect(page.locator('.alert-success')).toContainText('Application submitted');
  });

  test('should save draft and resume later', async ({ page }) => {
    // 1. Start application
    await page.goto('/jobs/123/apply');
    await page.check('input[data-doc-id="resume-1"]');
    await page.click('button:has-text("Set as Primary")');
    await page.click('button:has-text("Continue")');

    // 2. Navigate away (draft auto-saved)
    await page.goto('/jobs');

    // 3. Return to application
    await page.goto('/jobs/123/apply');

    // 4. Verify draft loaded
    await expect(page.locator('input[data-doc-id="resume-1"]')).toBeChecked();
  });
});
```

---

### 4.2 Recruiter Review Journey (Playwright)

**File:** `apps/portal/e2e/recruiter-review.spec.ts`

```typescript
test.describe('Recruiter Review Flow', () => {
  test('should review and approve application', async ({ page }) => {
    // 1. Sign in as recruiter
    await page.goto('/sign-in');
    await page.fill('input[name="email"]', 'recruiter@test.com');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // 2. Navigate to pending applications
    await page.goto('/applications/pending');
    await expect(page.locator('text=Jane Doe')).toBeVisible();

    // 3. Click review
    await page.click('a:has-text("Review")');
    await expect(page).toHaveURL(/\/applications\/.*\/review/);

    // 4. View application details
    await expect(page.locator('text=Software Engineer')).toBeVisible();
    await expect(page.locator('text=Jane Doe')).toBeVisible();

    // 5. Add recruiter notes
    await page.fill('textarea[name="recruiterNotes"]', 'Strong candidate with great experience');

    // 6. Approve and submit
    await page.click('button:has-text("Approve & Submit to Company")');

    // 7. Verify success
    await expect(page).toHaveURL(/\/applications/);
    await expect(page.locator('.alert-success')).toContainText('Application submitted');
  });
});
```

---

## 5. Validation Test Cases

### 5.1 Business Rules

| Test Case | Expected Behavior |
|-----------|-------------------|
| Duplicate application | Error: "You have already applied to this job" |
| No resume selected | Validation error: "Please select at least one resume" |
| No primary resume | Validation error: "Please select a primary resume" |
| Required question unanswered | Validation error: "This question is required" |
| Invalid document ID | Error: "Document not found or does not belong to you" |
| Recruiter approves unassigned app | Error 403: "You are not authorized to review this application" |
| Company requests pre-screen for other company's job | Error 403: "Unauthorized" |

---

### 5.2 Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| Candidate deletes document mid-application | Error on submit: "Selected document no longer exists" |
| Recruiter relationship expires during review | Application routes to company directly |
| Draft older than 30 days | Auto-deleted, candidate starts fresh |
| Session timeout during application | Redirect to sign-in, draft persists |
| Network error during submission | Show error message, retry button |
| RabbitMQ unavailable | Application still created, event retried later |
| Resend API failure | Email queued for retry, does not block submission |

---

### 5.3 Performance Tests

| Test | Target | Tool |
|------|--------|------|
| Application submission latency | <500ms | k6, Artillery |
| Draft save latency | <100ms | k6 |
| Concurrent submissions (100 users) | Success rate >98% | k6 |
| Database query time (getApplications) | <100ms | pgBench |
| Event delivery latency | <5 seconds | RabbitMQ monitoring |

---

## 6. Test Data Management

### 6.1 Test Fixtures

**File:** `services/ats-service/src/__tests__/fixtures/applications.ts`

```typescript
export const testCandidate = {
  id: 'cand-1',
  email: 'candidate@test.com',
  first_name: 'Jane',
  last_name: 'Doe',
};

export const testRecruiter = {
  id: 'rec-1',
  email: 'recruiter@test.com',
  first_name: 'John',
  last_name: 'Smith',
};

export const testJob = {
  id: 'job-1',
  title: 'Software Engineer',
  company_id: 'comp-1',
  status: 'open',
};

export const testPreScreenQuestions = [
  {
    id: 'q-1',
    job_id: 'job-1',
    question: 'Do you have React experience?',
    question_type: 'yes_no',
    is_required: true,
  },
];
```

---

### 6.2 Database Seeding

**File:** `infra/migrations/seed_test_applications.sql`

```sql
-- Seed test candidates
INSERT INTO ats.candidates (id, email, first_name, last_name)
VALUES 
  ('test-cand-1', 'candidate1@test.com', 'Alice', 'Johnson'),
  ('test-cand-2', 'candidate2@test.com', 'Bob', 'Williams');

-- Seed test recruiters
INSERT INTO network.recruiters (id, email, first_name, last_name)
VALUES 
  ('test-rec-1', 'recruiter1@test.com', 'Carol', 'Davis');

-- Seed recruiter-candidate relationship
INSERT INTO network.recruiter_candidates (recruiter_id, candidate_id, start_date, end_date)
VALUES 
  ('test-rec-1', 'test-cand-1', NOW(), NOW() + INTERVAL '12 months');

-- Seed test jobs
INSERT INTO ats.jobs (id, title, company_id, status)
VALUES 
  ('test-job-1', 'Software Engineer', 'test-company-1', 'open');

-- Seed pre-screen questions
INSERT INTO ats.job_pre_screen_questions (job_id, question, question_type, is_required)
VALUES 
  ('test-job-1', 'Years of experience?', 'text', true),
  ('test-job-1', 'Willing to relocate?', 'yes_no', false);
```

---

### 6.3 Test Cleanup

```typescript
afterEach(async () => {
  // Delete test applications
  await db.from('ats.applications').delete().ilike('candidate_id', 'test-%');
  await db.from('documents').delete().eq('entity_type', 'application').ilike('entity_id', 'test-%');
  await db.from('ats.job_pre_screen_answers').delete().ilike('application_id', 'test-%');
  await db.from('ats.application_audit_log').delete().ilike('application_id', 'test-%');
});
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow

**File:** `.github/workflows/test.yml`

```yaml
name: Test Candidate Applications

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm --filter @splits-network/ats-service test
      - run: pnpm --filter @splits-network/network-service test

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm --filter @splits-network/ats-service test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: pnpm install
      - run: pnpm --filter @splits-network/candidate playwright install
      - run: pnpm --filter @splits-network/candidate e2e
```

---

## 8. Test Execution Checklist

### Pre-Deployment Testing

- [ ] All unit tests passing (>80% coverage)
- [ ] All integration tests passing
- [ ] E2E tests for critical paths passing
- [ ] Performance tests meeting SLAs
- [ ] Security tests (SQL injection, XSS) passing
- [ ] Manual UAT with 5+ users completed
- [ ] All critical bugs resolved
- [ ] Documentation reviewed

### Post-Deployment Monitoring

- [ ] Monitor application submission success rate (target: >98%)
- [ ] Monitor API response times (target: <500ms)
- [ ] Monitor event delivery latency (target: <5s)
- [ ] Monitor email delivery rate (target: >95%)
- [ ] Monitor error logs for unexpected failures
- [ ] Collect user feedback

---

## 9. Next Steps

1. Set up test infrastructure
2. Write unit tests for Phase 2 (backend services)
3. Write integration tests for Phase 3 (API gateway)
4. Write E2E tests for Phase 5 (UI)
5. Execute full test suite before Phase 9 deployment

---

**Status:** ✅ Ready for Test Implementation  
**Completion:** All 8 implementation documents finalized  
**Next:** Execute [Implementation Phases](./07-implementation-phases.md)
