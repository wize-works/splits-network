# Direct vs Represented Candidates - Business Logic

**Document:** Direct vs Represented Candidate Application Flows  
**Created:** December 20, 2025  
**Status:** Core Business Logic - Phase 1  
**Priority:** Critical - Foundational to platform

---

## Overview

The Splits Network supports **two types of candidates** based on their representation status. This distinction affects application workflows, permissions, fees, and platform economics.

---

## Candidate Types

### 1. Direct Candidate

**Definition:** A candidate who applies to jobs themselves without recruiter representation.

**Characteristics:**
- ✅ No active recruiter relationship
- ✅ Creates own applications via candidate portal
- ✅ Manages own job search
- ✅ No placement fee for companies
- ✅ Platform may charge nominal candidate fee or company posting fee

**Database State:**
- No record in `network.recruiter_candidates` with `status = 'active'`
- Applications have `recruiter_id = NULL`
- Applications have `application_source = 'direct'`

**Use Cases:**
- Passive job seekers browsing open positions
- Candidates who prefer to manage their own search
- Entry-level candidates without recruiter connections
- Candidates between recruiter relationships (expired agreements)

---

### 2. Represented Candidate

**Definition:** A candidate with an active, exclusive recruiter relationship who has signed a "Right to Represent" agreement.

**Characteristics:**
- ✅ Has active recruiter relationship (12-month exclusive)
- ✅ Recruiter submits applications on their behalf
- ✅ Explicit consent given (`consent_given = true`)
- ✅ Placement fee applies on successful hire
- ✅ Professional representation and advocacy

**Database State:**
- Active record in `network.recruiter_candidates`:
  - `status = 'active'`
  - `consent_given = true`
  - `relationship_end_date` > current date
- Applications have `recruiter_id = [recruiter's ID]`
- Applications have `application_source = 'recruiter'`

**Use Cases:**
- Passive candidates sourced by recruiters
- Senior-level candidates seeking expert representation
- Candidates wanting access to hidden/exclusive opportunities
- Candidates preferring recruiter to handle negotiations

---

## Application Workflows

### Direct Candidate Application Flow

```
1. Candidate browses jobs (candidate portal)
2. Candidate clicks "Apply"
3. Candidate fills out application form (draft stage)
4. Candidate submits application
   ↓
5. AI Review (automatic, < 30 seconds)
   - AI analyzes resume vs job description
   - Generates fit score (0-100)
   - Identifies strengths and concerns
   - Provides recommendation
   - Candidate notified with AI insights
   ↓
6. Application submitted to company (submitted stage)
7. Company reviews application + AI insights
8. Company conducts interviews (interview stage)
9. Company makes offer (offer stage)
   ↓
10. If hired: No placement fee to recruiter
```

**Application Stages:**
- `draft` → `ai_review` → `submitted` → `interview` → `offer` → `hired`/`rejected`/`withdrawn`

**Key Points:**
- Candidate has full control
- No recruiter intermediary
- No representation agreement needed
- **AI provides immediate fit assessment** (advisory, non-blocking)
- Company receives application with AI insights
- Platform may charge small platform fee to candidate or company

**Portal:** `apps/candidate` (Candidate Portal)

**API Endpoint:** `POST /api/applications` (with `application_source: 'direct'`)

**See Implementation:** `docs/implementation-plans/ai-assisted-application-flow.md`

---

### Represented Candidate Application Flow

```
1. Recruiter has candidate in their network (active relationship)
2. Recruiter finds suitable job
3. Recruiter creates draft application (recruiter portal)
4. Recruiter adds insights/notes about candidate
5. Recruiter submits draft for AI review
   ↓
6. AI Review (automatic, < 30 seconds)
   - AI analyzes candidate fit for role
   - Generates fit score and insights
   - Both recruiter and candidate notified
   ↓
7. Recruiter conducts phone screen (screen stage)
   - Reviews AI insights before screen
   - Validates candidate interest
   - Assesses communication and fit
   - Makes decision: Submit to company or decline
   ↓
8a. Recruiter approves → Application submitted to company (submitted stage)
    - Company reviews application + recruiter insights + AI analysis
    - Company conducts interviews (interview stage)
    - Company makes offer (offer stage)
    ↓
    If hired: Placement fee paid to recruiter

8b. Recruiter declines → Application rejected
    - Candidate notified with feedback
    - Application not submitted to company
```

**Application Stages:**
- `draft` → `ai_review` → `screen` → `submitted` → `interview` → `offer` → `hired`/`rejected`/`withdrawn`

**Key Points:**
- Recruiter acts as advocate with AI-powered insights
- **AI review happens BEFORE recruiter screen** to inform decision
- Professional vetting enhanced by AI analysis
- Recruiter makes final decision on whether to submit
- Recruiter insights + AI insights add value for companies
- Placement fee justified by recruiter's work
- Candidate must have given explicit consent

**Portal:** `apps/portal` (Recruiter Portal)

**API Endpoint:** `POST /api/applications` (with `application_source: 'recruiter'`)

**See Implementation:** `docs/implementation-plans/ai-assisted-application-flow.md`

---

## AI-Assisted Application Screening

**Introduced:** Phase 1.5 (Q1 2026)  
**Mode:** Advisory (non-blocking)  
**Purpose:** Evaluate candidate-job fit automatically to assist recruiters and companies

### How AI Review Works

When an application is submitted (either by candidate or recruiter), it automatically enters the `ai_review` stage where:

1. **AI analyzes:**
   - Resume/CV content vs job description
   - Skills match (required and preferred)
   - Experience level alignment
   - Location compatibility
   - Overall candidate-job fit

2. **AI generates:**
   - Fit Grade (A-F)
   - Fit score (0-100)
   - Recommendation (strong/good/fair/poor fit)
   - Strengths (3-5 key matching points)
   - Concerns (0-3 potential issues)
   - Skills match breakdown (matched vs missing)

3. **AI notifies:**
   - Candidate: Basic fit feedback and confirmation
   - Recruiter (if represented): Detailed insights before screen
   - Company (when submitted): Full analysis with application

### Advisory Mode (Default)

**Current implementation:**
- AI provides insights but does NOT block applications
- All applications proceed to next stage regardless of score
- Human decision-makers (recruiters/companies) have final say
- Transparent scoring visible to all parties

**Why advisory?**
- Avoids AI false negatives blocking good candidates
- Maintains human oversight and judgment
- Builds trust in AI system before introducing gatekeeping
- Complies with fair hiring practices

### Future: Gatekeeper Mode (Paid Feature)

**Planned for Phase 3 (Q3 2026):**
- Companies can opt-in to auto-reject applications below threshold
- Requires paid feature upgrade per job posting
- Minimum score set by company (e.g., 60/100)
- Rejected candidates notified with basic feedback
- Companies can review auto-rejected candidates if desired

**See full details:** `docs/implementation-plans/ai-assisted-application-flow.md`

---

## Prerequisite: Right to Represent Agreement

### For Represented Candidates Only

Before a recruiter can submit applications for a candidate, an **exclusive 12-month agreement** must exist:

**Agreement Process:**
1. Recruiter invites candidate (`network.recruiter_candidates` created)
2. Invitation email sent with magic link token
3. Candidate clicks link, reviews agreement terms
4. Candidate explicitly accepts (`consent_given = true`)
5. Relationship becomes active for 12 months

**Agreement Terms Include:**
- Exclusive representation for specific roles
- Authorization to submit profile to employers
- No duplicate submissions (candidate can't apply directly to same jobs)
- Recruiter commission structure
- Confidentiality and communication expectations
- Right to decline any opportunity

**See:** `apps/candidate/src/app/(authenticated)/invitation/[token]/invitation-client.tsx`

---

## Permissions & Access Control

### Direct Candidates Can:
- ✅ Browse all open jobs
- ✅ Apply to any job directly
- ✅ Manage their own applications
- ✅ Communicate directly with companies
- ✅ Accept offers directly

### Direct Candidates Cannot:
- ❌ Have recruiter submit for them (no relationship)
- ❌ Access recruiter portal
- ❌ See recruiter-exclusive jobs (if any)

---

### Represented Candidates Can:
- ✅ View their applications (submitted by recruiter)
- ✅ Accept/decline interview invitations
- ✅ Track application progress
- ✅ Communicate with recruiter about opportunities
- ✅ Accept offers (with recruiter guidance)

### Represented Candidates Cannot:
- ❌ Apply directly to jobs during active relationship (per agreement)
- ❌ Submit duplicate applications themselves
- ❌ Bypass their recruiter for roles they've been submitted to
- ❌ Work with multiple recruiters simultaneously (exclusive relationship)

---

### Recruiters Can (For Their Represented Candidates):
- ✅ View candidates they have active relationships with
- ✅ Create draft applications
- ✅ Submit applications on candidate's behalf
- ✅ Add recruiter notes and insights
- ✅ Track application status
- ✅ Communicate with companies about their candidates
- ✅ Manage application stage transitions

### Recruiters Cannot:
- ❌ Submit candidates without active consent
- ❌ Submit candidates they don't represent (no relationship)
- ❌ Apply to their own posted jobs (conflict of interest)
- ❌ See or modify direct candidate applications

---

## Fee Structure

**Important:** The placement fee is **ALWAYS set by the employer on the job posting** (e.g., 20% of first-year salary). The fee exists regardless of application type. The difference is **who receives the fee split**.

### Direct Applications
```
Company posts job (with 20% placement fee) → Direct candidate applies → Hired
                                                                          ↓
                                            Company pays placement fee (20% of salary)
                                                                          ↓
                                            Fee split: Platform + Sourcer
```

**Fee Distribution:**
- **Platform:** 50-70% (for providing marketplace)
- **Sourcer:** 10% (recruiter/user who originally sourced this candidate to platform)
- **Candidate's recruiter:** N/A (no active representation)

**Example:** 
- Job: $100k salary with 20% placement fee = $20,000
- Platform gets: $18,000 (90%)
- Sourcer gets: $2,000 (10%)

**Key Point:** Company pays the SAME fee, but since no recruiter is actively representing the candidate, the fee goes to platform + original sourcer instead.

---

### Represented Applications
```
Company posts job (with 20% placement fee) → Recruiter submits candidate → Hired
                                                                             ↓
                                            Company pays placement fee (20% of salary)
                                                                             ↓
                                            Fee split: Recruiter + Platform + Sourcer
```

**Fee Distribution:**
- **Candidate's Recruiter:** 40-60% (for active representation and placement) (percentage varies based on subscription tier)
- **Platform:** 30-50% (for providing marketplace)
- **Sourcer:** 10% (may be same or different recruiter who sourced candidate)

**Example:**
- Job: $100k salary with 20% placement fee = $20,000
- Candidate's Recruiter gets: $12,000 (60%)
- Platform gets: $6,000 (30%)
- Sourcer gets: $2,000 (10%)

**Key Point:** Recruiter gets majority of fee because they actively managed candidate relationship, submitted application, and guided placement.

---

### Important Distinctions

**The placement fee is NOT optional** - it's always charged by the employer.

**What changes:**
- **Direct:** Fee split between platform and sourcer (no active recruiter)
- **Represented:** Fee split between recruiter, platform, and sourcer (active recruiter relationship)

**Tracked in:** `billing.placements` table with fee calculations and splits

---

## State Transitions

### Direct Candidate → Represented Candidate

**Scenario:** A direct candidate is recruited and agrees to representation.

**Process:**
1. Recruiter invites candidate
2. Candidate accepts relationship
3. Candidate becomes represented
4. Future applications must go through recruiter
5. Existing direct applications unaffected (grandfathered)

**Database:**
- `network.recruiter_candidates` record created with `status = 'active'`
- Future applications will have `recruiter_id` populated

---

### Represented Candidate → Direct Candidate

**Scenario:** Recruiter relationship expires or is terminated.

**Process:**
1. 12-month period ends (or early termination)
2. `network.recruiter_candidates.status` → `'expired'` or `'terminated'`
3. Candidate can now apply directly again
4. Historical recruiter applications remain attributed to recruiter

**Database:**
- `network.recruiter_candidates.status` updated
- Candidate can create new applications with `recruiter_id = NULL`

---

## Database Schema

### Applications Table (`ats.applications`)

**Key Fields:**
```sql
recruiter_id UUID NULL  -- NULL for direct, populated for represented
application_source VARCHAR(50) -- 'direct' or 'recruiter'
candidate_id UUID NOT NULL
job_id UUID NOT NULL
stage VARCHAR(50) -- draft, ai_review, screen, submitted, interview, offer, hired, rejected, withdrawn
recruiter_notes TEXT -- Only for represented applications
```

**Business Rules:**
- If `recruiter_id` is NULL → must be `application_source = 'direct'`
- If `recruiter_id` is populated → must be `application_source = 'recruiter'`
- `recruiter_notes` only relevant for represented applications

**See:** `infra/migrations/014_make_recruiter_id_nullable.sql`

---

### Recruiter-Candidate Relationships (`network.recruiter_candidates`)

**Key Fields:**
```sql
recruiter_id UUID NOT NULL
candidate_id UUID NOT NULL
status VARCHAR(50) -- 'active', 'expired', 'terminated'
consent_given BOOLEAN -- Must be true for representation
relationship_start_date TIMESTAMPTZ
relationship_end_date TIMESTAMPTZ -- 12 months from start
```

**Constraint:**
- `UNIQUE(candidate_id) WHERE status = 'active'`
- Ensures only ONE active recruiter per candidate

**See:** `infra/migrations/015_enforce_single_active_recruiter.sql`

---

## User Interfaces

### Candidate Portal (`apps/candidate`)

**For Direct Candidates:**
- Browse jobs page
- "Apply Now" button
- Application form
- My Applications dashboard
- Application status tracking

**For Represented Candidates:**
- View applications submitted by recruiter
- Accept/decline interviews
- Track progress
- Message recruiter about opportunities
- Cannot apply directly (message: "Your recruiter manages applications")

---

### Recruiter Portal (`apps/portal`)

**For Recruiters:**
- My Candidates list (only those with active relationships)
- Candidate detail pages
- "Submit to Job" action
- Draft application workflow
- Application management dashboard
- Stage progression tools

**Cannot see:**
- Direct candidate applications
- Candidates without consent
- Other recruiters' candidates

---

## Validation Rules

### Before Creating Direct Application

```typescript
// Check: Does candidate have active recruiter?
const hasActiveRecruiter = await checkActiveRecruiterRelationship(candidateId);

if (hasActiveRecruiter) {
  return error(403, "You have an active recruiter relationship. " +
    "Your recruiter must submit applications on your behalf. " +
    "Contact your recruiter or cancel the relationship first.");
}

// Proceed with direct application
```

---

### Before Recruiter Submits Application

```typescript
// Check 1: Active relationship exists
const relationship = await getRecruiterCandidateRelationship(recruiterId, candidateId);

if (!relationship || relationship.status !== 'active') {
  return error(403, "No active relationship with this candidate.");
}

// Check 2: Candidate has given consent
if (!relationship.consent_given) {
  return error(403, "Candidate has not accepted your representation agreement. " +
    "Resend invitation or wait for candidate acceptance.");
}

// Check 3: Relationship not expired
if (new Date(relationship.relationship_end_date) < new Date()) {
  return error(403, "Relationship has expired. Renew relationship first.");
}

// Proceed with recruiter application
```

---

## Business Scenarios

### Scenario 1: Career Switcher (Direct)
**Jane** is switching from marketing to software engineering. She browses the job board, finds entry-level roles, and applies directly. No recruiter relationship needed.

**Flow:** Direct candidate → Self-application → Hired → Placement fee split between platform + sourcer (Jane's original sourcer to platform)

---

### Scenario 2: Senior Engineer (Represented)
**Bob** is a senior engineer passively open to opportunities. Recruiter Alice sources him, sends agreement, Bob accepts. Alice submits Bob to several senior roles with detailed insights.

**Flow:** Represented candidate → Recruiter submits → Hired → Placement fee

---

### Scenario 3: Relationship Expiration
**Tom** had a recruiter relationship with Mike for 12 months. Relationship expires. Tom is now a direct candidate again and applies himself to new jobs.

**Flow:** Represented → Expired → Direct candidate

---

### Scenario 4: Mid-Search Recruitment
**Sarah** is applying directly to jobs. Recruiter Emily reaches out, offers representation. Sarah accepts. Sarah's future applications must now go through Emily (existing applications unaffected).

**Flow:** Direct → Accepts representation → Represented

---

## Analytics & Metrics

### Track Separately:
- **Direct application conversion rate** - % hired from direct applications
- **Represented application conversion rate** - % hired from recruiter submissions
- **Average time to hire** (direct vs represented)
- **Quality of hire scores** (direct vs represented)
- **Total placement fee revenue** (all placements)
- **Platform share of fees** (higher % on direct, lower % on represented)
- **Recruiter earnings** (represented only)
- **Sourcer earnings** (all placements where they sourced candidate)

### Hypothesis to Test:
- Do represented candidates have higher conversion rates?
- Are represented candidates placed faster?
- Do companies prefer one type over another?
- What's the optimal mix for platform health?

---

## API Endpoints

### Direct Candidates
```
POST /api/applications (application_source: 'direct', recruiter_id: null)
GET /api/candidates/me/applications
PATCH /api/applications/:id/accept-interview
```

### Recruiters (For Represented Candidates)
```
GET /api/recruiter-candidates/me (list candidates)
POST /api/applications (application_source: 'recruiter', recruiter_id: [id])
GET /api/applications?recruiter_id=[id]
PATCH /api/applications/:id/stage (advance application)
```

---

## Related Documentation

- [Recruiter Application Management Flow](../application-flow/recruiter-application-management-flow.md) - Represented candidate flow
- [Recruiter-to-Recruiter Collaboration](./recruiter-to-recruiter-collaboration.md) - Phase 2 splits
- [User Roles and Permissions](../guidance/user-roles-and-permissions.md) - RBAC
- [Candidate Recruiter Relationships](../implementation/candidate-recruiter-relationships.md) - Agreement process

---

## Implementation Checklist

### ✅ Database Schema
- [x] `recruiter_id` nullable in applications
- [x] `application_source` field added
- [x] Single active recruiter constraint
- [x] Relationship table with consent tracking

### ✅ Backend Logic
- [x] Permission checks for application creation
- [x] Relationship validation
- [x] Consent verification

### 🔄 Frontend (In Progress)
- [ ] Candidate portal: direct application flow
- [ ] Recruiter portal: represented candidate submission
- [ ] Proper permission messaging
- [ ] Relationship status indicators

### ❌ Missing
- [ ] Transition workflows (direct ↔ represented)
- [ ] Clear error messages when wrong user tries wrong action
- [ ] Analytics tracking for both types
- [ ] Fee calculation for represented applications

---

**Summary:** Direct and represented candidates are the core of the platform's dual business model. Direct applications provide volume and accessibility; represented applications provide quality and revenue. Both are essential to platform success.
