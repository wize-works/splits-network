# Recruiter Submission Flow - Business Logic

**Document:** Recruiter-Initiated Application Flow (Candidate Approval Required)  
**Created:** December 22, 2025  
**Status:** Core Business Logic - Phase 1 Enhancement  
**Priority:** Critical - Candidate Agency & Compliance

---

## Overview

This document defines the business logic for **recruiter-initiated applications** where a recruiter sends a job opportunity to a candidate and the candidate must explicitly approve and complete the application before it proceeds to the recruiter's review and eventual company submission.

**Key Principle:** Even with an active "Right to Represent" agreement, candidates must approve each specific job opportunity and provide job-specific application materials.

---

## Core Concepts

### Right to Represent vs. Per-Job Approval

**Right to Represent Agreement:**
- 12-month exclusive relationship between recruiter and candidate
- Gives recruiter permission to *propose* opportunities
- Establishes trust and working relationship
- Required prerequisite for recruiter to send jobs

**Per-Job Approval (This Document):**
- Candidate must approve *each specific job* opportunity
- Candidate provides job-specific answers and documents
- Candidate can decline opportunities without ending relationship
- Ensures candidate agency and application quality

**Analogy:**
- Right to Represent = "You're my real estate agent"
- Per-Job Approval = "Yes, I want to see this specific house"

---

## Application Stages

### New Stage: `recruiter_proposed`

**Definition:** Recruiter has sent job opportunity to candidate; awaiting candidate's decision to proceed.

**Characteristics:**
- Initiated by recruiter, not candidate
- Minimal application data (no resume, no answers yet)
- Candidate has NOT approved
- Awaiting candidate action
- Visible to both recruiter and candidate

**Stage Order in Flow:**
```
recruiter_proposed → draft → ai_review → screen → submitted → interview → offer → hired/rejected
```

### Stage Distinctions

| Stage | Who Initiated | Candidate Approval | Status |
|-------|---------------|-------------------|--------|
| `draft` | Candidate | N/A (self-initiated) | Incomplete application |
| `recruiter_proposed` | Recruiter | Pending | Awaiting candidate decision |
| `ai_review` | Either | Approved | AI analyzing application |
| `screen` | Either | Approved | Recruiter reviewing |

**Key Point:** Stage alone distinguishes the source. No `application_source` field needed.

---

## Complete Flow

### Phase 1: Recruiter Proposes Opportunity

**Actors:** Recruiter  
**Prerequisites:**
- Active recruiter-candidate relationship exists
- `network.recruiter_candidates.status = 'active'`
- `network.recruiter_candidates.consent_given = true`

**Steps:**
1. Recruiter identifies suitable job for candidate
2. Recruiter clicks "Send Job to Candidate" on candidate detail page
3. Recruiter adds optional note about why this is a good fit
4. System creates application record:
   ```sql
   stage = 'recruiter_proposed'
   recruiter_id = [recruiter's ID]
   candidate_id = [candidate's ID]
   job_id = [job ID]
   recruiter_pitch = [optional note]
   ```
5. System creates audit log entry:
   ```sql
   action = 'recruiter_proposed_job'
   performed_by_user_id = [recruiter's user ID]
   performed_by_role = 'recruiter'
   ```
6. Event published: `application.recruiter_proposed`
7. Candidate notified via email: "New Job Opportunity from [Recruiter Name]"

**Database State:**
- Application exists with minimal data
- No documents attached yet
- No pre-screen answers yet
- Visible in candidate portal as "Pending Your Response"

---

### Phase 2: Candidate Reviews Opportunity

**Actors:** Candidate  
**Entry Point:** Email notification → Candidate portal

**Candidate Portal View:**
- Job details (title, company, description, requirements)
- Salary range and benefits
- Location and work arrangement
- Recruiter's note/pitch
- Two prominent buttons: **"Apply to This Job"** | **"Decline Opportunity"**

**Candidate Actions:**
1. Reviews job details thoroughly
2. Decides whether to proceed

---

### Phase 3A: Candidate Approves (Accepts Opportunity)

**Steps:**
1. Candidate clicks "Apply to This Job"
2. Application stage changes: `recruiter_proposed` → `draft`
3. System creates audit log entry:
   ```sql
   action = 'candidate_approved_opportunity'
   performed_by_user_id = [candidate's user ID]
   performed_by_role = 'candidate'
   timestamp = NOW()
   ```
4. Candidate redirected to application form wizard
5. Candidate completes application:
   - Uploads/selects resume
   - Attaches additional documents (cover letter, portfolio, etc.)
   - Answers pre-screen questions
   - Adds personal notes
6. Candidate clicks "Submit Application"
7. Application stage changes: `draft` → `ai_review`
8. System creates audit log entry:
   ```sql
   action = 'candidate_submitted_application'
   performed_by_user_id = [candidate's user ID]
   performed_by_role = 'candidate'
   ```
9. AI review executes (automatic, ~30 seconds)
10. Application stage changes: `ai_review` → `screen`
11. System creates audit log entry:
   ```sql
   action = 'ai_review_completed'
   performed_by_user_id = NULL
   performed_by_role = 'system'
   new_value = { fit_score: 85, recommendation: 'strong_fit' }
   ```
12. Event published: `application.submitted_for_recruiter_review`
13. Recruiter notified: "Candidate completed application for [Job Title]"

**Result:** Application now in recruiter's review queue with complete application materials.

---

### Phase 3B: Candidate Declines Opportunity

**Steps:**
1. Candidate clicks "Decline Opportunity"
2. Candidate provides reason (dropdown + text)  (need method to capture)
   - Not interested in role
   - Not interested in company
   - Location doesn't work
   - Salary too low
   - Other (specify)
3. Application stage changes: `recruiter_proposed` → `rejected`
4. System creates audit log entry:
   ```sql
   action = 'candidate_declined_opportunity'
   performed_by_user_id = [candidate's user ID]
   performed_by_role = 'candidate'
   old_value = { stage: 'recruiter_proposed' }
   new_value = { stage: 'rejected', reason: [decline reason] }
   ```
5. Event published: `application.candidate_declined`
6. Recruiter notified: "Candidate declined [Job Title] opportunity"
7. Application archived (visible in history but not active)

**Result:** No application proceeds to company. Recruiter-candidate relationship remains intact.

---

### Phase 4: Recruiter Screens Application

**Same as existing represented candidate flow.**

**Steps:**
1. Recruiter reviews completed application + AI insights
2. Recruiter conducts phone screen
3. Recruiter decides: Approve or Request Changes or Decline
4. If approved: Stage changes to `submitted` (to company)
5. System creates audit log entry:
   ```sql
   action = 'recruiter_submitted_to_company'
   performed_by_user_id = [recruiter's user ID]
   performed_by_role = 'recruiter'
   ```

---

## Audit Log Structure

**All approval events tracked in `ats.application_audit_log`:**

### Recruiter Proposes Job
```json
{
  "application_id": "uuid",
  "action": "recruiter_proposed_job",
  "performed_by_user_id": "recruiter_user_id",
  "performed_by_role": "recruiter",
  "timestamp": "2025-12-22T10:30:00Z",
  "old_value": null,
  "new_value": {
    "stage": "recruiter_proposed",
    "recruiter_pitch": "I think you'd be perfect for this role..."
  }
}
```

### Candidate Approves Opportunity
```json
{
  "application_id": "uuid",
  "action": "candidate_approved_opportunity",
  "performed_by_user_id": "candidate_user_id",
  "performed_by_role": "candidate",
  "timestamp": "2025-12-22T14:15:00Z",
  "old_value": { "stage": "recruiter_proposed" },
  "new_value": { "stage": "draft" }
}
```

### Candidate Declines Opportunity
```json
{
  "application_id": "uuid",
  "action": "candidate_declined_opportunity",
  "performed_by_user_id": "candidate_user_id",
  "performed_by_role": "candidate",
  "timestamp": "2025-12-22T14:20:00Z",
  "old_value": { "stage": "recruiter_proposed" },
  "new_value": {
    "stage": "rejected",
    "decline_reason": "not_interested_in_role",
    "decline_note": "Looking for more senior positions"
  }
}
```

### Candidate Submits Completed Application
```json
{
  "application_id": "uuid",
  "action": "candidate_submitted_application",
  "performed_by_user_id": "candidate_user_id",
  "performed_by_role": "candidate",
  "timestamp": "2025-12-22T15:00:00Z",
  "old_value": { "stage": "draft" },
  "new_value": {
    "stage": "ai_review",
    "documents_attached": ["resume_uuid", "cover_letter_uuid"],
    "questions_answered": 3
  }
}
```

### Benefits of Audit Log Approach:
- ✅ Complete timeline of all actions
- ✅ Who did what and when
- ✅ No need for redundant fields in applications table
- ✅ Queryable history for compliance
- ✅ Supports reporting and analytics

---

## Database Schema Implications

### `ats.applications` Table

**No new fields needed.**

Existing fields suffice:
- `stage` - includes new `recruiter_proposed` value
- `recruiter_id` - identifies recruiter (if represented)
- `candidate_id` - identifies candidate
- `job_id` - identifies job
- `recruiter_notes` - optional pitch when proposing

**Remove from consideration:**
- ~~`application_source`~~ - Stage distinguishes this
- ~~`candidate_approval_status`~~ - Use audit log
- ~~`candidate_approved_at`~~ - Use audit log

### `ats.application_audit_log` Table

**Existing structure supports all events:**
```sql
CREATE TABLE ats.application_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'recruiter_proposed_job', 'candidate_approved_opportunity'
    performed_by_user_id UUID, -- identity.users.id
    performed_by_role VARCHAR(50), -- 'recruiter', 'candidate', 'company', 'system'
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    old_value JSONB,
    new_value JSONB,
    notes TEXT
);
```

**New `action` values:**
- `recruiter_proposed_job`
- `candidate_approved_opportunity`
- `candidate_declined_opportunity`
- `candidate_submitted_application` (from recruiter-proposed flow)

---

## Event System

### New Events

#### 1. `application.recruiter_proposed`
**Trigger:** Recruiter sends job to candidate  
**Payload:**
```json
{
  "application_id": "uuid",
  "recruiter_id": "uuid",
  "recruiter_name": "John Doe",
  "candidate_id": "uuid",
  "candidate_name": "Jane Smith",
  "candidate_email": "jane@example.com",
  "job_id": "uuid",
  "job_title": "Senior Software Engineer",
  "company_name": "Acme Corp",
  "recruiter_pitch": "Optional note from recruiter"
}
```

**Consumers:**
- Notification Service → Email candidate
- Analytics → Track proposal rate

---

#### 2. `application.candidate_approved`
**Trigger:** Candidate accepts opportunity and starts application  
**Payload:**
```json
{
  "application_id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "job_id": "uuid",
  "approved_at": "2025-12-22T14:15:00Z"
}
```

**Consumers:**
- Analytics → Track approval rate
- Recruiter dashboard → Update status

---

#### 3. `application.candidate_declined`
**Trigger:** Candidate declines opportunity  
**Payload:**
```json
{
  "application_id": "uuid",
  "candidate_id": "uuid",
  "candidate_name": "Jane Smith",
  "recruiter_id": "uuid",
  "recruiter_name": "John Doe",
  "recruiter_email": "john@recruiting.com",
  "job_id": "uuid",
  "job_title": "Senior Software Engineer",
  "decline_reason": "not_interested_in_role",
  "decline_note": "Looking for more senior positions",
  "declined_at": "2025-12-22T14:20:00Z"
}
```

**Consumers:**
- Notification Service → Email recruiter
- Analytics → Track decline reasons
- Automation → Flag job/candidate mismatch patterns

---

#### 4. `application.submitted_for_recruiter_review`
**Trigger:** Candidate completes application (after AI review)  
**Payload:**
```json
{
  "application_id": "uuid",
  "candidate_id": "uuid",
  "candidate_name": "Jane Smith",
  "recruiter_id": "uuid",
  "recruiter_email": "john@recruiting.com",
  "job_id": "uuid",
  "job_title": "Senior Software Engineer",
  "ai_fit_score": 85,
  "ai_recommendation": "strong_fit",
  "submitted_at": "2025-12-22T15:00:00Z"
}
```

**Consumers:**
- Notification Service → Email recruiter
- Recruiter dashboard → Add to review queue

---

## Portal Changes

### Candidate Portal (`apps/candidate`)

#### New: Pending Opportunities View (`/opportunities/pending`)

**Display:**
- List of jobs sent by recruiter(s)
- Each card shows:
  - Job title, company, location
  - Recruiter name and photo
  - Recruiter's pitch/note
  - Days since sent
  - Two buttons: "Review & Apply" | "Decline"

**Filtering:**
- By recruiter
- By date sent
- By job type/location

---

#### Enhanced: Job Detail Page (from recruiter proposal)

**Shows:**
- Full job description
- Company information
- Salary range and benefits
- Recruiter's note about why this fits
- Prominent CTA: "Apply to This Job"
- Secondary action: "Not Interested"

**Decline Flow:**
- Modal with reason dropdown
- Optional text field for details
- Confirmation: "Are you sure? This will notify your recruiter."

---

### Recruiter Portal (`apps/portal`)

#### Enhanced: Candidate Detail Page

**New Action: "Send Job Opportunity"**

**Flow:**
1. Click "Send Job Opportunity" button
2. Modal opens:
   - Search/select job from active jobs
   - Text area: "Why is this a good fit?" (optional)
   - Preview: Job title, company, salary
3. Click "Send to Candidate"
4. Success toast: "Job opportunity sent to [Candidate Name]"
5. Application appears in "Awaiting Candidate Response" section

---

#### New: Opportunity Responses Dashboard

**Tab/Section showing:**
- **Pending:** Jobs sent to candidates awaiting response
  - Days since sent
  - Reminder option (if >3 days)
- **Approved:** Candidates who accepted and completed application
  - Ready for your review
- **Declined:** Candidates who declined
  - Shows decline reason
  - Allows recruiter to send different job

---

## Notification Templates

### To Candidate: New Job Opportunity

**Subject:** `New Job Opportunity from [Recruiter Name] - [Job Title]`

**Body:**
```
Hi [Candidate Name],

[Recruiter Name] has found a great opportunity for you!

Job: [Job Title]
Company: [Company Name]
Location: [Location]
Salary: [Range]

Why [Recruiter Name] thinks you're a great fit:
"[Recruiter's pitch note]"

This role matches your skills in [key skills]. Review the full details and let us know if you'd like to apply!

[Review Job & Apply Button]  [Not Interested Button]

You have full control - you can decline this without affecting your relationship with [Recruiter Name].

Best regards,
Splits Network Team
```

---

### To Recruiter: Candidate Approved

**Subject:** `[Candidate Name] is interested in [Job Title]!`

**Body:**
```
Hi [Recruiter Name],

Great news! [Candidate Name] has accepted your job opportunity for [Job Title] at [Company Name] and completed their application.

They've uploaded:
- Resume
- [Other documents]

And answered all pre-screen questions.

The application has been analyzed by our AI (Fit Score: [Score]/100) and is now ready for your review.

[Review Application Button]

Next Steps:
1. Review their complete application
2. Conduct phone screen
3. Submit to company if approved

- Splits Network Team
```

---

### To Recruiter: Candidate Declined

**Subject:** `[Candidate Name] declined [Job Title]`

**Body:**
```
Hi [Recruiter Name],

[Candidate Name] has decided not to pursue the [Job Title] position at [Company Name].

Reason: [Decline reason]
[Optional: "Notes: [decline note]"]

This is normal - not every opportunity will be the right fit. Keep searching for roles that match their preferences!

[Send Another Job Button]  [View Candidate Profile Button]

- Splits Network Team
```

---

## Validation Rules

### Before Recruiter Can Propose Job

```typescript
// Check 1: Active relationship exists
const relationship = await getRecruiterCandidateRelationship(recruiterId, candidateId);

if (!relationship || relationship.status !== 'active') {
  return error(403, "No active relationship with this candidate.");
}

// Check 2: Candidate has given consent
if (!relationship.consent_given) {
  return error(403, "Candidate has not accepted your representation agreement.");
}

// Check 3: Relationship not expired
if (new Date(relationship.relationship_end_date) < new Date()) {
  return error(403, "Relationship has expired. Request renewal first.");
}

// Check 4: No existing application for this job (prevent duplicates)
const existingApplication = await getApplicationByJobAndCandidate(jobId, candidateId);
if (existingApplication && existingApplication.stage !== 'rejected') {
  return error(409, "Candidate already has an active application for this job.");
}

// Proceed with proposal
```

---

### Before Candidate Can Approve

```typescript
// Check 1: Application is in recruiter_proposed stage
if (application.stage !== 'recruiter_proposed') {
  return error(400, "This application cannot be modified at this stage.");
}

// Check 2: User is the candidate for this application
if (application.candidate_id !== userId) {
  return error(403, "You can only respond to opportunities sent to you.");
}

// Check 3: Job is still active
const job = await getJob(application.job_id);
if (job.status !== 'active') {
  return error(400, "This job is no longer accepting applications.");
}

// Proceed with approval → draft stage
```

---

## Analytics & Reporting

### Key Metrics to Track

1. **Proposal Rate:** Jobs sent per recruiter per month
2. **Approval Rate:** % of proposals approved by candidates
3. **Decline Reasons:** Categorized breakdown
4. **Time to Response:** How long candidates take to respond
5. **Conversion Rate:** Proposals → Applications → Hires
6. **Mismatch Patterns:** Recruiters sending wrong opportunities

### Recruiter Dashboard Stats

**Show per recruiter:**
- Jobs sent this month
- Approval rate (%)
- Average time to candidate response
- Top decline reasons (to improve targeting)

---

## Documentation Updates Required

### 1. Update: `docs/business-logic/direct-vs-represented-candidates.md`

**Section: "Represented Candidate Application Flow"**

Replace with new two-phase flow:
1. **Phase 1:** Recruiter proposes job → Candidate approves/declines
2. **Phase 2:** Candidate completes application → Recruiter screens → Submits to company

**Clarify:**
- Right to Represent ≠ blanket authority to submit
- Candidate must approve each specific opportunity
- Candidate provides job-specific materials

---

### 2. Update: `apps/candidate/invitation/[token]/invitation-client.tsx`

**Right to Represent Agreement Text:**

**Current (implied):**
> "By accepting, you give [Recruiter] permission to submit your profile to employers."

**Updated (more accurate):**
> "By accepting, you give [Recruiter] permission to **propose job opportunities** to you. You'll review each opportunity and decide whether to apply. [Recruiter] will enhance and submit applications you approve."

**Key additions to agreement display:**
- ✅ Recruiter can send you job opportunities
- ✅ You review and approve each one individually
- ✅ You provide application materials for approved jobs
- ✅ Recruiter enhances and advocates for you
- ✅ You can decline opportunities without ending relationship

---

### 3. Create: `docs/implementation-plans/recruiter-submission-flow-implementation.md`

**Include:**
- API endpoints needed
- Database migration (add `recruiter_proposed` stage to enum)
- Portal UI changes (candidate and recruiter)
- Event system updates
- Notification templates
- Testing strategy

---

### 4. Update: `docs/implementation/02-api-contracts.md`

**Add new endpoints:**
- `POST /api/applications/recruiter-propose` - Recruiter sends job
- `POST /api/applications/:id/candidate-approve` - Candidate accepts
- `POST /api/applications/:id/candidate-decline` - Candidate rejects
- `GET /api/candidates/me/pending-opportunities` - List for candidate
- `GET /api/recruiters/me/proposed-jobs` - List for recruiter

---

### 5. Update: `docs/guidance/user-roles-and-permissions.md`

**Add permissions:**
- Recruiter: Can propose jobs to represented candidates
- Candidate: Can approve/decline proposed opportunities
- Candidate: Can complete applications for approved opportunities

---

## Legal & Compliance Benefits

### Why This Flow is Better

1. **Explicit Consent:** Candidate explicitly approves each submission
2. **EEOC Compliance:** Clear record of candidate knowingly applying
3. **Candidate Rights:** Preserves autonomy even with representation
4. **Dispute Prevention:** Audit trail shows candidate approved each job
5. **Quality Control:** Candidate provides relevant materials per job
6. **Trust Building:** Candidates trust recruiters who respect their agency

### Audit Trail for Compliance

**For any application, we can prove:**
1. When recruiter proposed job (timestamp, recruiter identity)
2. When candidate approved (timestamp, IP address, user agent)
3. What materials candidate provided (documents, answers)
4. When recruiter submitted to company (timestamp)
5. All stage transitions with actors and timestamps

**Query example:**
```sql
SELECT 
    action,
    performed_by_user_id,
    performed_by_role,
    timestamp,
    new_value
FROM ats.application_audit_log
WHERE application_id = '[uuid]'
ORDER BY timestamp ASC;
```

---

## Migration Strategy

### Phase 1: Database Changes
1. Add `recruiter_proposed` to application stage enum
2. Update audit log to include new action types
3. Test in staging environment

### Phase 2: Backend Implementation
1. New API endpoints for propose/approve/decline
2. Event publishers for new events
3. Service layer logic for stage transitions
4. Validation rules enforcement

### Phase 3: Frontend Implementation
1. Candidate portal: Pending opportunities view
2. Recruiter portal: Send job action & responses dashboard
3. Notification templates
4. Testing with real recruiter-candidate pairs

### Phase 4: Documentation & Training
1. Update all docs (listed above)
2. In-app help text
3. Recruiter training materials
4. Candidate FAQs

### Phase 5: Rollout
1. Soft launch with beta recruiters
2. Gather feedback
3. Iterate on UX
4. Full rollout

---

## Success Criteria

**This flow is successful when:**
1. ✅ 70%+ approval rate on recruiter proposals (good targeting)
2. ✅ Candidates respond within 48 hours on average
3. ✅ Zero compliance issues related to candidate consent
4. ✅ Application quality scores higher (tailored materials)
5. ✅ Candidate satisfaction surveys show high agency/control
6. ✅ Recruiters understand and use flow correctly
7. ✅ Clear audit trail for all applications

---

## Future Enhancements

### Phase 2 (Post-MVP)
- **Batch Proposals:** Recruiter sends multiple jobs at once
- **Candidate Preferences:** Set criteria for auto-decline/auto-approve
- **Smart Matching:** AI suggests jobs to send based on candidate profile
- **Proposal Templates:** Save common pitches for reuse
- **Video Pitches:** Recruiter records video about why job is good fit
- **Expiration:** Auto-decline proposals after X days of inactivity

---

## Appendix: Comparison to Current Flow

### Current Documented Flow (Problematic)
```
Recruiter → Creates draft → Submits for AI review → Screens → Submits to company
                ↑
          Candidate has no input until after submission
```

**Problems:**
- Candidate can't decline specific opportunities
- Candidate doesn't provide job-specific materials
- Lower application quality
- Compliance concerns

---

### New Flow (This Document)
```
Recruiter → Proposes job → Candidate reviews → Approves/Declines
                                                      ↓
                                          If approved: Complete application
                                                      ↓
                                          AI review → Recruiter screens → Submit to company
```

**Benefits:**
- ✅ Candidate agency preserved
- ✅ Job-specific materials collected
- ✅ Higher quality applications
- ✅ Compliance-ready audit trail
- ✅ Partnership model, not proxy model

---

**END OF DOCUMENT**
