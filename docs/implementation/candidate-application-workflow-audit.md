# Candidate Application Workflow - Current State Audit

**Created:** December 18, 2025  
**Purpose:** Audit existing implementation to plan candidate job application feature

---

## Executive Summary

This document audits the existing Splits Network codebase to understand what's already built for candidate job applications, proposals, and document management. This audit informs the design and implementation of the complete candidate application workflow.

---

## 1. Existing Data Models

### 1.1 Core Tables (from Supabase)

#### **ats.applications**
```sql
- id (uuid, PK)
- job_id (uuid, FK → ats.jobs)
- candidate_id (uuid, FK → ats.candidates)
- recruiter_id (uuid, FK → identity.users) -- The recruiter who submitted this application
- stage (text) -- 'submitted', 'screen', 'interview', 'offer', 'hired', 'rejected'
- notes (text, nullable)
- created_at (timestamptz)
- updated_at (timestamptz)
- accepted_by_company (boolean, default false)
- accepted_at (timestamptz, nullable)
```
**Status:** ✅ EXISTS  
**Purpose:** Main application record tracking candidate submissions to jobs

#### **ats.candidates**
```sql
- id (uuid, PK)
- email (text, unique)
- full_name (text)
- linkedin_url (text, nullable)
- phone (varchar, nullable)
- location (varchar, nullable)
- current_title (varchar, nullable)
- current_company (varchar, nullable)
- user_id (uuid, nullable, FK → identity.users) -- If candidate is self-managed
- created_by_user_id (uuid, nullable, FK → identity.users) -- Recruiter who added them
- recruiter_id (uuid, nullable, FK → identity.users) -- SOURCER attribution
- verification_status (text, default 'unverified')
- verification_metadata (jsonb)
- verified_at (timestamptz, nullable)
- verified_by_user_id (uuid, nullable)
- created_at, updated_at
```
**Status:** ✅ EXISTS  
**Purpose:** Candidate records, can be self-managed or recruiter-managed

#### **ats.job_pre_screen_questions**
```sql
- id (uuid, PK)
- job_id (uuid, FK → ats.jobs)
- question (text)
- question_type (text) -- 'text', 'yes_no', 'select', 'multi_select'
- options (jsonb, nullable)
- is_required (boolean, default true)
- sort_order (integer, default 0)
- created_at, updated_at
```
**Status:** ✅ EXISTS  
**Purpose:** Pre-screening questions defined by companies for specific jobs  
**RLS:** Enabled

⚠️ **MISSING:** `ats.job_pre_screen_answers` table for storing candidate responses

#### **network.recruiter_candidates**
```sql
- id (uuid, PK)
- recruiter_id (uuid, FK → network.recruiters)
- candidate_id (uuid, FK → ats.candidates)
- relationship_start_date (timestamptz, default now())
- relationship_end_date (timestamptz) -- 12 months from start
- status (text) -- 'active', 'expired', 'terminated'
- invited_at (timestamptz)
- invitation_token (text, nullable)
- invitation_expires_at (timestamptz)
- consent_given (boolean, default false)
- consent_given_at (timestamptz)
- consent_ip_address (text)
- consent_user_agent (text)
- declined_at (timestamptz)
- declined_reason (text)
- created_at, updated_at
```
**Status:** ✅ EXISTS  
**Purpose:** 12-month renewable recruiter-candidate relationships (candidate-wide, not job-specific)

#### **network.candidate_role_assignments**
```sql
- id (uuid, PK)
- job_id (uuid, FK → ats.jobs)
- candidate_id (uuid, FK → ats.candidates)
- recruiter_id (uuid, FK → network.recruiters)
- state (text) -- 'proposed', 'accepted', 'declined', 'timed_out', 'submitted', 'closed'
- proposed_at (timestamptz)
- response_due_at (timestamptz)
- accepted_at, declined_at, timed_out_at, submitted_at, closed_at (all timestamptz, nullable)
- proposed_by (uuid, nullable, FK → identity.users)
- proposal_notes (text, nullable)
- response_notes (text, nullable)
- created_at, updated_at
```
**Status:** ✅ EXISTS (Phase 2)  
**Purpose:** Tracks job-specific recruiter proposals to work on candidate-job pairings  
**Comment:** "State machine for candidate-job proposals and collaboration"

This is the key table for tracking which recruiter is assigned to a specific role for a candidate (for fiscal tracking)!

#### **ats.application_audit_log**
```sql
- id (uuid, PK)
- application_id (uuid, FK → ats.applications)
- action (text) -- 'accepted', 'rejected', 'stage_changed', 'viewed', etc.
- performed_by_user_id (uuid, nullable)
- performed_by_role (text, nullable)
- company_id (uuid, nullable)
- old_value (jsonb, nullable)
- new_value (jsonb, nullable)
- metadata (jsonb, nullable)
- ip_address, user_agent (text, nullable)
- created_at
```
**Status:** ✅ EXISTS  
**Purpose:** Comprehensive audit trail for all application actions

⚠️ **MISSING:** Document management tables (assumed to exist in document-service, but not visible in current schema list)

---

## 2. Existing Services & APIs

### 2.1 ATS Service

#### **ApplicationService** (`services/ats-service/src/services/applications/service.ts`)

**Existing Methods:**
- `getApplications(filters?)` - List applications with filters
- `getApplicationById(id)` - Get single application
- `getApplicationsByJobId(jobId)` - All applications for a job
- `getApplicationsByRecruiterId(recruiterId)` - All applications by recruiter
- `getApplicationsByCandidateId(candidateId)` - All applications by candidate ✅
- `submitCandidate(jobId, email, name, recruiterId?, options)` - Create application

**Status:** ✅ Core application CRUD exists  
**Gaps:**
- No method for candidate self-submission (without recruiter)
- No draft/saved application support
- No pre-screen answer handling

### 2.2 Network Service

#### **CandidateRoleAssignmentService** (`services/network-service/src/services/proposals/service.ts`)

**Existing Methods:**
- `createProposal(jobId, candidateId, recruiterId, proposedBy?, notes?, duedays)` - Create proposal
- `acceptProposal(assignmentId, responseNotes?)` - Accept proposal
- `declineProposal(assignmentId, responseNotes?)` - Decline proposal
- `submitAssignment(assignmentId)` - Mark as submitted
- `closeAssignment(assignmentId)` - Close the assignment
- `getRecruiterProposals(recruiterId, state?)` - Get recruiter's proposals
- `getJobProposals(jobId, state?)` - Get proposals for job
- `canRecruiterWorkOnCandidate(recruiterId, candidateId, jobId)` - Check eligibility

**Status:** ✅ Proposal state machine fully implemented  
**Purpose:** This is **Phase 2** - for recruiter-to-recruiter or company-to-recruiter proposals

**Key Insight:** This is NOT the candidate application flow. This is for recruiters proposing to work on candidate-job pairings.

### 2.3 Document Service (Inferred)

Routes exist in API Gateway (`services/api-gateway/src/routes/documents/routes.ts`):
- `GET /api/candidates/me/documents` - Get candidate's documents
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/:id` - Get document by ID
- `DELETE /api/documents/:id` - Delete document (inferred)
- `GET /api/documents/entity/:entityType/:entityId` - Get documents by entity

**Status:** ✅ Document management exists  
**Service:** Separate `document-service` (not in current workspace folders, likely separate microservice)

---

## 3. Existing Frontend Implementation

### 3.1 Candidate App (`apps/candidate`)

#### **Applications Page** (`app/(authenticated)/applications/page.tsx`)
**Status:** ✅ EXISTS  
**Features:**
- Displays candidate's applications
- Filters: active vs inactive
- Shows stats (total, active, interviews, offers)
- Links to application details
- Links to job details

**API Call:** `getApplications(token)` from `/lib/api.ts`

#### **Documents Page** (`app/(authenticated)/documents/page.tsx`)
**Status:** ✅ EXISTS  
**Features:**
- Upload resume, cover letter, portfolio, other
- Auto-detect document type from filename
- Download documents
- Delete documents
- Filter by type
- File type icons

**Storage:** Uses existing document service

#### **Job Detail Page** (`app/(public)/jobs/[id]/page.tsx`)
**Status:** ✅ EXISTS  
**Current:** Shows "Create Account" and "Sign In" CTAs  
**Missing:** "Apply Now" button and application flow

### 3.2 Portal App (`apps/portal`)

#### **Proposals Page** (`app/(authenticated)/proposals/page.tsx`)
**Status:** ✅ EXISTS  
**Purpose:** Recruiter view of candidate-role proposals (Phase 2)  
**Features:**
- List proposals
- Accept/decline proposals
- View proposal details
- Filter by state

**Component:** `ProposalCard` component exists

---

## 4. Gaps Analysis

### 4.1 Missing Tables

| Table | Purpose | Priority |
|-------|---------|----------|
| `ats.job_pre_screen_answers` | Store candidate responses to pre-screen questions | HIGH |
| `ats.application_documents` | Link documents to specific applications | MEDIUM |
| `ats.application_drafts` | Store draft/in-progress applications | MEDIUM |

### 4.2 Missing API Endpoints

#### **For Candidates:**
- `POST /api/applications/draft` - Save draft application
- `GET /api/applications/draft/:jobId` - Get draft for job
- `POST /api/applications/submit` - Submit complete application (with docs & answers)
- `GET /api/jobs/:id/pre-screen-questions` - Get pre-screen questions for job
- `POST /api/applications/:id/answers` - Submit pre-screen answers
- `GET /api/candidates/me/recruiter` - Check if candidate has recruiter relationship

#### **For Recruiters:**
- `GET /api/recruiters/me/candidate-applications` - Candidate-initiated applications needing recruiter review
- `POST /api/applications/:id/review` - Recruiter review/enhance application
- `POST /api/applications/:id/submit-to-company` - Recruiter submits to company

#### **For Companies:**
- `POST /api/applications/:id/request-prescreen` - Request recruiter pre-screen for non-represented candidate

### 4.3 Missing UI Components

#### **Candidate App:**
- `/jobs/[id]/apply` page - Application wizard
- Multi-step application form
- Document selection component
- Pre-screen questions form
- Draft save/resume functionality
- "Apply Now" button on job detail page

#### **Portal App:**
- Candidate-initiated applications inbox
- Application review/enhancement UI
- Request pre-screen workflow (company side)

### 4.4 Missing Business Logic

- Application state management (draft → submitted → under_review → approved/rejected)
- Auto-assignment of random recruiter when company requests pre-screen
- Validation: prevent duplicate applications (same candidate, same job)
- Notification triggers:
  - Recruiter notified when candidate with relationship applies
  - Company notified of direct application (no recruiter)
  - Candidate notified of recruiter acceptance/enhancement request
  - Candidate notified of recruiter submission to company

---

## 5. Existing Workflows (What's Built)

### 5.1 ✅ Recruiter Submits Candidate (Portal)
**Flow:**
1. Recruiter finds/creates candidate
2. Recruiter submits candidate to job
3. Application created with `recruiter_id` set
4. Company sees submission

**Code:** `ApplicationService.submitCandidate()`

### 5.2 ✅ Document Management (Candidate App)
**Flow:**
1. Candidate uploads documents
2. Documents stored with `entity_type=candidate`, `entity_id=candidate_id`
3. Candidate can view/download/delete documents

**Code:** Document service + `/documents` page

### 5.3 ✅ Recruiter-Candidate Relationship (Invitation)
**Flow:**
1. Recruiter invites candidate (creates `recruiter_candidates` record)
2. Candidate receives magic link
3. Candidate accepts invitation
4. 12-month relationship established

**Code:** Invitation flow exists (inferred from table structure)

### 5.4 ✅ Proposal System (Phase 2 - Recruiter-to-Recruiter)
**Flow:**
1. Recruiter proposes to work on candidate-job pairing
2. Company/other recruiter accepts or declines
3. Proposal state machine tracked in `candidate_role_assignments`

**Code:** `CandidateRoleAssignmentService`

---

## 6. Required Workflows (To Build)

### 6.1 ❌ Candidate Applies to Job (No Recruiter)
**Flow:**
1. Candidate browses `/jobs/[id]`
2. Clicks "Apply Now"
3. Multi-step wizard:
   - Step 1: Select/upload documents (resume required)
   - Step 2: Answer pre-screen questions (if any)
   - Step 3: Review & submit
4. Application created with `recruiter_id = NULL`
5. Company sees application directly
6. Company can click "Request Pre-Screen" → random recruiter assigned

**Tables Involved:**
- `ats.applications` (new record, `recruiter_id = NULL`)
- `ats.job_pre_screen_answers` (new records)
- `ats.application_documents` (link existing docs to application)

### 6.2 ❌ Candidate Applies to Job (Has Recruiter)
**Flow:**
1. Candidate browses `/jobs/[id]`
2. Clicks "Apply Now"
3. System checks `network.recruiter_candidates` for active relationship
4. Multi-step wizard (same as above)
5. On submit:
   - Application created with `recruiter_id` from relationship
   - Application state = 'draft' or 'pending_recruiter_review'
6. Recruiter notified (email + in-app)
7. Recruiter reviews application:
   - Can request candidate update something
   - Can enhance/add notes
   - Approves and submits to company
8. Application state → 'submitted', company sees it

**Tables Involved:**
- `ats.applications` (new record, `recruiter_id` from relationship)
- `network.recruiter_candidates` (check for active relationship)
- `ats.job_pre_screen_answers`
- `ats.application_documents`
- Notification queue

### 6.3 ❌ Company Requests Pre-Screen (Non-Represented Candidate)
**Flow:**
1. Company sees application with `recruiter_id = NULL`
2. Clicks "Request Pre-Screen from Recruiter"
3. System randomly selects active recruiter
4. Invitation sent to candidate: "Recruiter X would like to represent you for this job"
5. Candidate accepts or declines
6. If accepted:
   - `network.recruiter_candidates` relationship created (12 months)
   - Application updated with `recruiter_id`
   - Recruiter takes over application

**Tables Involved:**
- `ats.applications` (update `recruiter_id`)
- `network.recruiters` (find active recruiters)
- `network.recruiter_candidates` (create relationship)

### 6.4 ❌ Draft Application (Save Progress)
**Flow:**
1. Candidate starts application
2. Can save at any step
3. Returns later to resume
4. Draft persisted until submitted or deleted

**Tables Involved:**
- `ats.application_drafts` (new table)
- Store: `candidate_id`, `job_id`, `draft_data` (jsonb), `last_saved_at`

---

## 7. Data Model Additions Required

### 7.1 New Table: `ats.job_pre_screen_answers`

```sql
CREATE TABLE IF NOT EXISTS ats.job_pre_screen_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ats.job_pre_screen_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    answer_boolean BOOLEAN,
    answer_json JSONB, -- For select/multi_select options
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pre_screen_answers_application ON ats.job_pre_screen_answers(application_id);
CREATE INDEX idx_pre_screen_answers_question ON ats.job_pre_screen_answers(question_id);
```

### 7.2 New Table: `ats.application_documents`

```sql
CREATE TABLE IF NOT EXISTS ats.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    document_id UUID NOT NULL, -- Reference to document-service
    document_type TEXT NOT NULL, -- 'resume', 'cover_letter', 'portfolio', 'other'
    is_primary BOOLEAN DEFAULT false, -- Primary resume for this application
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_app_docs_application ON ats.application_documents(application_id);
CREATE UNIQUE INDEX idx_app_docs_unique ON ats.application_documents(application_id, document_id);
```

### 7.3 New Table: `ats.application_drafts` (Optional)

```sql
CREATE TABLE IF NOT EXISTS ats.application_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES ats.candidates(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES ats.jobs(id) ON DELETE CASCADE,
    draft_data JSONB NOT NULL DEFAULT '{}', -- Stores form state
    last_saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(candidate_id, job_id)
);

CREATE INDEX idx_app_drafts_candidate ON ats.application_drafts(candidate_id);
CREATE INDEX idx_app_drafts_job ON ats.application_drafts(job_id);
```

### 7.4 Extend `ats.applications` Table

Add columns:
```sql
ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
-- 'draft', 'pending_recruiter_review', 'recruiter_approved', 'submitted', 'under_review', 'rejected', 'accepted'

ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS submitted_by TEXT;
-- 'candidate', 'recruiter'

ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS candidate_submitted_at TIMESTAMPTZ;
-- When candidate originally submitted (before recruiter review)
```

---

## 8. Key Architectural Decisions

### Decision 1: Recruiter Assignment Scope
**Clarification:** 
- `network.recruiter_candidates` = candidate-wide 12-month relationship
- `network.candidate_role_assignments` = job-specific tracking for fiscal assignment
- `ats.applications.recruiter_id` = who submitted/manages this specific application

**Implementation:**
- When candidate with recruiter applies, use recruiter from `recruiter_candidates`
- Create `candidate_role_assignment` for fiscal tracking
- Set `applications.recruiter_id` to that recruiter

### Decision 2: Application Flow
**Candidate Without Recruiter:**
- Direct submission to company (`recruiter_id = NULL`)
- Company can request pre-screen → random recruiter offered to candidate

**Candidate With Recruiter:**
- Candidate submits application
- Goes to recruiter for review/enhancement
- Recruiter submits to company

### Decision 3: Document Management
**Use existing document service:**
- Candidates upload docs to their profile
- During application, select existing docs (checkboxes)
- Can upload new docs inline
- Store references in `application_documents` table

### Decision 4: Pre-Screen Answers
**Storage:**
- `ats.job_pre_screen_answers` table
- One row per question per application
- Support text, boolean, and JSON answers

---

## 9. Next Steps

1. ✅ **Complete this audit** (DONE)
2. **Create detailed implementation plan** with:
   - Database migrations
   - API endpoint specs (request/response schemas)
   - Service method signatures
   - UI wireframes/component breakdown
   - Event flows
   - Notification templates
3. **Phased implementation:**
   - Phase 1: Database schema additions
   - Phase 2: ATS Service updates (API endpoints)
   - Phase 3: API Gateway routes
   - Phase 4: Candidate App UI (application wizard)
   - Phase 5: Portal App UI (recruiter review)
   - Phase 6: Notification triggers
   - Phase 7: Testing & edge cases

---

## 10. Summary

### What Exists:
✅ Core application table structure  
✅ Recruiter-candidate relationships (12-month)  
✅ Document management system  
✅ Pre-screen questions (table exists)  
✅ Proposal system (Phase 2 - recruiter proposals)  
✅ Application submission by recruiters  
✅ Candidate applications list page  
✅ Documents management page  

### What's Missing:
❌ Candidate-initiated application flow  
❌ Pre-screen answers storage  
❌ Application-document linking  
❌ Draft application support  
❌ Recruiter review/enhancement workflow  
❌ Company request pre-screen workflow  
❌ UI: Application wizard  
❌ UI: Recruiter application inbox  
❌ Notifications for application events  

### Critical Insight:
The **existing proposal system** (`candidate_role_assignments`) is for Phase 2 recruiter-to-recruiter collaboration. We need to build the **candidate application flow** which is separate but will create `candidate_role_assignments` records for fiscal tracking purposes.

---

**Document Status:** ✅ COMPLETE  
**Ready for:** Implementation Planning Phase

