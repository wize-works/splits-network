# API Contracts - Candidate Application Workflow

**Document:** 02 - API Contracts  
**Created:** December 19, 2025

---

## Overview

Complete API endpoint specifications for the candidate application workflow, including request/response schemas, error codes, and authentication requirements.

---

## Base URL

All endpoints are prefixed with the API Gateway base URL:
- Development: `http://localhost:3000`
- Production: `https://api.splits.network`

---

## Authentication

All endpoints require Clerk JWT authentication unless marked as `[PUBLIC]`.

**Headers:**
```http
Authorization: Bearer <clerk_jwt_token>
```

---

## 1. Application Endpoints

> **Note on Drafts:** Draft applications use `stage='draft'` in the main `applications` table. No separate draft endpoints. Create application with `stage='draft'`, update via PATCH, then change stage to submit.

### 1.1 Submit Application

**Endpoint:** `POST /api/applications/submit`

**Auth:** Required (Candidate)

**Description:** Submit a complete job application. This is the main application submission endpoint.

**Request Body:**
```typescript
{
  job_id: string;                // Required
  document_ids: string[];        // Required: At least one resume
  primary_resume_id: string;     // Required: Which document is primary
  pre_screen_answers?: {         // Required if job has questions
    question_id: string;
    answer: any;               // JSONB matching question_type format
  }[];
  notes?: string;                // Optional candidate notes
}
```

**Business Rules:**
1. Candidate must have profile with email
2. At least one document must be a resume
3. All required pre-screen questions must be answered
4. Cannot apply twice to the same job

**Response:** `201 Created`
```typescript
{
  data: {
    application: {
      id: string;
      job_id: string;
      candidate_id: string;
      recruiter_id: string | null;      // NULL if no recruiter relationship
      stage: string;                    // 'screen' (pending recruiter) or 'submitted' (to company)
      created_at: string;
      // Submission timestamp tracked in application_audit_log
    };
    has_recruiter: boolean;             // Whether candidate has recruiter relationship
    next_steps: string;                 // Human-readable next steps
  }
}
```

**Success Flows:**

**No Recruiter:**
```json
{
  "data": {
    "application": { ... },
    "has_recruiter": false,
    "next_steps": "Your application has been submitted directly to the company. They will review and contact you if interested."
  }
}
```

**Has Recruiter:**
```json
{
  "data": {
    "application": { ... },
    "has_recruiter": true,
    "next_steps": "Your application has been sent to your recruiter for review. They will enhance and submit it to the company."
  }
}
```

**Errors:**
- `400` - Invalid request (missing required fields, invalid document IDs)
- `401` - Unauthorized
- `404` - Job not found or candidate profile not found
- `409` - Duplicate application (already applied to this job)
- `422` - Validation error (missing required answers, no resume provided, etc.)

**Error Response Format:**
```typescript
{
  error: {
    code: string;              // Machine-readable error code
    message: string;           // Human-readable message
    details?: any;             // Optional validation details
  }
}
```

**Error Codes:**
- `DUPLICATE_APPLICATION` - Already applied
- `MISSING_RESUME` - No resume document provided
- `INVALID_DOCUMENT` - Document ID not found or not owned by candidate
- `MISSING_REQUIRED_ANSWERS` - Required pre-screen questions not answered
- `JOB_NOT_FOUND` - Job doesn't exist
- `JOB_CLOSED` - Job is no longer accepting applications

---

---

### 1.2 Get My Applications

**Endpoint:** `GET /api/candidates/me/applications`

**Auth:** Required (Candidate)

**Description:** List all applications for the authenticated candidate.

**Query Parameters:**
```
?status=active|inactive|all    // Filter by status (default: all)
&limit=20                      // Results per page
&offset=0                      // Pagination offset
```

**Response:** `200 OK`
```typescript
{
  data: {
    applications: [
      {
        id: string;
        job: {
          id: string;
          title: string;
          company: {
            name: string;
          };
          location?: string;
          employment_type?: string;
        };
        candidate_id: string;
        recruiter_id: string | null;
        recruiter?: {
          name: string;
          email: string;
        };
        status: string;
        stage: string;
        submitted_by: string;
        created_at: string;
        updated_at: string;
        // Submission timestamps available in workflow_events from audit log
      }
    ];
    total: number;
    has_more: boolean;
  }
}
```

---

### 1.3 Get Application Details

**Endpoint:** `GET /api/applications/:id`

**Auth:** Required (Candidate owns it, Recruiter manages it, or Company owns job)

**Description:** Get full application details including documents and pre-screen answers.

**Response:** `200 OK`
```typescript
{
  data: {
    id: string;
    job: {
      id: string;
      title: string;
      company: { name: string };
      description: string;
      // ... full job details
    };
    candidate: {
      id: string;
      full_name: string;
      email: string;
      // ... candidate details
    };
    recruiter?: {
      id: string;
      name: string;
      email: string;
    };
    documents: [
      {
        id: string;
        entity_type: 'application';  // From documents table
        entity_id: string;            // This application's ID
        document_type: string;
        is_primary: boolean;
        file_name: string;
        file_size: number;
        uploaded_at: string;
      }
    ];
    pre_screen_answers: [
      {
        question_id: string;
        question: string;
        question_type: string;
        answer: any;                  // JSONB matching question_type
      }
    ];
    status: string;
    stage: string;
    submitted_by: string;
    // Temporal data via application_audit_log:
    workflow_events: [
      {
        action: string;              // 'draft_saved', 'submitted_to_recruiter', 'recruiter_reviewed', 'submitted_to_company'
        performed_by_user_id: string;
        metadata: any;
        created_at: string;
      }
    ];
    notes?: string;
    created_at: string;
    updated_at: string;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not owner/recruiter/company)
- `404` - Application not found

---

### 1.4 Withdraw Application

**Endpoint:** `POST /api/applications/:id/withdraw`

**Auth:** Required (Candidate owns it)

**Description:** Candidate withdraws their application.

**Request Body:**
```typescript
{
  reason?: string;    // Optional withdrawal reason
}
```

**Response:** `200 OK`
```typescript
{
  data: {
    id: string;
    status: 'withdrawn';
    updated_at: string;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not candidate's application)
- `404` - Application not found
- `409` - Cannot withdraw (already accepted/rejected)

---

## 2. Pre-Screen Questions Endpoints

### 2.1 Get Job Pre-Screen Questions

**Endpoint:** `GET /api/jobs/:jobId/pre-screen-questions`

**Auth:** Required

**Description:** Get all pre-screening questions for a job (if any).

**Response:** `200 OK`
```typescript
{
  data: {
    questions: [
      {
        id: string;
        job_id: string;
        question: string;
        question_type: 'text' | 'yes_no' | 'select' | 'multi_select';
        options?: any[];          // For select/multi_select
        is_required: boolean;
        sort_order: number;
      }
    ];
    total: number;
  }
}
```

---

## 3. Recruiter Review Endpoints

### 3.1 Get Pending Applications for Recruiter

**Endpoint:** `GET /api/recruiters/me/pending-applications`

**Auth:** Required (Recruiter)

**Description:** Get all candidate applications waiting for recruiter review.

**Query Parameters:**
```
?stage=screen                       // Filter by stage (screen = pending recruiter review)
&limit=50
&offset=0
```

**Response:** `200 OK`
```typescript
{
  data: {
    applications: [
      {
        id: string;
        job: { id: string; title: string; company: { name: string } };
        candidate: { id: string; full_name: string; email: string };
        stage: 'screen';  // Pending recruiter review
        created_at: string;  // When application was created
        documents_count: number;
        has_all_answers: boolean;
      }
    ];
    total: number;
  }
}
```

---

### 3.2 Approve and Submit Application

**Endpoint:** `POST /api/applications/:id/recruiter-submit`

**Auth:** Required (Recruiter managing this application)

**Description:** Recruiter reviews, optionally enhances, and submits application to company.

**Request Body:**
```typescript
{
  recruiter_notes?: string;       // Recruiter's pitch/notes
  enhanced_resume_id?: string;    // Optional: replace primary resume
  additional_document_ids?: string[];  // Optional: add more documents
}
```

**Response:** `200 OK`
```typescript
{
  data: {
    id: string;
    status: 'submitted';
    // Timestamps tracked in application_audit_log:
    // - 'recruiter_reviewed' event
    // - 'submitted_to_company' event
    updated_at: string;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not this application's recruiter)
- `404` - Application not found
- `409` - Invalid state (already submitted or not in review)

---

### 3.3 Request Changes from Candidate

**Endpoint:** `POST /api/applications/:id/request-changes`

**Auth:** Required (Recruiter)

**Description:** Recruiter requests candidate make changes before submission.

**Request Body:**
```typescript
{
  requested_changes: string;      // What needs to be changed
  specific_questions?: string[];  // Optional: specific questions to re-answer
}
```

**Response:** `200 OK`
```typescript
{
  data: {
    id: string;
    status: 'changes_requested';
    updated_at: string;
  }
}
```

---

## 4. Company Endpoints

### 4.1 Request Pre-Screen for Application

**Endpoint:** `POST /api/applications/:id/request-prescreen`

**Auth:** Required (Company admin for this job)

**Description:** Company requests a recruiter pre-screen for a non-represented candidate's application.

**Request Body:**
```typescript
{
  reason?: string;    // Optional: why pre-screen is needed
}
```

**Business Logic:**
1. Verify application has `recruiter_id = NULL`
2. Find random active recruiter
3. Create invitation for candidate
4. Send notification to candidate and recruiter

**Response:** `200 OK`
```typescript
{
  data: {
    application_id: string;
    recruiter_assigned: {
      id: string;
      name: string;
    };
    invitation_sent_to_candidate: boolean;
    message: string;
  }
}
```

**Errors:**
- `401` - Unauthorized
- `403` - Forbidden (not company for this job)
- `404` - Application not found
- `409` - Application already has recruiter
- `503` - No active recruiters available

---

## 5. Recruiter-Candidate Relationship Endpoints

### 5.1 Check Recruiter Relationship

**Endpoint:** `GET /api/candidates/me/recruiter`

**Auth:** Required (Candidate)

**Description:** Check if candidate has an active recruiter relationship.

**Response:** `200 OK`
```typescript
{
  data: {
    has_recruiter: boolean;
    recruiter?: {
      id: string;
      user_id: string;
      name: string;
      email: string;
      relationship_start_date: string;
      relationship_end_date: string;
      status: 'active';
    };
  }
}
```

---

## 6. Response Envelope Standard

**All responses MUST use the envelope format:**

```typescript
// Success
{
  data: T    // Actual payload
}

// Error
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

**Reference:** `docs/guidance/api-response-format.md`

---

## 7. Standard Error Codes

| HTTP Status | Error Code | Description |
|-------------|-----------|-------------|
| 400 | `INVALID_REQUEST` | Malformed request body |
| 400 | `MISSING_REQUIRED_FIELD` | Required field missing |
| 401 | `UNAUTHORIZED` | Not authenticated |
| 403 | `FORBIDDEN` | Authenticated but not authorized |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | Duplicate or invalid state |
| 422 | `VALIDATION_ERROR` | Business logic validation failed |
| 500 | `INTERNAL_ERROR` | Server error |

---

## 8. Rate Limiting

- Candidates: 10 requests/minute for application submissions
- Recruiters: 100 requests/minute
- Companies: 100 requests/minute

**Rate Limit Headers:**
```http
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-RateLimit-Reset: 1640000000
```

---

## 9. Next Steps

1. Implement API routes in `api-gateway`
2. Implement service methods in `ats-service`
3. Add validation schemas
4. Proceed to [Service Layer](./03-service-layer.md)

---

**Status:** ✅ Ready for Implementation  
**Next:** [Service Layer](./03-service-layer.md)
