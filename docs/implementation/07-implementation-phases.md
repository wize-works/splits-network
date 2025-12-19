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

**File:** `infra/migrations/013_candidate_applications.sql`

```bash
# Copy from 01-database-schema.md
```

- [x] Copy SQL from [01-database-schema.md](./01-database-schema.md)
- [x] Place in `infra/migrations/` folder
- [x] Review schema definitions

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

- [x] Apply migration to development database
- [x] Verify table created: `job_pre_screen_answers`
- [x] Verify stage constraint updated on `applications` (includes 'draft')
- [x] Verify `recruiter_notes` column added to `applications`
- [x] Verify indexes exist
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

- [x] Add `createApplication()` method
- [x] Add `createPreScreenAnswers()` method
- [x] Add `linkDocumentToApplication()` method
- [x] Add `getDocumentsForApplication()` method
- [x] Add `getPreScreenAnswersForApplication()` method
- [x] Add `getPreScreenQuestionsForJob()` method
- [x] Add `getApplicationById()` method
- [x] Add `updateApplicationStage()` method

#### 2.2 ATS Service - Service Layer

**File:** `services/ats-service/src/service.ts`

Implement three core flows from [03-service-layer.md](./03-service-layer.md):

- [x] `submitCandidateApplication()` (15-step flow)
  - [x] Input validation
  - [x] Check duplicate applications
  - [x] Check recruiter relationship
  - [x] Routing logic (recruiter vs company)
  - [x] Create application record
  - [x] Create pre-screen answers
  - [x] Link documents
  - [x] Create audit log entries
  - [x] Emit event
  - [x] Return response

- [x] `recruiterSubmitApplication()` (6-step flow)
  - [x] Verify recruiter owns application
  - [x] Update application status
  - [x] Add recruiter notes
  - [x] Create audit log entries
  - [x] Emit event
  - [x] Return response

- [x] `withdrawApplication()` implemented
- [x] `getPendingApplicationsForRecruiter()` implemented

- [ ] `requestPreScreen()` (6-step flow)
  - [ ] Verify company owns job
  - [ ] Assign recruiter (manual or auto)
  - [ ] Update application
  - [ ] Emit event
  - [ ] Return response

#### 2.3 ATS Service - Routes

**File:** `services/ats-service/src/routes/applications.ts`

Implement endpoints from [02-api-contracts.md](./02-api-contracts.md):

- [x] POST `/applications/submit`
- [ ] GET `/applications/draft/:jobId` (using stage='draft' instead)
- [ ] POST `/applications/draft/:jobId` (using stage='draft' instead)
- [ ] DELETE `/applications/draft/:jobId` (using stage='draft' instead)
- [x] GET `/applications/:id`
- [x] GET `/applications/:id/full`
- [x] POST `/applications/:id/withdraw`
- [x] POST `/applications/:id/recruiter-submit`
- [x] GET `/recruiters/:recruiterId/pending-applications`
- [x] GET `/jobs/:jobId/pre-screen-questions`
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

- [x] Add proxy routes for application endpoints
- [x] Apply Clerk JWT verification middleware
- [x] Apply rate limiting
- [x] Add request logging

#### 3.2 Authorization

**File:** `services/api-gateway/src/rbac.ts`

- [x] Define permissions:
  - `applications:submit` (candidate)
  - `applications:review` (recruiter)
  - `applications:request-prescreen` (company)
- [x] Update RBAC checks in gateway
- [x] Added 'candidate' to UserRole type

#### 3.3 Testing

- [x] Test builds compile successfully
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
**Status:** ✅ **COMPLETE**

### Goals

Implement event-driven notifications for application lifecycle.

### Tasks

#### 4.1 Event Emission (ATS Service)

**File:** `services/ats-service/src/events.ts`

- [x] Configure RabbitMQ connection
- [x] Implement event publisher
- [x] Emit events in service methods:
  - [x] `application.created` (candidate submission)
  - [x] `application.submitted_to_company` (recruiter review complete)
  - [x] `application.withdrawn` (candidate withdrawal)

#### 4.2 Event Consumers (Notification Service)

**File:** `services/notification-service/src/consumers/applications/consumer.ts`

- [x] Add `handleCandidateApplicationSubmitted()` - sends confirmation to candidate + alert to recruiter if applicable
- [x] Add `handleRecruiterSubmittedToCompany()` - notifies company admins
- [x] Add `handleApplicationWithdrawn()` - notifies recruiter and company

#### 4.3 Email Templates (Resend)

**File:** `services/notification-service/src/services/applications/service.ts`

Implement templates from [04-event-system.md](./04-event-system.md):

- [x] `sendCandidateApplicationSubmitted()` - confirmation to candidate with next steps
- [x] `sendRecruiterApplicationPending()` - alert recruiter of pending review
- [x] `sendCompanyApplicationReceived()` - notify company of new application
- [x] `sendApplicationWithdrawn()` - notify relevant parties of withdrawal

#### 4.4 Testing

- [x] Test event emission from ATS service
- [x] Event routing configured in notification service
- [x] Email methods implemented with Resend integration
- [ ] Manual test: Submit application and verify emails
- [ ] Manual test: Recruiter submit to company and verify emails
- [ ] Manual test: Withdraw application and verify emails

**Deliverables:**
- ✅ Events emitting correctly
- ✅ Notifications service consuming events
- ✅ Email templates implemented
- ⏳ Manual testing pending (requires running services)

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
**Status:** ✅ **COMPLETE**

### Goals

Build recruiter interface for reviewing and approving applications.

### Tasks

#### 6.1 Pending Applications List

**File:** `apps/portal/src/app/(authenticated)/applications/pending/page.tsx`

- [x] Fetch pending applications for recruiter
- [x] Display list with candidate name, job, submission date
- [x] Add "Review" action button
- [x] Show document count and pre-screen answer count
- [x] Success message on return from submission

#### 6.2 Application Review Page

**Files:**
- `apps/portal/src/app/(authenticated)/applications/[id]/review/page.tsx`
- `apps/portal/src/app/(authenticated)/applications/[id]/review/review-form.tsx`

- [x] Display job details
- [x] Display candidate profile summary
- [x] Display selected documents (view/download)
- [x] Display pre-screen question answers
- [x] Add recruiter notes text area
- [x] Add "Submit to Company" button
- [x] Permission check (recruiter must own application)
- [x] Stage validation (must be in 'screen' stage)

#### 6.3 API Client Methods

**File:** `apps/portal/src/lib/api-client.ts`

- [x] `getPendingApplications(recruiterId)` → GET /api/recruiters/:id/pending-applications
- [x] `getApplicationFullDetails(id)` → GET /api/applications/:id/full
- [x] `recruiterSubmitApplication(id, notes)` → POST /api/applications/:id/recruiter-submit

#### 6.4 Testing

- [x] Portal builds successfully
- [ ] Manual test: View pending applications list
- [ ] Manual test: Review application details
- [ ] Manual test: Submit to company
- [ ] Manual test: Verify email notifications sent

**Deliverables:**
- ✅ Recruiter review interface complete
- ✅ Submit to company working
- ✅ Portal builds successfully
- ⏳ Manual testing pending (requires running services)

---

## Phase 7: Company Portal (Pre-Screen Requests)

**Duration:** 2-3 days  
**Dependencies:** Phase 6 complete  
**Risk:** Low

### Goals

Enable companies to request pre-screen for direct applications.

### Tasks

#### 7.1 Applications List with Pre-Screen Tab

**File:** `apps/portal/src/app/(authenticated)/roles/[id]/components/candidate-pipeline.tsx`

- [x] Add "Needs Pre-Screen" tab
- [x] Filter applications where `recruiter_id IS NULL`
- [x] Display candidate info and application date
- [x] Add "Request Pre-Screen" button

#### 7.2 Pre-Screen Request Modal

**Component:** Request Pre-Screen Modal (`apps/portal/src/app/(authenticated)/roles/[id]/components/pre-screen-request-modal.tsx`)

- [x] Show recruiter assignment options:
  - Auto-assign (system selects)
  - Manual select from dropdown
- [x] Add optional message field
- [x] Add submit button
- [x] Handle success/error

#### 7.3 API Client Methods

**File:** `apps/portal/src/lib/api-client.ts`

- [x] `requestPreScreen(applicationId, data)` → POST /api/applications/:id/request-prescreen

#### 7.4 Backend Implementation

**ATS Service:**

- [x] `requestPreScreen` method in ApplicationService
- [x] POST `/applications/:id/request-prescreen` route
- [x] Validates company ownership and application state
- [x] Updates application recruiter_id and stage to 'screen'
- [x] Creates audit log with 'prescreen_requested' action
- [x] Emits `application.prescreen_requested` event

**API Gateway:**

- [x] POST `/api/applications/:id/request-prescreen` route
- [x] RBAC: requires company_admin or hiring_manager role
- [x] Injects authenticated user context

**Notification Service:**

- [x] Event consumer for `application.prescreen_requested`
- [x] Email to assigned recruiter (if manual assignment)
- [x] Confirmation email to requesting user
- [x] Includes candidate details, job info, and optional message

#### 7.5 Testing

- [ ] Test pre-screen request with auto-assign
- [ ] Test pre-screen request with manual selection
- [ ] Test only company admins can request
- [ ] Test recruiter receives notification

**Deliverables:**
- ✅ Company can request pre-screens
- ✅ Auto-assign option available
- ✅ Manual selection working
- ✅ Notifications sent
- ✅ All builds passing

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
