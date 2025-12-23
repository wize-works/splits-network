# Recruiter Submission Flow - Implementation Plan

**Status**: Phase 2 Implementation In Progress  
**Last Updated**: 2024-12-14  
**Owner**: Development Team

---

## 1. Overview

This document tracks the implementation of the **Recruiter Submission Flow** - a new capability allowing recruiters to propose job opportunities to candidates for approval before candidates complete their full applications. This is defined in [recruiter-submission-flow.md](./recruiter-submission-flow.md).

---

## 2. Implementation Phases

### Phase 1: Foundation ✅ COMPLETE

**Objective**: Set up database schema, core service methods, and API endpoints

#### 2.1.1 Database Schema
- **File**: `infra/migrations/021_add_recruiter_proposed_stage.sql`
- **Changes**:
  - ✅ Added `recruiter_proposed` stage documentation to `ats.applications` table
  - ✅ Updated stage validation to include `recruiter_proposed`
  - ✅ Documented new audit log actions:
    - `recruiter_proposed_job` - Recruiter sends job to candidate
    - `candidate_approved_opportunity` - Candidate approves job
    - `candidate_declined_opportunity` - Candidate declines job
  - ✅ Created helper functions:
    - `get_application_stage_history(application_id)` - Retrieve full stage timeline
    - `is_recruiter_proposed_application(application_id)` - Check if application is in recruiter_proposed stage
  - ✅ Rollback script included

**Status**: ✅ Complete

---

#### 2.1.2 Backend Service Layer
- **File**: `services/ats-service/src/services/applications/service.ts`
- **New Methods Added**:

**1. `recruiterProposeJob()`**
  - Purpose: Recruiter initiates job proposal to candidate
  - Parameters:
    - `recruiterId`: Recruiter identifier
    - `recruiterUserId`: Recruiter user ID (for audit trail)
    - `candidateId`: Target candidate
    - `jobId`: Job being proposed
    - `pitch`: Optional recruiter notes
  - Returns: `Application` (stage: `recruiter_proposed`)
  - Side Effects:
    - Creates application in `recruiter_proposed` stage
    - Creates audit log entry with `recruiter_proposed_job` action
    - Publishes `application.recruiter_proposed` event
  - Validation:
    - Job exists and is active
    - Candidate exists
    - No active application already exists for this job+candidate pair

**2. `candidateApproveOpportunity()`**
  - Purpose: Candidate approves job opportunity
  - Parameters:
    - `applicationId`: Application to approve
    - `candidateId`: Candidate (validated against application)
    - `candidateUserId`: User ID for audit trail
  - Returns: `Application` (stage: `draft`)
  - Side Effects:
    - Updates stage from `recruiter_proposed` → `draft`
    - Creates audit log entry with `candidate_approved_opportunity` action
    - Publishes `application.candidate_approved` event
  - Validation:
    - Application exists and is in `recruiter_proposed` stage
    - User is the candidate for this application
    - Job is still active

**3. `candidateDeclineOpportunity()`**
  - Purpose: Candidate declines job opportunity
  - Parameters:
    - `applicationId`: Application to decline
    - `candidateId`: Candidate
    - `candidateUserId`: User ID for audit trail
    - `reason`: Decline reason code (optional)
    - `notes`: Additional details (optional)
  - Returns: `Application` (stage: `rejected`)
  - Side Effects:
    - Updates stage from `recruiter_proposed` → `rejected`
    - Creates audit log entry with `candidate_declined_opportunity` action + reason/notes in metadata
    - Publishes `application.candidate_declined` event
  - Validation:
    - Application exists and is in `recruiter_proposed` stage
    - User is the candidate

**4. `getPendingOpportunitiesForCandidate()`**
  - Purpose: Query pending job opportunities awaiting candidate decision
  - Parameters:
    - `candidateId`: Target candidate
  - Returns: `Array<Application>` enriched with job and recruiter details
  - Details:
    - Filters for applications in `recruiter_proposed` stage only
    - Enriches with: job title, description, location, recruiter name, recruiter email
    - Ordered by creation date (newest first)
  - Use Case: Candidate portal pending opportunities view

**5. `getProposedJobsForRecruiter()`**
  - Purpose: Get recruiter's dashboard of sent job proposals
  - Parameters:
    - `recruiterId`: Recruiter identifier
  - Returns: Array of applications with status mapping:
    - `status: 'pending'` = stage `recruiter_proposed`
    - `status: 'approved'` = stage `draft` (candidate approved but hasn't completed)
    - `status: 'declined'` = stage `rejected`
  - Enriches: Candidate name, email, job title
  - Use Case: Recruiter dashboard showing proposal outcomes

**Status**: ✅ Complete

**Code Review**: All methods follow existing patterns:
- Parameter validation first
- Business logic second
- Audit logging third
- Event publishing last
- Consistent error messages
- Proper audit context tracking

---

#### 2.1.3 API Endpoints
- **File**: `services/ats-service/src/routes/applications/routes.ts`
- **New Endpoints Added**:

| Method | Path | Purpose | Request Body | Response |
|--------|------|---------|--------------|----------|
| POST | `/applications/recruiter-propose` | Recruiter proposes job | `{ recruiter_id?, recruiter_user_id?, candidate_id, job_id, pitch? }` | Application object |
| POST | `/applications/:id/candidate-approve` | Candidate approves | `{ candidate_id?, candidate_user_id? }` | Application object |
| POST | `/applications/:id/candidate-decline` | Candidate declines | `{ candidate_id?, candidate_user_id?, reason?, notes? }` | Application object |
| GET | `/candidates/:candidateId/pending-opportunities` | Get pending for candidate | None | Array of Applications (enriched) |
| GET | `/recruiters/:recruiterId/proposed-jobs` | Get recruiter proposals | `?status=pending/approved/declined` | Array of Applications (enriched) |

**Request Extraction**:
- User context (recruiter_id, candidate_id) can come from:
  - Request body (passed by API Gateway)
  - Request auth context (fallback)

**Status**: ✅ Complete

---

#### 2.1.4 AtsService Delegation
- **File**: `services/ats-service/src/service.ts`
- **Methods Added**:
  - ✅ `recruiterProposeJob(params)`
  - ✅ `candidateApproveOpportunity(params)`
  - ✅ `candidateDeclineOpportunity(params)`
  - ✅ `getPendingOpportunitiesForCandidate(candidateId)`
  - ✅ `getProposedJobsForRecruiter(recruiterId)`

**Status**: ✅ Complete

---

### Phase 2: Events & Notifications 🔄 IN PROGRESS

**Objective**: Ensure all events are published and notification templates created

#### 2.2.1 Events to Publish

Four new domain events:

1. **`application.recruiter_proposed`**
   - When: Recruiter proposes job to candidate
   - Payload:
     ```json
     {
       "application_id": "string",
       "recruiter_id": "string",
       "recruiter_user_id": "string",
       "candidate_id": "string",
       "candidate_email": "string",
       "candidate_name": "string",
       "job_id": "string",
       "job_title": "string",
       "company_id": "string",
       "recruiter_pitch": "string (optional)"
     }
     ```
   - Consumed By: `notification-service` (send candidate notification)
   - Current Status: ✅ Publishing code in place

2. **`application.candidate_approved`**
   - When: Candidate approves job opportunity
   - Payload:
     ```json
     {
       "application_id": "string",
       "candidate_id": "string",
       "recruiter_id": "string",
       "job_id": "string",
       "approved_at": "ISO-8601 datetime"
     }
     ```
   - Consumed By: `notification-service` (send recruiter notification)
   - Current Status: ✅ Publishing code in place

3. **`application.candidate_declined`**
   - When: Candidate declines job opportunity
   - Payload:
     ```json
     {
       "application_id": "string",
       "candidate_id": "string",
       "candidate_name": "string",
       "recruiter_id": "string",
       "job_id": "string",
       "decline_reason": "string (optional)",
       "decline_note": "string (optional)",
       "declined_at": "ISO-8601 datetime"
     }
     ```
   - Consumed By: `notification-service` (send recruiter notification)
   - Current Status: ✅ Publishing code in place

4. **`application.submitted_for_recruiter_review`** (existing event reused)
   - When: Candidate completes application after approving opportunity
   - No changes needed - already being published

**Status**: 🔄 In Progress - Code is publishing events. Notifications not yet implemented.

---

#### 2.2.2 Notification Templates (Not Started)

To Do:
- [ ] Create "New Job Opportunity from [Recruiter]" email template
  - Recipient: Candidate
  - Event: `application.recruiter_proposed`
  - Content:
    - Job title and company
    - Recruiter name/contact info
    - Recruiter pitch (if provided)
    - Call-to-action: "View Opportunity" and "Decline" links
  - File: `services/notification-service/src/emails/...`

- [ ] Create "[Candidate] Interested in [Job]" email template
  - Recipient: Recruiter
  - Event: `application.candidate_approved`
  - Content:
    - Candidate name
    - Job title
    - Call-to-action: "View Application" link
  - File: `services/notification-service/src/emails/...`

- [ ] Create "[Candidate] Declined [Job]" email template
  - Recipient: Recruiter
  - Event: `application.candidate_declined`
  - Content:
    - Candidate name
    - Job title
    - Decline reason (if provided)
    - Decline note (if provided)
  - File: `services/notification-service/src/emails/...`

**Status**: ❌ Not Started

---

### Phase 3: Frontend - Candidate Portal 🔲 NOT STARTED

**Objective**: Add UI for candidates to view and respond to job proposals

#### 2.3.1 New Page: Pending Opportunities
- **Route**: `/opportunities/pending`
- **Endpoint Used**: `GET /candidates/:candidateId/pending-opportunities`
- **Features**:
  - List of all pending recruiter proposals
  - For each opportunity:
    - Job title, company, location
    - Recruiter name
    - Recruiter pitch (if provided)
    - "View Details" link (expands job description)
    - "Approve" button (transitions to application form)
    - "Decline" button (opens decline modal)
  - Decline modal:
    - Reason dropdown (optional pre-defined reasons)
    - Notes text field (optional)
    - Confirm/Cancel buttons
  - Empty state: "No pending opportunities"

#### 2.3.2 Integration into Main Navigation
- Add "Opportunities" tab/link in candidate portal navigation
- Show badge with count of pending opportunities
- Link to `/opportunities/pending` page

**Status**: ❌ Not Started

---

### Phase 4: Frontend - Recruiter Portal 🔲 NOT STARTED

**Objective**: Add UI for recruiters to send job proposals and track outcomes

#### 2.4.1 Candidate Detail Page Enhancement
- **Location**: Candidate profile view (existing page)
- **New Section**: "Send Job Opportunity"
  - Job dropdown (filtered to recruiter's jobs)
  - Optional pitch text field
  - Send button
  - Success/error toast notification

#### 2.4.2 Proposal Dashboard
- **Route**: `/proposals` (new page)
- **Endpoint Used**: `GET /recruiters/:recruiterId/proposed-jobs?status=...`
- **Features**:
  - Tab filter: Pending | Approved | Declined
  - For each proposal:
    - Candidate name
    - Job title
    - Sent date
    - Status with visual indicator
    - Last update date
  - Actions:
    - If pending: "Cancel" button (?) or link to candidate profile
    - If approved: "View Application" link to application details
    - If declined: Reason if provided
  - Sort options: By date, by candidate, by job
  - Search: Filter by candidate name or job title

**Status**: ❌ Not Started

---

### Phase 5: Documentation 🔲 NOT STARTED

#### 2.5.1 Updates Needed

1. **API Documentation** (`docs/API-DOCUMENTATION.md`)
   - [ ] Document 5 new endpoints
   - [ ] Include example request/response payloads
   - [ ] Document new events

2. **User Roles & Permissions** (`docs/guidance/user-roles-and-permissions.md`)
   - [ ] Document recruiter capability: "Send Job Opportunity"
   - [ ] Document candidate capability: "Respond to Job Proposals"
   - [ ] Document access control rules

3. **Business Logic** (`docs/business-logic/`)
   - [ ] Link from recruiter-submission-flow.md to this implementation document
   - [ ] Update direct-vs-represented flow documentation

4. **Right to Represent** (Client-facing docs)
   - [ ] Update invitation language to clarify "per-job approval" model

**Status**: ❌ Not Started

---

## 3. Progress Tracking

### Completed
- ✅ Database migration (`021_add_recruiter_proposed_stage.sql`)
- ✅ 5 service methods (ApplicationService)
- ✅ 5 API endpoints
- ✅ Event publishing (code in place)
- ✅ Service delegation (AtsService)

### In Progress
- 🔄 Event system verification (ensure 4 events are properly published)
- 🔄 Notification service integration setup

### To Do
- ❌ Notification email templates (3 templates)
- ❌ Candidate portal UI (pending opportunities page)
- ❌ Recruiter portal UI (proposal dashboard)
- ❌ Documentation updates (5 documents)
- ❌ End-to-end testing

---

## 4. Testing Checklist

### Backend Testing
- [ ] `recruiterProposeJob()` validation
  - Job not found
  - Candidate not found
  - Duplicate active application
  - Happy path
- [ ] `candidateApproveOpportunity()` validation
  - Application not in recruiter_proposed stage
  - User not candidate
  - Job no longer active
  - Happy path
- [ ] `candidateDeclineOpportunity()` validation
  - Application not in recruiter_proposed stage
  - User not candidate
  - Decline reason/notes capture
  - Happy path
- [ ] Event publishing
  - All 4 events emitted
  - Event payloads correct
  - RabbitMQ delivery confirmed
- [ ] API endpoints
  - Auth context extraction
  - Error responses
  - Pagination (for get endpoints)
  - HTTP status codes

### Frontend Testing
- [ ] Candidate pending opportunities page
  - Loads pending applications
  - Approve flow works
  - Decline flow works with modal
  - Empty state displays
- [ ] Recruiter proposal dashboard
  - Lists proposed jobs with correct status
  - Tab filtering works
  - Search/sort work
  - Actions available per status
- [ ] Integration
  - Stage transitions work end-to-end
  - Notifications sent after each action
  - Audit log records all events

### Integration Testing
- [ ] Full recruiter → candidate → approve → complete flow
- [ ] Full recruiter → candidate → decline flow
- [ ] Right to represent validation (network service integration)
- [ ] Email notifications received in correct order

---

## 5. Risk Mitigation

### Known Risks
1. **RabbitMQ Event Publishing**: Code includes event publishing but notifications not yet implemented
   - Mitigation: Verify RabbitMQ connection before production
   - Verification: Check notification-service logs for event consumption

2. **Duplicate Applications**: Recruiter could spam "propose" requests
   - Mitigation: Service checks for active application existence
   - Enhancement: Rate limiting at gateway level (Phase 3+)

3. **Job Status Changes**: Job might become inactive between proposal and approval
   - Mitigation: `candidateApproveOpportunity()` validates job is still active
   - Enhancement: Send notification to candidate if job becomes inactive

4. **Relationship Validation**: Network service dependency not yet integrated
   - Current: Code has TODO comment
   - Mitigation: Gateway validates before routing to ATS service
   - Phase 3: Add network service call to confirm recruiter-candidate relationship

---

## 6. Dependencies

### External Services
- **Notification Service**: Must consume 3 new events and send emails
- **Network Service**: Must validate recruiter-candidate relationships (if enforcing)
- **Identity Service**: Must provide recruiter/candidate user details

### Internal Dependencies
- EventPublisher (already in place)
- AtsRepository (already in place)
- Audit log system (already in place)

---

## 7. Rollback Plan

If issues are discovered in production:

1. **Database**: Run rollback script in migration `021_add_recruiter_proposed_stage.sql`
2. **Code**: Revert service methods + API endpoints + AtsService delegation
3. **Events**: No listener yet, so no downstream effects
4. **Frontend**: Remove pending opportunities page and recruiter proposal dashboard

All changes are isolated to recruiter submission flow - no impact to existing pipelines.

---

## 8. Next Steps

1. **Verify Event Publishing** (Today)
   - Check that 4 events are being emitted to RabbitMQ
   - Verify payloads match spec

2. **Implement Notification Templates** (Next)
   - Add 3 email templates to notification-service
   - Set up event listeners
   - Test email delivery

3. **Build Frontend** (After notifications)
   - Candidate pending opportunities page
   - Recruiter proposal dashboard

4. **Document & Test** (Final)
   - Update all documentation
   - Run full integration tests
   - Internal QA sign-off

---

**Prepared by**: Development Team  
**Date**: 2024-12-14  
**Review Status**: Ready for Phase 2 (Events & Notifications)
