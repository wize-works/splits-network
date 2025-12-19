# Implementation Phases - Candidate Application Workflow

**Document:** 07 - Implementation Phases  
**Created:** December 19, 2025

---

## Overview

Phased rollout plan to implement the candidate application workflow in manageable, testable increments.

---

## Phase 0: Pre-Implementation Checklist

**Duration:** 1 day

### Tasks

- [ ] Review all documentation (01-08)
- [ ] Stakeholder approval of flows and UX
- [ ] Verify Supabase credentials and access
- [ ] Confirm RabbitMQ connection details
- [ ] Confirm Resend API key and email domains
- [ ] Create feature branch: `feature/candidate-applications`
- [ ] Set up local development environment
- [ ] Run `pnpm install` at root
- [ ] Start all services with `pnpm dev`

---

## Phase 1: Database Schema & Migrations

**Duration:** 2-3 days  
**Dependencies:** None  
**Risk:** Low

### Goals

Establish database foundation for new features.

### Tasks

#### 1.1 Create Migration File

**File:** `infra/migrations/008_candidate_applications.sql`

```bash
# Copy from 01-database-schema.md
```

- [ ] Copy SQL from [01-database-schema.md](./01-database-schema.md)
- [ ] Place in `infra/migrations/` folder
- [ ] Review schema definitions

#### 1.2 Apply Migration

**Using Supabase MCP Tools:**

```typescript
// Use mcp_supabase_apply_migration tool
{
  migration_name: "008_candidate_applications",
  ddl_sql: "..." // Full migration SQL
}
```

**Or via Supabase CLI:**

```bash
cd infra/migrations
supabase db push --db-url postgresql://...
```

- [ ] Apply migration to development database
- [ ] Verify table created: `job_pre_screen_answers`
- [ ] Verify stage constraint updated on `applications` (includes 'draft')
- [ ] Verify `recruiter_notes` column added to `applications`
- [ ] Verify indexes exist
- [ ] Test foreign key constraints
- [ ] Check RLS policies applied

#### 1.3 Seed Test Data

**File:** `infra/migrations/seed_test_applications.sql`

- [ ] Create test candidates
- [ ] Create test jobs with pre-screen questions
- [ ] Create test recruiter-candidate relationships
- [ ] Insert draft applications (stage='draft') for testing
- [ ] Link test documents via `documents` table with entity_type='application'

#### 1.4 Validation

- [ ] Query tables to confirm structure
- [ ] Test RLS by querying as different user roles
- [ ] Verify cascading deletes work correctly
- [ ] Verify draft applications queryable via stage='draft'
- [ ] Verify documents linked via entity pattern
- [ ] Document any schema deviations

**Deliverables:**
- ✅ 1 new table in database (`job_pre_screen_answers`)
- ✅ Applications table updated (stage constraint, recruiter_notes column)
- ✅ Migration file committed
- ✅ Test data seeded

---

## Phase 2: Backend Services (ATS & Network)

**Duration:** 4-5 days  
**Dependencies:** Phase 1 complete  
**Risk:** Medium

### Goals

Implement core business logic for application submission and routing.

### Tasks

#### 2.1 ATS Service - Repository Layer

**File:** `services/ats-service/src/repository.ts`

- [ ] Add `createApplication()` method
- [ ] Add `createPreScreenAnswers()` method
- [ ] Add `createApplicationDocuments()` method
- [ ] Add `getDraftApplication()` method
- [ ] Add `saveDraftApplication()` method
- [ ] Add `deleteDraftApplication()` method
- [ ] Add `getApplicationById()` method
- [ ] Add `updateApplicationStage()` method

#### 2.2 ATS Service - Service Layer

**File:** `services/ats-service/src/service.ts`

Implement three core flows from [03-service-layer.md](./03-service-layer.md):

- [ ] `submitCandidateApplication()` (15-step flow)
  - [ ] Input validation
  - [ ] Check duplicate applications
  - [ ] Check recruiter relationship
  - [ ] Routing logic (recruiter vs company)
  - [ ] Create application record
  - [ ] Create pre-screen answers
  - [ ] Link documents
  - [ ] Delete draft
  - [ ] Emit event
  - [ ] Return response

- [ ] `recruiterSubmitApplication()` (6-step flow)
  - [ ] Verify recruiter owns application
  - [ ] Update application status
  - [ ] Add recruiter notes
  - [ ] Update timestamp
  - [ ] Emit event
  - [ ] Return response

- [ ] `requestPreScreen()` (6-step flow)
  - [ ] Verify company owns job
  - [ ] Assign recruiter (manual or auto)
  - [ ] Update application
  - [ ] Emit event
  - [ ] Return response

#### 2.3 ATS Service - Routes

**File:** `services/ats-service/src/routes/applications.ts`

Implement endpoints from [02-api-contracts.md](./02-api-contracts.md):

- [ ] POST `/applications/submit`
- [ ] GET `/applications/draft/:jobId`
- [ ] POST `/applications/draft/:jobId`
- [ ] DELETE `/applications/draft/:jobId`
- [ ] GET `/applications/:id`
- [ ] POST `/applications/:id/recruiter-submit`
- [ ] POST `/applications/:id/request-prescreen`

#### 2.4 Network Service - Recruiter Assignment

**File:** `services/network-service/src/services/assignments.ts`

- [ ] `getActiveRecruiterForCandidate()` method
- [ ] `assignRecruiterToJob()` method (for company-requested pre-screens)
- [ ] `createCandidateRoleAssignment()` method (job-specific fiscal tracking)

#### 2.5 Testing

**Files:** `services/ats-service/src/__tests__/applications.test.ts`

- [ ] Test submitCandidateApplication with no recruiter
- [ ] Test submitCandidateApplication with recruiter
- [ ] Test duplicate application rejection
- [ ] Test recruiter submit flow
- [ ] Test pre-screen request flow
- [ ] Test draft save/load/delete
- [ ] Test validation errors

**Deliverables:**
- ✅ Service methods implemented
- ✅ All endpoints return `{ data: T }` envelope
- ✅ Unit tests passing
- ✅ Manual testing via Postman/curl

---

## Phase 3: API Gateway Integration

**Duration:** 2 days  
**Dependencies:** Phase 2 complete  
**Risk:** Low

### Goals

Expose ATS endpoints through API Gateway with authentication and authorization.

### Tasks

#### 3.1 Gateway Routes

**File:** `services/api-gateway/src/routes/applications.ts`

- [ ] Add proxy routes for application endpoints
- [ ] Apply Clerk JWT verification middleware
- [ ] Apply rate limiting
- [ ] Add request logging

#### 3.2 Authorization

**File:** `services/api-gateway/src/rbac.ts`

- [ ] Define permissions:
  - `applications:submit` (candidate)
  - `applications:review` (recruiter)
  - `applications:request-prescreen` (company)
- [ ] Update RBAC checks in gateway

#### 3.3 Testing

- [ ] Test candidate can submit applications
- [ ] Test candidate cannot submit on behalf of others
- [ ] Test recruiter can review assigned applications
- [ ] Test recruiter cannot review others' applications
- [ ] Test company can request pre-screens for their jobs
- [ ] Test rate limiting works

**Deliverables:**
- ✅ Gateway routes configured
- ✅ Authorization working
- ✅ Integration tests passing

---

## Phase 4: Events & Notifications

**Duration:** 2-3 days  
**Dependencies:** Phase 2 complete  
**Risk:** Low

### Goals

Implement event-driven notifications for application lifecycle.

### Tasks

#### 4.1 Event Emission (ATS Service)

**File:** `services/ats-service/src/events.ts`

- [ ] Configure RabbitMQ connection
- [ ] Implement `emitApplicationEvent()` helper
- [ ] Emit events in service methods:
  - [ ] `application.submitted_to_recruiter`
  - [ ] `application.submitted_to_company`
  - [ ] `prescreen.requested`

#### 4.2 Event Consumers (Notification Service)

**File:** `services/notification-service/src/consumers/applications/`

- [ ] Create `submitted-to-recruiter-consumer.ts`
- [ ] Create `submitted-to-company-consumer.ts`
- [ ] Create `prescreen-requested-consumer.ts`

#### 4.3 Email Templates (Resend)

**File:** `services/notification-service/src/services/email-templates.ts`

Implement templates from [04-event-system.md](./04-event-system.md):

- [ ] `application_submitted_to_recruiter` (to recruiter)
- [ ] `application_submitted_to_recruiter_confirmation` (to candidate)
- [ ] `application_submitted_to_company` (to company)
- [ ] `application_submitted_to_company_confirmation` (to candidate)
- [ ] `prescreen_requested` (to recruiter)
- [ ] `prescreen_requested_confirmation` (to company)

#### 4.4 Testing

- [ ] Test event emission from ATS service
- [ ] Test event consumption in notification service
- [ ] Test emails sent via Resend
- [ ] Verify email content and formatting
- [ ] Test email delivery failures (retry logic)

**Deliverables:**
- ✅ Events emitting correctly
- ✅ Notifications service consuming events
- ✅ Emails delivered via Resend
- ✅ Email templates styled and tested

---

## Phase 5: Candidate UI (Wizard)

**Duration:** 5-6 days  
**Dependencies:** Phase 3 complete  
**Risk:** Medium

### Goals

Build candidate-facing application wizard.

### Tasks

#### 5.1 Application Wizard Structure

**Files from [05-ui-components.md](./05-ui-components.md):**

- [ ] Create `apps/candidate/src/app/(authenticated)/jobs/[id]/apply/page.tsx`
- [ ] Create `application-wizard.tsx` (main orchestrator)
- [ ] Create `components/step-indicator.tsx`
- [ ] Create `components/step-documents.tsx`
- [ ] Create `components/step-questions.tsx`
- [ ] Create `components/step-review.tsx`

#### 5.2 API Client Methods

**File:** `apps/candidate/src/lib/api.ts`

- [ ] `submitApplication(data)` → POST /api/applications/submit
- [ ] `getDraftApplication(jobId)` → GET /api/applications/draft/:jobId
- [ ] `saveDraftApplication(jobId, data)` → POST /api/applications/draft/:jobId
- [ ] `getPreScreenQuestions(jobId)` → GET /api/jobs/:jobId/pre-screen-questions
- [ ] `getMyDocuments()` → GET /api/documents

#### 5.3 Form State Management

- [ ] Implement wizard step navigation
- [ ] Implement auto-save draft on step change
- [ ] Implement form validation
- [ ] Implement error handling
- [ ] Implement loading states

#### 5.4 Document Selection

- [ ] Display existing documents by type (resume, cover letter, portfolio)
- [ ] Allow document selection with checkboxes
- [ ] Implement "Set as Primary Resume" functionality
- [ ] Add upload capability (if missing, link to document management)

#### 5.5 Pre-Screen Questions

- [ ] Render question types: text, yes/no, select, multi-select
- [ ] Implement required field validation
- [ ] Save answers in form state
- [ ] Auto-save to draft

#### 5.6 Review & Submit

- [ ] Display application summary
- [ ] Show selected documents
- [ ] Show question answers
- [ ] Implement submit button with loading state
- [ ] Handle submission success/failure
- [ ] Redirect to applications list on success

#### 5.7 Testing

- [ ] Test wizard flow end-to-end
- [ ] Test draft save and resume
- [ ] Test validation (missing resume, required questions)
- [ ] Test duplicate application handling
- [ ] Test with recruiter vs without recruiter
- [ ] Test mobile responsiveness
- [ ] Test accessibility (keyboard navigation, screen readers)

**Deliverables:**
- ✅ Complete application wizard
- ✅ Draft autosave working
- ✅ Validation working
- ✅ Mobile-responsive UI
- ✅ Accessible components

---

## Phase 6: Recruiter Portal (Review Interface)

**Duration:** 3-4 days  
**Dependencies:** Phase 5 complete  
**Risk:** Low

### Goals

Build recruiter interface for reviewing and approving applications.

### Tasks

#### 6.1 Pending Applications List

**File:** `apps/portal/src/app/(authenticated)/applications/pending/page.tsx`

- [ ] Fetch pending applications for recruiter
- [ ] Display list with candidate name, job, submission date
- [ ] Add "Review" action button
- [ ] Add filters (by job, by date)

#### 6.2 Application Review Page

**File:** `apps/portal/src/app/(authenticated)/applications/[id]/review/page.tsx`

- [ ] Display job details
- [ ] Display candidate profile summary
- [ ] Display selected documents (view/download)
- [ ] Display pre-screen question answers
- [ ] Add recruiter notes text area
- [ ] Add "Approve & Submit" button
- [ ] Add "Request Changes" button

#### 6.3 API Client Methods

**File:** `apps/portal/src/lib/api-client.ts`

- [ ] `getPendingApplications()` → GET /api/recruiters/me/applications?status=pending
- [ ] `getApplicationDetails(id)` → GET /api/applications/:id
- [ ] `recruiterSubmitApplication(id, notes)` → POST /api/applications/:id/recruiter-submit
- [ ] `requestApplicationChanges(id, feedback)` → POST /api/applications/:id/request-changes

#### 6.4 Testing

- [ ] Test pending applications list
- [ ] Test application review flow
- [ ] Test approve and submit
- [ ] Test request changes
- [ ] Test permissions (recruiter can only see assigned applications)

**Deliverables:**
- ✅ Recruiter review interface
- ✅ Approve/request changes working
- ✅ Notifications sent on approval

---

## Phase 7: Company Portal (Pre-Screen Requests)

**Duration:** 2-3 days  
**Dependencies:** Phase 6 complete  
**Risk:** Low

### Goals

Enable companies to request pre-screen for direct applications.

### Tasks

#### 7.1 Applications List with Pre-Screen Tab

**File:** `apps/portal/src/app/(authenticated)/companies/[id]/applications/page.tsx`

- [ ] Add "Needs Pre-Screen" tab
- [ ] Filter applications where `recruiter_id IS NULL`
- [ ] Display candidate info and application date
- [ ] Add "Request Pre-Screen" button

#### 7.2 Pre-Screen Request Modal

**Component:** Request Pre-Screen Modal

- [ ] Show recruiter assignment options:
  - Auto-assign (system selects)
  - Manual select from dropdown
- [ ] Add optional message field
- [ ] Add submit button
- [ ] Handle success/error

#### 7.3 API Client Methods

**File:** `apps/portal/src/lib/api-client.ts`

- [ ] `requestPreScreen(applicationId, recruiterId?, message?)` → POST /api/applications/:id/request-prescreen

#### 7.4 Testing

- [ ] Test pre-screen request with auto-assign
- [ ] Test pre-screen request with manual selection
- [ ] Test only company admins can request
- [ ] Test recruiter receives notification

**Deliverables:**
- ✅ Company can request pre-screens
- ✅ Auto-assign working
- ✅ Manual selection working
- ✅ Notifications sent

---

## Phase 8: Testing & QA

**Duration:** 3-4 days  
**Dependencies:** All phases complete  
**Risk:** Low

### Goals

Comprehensive testing before production release.

### Tasks

#### 8.1 Integration Testing

- [ ] Test full candidate flow (no recruiter)
- [ ] Test full candidate flow (with recruiter)
- [ ] Test recruiter review and approval
- [ ] Test company pre-screen request
- [ ] Test draft persistence across sessions
- [ ] Test duplicate application prevention
- [ ] Test all email notifications deliver

#### 8.2 Edge Case Testing

- [ ] Candidate deletes document mid-application
- [ ] Recruiter relationship expires during review
- [ ] Session timeout during application
- [ ] Network error during submission
- [ ] RabbitMQ connection failure
- [ ] Resend API failure
- [ ] Database deadlock scenarios

#### 8.3 Performance Testing

- [ ] Test with 100+ simultaneous applications
- [ ] Test draft queries with large datasets
- [ ] Test notification queue backlog handling
- [ ] Test document upload concurrency

#### 8.4 Security Testing

- [ ] Test authorization (candidate cannot access others' applications)
- [ ] Test recruiter cannot approve unassigned applications
- [ ] Test company cannot request pre-screens for other companies' jobs
- [ ] Test SQL injection prevention
- [ ] Test XSS prevention in form inputs

#### 8.5 User Acceptance Testing (UAT)

- [ ] Recruit 5 internal testers (candidates, recruiters, company)
- [ ] Provide test scenarios
- [ ] Collect feedback
- [ ] Fix critical bugs
- [ ] Iterate on UX issues

**Deliverables:**
- ✅ All tests passing
- ✅ No critical bugs
- ✅ Performance benchmarks met
- ✅ Security verified
- ✅ UAT feedback incorporated

---

## Phase 9: Documentation & Deployment

**Duration:** 2 days  
**Dependencies:** Phase 8 complete  
**Risk:** Low

### Goals

Finalize documentation and deploy to production.

### Tasks

#### 9.1 Documentation

- [ ] Update API documentation with new endpoints
- [ ] Create user guides:
  - Candidate: How to apply for jobs
  - Recruiter: How to review applications
  - Company: How to request pre-screens
- [ ] Update architecture diagrams
- [ ] Document event flows

#### 9.2 Deployment Preparation

- [ ] Review Kubernetes manifests
- [ ] Update environment variables
- [ ] Prepare rollback plan
- [ ] Schedule deployment window
- [ ] Notify stakeholders

#### 9.3 Production Deployment

- [ ] Apply database migration to production
- [ ] Deploy updated services (ats, network, notification, api-gateway)
- [ ] Deploy updated frontend (candidate, portal)
- [ ] Smoke test production
- [ ] Monitor logs and errors
- [ ] Monitor RabbitMQ queues
- [ ] Monitor email delivery

#### 9.4 Post-Deployment

- [ ] Announce feature launch
- [ ] Monitor application submission rate
- [ ] Collect user feedback
- [ ] Address any issues
- [ ] Plan Phase 2 enhancements

**Deliverables:**
- ✅ Production deployment successful
- ✅ All services operational
- ✅ Documentation published
- ✅ Stakeholders notified

---

## Rollback Plan

### If Critical Issue Found Post-Deployment

1. **Immediate Actions:**
   - [ ] Disable application submission UI (feature flag or route block)
   - [ ] Stop notification consumers to prevent email spam
   - [ ] Revert API Gateway routes to previous version

2. **Database Rollback:**
   - [ ] Run rollback migration (from [01-database-schema.md](./01-database-schema.md))
   - [ ] Verify no data corruption
   - [ ] Restore from backup if necessary

3. **Service Rollback:**
   - [ ] Deploy previous Docker images
   - [ ] Restart services
   - [ ] Verify health checks

4. **Communication:**
   - [ ] Notify users of temporary outage
   - [ ] Post-mortem analysis
   - [ ] Fix issues in development
   - [ ] Re-deploy when ready

---

## Success Metrics

### Phase 1-3 (Backend)
- All endpoints return 2xx responses
- Unit test coverage >80%
- API response time <200ms

### Phase 4 (Notifications)
- Event delivery success rate >99%
- Email delivery success rate >95%
- Average notification latency <5 seconds

### Phase 5-7 (Frontend)
- Application submission success rate >98%
- Draft save success rate >99%
- Wizard completion rate >70% (users who start reach submit)
- Mobile responsiveness: works on iOS/Android browsers

### Phase 8 (Testing)
- Zero critical bugs
- <5 medium-priority bugs
- UAT satisfaction score >8/10

### Post-Deployment (Week 1)
- >100 applications submitted
- Zero production incidents
- Email delivery success rate >95%
- User-reported bugs <3

---

## Timeline Summary

| Phase | Duration | Cumulative |
|-------|----------|-----------|
| 0: Pre-Implementation | 1 day | 1 day |
| 1: Database | 2-3 days | 3-4 days |
| 2: Backend Services | 4-5 days | 7-9 days |
| 3: API Gateway | 2 days | 9-11 days |
| 4: Events & Notifications | 2-3 days | 11-14 days |
| 5: Candidate UI | 5-6 days | 16-20 days |
| 6: Recruiter Portal | 3-4 days | 19-24 days |
| 7: Company Portal | 2-3 days | 21-27 days |
| 8: Testing & QA | 3-4 days | 24-31 days |
| 9: Deployment | 2 days | 26-33 days |

**Total Estimated Duration:** 4-5 weeks (20-25 working days)

---

## Next Steps

1. Review implementation phases with team
2. Assign phase owners
3. Begin Phase 0 preparation
4. Proceed to [Testing Strategy](./08-testing-strategy.md)

---

**Status:** ✅ Ready for Execution  
**Next:** [Testing Strategy](./08-testing-strategy.md)
