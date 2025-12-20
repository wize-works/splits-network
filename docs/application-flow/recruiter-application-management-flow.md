# Recruiter Application Management Flow - Analysis & Action Plan

**Document:** Recruiter Application Management Flow  
**Created:** December 19, 2025  
**Status:** Analysis Complete - Implementation Required  
**Scope:** Represented Candidate Applications (recruiter-submitted)

---

## Document Scope

**This document focuses exclusively on represented candidate applications** - where a recruiter has an active relationship with a candidate and submits applications on their behalf.

**Related Documentation:**
- [Direct vs Represented Candidates](../business-logic/direct-vs-represented-candidates.md) - Understanding both application types and fee structures
- [Recruiter-to-Recruiter Collaboration](../business-logic/recruiter-to-recruiter-collaboration.md) - Phase 2 proposals system for split placements

---

## Executive Summary

This document analyzes the current application management flow for **recruiters managing represented candidates** and identifies gaps in the user experience when managing candidate applications.

### Important Context: Recruiter-Candidate Relationships

**Before applications happen**, there must be a **recruiter-candidate relationship** established:

1. **Recruiter invites candidate** (creates `network.recruiter_candidates` record)
2. **Candidate reviews "Right to Represent" agreement** via invitation link
3. **Candidate explicitly consents** (`consent_given: true`)
4. **12-month exclusive relationship** is established

**Critical Business Rule: ONE ACTIVE RECRUITER PER CANDIDATE**
- A candidate can only have **ONE active recruiter relationship** at any given time
- Each relationship is a 12-month exclusive period
- After expiration, candidate may choose a different recruiter for the next 12-month period
- All historical relationships are preserved for financial attribution and tracking
- This is enforced by database constraint: `UNIQUE(candidate_id) WHERE status='active'`
5. **Now candidate can apply to jobs** with that recruiter's representation

This foundational agreement is tracked in `network.recruiter_candidates` and includes:
- Authorization for recruiter to submit candidate to employers
- Exclusive representation period (12 months)
- Protection against duplicate submissions
- Fee entitlement for successful placements

**Note:** The **Proposals system** (Phase 2) is a separate workflow for recruiter-to-recruiter collaboration on split placements. When a company-side recruiter wants to work with a candidate who already has their own recruiter, they propose collaboration and negotiate fee splits. See [Recruiter-to-Recruiter Collaboration](../business-logic/recruiter-to-recruiter-collaboration.md) for full details. This document focuses on direct candidate→recruiter→company flow only.

### Current Problem

**Context:** This analysis addresses represented candidate applications where the recruiter submits on behalf of candidates they represent. Direct candidate applications (self-submitted, no recruiter) follow a different flow in the candidate portal.

When a recruiter views a candidate's details page (where an active relationship already exists), they can see all applications for that candidate. However, clicking on an application redirects to the role/job page instead of an application management page. This leaves recruiters without a dedicated interface to:
- View application details
- Update application stage
- Add/edit notes
- Manage the application lifecycle
- Track application history

---

## Current State Analysis

### What Exists

#### 1. Candidate Details Page
**Location:** [`apps/portal/src/app/(authenticated)/candidates/[id]/candidate-detail-client.tsx`](../../apps/portal/src/app/(authenticated)/candidates/[id]/candidate-detail-client.tsx)

**Current Behavior:**
- Displays list of all applications for a candidate
- Shows application stage, job title, timestamps
- Clicking application link → redirects to `/roles/${application.job_id}` (the job page)
- **Gap:** No direct link to manage the specific application

**Code Reference (Lines 420-429):**
```tsx
<Link
    href={`/roles/${application.job_id}`}
    className="btn btn-sm btn-ghost"
>
    <i className="fa-solid fa-arrow-right"></i>
</Link>
```

#### 2. Application Review Flow (Screen Stage)
**Location:** [`apps/portal/src/app/(authenticated)/applications/[id]/review/`](../../apps/portal/src/app/(authenticated)/applications/[id]/review/)

**Current Capabilities:**
- ✅ Reviews applications in 'screen' stage
- ✅ Allows recruiter to add notes
- ✅ Submits application to company
- **Limitation:** Only works for `stage='screen'` - no management for other stages

#### 3. Applications List Page
**Location:** [`apps/portal/src/app/(authenticated)/applications/`](../../apps/portal/src/app/(authenticated)/applications/)

**Current Capabilities:**
- ✅ Lists all applications for recruiter
- ✅ Filters by stage
- ✅ "View Details" button exists but...
- **Gap:** No dedicated application detail page exists for this link!

**Code Reference (applications-list-client.tsx, Line 333):**
```tsx
<Link
    href={`/applications/${application.id}`}
    className="btn btn-primary btn-sm gap-2"
>
    View Details
    <i className="fa-solid fa-arrow-right"></i>
</Link>
```

**Issue:** This link points to `/applications/[id]` but that page **doesn't exist** in the portal!

#### 4. Backend API Support
**Location:** `services/ats-service/src/` and `services/api-gateway/src/`

**Available Endpoints:**
- ✅ `GET /api/applications/:id` - Get application details
- ✅ `PATCH /api/applications/:id/stage` - Update stage
- ✅ `POST /api/applications/:id/recruiter-submit` - Submit to company
- ✅ Full audit logging support
- ✅ Event publishing for notifications

**Code Reference:**
```typescript
// api-client.ts
async updateApplicationStage(id: string, stage: string, notes?: string) {
    return this.request(`/applications/${id}/stage`, {
        method: 'PATCH',
        body: JSON.stringify({ stage, notes }),
    });
}
```

---

## What's Missing

### Critical Gaps

#### 1. **Application Detail Page for Recruiters** ⚠️ HIGH PRIORITY
**Path:** `/applications/[id]/page.tsx` **DOES NOT EXIST**

This is the main issue. The portal has:
- `/applications` - list view ✅
- `/applications/[id]/review` - review form for screen stage ✅
- `/applications/[id]` - **MISSING** ❌

This page should provide:
- Complete application overview
- Candidate information
- Job details
- Application history/timeline
- Current stage
- Notes (candidate + recruiter)
- Documents
- Actions: Update stage, Add notes, View candidate, View job

#### 2. **Stage Management Interface**
Currently only available in the job pipeline view ([`roles/[id]/components/candidate-pipeline.tsx`](../../apps/portal/src/app/(authenticated)/roles/[id]/components/candidate-pipeline.tsx)), but not from:
- Candidate details page
- Applications list page
- Individual application view

#### 3. **Application Actions from Candidate Details**
The button on the candidate details page should allow the recruiter to:
- Go directly to application management
- Update stage without navigating to role page
- Quick actions (reject, move to interview, etc.)

---

## User Flows - Current vs. Desired

### Complete Flow (Including Relationship Establishment)
```
PHASE 1: Establish Relationship
Recruiter Dashboard
  → Candidates → Add New Candidate
    → Send Invitation
      → Candidate receives email
        → Candidate signs in
          → Reviews "Right to Represent" Agreement
            → Accepts Invitation ✅
              → 12-month relationship established
              → Recruiter can now represent this candidate

PHASE 2: Candidate Applies to Jobs
Candidate Portal
  → Browse Jobs
    → Apply to Job
      → Application created
        → Goes to Recruiter for review (stage: 'screen')
          → Recruiter reviews and enhances
            → Submits to Company (stage: 'submitted')

PHASE 3: Recruiter Manages Application (CURRENT GAP)
Recruiter Dashboard
  → Candidates
    → Click Candidate (with active relationship)
      → Candidate Details Page
        → See Applications List
          → Click Application 🔴
            → Redirects to Role/Job Page ❌
            → Must find candidate in pipeline ❌
            → Manage from there ❌
```

### Desired Flow (Fixed)
```
PHASE 3 (Fixed): Recruiter Manages Application
Recruiter Dashboard
  → Candidates
    → Click Candidate
      → Candidate Details Page
        → See Applications List
          → Click "Manage Application" ✅
            → Application Detail Page ✅
              → View all details ✅
              → View relationship status ✅
              → Update stage ✅
              → Add notes ✅
              → Quick actions ✅
```

### Alternative Entry Points
```
1. From Applications List:
   Applications → Click "View Details" → Application Detail Page ✅

2. From Role Pipeline:
   Roles → Select Role → Pipeline → Click Candidate → Application Detail Page ✅

3. From Dashboard:
   Recent Activity → Click Application → Application Detail Page ✅
```

---

## Implementation Plan

### Phase 1: Create Application Detail Page (CRITICAL)

#### Task 1.1: Create Base Page Structure
**File:** `apps/portal/src/app/(authenticated)/applications/[id]/page.tsx`

**Requirements:**
- Server component for data fetching
- Fetch application with full details (candidate, job, documents, recruiter)
- Permission check: recruiter owns application
- Pass data to client component

**Estimated Time:** 2 hours

#### Task 1.2: Create Client Component
**File:** `apps/portal/src/app/(authenticated)/applications/[id]/application-detail-client.tsx`

**Sections:**
1. **Header**
   - Application ID
   - Current stage badge
   - Last updated timestamp
   - Breadcrumbs (Dashboard > Applications > Detail)

2. **Quick Actions Bar**
   - Update Stage (dropdown + modal)
   - Add Note
   - View Candidate Profile
   - View Job Details
   - Quick stage buttons (Interview, Offer, Reject)

3. **Main Content (3-column layout)**
   
   **Left Column (2/3 width):**
   - Application Timeline
     - All stage changes
     - Notes added
     - Documents uploaded
     - Activity log
   
   - Job Details Card
     - Title, company, location
     - Salary range
     - Description (collapsed)
     - Link to full job posting
   
   - Candidate Information Card
     - Name, email, phone
     - Current title/company
     - LinkedIn
     - Link to candidate profile
   
   - Notes Section
     - Candidate's application notes
     - Recruiter's notes (editable)
   
   **Right Column (1/3 width):**
   - Status Card
     - Current stage
     - Stage history
     - Key dates
   
   - Documents Card
     - List of attached documents
     - Download links
     - Document preview
   
   - Actions Card
     - Stage transition buttons
     - Quick reject
     - Archive
   
   - Pre-Screen Answers Card (if applicable)
     - Questions and answers

**Estimated Time:** 6 hours

#### Task 1.3: Implement Stage Update Functionality
**Component:** Stage Update Modal/Dropdown

**Features:**
- Stage selection dropdown
- Conditional fields based on stage:
  - Interview → Schedule date/time
  - Offer → Offer amount
  - Reject → Rejection reason
  - Hired → Start date, salary
- Notes field (optional)
- Confirmation dialog
- Optimistic UI update
- Error handling
- Toast notifications

**API Calls:**
```typescript
await apiClient.updateApplicationStage(
  applicationId,
  newStage,
  notes
);
```

**Estimated Time:** 4 hours

---

### Phase 2: Update Candidate Details Page Links

#### Task 2.1: Change Application Link Destination
**File:** `apps/portal/src/app/(authenticated)/candidates/[id]/candidate-detail-client.tsx`

**Change:** Line ~428
```tsx
// BEFORE
<Link href={`/roles/${application.job_id}`}>
  <i className="fa-solid fa-arrow-right"></i>
</Link>

// AFTER
<Link
  href={`/applications/${application.id}`}
  className="btn btn-sm btn-primary"
>
  <i className="fa-solid fa-pen-to-square"></i>
  Manage
</Link>
```

**Additional Enhancement:** Add secondary button to view role
```tsx
<div className="flex gap-2">
  <Link
    href={`/applications/${application.id}`}
    className="btn btn-sm btn-primary"
  >
    <i className="fa-solid fa-pen-to-square"></i>
    Manage
  </Link>
  <Link
    href={`/roles/${application.job_id}`}
    className="btn btn-sm btn-ghost"
  >
    <i className="fa-solid fa-briefcase"></i>
    View Role
  </Link>
</div>
```

**Estimated Time:** 1 hour

---

### Phase 3: Enhance Application Actions

#### Task 3.1: Quick Actions Component
**File:** `apps/portal/src/components/application-quick-actions.tsx`

Reusable component for common application actions:
- Move to Interview
- Send Offer
- Mark as Hired
- Reject
- Add Note

Can be used in:
- Application detail page
- Candidate details page
- Applications list
- Role pipeline

**Estimated Time:** 3 hours

#### Task 3.2: Stage Transition Wizard
**File:** `apps/portal/src/components/stage-transition-wizard.tsx`

Multi-step modal for stage changes:
1. Select new stage
2. Add required info (dates, amounts, reasons)
3. Add optional notes
4. Confirm and submit

**Estimated Time:** 4 hours

---

### Phase 4: Additional Enhancements (Optional)

#### Task 4.1: Bulk Actions
- Select multiple applications
- Apply stage change to all
- Useful in applications list view

**Estimated Time:** 3 hours

#### Task 4.2: Application Templates
- Save common notes as templates
- Quick apply to similar applications
- Rejection reason templates

**Estimated Time:** 2 hours

#### Task 4.3: Activity Feed
- Real-time updates
- Email notifications sent
- Stage changes by other users
- Document uploads

**Estimated Time:** 4 hours

---

## Technical Specifications

### Data Model
```typescript
interface ApplicationDetail {
  id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  stage: ApplicationStage;
  notes?: string;
  recruiter_notes?: string;
  accepted_by_company: boolean;
  accepted_at?: Date;
  created_at: Date;
  updated_at: Date;
  
  // Enriched data
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    linkedin_url?: string;
    current_title?: string;
    current_company?: string;
  };
  
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
    };
    location?: string;
    salary_min?: number;
    salary_max?: number;
    description?: string;
  };
  
  documents: Document[];
  pre_screen_answers?: PreScreenAnswer[];
  audit_log: AuditLogEntry[];
}
```

### API Endpoints (Already Implemented)
```
GET    /api/applications/:id          - Get application details
GET    /api/applications/:id/full     - Get full details (candidate, job, docs)
PATCH  /api/applications/:id/stage    - Update stage
POST   /api/applications/:id/recruiter-submit  - Submit to company
```

### Permissions
- **Recruiter must have active relationship with candidate** (`network.recruiter_candidates.status = 'active'` AND `consent_given = true`)
- Recruiter must own the application (`application.recruiter_id === recruiter.id`)
- Admin users can view all applications
- Company users can view applications for their jobs (after submission)

**Critical Check:** The application detail page should verify both:
1. The recruiter owns the application
2. The recruiter-candidate relationship is still active

If relationship has expired or been terminated, show warning but still allow viewing historical data.

---

## File Structure

```
apps/portal/src/app/(authenticated)/applications/
├── page.tsx                          # ✅ Applications list (exists)
├── applications-list-client.tsx      # ✅ List component (exists)
├── pending/
│   └── page.tsx                      # ✅ Pending review list (exists)
└── [id]/
    ├── page.tsx                      # ❌ CREATE - Application detail page
    ├── application-detail-client.tsx # ❌ CREATE - Detail component
    └── review/
        ├── page.tsx                  # ✅ Review page (exists)
        └── review-form.tsx           # ✅ Review form (exists)
```

### Components to Create
```
apps/portal/src/components/
├── application-quick-actions.tsx     # ❌ CREATE - Quick action buttons
├── stage-transition-modal.tsx        # ❌ CREATE - Stage update modal
├── application-timeline.tsx          # ❌ CREATE - Activity timeline
└── application-stage-badge.tsx       # ❌ CREATE - Reusable stage badge
```

---

## Testing Checklist

### Unit Tests
- [ ] Application detail page renders correctly
- [ ] Stage update validates input
- [ ] Permissions are checked
- [ ] Error states display properly

### Integration Tests
- [ ] Recruiter can view own applications
- [ ] Recruiter can update application stage
- [ ] Recruiter can add notes
- [ ] Stage transitions trigger events
- [ ] Notifications are sent

### E2E Tests
- [ ] Navigate from candidate details to application
- [ ] Update stage from application detail page
- [ ] Add notes to application
- [ ] Reject application with reason
- [ ] Move application through full pipeline

---

## Success Criteria

### Must Have (Phase 1 & 2)
✅ Application detail page exists and is accessible  
✅ Recruiter can view full application details  
✅ Recruiter can update application stage  
✅ Links from candidate details page work correctly  
✅ Permissions are enforced  
✅ Stage updates are logged  

### Should Have (Phase 3)
✅ Quick actions are available  
✅ Stage transition wizard is intuitive  
✅ Timeline shows application history  
✅ Documents are easily accessible  

### Nice to Have (Phase 4)
✅ Bulk actions for multiple applications  
✅ Templates for common notes  
✅ Real-time activity feed  
✅ Email notification previews  

---

## Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Application Detail Page | 12 hours |
| Phase 2 | Update Links | 1 hour |
| Phase 3 | Enhanced Actions | 7 hours |
| **Total Core** | | **20 hours** |
| Phase 4 (Optional) | Additional Features | 9 hours |
| **Grand Total** | | **29 hours** |

**Recommended Sprint:** 2 weeks for Phases 1-3 (MVP)

---

## Priority Order

1. **CRITICAL:** Create `/applications/[id]/page.tsx` (Task 1.1 & 1.2)
2. **HIGH:** Implement stage update functionality (Task 1.3)
3. **HIGH:** Update candidate details page links (Task 2.1)
4. **MEDIUM:** Quick actions component (Task 3.1)
5. **MEDIUM:** Stage transition wizard (Task 3.2)
6. **LOW:** Phase 4 enhancements

---

## References

### Existing Code
- Candidate Details: [`apps/portal/src/app/(authenticated)/candidates/[id]/candidate-detail-client.tsx`](../../apps/portal/src/app/(authenticated)/candidates/[id]/candidate-detail-client.tsx)
- Applications List: [`apps/portal/src/app/(authenticated)/applications/applications-list-client.tsx`](../../apps/portal/src/app/(authenticated)/applications/applications-list-client.tsx)
- Review Page: [`apps/portal/src/app/(authenticated)/applications/[id]/review/page.tsx`](../../apps/portal/src/app/(authenticated)/applications/[id]/review/page.tsx)
- API Client: [`apps/portal/src/lib/api-client.ts`](../../apps/portal/src/lib/api-client.ts)

### Documentation

**Business Logic:**
- Direct vs Represented Candidates: [`docs/business-logic/direct-vs-represented-candidates.md`](../business-logic/direct-vs-represented-candidates.md)
- Recruiter-to-Recruiter Collaboration: [`docs/business-logic/recruiter-to-recruiter-collaboration.md`](../business-logic/recruiter-to-recruiter-collaboration.md)

**Technical Implementation:**
- API Contracts: [`docs/implementation/02-api-contracts.md`](../implementation/02-api-contracts.md)
- Service Layer: [`docs/implementation/03-service-layer.md`](../implementation/03-service-layer.md)
- Database Schema: [`docs/implementation/01-database-schema.md`](../implementation/01-database-schema.md)
- UI Components: [`docs/implementation/05-ui-components.md`](../implementation/05-ui-components.md)

---

## Next Steps

1. **Review this document** with the team
2. **Prioritize tasks** based on business needs
3. **Create tickets** for each task in project management system
4. **Assign developers** to Phase 1 (critical path)
5. **Start implementation** with Task 1.1
6. **Schedule demo** after Phase 1 completion

---

**Document Status:** Ready for Implementation  
**Last Updated:** December 19, 2025  
**Owner:** Development Team  
**Reviewer:** Product Manager
