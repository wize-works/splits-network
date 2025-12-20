# Recruiter-to-Recruiter Collaboration (Splits Network Model)

**Document:** Recruiter-to-Recruiter Collaboration Business Logic  
**Created:** December 20, 2025  
**Status:** Phase 2 - Future Implementation  
**Priority:** Deferred - Focus on direct candidate→recruiter→company flow first

---

## Overview

The Splits Network enables **recruiter-to-recruiter collaboration** where two recruiters work together on a single placement and split the fee. This creates a two-sided marketplace model.

---

## Business Model: Two Types of Recruiters

### Candidate-Side Recruiter
- **Represents candidates** with exclusive 12-month "Right to Represent" agreements
- Manages their candidate pool
- Submits candidates to jobs
- **Primary relationship:** Candidate

### Company-Side Recruiter  
- **Represents companies** and their open positions
- Searches for candidates to fill roles
- May have candidates in their own network OR find candidates represented by other recruiters
- **Primary relationship:** Company

---

## Two Application Paths

### Path 1: Direct Application (Phase 1 - Current Focus)

```
Candidate → Candidate Recruiter → Company → Hired
                    ↓
               100% Fee
```

**Flow:**
1. Recruiter has exclusive agreement with candidate
2. Recruiter finds open job (posted by company directly)
3. Recruiter submits candidate to company
4. If hired, recruiter receives full placement fee

**Characteristics:**
- No collaboration needed
- Straightforward submission
- Traditional recruiting model
- **This is the Phase 1 focus**

---

### Path 2: Recruiter Collaboration (Phase 2 - Proposals System)

```
Candidate → Candidate Recruiter ←→ Company Recruiter → Company → Hired
                    ↓                       ↓
                Split Fee              Split Fee
```

**Flow:**
1. Company Recruiter has an open role for their client company
2. Company Recruiter searches platform, finds perfect candidate (Jane)
3. Jane already has exclusive agreement with Candidate Recruiter
4. **Company Recruiter proposes collaboration** via Proposals system
5. Candidate Recruiter reviews proposal
6. If accepted: Both recruiters work together, split the fee
7. If declined: Company Recruiter cannot submit that candidate

**Characteristics:**
- Requires collaboration agreement
- Fee split negotiation
- Enables access to broader candidate pool
- **This is the "Splits Network" value proposition**

---

## Proposals System (`network.candidate_role_assignments`)

### Purpose
Manage permission and collaboration when a company-side recruiter wants to work with a candidate who already has their own recruiter.

### State Machine
```
proposed → accepted/declined/timed_out → submitted → closed
```

### Key Fields
- `job_id` - The specific role being filled
- `candidate_id` - The candidate in question
- `recruiter_id` - The company-side recruiter proposing collaboration
- `state` - Current state in workflow
- `proposal_notes` - Why this candidate fits
- `response_notes` - Acceptance/decline reasoning

### Business Rules

1. **Only candidate's recruiter can accept/decline proposals**
   - Candidate has exclusive agreement with their recruiter
   - Candidate's recruiter makes collaboration decisions

2. **One proposal per candidate-job pair**
   - Prevents duplicate proposals for same scenario
   - Enforced by: `UNIQUE(job_id, candidate_id)`

3. **Time-limited proposals**
   - Proposals expire if not responded to (default: 48-72 hours)
   - Auto-transitions to `timed_out` state

4. **Fee split negotiation**
   - Must be agreed upon before submission
   - Tracked in billing system
   - Typically 50/50 split, but configurable

---

## Workflow Details

### Company Recruiter Initiates Proposal

**Prerequisites:**
- Company recruiter has active role to fill
- They find candidate in system who has another recruiter
- Candidate has active `consent_given` relationship with their recruiter

**Actions:**
1. Company recruiter views candidate profile
2. Clicks "Propose Collaboration" for specific job
3. Fills out proposal form:
   - Why this candidate fits the role
   - Proposed fee split
   - Timeline expectations
4. System creates `candidate_role_assignment` with `state = 'proposed'`
5. Notification sent to candidate's recruiter

### Candidate Recruiter Reviews Proposal

**They see:**
- Which company recruiter is proposing
- The job details
- Proposed fee split
- Why they think the candidate fits

**Options:**
1. **Accept** → `state = 'accepted'`, can now submit application
2. **Decline** → `state = 'declined'`, proposal closed
3. **Ignore** → Auto-timeout after X hours → `state = 'timed_out'`

### Accepted Proposal Workflow

**After acceptance:**
1. Both recruiters can see collaboration in their dashboard
2. Candidate's recruiter submits application
3. Application tracked with both recruiter IDs
4. If hired: Fee automatically split per agreement
5. Both recruiters credited with placement metrics

---

## Why This Matters (Business Value)

### For Candidate-Side Recruiters
- **More opportunities:** Access jobs with company recruiters attached
- **Leverage network:** Their candidates visible to more opportunities
- **Passive income:** Collaboration offers they accept

### For Company-Side Recruiters
- **Larger candidate pool:** Not limited to their own network
- **Pre-vetted candidates:** Other recruiters have already screened
- **Faster fills:** Access to candidates they couldn't reach otherwise

### For The Platform
- **Network effects:** More recruiters = more value for everyone
- **Differentiation:** Enables collaboration, not just competition
- **Higher fill rates:** More candidate-job matches
- **Fee revenue:** Platform takes percentage of split fees

---

## Implementation Status

### ✅ Database Schema Exists
- `network.candidate_role_assignments` table created
- State machine columns in place
- Constraints enforced

### ❌ UI Not Implemented
- No proposals page in portal
- No accept/decline workflow
- No fee split negotiation interface

### ❌ Business Logic Incomplete
- Proposal creation flow missing
- Notification system not wired
- Fee split calculation not implemented
- Timeout/expiration logic not automated

---

## Phase 1 vs Phase 2 Priority

### Phase 1 Focus (Current)
**Direct candidate → recruiter → company flow**
- Recruiter manages their own candidates
- Direct submission to jobs
- Full fee to submitting recruiter
- **This is what we're building first**

### Phase 2 (Future)
**Recruiter-to-recruiter collaboration**
- Proposals system
- Fee splits
- Two-sided marketplace
- **Documented here, implemented later**

---

## Open Questions

1. **Default fee split percentage?** 50/50 or configurable?
2. **Proposal timeout window?** 48 hours? 72 hours?
3. **Who can decline?** Only candidate's recruiter, or candidate too?
4. **Multiple proposals?** Can multiple company recruiters propose for same candidate-job?
5. **Candidate visibility?** Does candidate know about collaboration?
6. **Counter-proposals?** Can candidate recruiter counter with different split?

---

## Related Documentation

- [Recruiter Application Management Flow](../application-flow/recruiter-application-management-flow.md) - Phase 1 implementation
- [User Roles and Permissions](../guidance/user-roles-and-permissions.md) - RBAC for recruiters
- Database schema: `infra/migrations/008_phase2_ownership_and_sourcing.sql`

---

**Next Steps:** Complete Phase 1 (direct flow), then return to design and implement Phase 2 proposals system with full recruiter-to-recruiter collaboration.
