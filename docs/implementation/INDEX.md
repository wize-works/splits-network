# Candidate Application Workflow - Implementation Guide Index

**Project:** Candidate Job Application Feature  
**Created:** December 19, 2025  
**Status:** ✅ Documentation Complete - Ready for Implementation

---

## Overview

This implementation guide covers the complete candidate job application workflow, enabling candidates to apply to jobs with or without recruiter representation, including document submission and pre-screening questions.

---

## Documentation Structure

### 📋 Planning & Analysis
- **[Audit Report](./candidate-application-workflow-audit.md)** - Current state analysis and gaps

### 🗄️ Database Layer
- **[1. Database Schema](./01-database-schema.md)** - New tables, migrations, and schema changes

### 🔌 Backend Services
- **[2. API Contracts](./02-api-contracts.md)** - Complete API endpoint specifications
- **[3. Service Layer](./03-service-layer.md)** - Business logic and service methods
- **[4. Event System](./04-event-system.md)** - Event definitions and notification flows

### 🎨 Frontend Layer
- **[5. UI Components](./05-ui-components.md)** - React components and pages
- **[6. User Flows](./06-user-flows.md)** - Step-by-step user experience flows

### 🚀 Implementation
- **[7. Implementation Phases](./07-implementation-phases.md)** - Phased rollout plan
- **[8. Testing Strategy](./08-testing-strategy.md)** - Test scenarios and validation

---

## Quick Reference

### Key Workflows

1. **Candidate applies (no recruiter)** → Direct to company → Company can request pre-screen
2. **Candidate applies (has recruiter)** → Recruiter reviews → Recruiter submits to company
3. **Draft applications** → Save with `stage='draft'` → Resume later

### Core Tables & Patterns

- `ats.applications` - Main application records (including drafts with `stage='draft'`)
- `ats.job_pre_screen_answers` - Candidate responses (single JSONB `answer` field)
- `documents` - Existing table, links via `entity_type='application'`, `entity_id`
- `ats.application_audit_log` - Existing table, tracks all workflow events (no timestamp columns needed)
- `network.recruiter_candidates` - 12-month recruiter-candidate relationships

### Key Services

- `ATS Service` - Application CRUD and management
- `Network Service` - Recruiter-candidate relationships
- `Document Service` - File storage and retrieval
- `Notification Service` - Email and in-app notifications

### Frontend Apps

- `apps/candidate` - Candidate-facing application flow
- `apps/portal` - Recruiter review and management

---

## Implementation Order

```
Phase 1: Database Foundation
  ↓
Phase 2: Backend Services (ATS Service)
  ↓
Phase 3: API Gateway Integration
  ↓
Phase 4: Candidate UI (Application Wizard)
  ↓
Phase 5: Recruiter UI (Review Flow)
  ↓
Phase 6: Notifications & Events
  ↓
Phase 7: Testing & Refinement
```

---

## Getting Started

1. Review the **[Audit Report](./candidate-application-workflow-audit.md)** to understand current state
2. Read **[Database Schema](./01-database-schema.md)** for data model changes
3. Review **[API Contracts](./02-api-contracts.md)** for endpoint specifications
4. Follow **[Implementation Phases](./07-implementation-phases.md)** for execution plan

---

## Key Decisions

### Recruiter Assignment Model
- **Candidate-wide:** `network.recruiter_candidates` (12-month relationships)
- **Job-specific:** `network.candidate_role_assignments` (fiscal tracking)
- **Application-specific:** `ats.applications.recruiter_id` (who manages this submission)

### Application Stages
- `draft` - **NEW** - Incomplete application, candidate still editing
- `screen` - Pending recruiter review (candidate has recruiter)
- `submitted` - Submitted to company (with or without recruiter)
- `interview` - Company is interviewing candidate
- `offer` - Offer extended by company
- `hired` - Candidate accepted offer (placement created)
- `rejected` - Declined by company or recruiter

### Document Handling
- Candidates upload to their profile first
- During application, select existing docs via checkboxes
- Can upload new docs inline during application
- Required: At least one resume
- **Storage:** Linked via existing `documents` table with `entity_type='application'`, `entity_id=<application_id>`

### Pre-Screen Questions
- Fetched from `ats.job_pre_screen_questions`
- Answers stored in `ats.job_pre_screen_answers` with single JSONB `answer` field
- Support types: text, yes/no, select, multi-select
- Answer format matches `question_type`: `{text: "..."}`, `{boolean: true}`, `{choice: "..."}`, `{choices: ["..."]}`
- Must be answered before submission if `is_required = true`

---

## Dependencies

### External Services
- Clerk (Authentication)
- Supabase (Database)
- Document Service (File storage)
- RabbitMQ (Event bus)
- Resend (Email notifications)

### Internal Services
- API Gateway (Entry point)
- ATS Service (Application logic)
- Network Service (Recruiter relationships)
- Identity Service (User management)
- Notification Service (Email/in-app notifications)

---

## Success Metrics

- Candidates can apply to jobs in < 5 minutes
- < 2% application abandonment rate
- Recruiters review applications within 24 hours
- Zero duplicate applications
- 100% pre-screen answer capture rate

---

## Documentation Complete ✅

All 8 implementation documents have been created and are ready for execution:

1. ✅ **Database Schema** - 1 new table (`job_pre_screen_answers`), updated stage constraint, migration 008, rollback plan
2. ✅ **API Contracts** - 8+ REST endpoints with full specs (removed draft-specific endpoints)
3. ✅ **Service Layer** - Complete business logic using `stage='draft'`, audit log, and entity patterns
4. ✅ **Event System** - 4 events (no draft events, use audit log), 6 email templates, RabbitMQ config
5. ✅ **UI Components** - Application wizard with JSONB answer handling, recruiter review, company portal
6. ✅ **User Flows** - 8 detailed workflows with audit log references
7. ✅ **Implementation Phases** - 9-phase rollout (4-5 weeks) with simplified validation
8. ✅ **Testing Strategy** - Unit, integration, E2E specs updated for simplified schema

**Schema Simplification:**
- ❌ Removed `application_drafts` table → Use `applications` with `stage='draft'`
- ❌ Removed `application_documents` table → Use existing `documents` table with entity pattern
- ❌ Removed timestamp columns → Use `application_audit_log` for all temporal tracking
- ✅ Unified pre-screen answers → Single JSONB `answer` field matching `question_type`

**Estimated Timeline:** 4-5 weeks (20-25 working days)

---

**Next:** Start with [Database Schema](./01-database-schema.md)
