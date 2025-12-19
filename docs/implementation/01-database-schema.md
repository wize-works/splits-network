# Database Schema - Candidate Application Workflow

**Document:** 01 - Database Schema  
**Created:** December 19, 2025

---

## Overview

This document defines all database schema changes required to support the candidate application workflow, including new tables, modifications to existing tables, and migration scripts.

---

## 1. New Tables

### 1.1 `ats.job_pre_screen_answers`

**Purpose:** Store candidate responses to job pre-screening questions.

**Schema:**
```sql
CREATE TABLE IF NOT EXISTS ats.job_pre_screen_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ats.job_pre_screen_questions(id) ON DELETE CASCADE,
    
    -- Generic answer storage (aligns with question_type pattern)
    answer JSONB NOT NULL,               -- Stores answer based on question_type
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Ensure one answer per question per application
    UNIQUE(application_id, question_id)
);

-- Indexes
CREATE INDEX idx_pre_screen_answers_application ON ats.job_pre_screen_answers(application_id);
CREATE INDEX idx_pre_screen_answers_question ON ats.job_pre_screen_answers(question_id);

-- Comments
COMMENT ON TABLE ats.job_pre_screen_answers IS 'Candidate responses to job pre-screening questions';
COMMENT ON COLUMN ats.job_pre_screen_answers.answer IS 'JSONB answer matching question_type format from job_pre_screen_questions';
```

**Answer Structure (aligns with `question_type`):**
```json
// text question_type
{
  "answer": "I have 5 years of experience with React and TypeScript..."
}

// yes_no question_type
{
  "answer": true
}

// select question_type (single selection)
{
  "answer": "option-value-2"
}

// multi_select question_type
{
  "answer": ["option-1", "option-3", "option-5"]
}
```

---

### 1.2 Use Existing `documents` Table

**No new table needed!** Use existing `documents` table with entity pattern.

**Existing Schema:**
```sql
-- documents table already has:
-- entity_type TEXT (e.g., 'application', 'candidate', 'company')
-- entity_id UUID (the application ID)
-- document_type TEXT ('resume', 'cover_letter', 'portfolio', 'other')
-- is_primary BOOLEAN (for marking primary resume)
```

**Usage for Applications:**
```sql
-- Link document to application
INSERT INTO documents (
  entity_type,
  entity_id,
  document_type,
  is_primary,
  file_name,
  file_url,
  ...
) VALUES (
  'application',
  '<application-id>',
  'resume',
  true,  -- Primary resume for this application
  'john-doe-resume.pdf',
  's3://...',
  ...
);
```

**Query Application Documents:**
```sql
-- Get all documents for an application
SELECT * FROM documents
WHERE entity_type = 'application' 
  AND entity_id = '<application-id>';

-- Get primary resume for an application
SELECT * FROM documents
WHERE entity_type = 'application' 
  AND entity_id = '<application-id>'
  AND document_type = 'resume'
  AND is_primary = true;
```

**No migration needed** - existing table already supports this pattern!

---

### 1.3 Draft Applications - Use `stage = 'draft'`

**No new table needed!** Add `'draft'` to existing `stage` values.

**Approach:** Use the existing `applications` table with `stage = 'draft'` for incomplete applications.

**Benefits:**
- Single source of truth for all applications (draft or submitted)
- Use existing `application_audit_log` to track draft saves
- Simpler queries and data model

**Draft Lifecycle:**
1. Candidate starts application → Create `applications` record with `stage = 'draft'`
2. Candidate saves progress → Update application fields + log to `application_audit_log`
3. Candidate submits → Update `stage` from `'draft'` to `'screen'` or `'submitted'`

**Draft Data Storage:**
```sql
-- Use existing columns:
-- - notes: Store candidate notes
-- - recruiter_notes: NULL for drafts
-- - stage: 'draft'
-- - submitted_at: NULL for drafts

-- Application documents linked via documents table:
-- WHERE entity_type = 'application' AND entity_id = '<draft-application-id>'

-- Pre-screen answers linked via job_pre_screen_answers table:
-- WHERE application_id = '<draft-application-id>'
```

**Cleanup Strategy:**
```sql
-- Delete stale drafts (older than 30 days)
DELETE FROM ats.applications
WHERE stage = 'draft'
  AND created_at < NOW() - INTERVAL '30 days';
```

---

## 2. Modifications to Existing Tables

### 2.1 `ats.applications` - Add `'draft'` Stage

```sql
-- Add 'draft' to existing stage values
-- No schema change needed if stage is TEXT without constraint
-- If stage has CHECK constraint, update it:

ALTER TABLE ats.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
ALTER TABLE ats.applications ADD CONSTRAINT applications_stage_check
    CHECK (stage IN ('draft', 'screen', 'submitted', 'interview', 'offer', 'hired', 'rejected'));

-- Add recruiter notes field if it doesn't exist
ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

-- Comments
COMMENT ON COLUMN ats.applications.recruiter_notes IS 'Recruiter insights/pitch added during review';
```

**Updated Stage Flow:**
```
Draft (candidate saves):
  draft → screen (if has recruiter) → submitted → interview → offer → hired
     ↓         ↓            ↓
  rejected  rejected     rejected

Draft (no recruiter):
  draft → submitted → interview → offer → hired
     ↓         ↓
  rejected  rejected
```

**Stage Values:**
- `'draft'` - **NEW** - Incomplete application, candidate still editing
- `'screen'` - Pending recruiter review
- `'submitted'` - Submitted to company
- `'interview'` - Company interviewing
- `'offer'` - Offer extended
- `'hired'` - Candidate hired
- `'rejected'` - Application rejected

---

### 2.2 Use Existing `application_audit_log`

**No new timestamp columns needed!** Track workflow events via audit log.

**Audit Log Events:**
```sql
-- Track draft saves
INSERT INTO application_audit_log (application_id, action, performed_by_user_id, metadata)
VALUES ('<app-id>', 'draft_saved', '<candidate-id>', '{"step": 2}');

-- Track submission to recruiter
INSERT INTO application_audit_log (application_id, action, performed_by_user_id, metadata)
VALUES ('<app-id>', 'submitted_to_recruiter', '<candidate-id>', '{"recruiter_id": "<rec-id>"}');

-- Track recruiter review
INSERT INTO application_audit_log (application_id, action, performed_by_user_id, metadata)
VALUES ('<app-id>', 'recruiter_reviewed', '<recruiter-id>', '{"approved": true}');

-- Track submission to company
INSERT INTO application_audit_log (application_id, action, performed_by_user_id, metadata)
VALUES ('<app-id>', 'submitted_to_company', '<recruiter-id>', '{}');
```

**Query Recent Activity:**
```sql
-- Get last save time for draft
SELECT created_at 
FROM application_audit_log
WHERE application_id = '<app-id>' 
  AND action = 'draft_saved'
ORDER BY created_at DESC
LIMIT 1;

-- Get submission timeline
SELECT action, created_at, performed_by_user_id
FROM application_audit_log
WHERE application_id = '<app-id>'
  AND action IN ('submitted_to_recruiter', 'recruiter_reviewed', 'submitted_to_company')
ORDER BY created_at ASC;
```

---

### 2.3 `ats.applications` - Add Indexes

```sql
-- Add index for draft queries
CREATE INDEX IF NOT EXISTS idx_applications_draft 
    ON ats.applications(candidate_id, stage) 
    WHERE stage = 'draft';

-- Add index for recruiter review queries
CREATE INDEX IF NOT EXISTS idx_applications_recruiter_review 
    ON ats.applications(recruiter_id, stage) 
    WHERE stage = 'screen';

-- Add index for submitted applications
CREATE INDEX IF NOT EXISTS idx_applications_submitted_at 
    ON ats.applications(submitted_at DESC)
    WHERE submitted_at IS NOT NULL;
```

---

## 3. Migration Scripts

### Migration: `008_add_application_workflow.sql`

```sql
-- Migration 008: Add Candidate Application Workflow Support
-- Adds pre-screen answers table and updates applications stage values

BEGIN;

-- 1. Create job_pre_screen_answers table
CREATE TABLE IF NOT EXISTS ats.job_pre_screen_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES ats.job_pre_screen_questions(id) ON DELETE CASCADE,
    answer JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(application_id, question_id)
);

CREATE INDEX idx_pre_screen_answers_application ON ats.job_pre_screen_answers(application_id);
CREATE INDEX idx_pre_screen_answers_question ON ats.job_pre_screen_answers(question_id);

COMMENT ON TABLE ats.job_pre_screen_answers IS 'Candidate responses to job pre-screening questions';
COMMENT ON COLUMN ats.job_pre_screen_answers.answer IS 'JSONB answer matching question_type format';

-- 2. Add 'draft' stage to applications
ALTER TABLE ats.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
ALTER TABLE ats.applications ADD CONSTRAINT applications_stage_check
    CHECK (stage IN ('draft', 'screen', 'submitted', 'interview', 'offer', 'hired', 'rejected'));

-- 3. Add recruiter_notes column if it doesn't exist
ALTER TABLE ats.applications ADD COLUMN IF NOT EXISTS recruiter_notes TEXT;

COMMENT ON COLUMN ats.applications.recruiter_notes IS 'Recruiter insights/pitch added during review';

-- 4. Add indexes
CREATE INDEX IF NOT EXISTS idx_applications_draft 
    ON ats.applications(candidate_id, stage) 
    WHERE stage = 'draft';

CREATE INDEX IF NOT EXISTS idx_applications_recruiter_review 
    ON ats.applications(recruiter_id, stage) 
    WHERE stage = 'screen';

CREATE INDEX IF NOT EXISTS idx_applications_submitted_at 
    ON ats.applications(submitted_at DESC)
    WHERE submitted_at IS NOT NULL;

COMMIT;
```

---

## 4. Rollback Script

### Rollback: `008_add_application_workflow_rollback.sql`

```sql
-- Rollback 008: Remove Candidate Application Workflow Support

BEGIN;

-- 1. Drop indexes
DROP INDEX IF EXISTS ats.idx_applications_submitted_at;
DROP INDEX IF EXISTS ats.idx_applications_recruiter_review;
DROP INDEX IF EXISTS ats.idx_applications_draft;

-- 2. Remove recruiter_notes column
ALTER TABLE ats.applications DROP COLUMN IF EXISTS recruiter_notes;

-- 3. Restore original stage constraint
ALTER TABLE ats.applications DROP CONSTRAINT IF EXISTS applications_stage_check;
ALTER TABLE ats.applications ADD CONSTRAINT applications_stage_check
    CHECK (stage IN ('screen', 'submitted', 'interview', 'offer', 'hired', 'rejected'));

-- 4. Drop job_pre_screen_answers table
DROP TABLE IF EXISTS ats.job_pre_screen_answers CASCADE;

COMMIT;
```

---

## 5. Validation Queries

After running the migration, validate the changes:

```sql
-- Verify job_pre_screen_answers table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'ats' 
  AND table_name = 'job_pre_screen_answers'
ORDER BY ordinal_position;

-- Verify stage constraint includes 'draft'
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'applications_stage_check';

-- Verify recruiter_notes column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'ats' 
  AND table_name = 'applications' 
  AND column_name = 'recruiter_notes';

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'ats' 
  AND tablename IN ('job_pre_screen_answers', 'applications')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Test draft application query
SELECT 
    a.id,
    a.candidate_id,
    a.job_id,
    a.stage,
    c.email as candidate_email,
    j.title as job_title
FROM ats.applications a
JOIN ats.candidates c ON c.id = a.candidate_id
JOIN ats.jobs j ON j.id = a.job_id
WHERE a.stage = 'draft'
ORDER BY a.updated_at DESC
LIMIT 10;

-- Test documents linked to application (using entity pattern)
SELECT 
    d.id,
    d.entity_type,
    d.entity_id,
    d.document_type,
    d.file_name,
    d.is_primary,
    d.uploaded_at
FROM documents d
WHERE d.entity_type = 'application'
  AND d.entity_id IN (
    SELECT id FROM ats.applications WHERE stage = 'draft' LIMIT 5
  )
ORDER BY d.entity_id, d.is_primary DESC, d.uploaded_at DESC;

-- Test pre-screen answers query
SELECT 
    a.id as answer_id,
    a.application_id,
    q.question_text,
    q.question_type,
    a.answer,
    a.created_at
FROM ats.job_pre_screen_answers a
JOIN ats.job_pre_screen_questions q ON q.id = a.question_id
ORDER BY a.created_at DESC
LIMIT 10;

-- Test audit log for application workflow events
SELECT 
    al.id,
    al.application_id,
    al.action,
    al.performed_by_user_id,
    al.metadata,
    al.created_at
FROM ats.application_audit_log al
WHERE al.action IN ('draft_saved', 'submitted_to_recruiter', 'recruiter_reviewed', 'submitted_to_company')
ORDER BY al.created_at DESC
LIMIT 20;

-- Check for orphaned pre-screen answers (questions deleted)
SELECT psa.* 
FROM ats.job_pre_screen_answers psa
LEFT JOIN ats.job_pre_screen_questions q ON psa.question_id = q.id
WHERE q.id IS NULL;

-- Check for applications without documents (submitted applications only)
SELECT a.id, a.job_id, a.candidate_id
FROM ats.applications a
WHERE a.stage IN ('submitted', 'interview', 'offer', 'hired')
  AND NOT EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.entity_type = 'application' 
    AND d.entity_id = a.id
  );

-- Check for applications without primary resume (submitted applications only)
SELECT a.id, a.job_id, a.candidate_id
FROM ats.applications a
WHERE a.stage IN ('submitted', 'interview', 'offer', 'hired')
  AND NOT EXISTS (
    SELECT 1 FROM documents d 
    WHERE d.entity_type = 'application' 
    AND d.entity_id = a.id
    AND d.document_type = 'resume'
    AND d.is_primary = true
  );

-- Check for stale drafts (older than 30 days)
SELECT a.* 
FROM ats.applications a
WHERE a.stage = 'draft'
  AND a.updated_at < NOW() - INTERVAL '30 days';
```

---

## 6. Key Indexes Summary

After this migration, the following indexes support the candidate application workflow:

### Pre-Screen Answers
- `idx_pre_screen_answers_application` - Query all answers for an application
- `idx_pre_screen_answers_question` - Find all responses to a question

### Applications (new indexes)
- `idx_applications_draft` - Query candidate's draft applications
- `idx_applications_recruiter_review` - Query applications pending recruiter review
- `idx_applications_submitted_at` - Query recent submissions

### Documents (existing table)
- Use existing indexes on `entity_type` and `entity_id` for application documents

### Application Audit Log (existing table)
- Use existing indexes on `application_id` and `action` for workflow tracking

---

## 7. Data Patterns

### Using Existing Tables for Application Workflow

#### 1. Draft Applications
Use the `applications` table with `stage = 'draft'`:

```sql
-- Create draft application
INSERT INTO ats.applications (
    candidate_id,
    job_id,
    stage,
    source,
    recruiter_id
) VALUES (
    '...',  -- candidate_id
    '...',  -- job_id
    'draft',
    'candidate_direct',
    NULL    -- no recruiter yet for direct path
)
RETURNING *;

-- Track draft saved event
INSERT INTO ats.application_audit_log (
    application_id,
    action,
    performed_by_user_id,
    metadata
) VALUES (
    '...',  -- application_id
    'draft_saved',
    '...',  -- user_id
    '{"progress": "documents_uploaded", "answers_completed": 3}'::jsonb
);
```

#### 2. Application Documents
Use the `documents` table with entity pattern:

```sql
-- Link document to application
INSERT INTO documents (
    entity_type,
    entity_id,
    document_type,
    file_name,
    file_path,
    file_size,
    mime_type,
    is_primary,
    uploaded_by_user_id
) VALUES (
    'application',
    '...',  -- application_id
    'resume',
    'john_doe_resume.pdf',
    's3://bucket/path/to/file.pdf',
    245678,
    'application/pdf',
    true,
    '...'   -- user_id
)
RETURNING *;

-- Query all documents for an application
SELECT * 
FROM documents 
WHERE entity_type = 'application' 
  AND entity_id = '...'
ORDER BY is_primary DESC, uploaded_at DESC;
```

#### 3. Workflow Timestamps
Use `application_audit_log` for all temporal tracking:

```sql
-- When candidate submits to recruiter
INSERT INTO ats.application_audit_log (
    application_id,
    action,
    performed_by_user_id,
    metadata
) VALUES (
    '...',
    'submitted_to_recruiter',
    '...',  -- candidate_user_id
    '{"recruiter_id": "..."}'::jsonb
);

-- When recruiter reviews and approves
INSERT INTO ats.application_audit_log (
    application_id,
    action,
    performed_by_user_id,
    metadata
) VALUES (
    '...',
    'recruiter_reviewed',
    '...',  -- recruiter_user_id
    '{"notes": "Strong candidate with excellent experience", "approved": true}'::jsonb
);

-- When recruiter submits to company
INSERT INTO ats.application_audit_log (
    application_id,
    action,
    performed_by_user_id,
    metadata
) VALUES (
    '...',
    'submitted_to_company',
    '...',  -- recruiter_user_id
    '{"company_id": "..."}'::jsonb
);

-- Query to get workflow timeline
SELECT 
    action,
    performed_by_user_id,
    metadata,
    created_at
FROM ats.application_audit_log
WHERE application_id = '...'
  AND action IN ('draft_saved', 'submitted_to_recruiter', 'recruiter_reviewed', 'submitted_to_company')
ORDER BY created_at ASC;
```

#### 4. Pre-Screen Answers with Generic JSONB
Store answers in a format matching the question type:

```sql
-- Text answer
INSERT INTO ats.job_pre_screen_answers (application_id, question_id, answer)
VALUES ('...', '...', '{"text": "5 years of experience with React and Node.js"}'::jsonb);

-- Boolean answer
INSERT INTO ats.job_pre_screen_answers (application_id, question_id, answer)
VALUES ('...', '...', '{"boolean": true}'::jsonb);

-- Single choice answer
INSERT INTO ats.job_pre_screen_answers (application_id, question_id, answer)
VALUES ('...', '...', '{"choice": "Bachelor''s Degree"}'::jsonb);

-- Multiple choice answer
INSERT INTO ats.job_pre_screen_answers (application_id, question_id, answer)
VALUES ('...', '...', '{"choices": ["JavaScript", "TypeScript", "Python"]}'::jsonb);

-- File upload answer
INSERT INTO ats.job_pre_screen_answers (application_id, question_id, answer)
VALUES ('...', '...', '{"file_url": "https://...", "file_name": "portfolio.pdf"}'::jsonb);

-- Query answers with question context
SELECT 
    q.question_text,
    q.question_type,
    q.options,
    a.answer,
    a.created_at
FROM ats.job_pre_screen_answers a
JOIN ats.job_pre_screen_questions q ON q.id = a.question_id
WHERE a.application_id = '...'
ORDER BY q.order_index, q.created_at;
```

---

## 8. Notes on Existing Table Usage

This implementation leverages existing tables and patterns:

1. **`applications` table with `stage='draft'`** - No separate drafts table needed. Draft applications are just regular applications in draft stage.

2. **`documents` table with entity pattern** - No junction table needed. Documents link to applications using `entity_type='application'` and `entity_id=<application_id>`.

3. **`application_audit_log` for temporal tracking** - No timestamp columns needed on applications table. All workflow events (draft_saved, submitted_to_recruiter, recruiter_reviewed, submitted_to_company) are tracked as audit log entries with metadata.

4. **`job_pre_screen_answers.answer` as generic JSONB** - Matches the pattern of `job_pre_screen_questions` which uses `question_type` TEXT and `options` JSONB. Answer structure varies based on question type, stored in a single flexible column.

This approach:
- ✅ Maintains consistency with existing patterns
- ✅ Avoids redundant tables and columns
- ✅ Provides full audit trail with metadata
- ✅ Supports flexible answer types
- ✅ Uses proven entity relationship pattern

---

## 9. Next Steps

1. Review and approve schema design
2. Test migration on staging database
3. Create seeding script for test data
4. Proceed to [API Contracts](./02-api-contracts.md)

---

**Status:** ✅ Ready for Review  
**Version**: 2.0 (aligned with existing architectural patterns)  
**Next:** [API Contracts](./02-api-contracts.md)
