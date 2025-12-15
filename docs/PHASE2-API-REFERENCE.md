# Phase 2 API Reference

**Version:** 1.0  
**Last Updated:** December 14, 2025  
**Status:** Implementation Complete ✅

This document describes all new API endpoints added in Phase 2 for candidate ownership, placement lifecycle, collaboration, proposals, and reputation.

---

## Authentication

All Phase 2 endpoints require authentication via Clerk JWT token in the `Authorization` header:

```
Authorization: Bearer <clerk_jwt_token>
```

The API Gateway resolves the Clerk user to an internal user ID and memberships before proxying to backend services.

---

## Table of Contents

1. [Candidate Ownership](#candidate-ownership)
2. [Placement Lifecycle](#placement-lifecycle)
3. [Placement Collaboration](#placement-collaboration)
4. [Proposals](#proposals)
5. [Reputation](#reputation)

---

## Candidate Ownership

### POST /api/candidates/:id/source

**Description:** Claim sourcing ownership of a candidate. Creates a 365-day protection window.

**Authorization:** Requires `recruiter` role

**Request Body:**
```json
{
  "source_method": "linkedin",
  "notes": "Found via advanced search for ML engineers"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "source_method": "linkedin",
  "sourced_at": "2025-12-14T10:00:00Z",
  "protection_expires_at": "2026-12-14T10:00:00Z",
  "notes": "Found via advanced search for ML engineers"
}
```

**Errors:**
- `400` - Candidate already sourced by another recruiter within protection window
- `404` - Candidate not found

---

### GET /api/candidates/:id/sourcer

**Description:** Get sourcing information for a candidate

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "sourcer": {
    "recruiter_id": "uuid",
    "recruiter_name": "John Doe",
    "sourced_at": "2025-12-14T10:00:00Z",
    "source_method": "linkedin",
    "protection_expires_at": "2026-12-14T10:00:00Z",
    "is_protected": true
  }
}
```

**Errors:**
- `404` - Candidate not found or not yet sourced

---

### POST /api/candidates/:id/outreach

**Description:** Record an outreach attempt to a candidate

**Authorization:** Requires `recruiter` role

**Request Body:**
```json
{
  "outreach_type": "email",
  "subject": "Exciting ML Engineer Opportunity",
  "message_preview": "Hi Jane, I came across your profile...",
  "engagement": "opened"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "recruiter_id": "uuid",
  "outreach_type": "email",
  "subject": "Exciting ML Engineer Opportunity",
  "sent_at": "2025-12-14T10:30:00Z",
  "engagement": "opened"
}
```

---

### GET /api/candidates/:id/protection-status

**Description:** Check if a candidate is currently protected by sourcing rights

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "is_protected": true,
  "protection_expires_at": "2026-12-14T10:00:00Z",
  "sourcer_recruiter_id": "uuid",
  "days_remaining": 365
}
```

---

## Placement Lifecycle

### POST /api/placements/:id/activate

**Description:** Activate a placement and start the guarantee period

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "start_date": "2025-12-15",
  "guarantee_days": 90
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "state": "active",
  "activated_at": "2025-12-14T10:00:00Z",
  "guarantee_end_date": "2026-03-15",
  "guarantee_days": 90
}
```

**Errors:**
- `400` - Placement already activated or not in 'hired' state
- `404` - Placement not found

---

### POST /api/placements/:id/complete

**Description:** Mark a placement as successfully completed after guarantee period

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "completion_notes": "Candidate exceeded expectations"
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "state": "completed",
  "completed_at": "2026-03-15T10:00:00Z",
  "completion_notes": "Candidate exceeded expectations"
}
```

**Errors:**
- `400` - Placement not in 'active' state or guarantee period not elapsed
- `404` - Placement not found

---

### POST /api/placements/:id/fail

**Description:** Mark a placement as failed during guarantee period

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "failure_reason": "candidate_quit",
  "failure_notes": "Candidate accepted counter-offer from previous employer"
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "state": "failed",
  "failed_at": "2026-01-20T10:00:00Z",
  "failure_reason": "candidate_quit",
  "failure_notes": "Candidate accepted counter-offer from previous employer",
  "replacement_eligible": true
}
```

---

### POST /api/placements/:id/request-replacement

**Description:** Request a replacement candidate for a failed placement

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "replacement_deadline": "2026-02-20",
  "notes": "Need replacement ASAP, same requirements"
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "replacement_requested": true,
  "replacement_deadline": "2026-02-20",
  "days_remaining": 31
}
```

---

### POST /api/placements/:id/link-replacement

**Description:** Link a new placement as a replacement for a failed one

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "replacement_placement_id": "uuid",
  "notes": "Replacement candidate starts next week"
}
```

**Response:** `200 OK`
```json
{
  "original_placement_id": "uuid",
  "replacement_placement_id": "uuid",
  "linked_at": "2026-02-10T10:00:00Z"
}
```

---

### GET /api/placements/:id/state-history

**Description:** View the complete state transition history for a placement

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "current_state": "active",
  "history": [
    {
      "from_state": null,
      "to_state": "hired",
      "transitioned_at": "2025-12-01T10:00:00Z",
      "transitioned_by": "uuid",
      "notes": "Offer accepted"
    },
    {
      "from_state": "hired",
      "to_state": "active",
      "transitioned_at": "2025-12-15T09:00:00Z",
      "transitioned_by": "uuid",
      "notes": "Candidate started work"
    }
  ]
}
```

---

### GET /api/placements/:id/guarantee

**Description:** Get guarantee period details for a placement

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "guarantee_days": 90,
  "activated_at": "2025-12-15T09:00:00Z",
  "guarantee_end_date": "2026-03-15",
  "days_remaining": 91,
  "is_active": true
}
```

---

### POST /api/placements/:id/guarantee/extend

**Description:** Extend the guarantee period for a placement

**Authorization:** Requires `company_admin` or `platform_admin` role

**Request Body:**
```json
{
  "additional_days": 30,
  "reason": "Onboarding extended due to project delays"
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "original_guarantee_days": 90,
  "new_guarantee_days": 120,
  "new_guarantee_end_date": "2026-04-14",
  "extended_at": "2026-03-10T10:00:00Z"
}
```

---

## Placement Collaboration

### POST /api/placements/:id/collaborators

**Description:** Add a collaborator to a placement with a specific role and split

**Authorization:** Requires `recruiter`, `company_admin`, or `platform_admin` role

**Request Body:**
```json
{
  "recruiter_id": "uuid",
  "role": "support",
  "split_percentage": 10,
  "notes": "Helped with technical screening"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "placement_id": "uuid",
  "recruiter_id": "uuid",
  "role": "support",
  "split_percentage": 10,
  "amount_earned": 2500,
  "added_at": "2025-12-14T10:00:00Z"
}
```

**Errors:**
- `400` - Total splits exceed 100%
- `404` - Placement or recruiter not found

---

### GET /api/placements/:id/collaborators

**Description:** List all collaborators for a placement with their splits

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "total_fee": 25000,
  "collaborators": [
    {
      "recruiter_id": "uuid",
      "recruiter_name": "Jane Smith",
      "role": "sourcer",
      "split_percentage": 40,
      "amount_earned": 10000
    },
    {
      "recruiter_id": "uuid",
      "recruiter_name": "John Doe",
      "role": "submitter",
      "split_percentage": 30,
      "amount_earned": 7500
    },
    {
      "recruiter_id": "uuid",
      "recruiter_name": "Bob Johnson",
      "role": "closer",
      "split_percentage": 20,
      "amount_earned": 5000
    },
    {
      "recruiter_id": "uuid",
      "recruiter_name": "Alice Williams",
      "role": "support",
      "split_percentage": 10,
      "amount_earned": 2500
    }
  ]
}
```

---

### PATCH /api/placements/:id/collaborators/:recruiter_id

**Description:** Update a collaborator's split percentage

**Authorization:** Requires `recruiter`, `company_admin`, or `platform_admin` role

**Request Body:**
```json
{
  "split_percentage": 15,
  "notes": "Increased for additional support"
}
```

**Response:** `200 OK`
```json
{
  "placement_id": "uuid",
  "recruiter_id": "uuid",
  "role": "support",
  "old_split_percentage": 10,
  "new_split_percentage": 15,
  "new_amount_earned": 3750
}
```

---

### POST /api/placements/calculate-splits

**Description:** Preview split calculation without creating a placement

**Authorization:** Authenticated users

**Request Body:**
```json
{
  "total_fee": 25000,
  "collaborators": [
    { "role": "sourcer", "split_percentage": 40 },
    { "role": "submitter", "split_percentage": 30 },
    { "role": "closer", "split_percentage": 20 },
    { "role": "support", "split_percentage": 10 }
  ]
}
```

**Response:** `200 OK`
```json
{
  "total_fee": 25000,
  "splits": [
    { "role": "sourcer", "split_percentage": 40, "amount": 10000 },
    { "role": "submitter", "split_percentage": 30, "amount": 7500 },
    { "role": "closer", "split_percentage": 20, "amount": 5000 },
    { "role": "support", "split_percentage": 10, "amount": 2500 }
  ],
  "total_split_percentage": 100,
  "valid": true
}
```

---

## Proposals

### POST /api/proposals

**Description:** Create a candidate proposal for a job

**Authorization:** Requires `recruiter` role

**Request Body:**
```json
{
  "candidate_id": "uuid",
  "job_id": "uuid",
  "pitch": "Jane has 5 years of ML experience at top tech companies...",
  "expected_salary": 150000
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "job_id": "uuid",
  "recruiter_id": "uuid",
  "state": "proposed",
  "pitch": "Jane has 5 years of ML experience...",
  "expected_salary": 150000,
  "proposed_at": "2025-12-14T10:00:00Z",
  "expires_at": "2025-12-21T10:00:00Z"
}
```

**Errors:**
- `400` - Candidate not owned by recruiter or proposal already exists
- `404` - Candidate or job not found

---

### GET /api/proposals/:id

**Description:** Get details of a specific proposal

**Authorization:** Authenticated users (recruiter or company users)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "candidate_id": "uuid",
  "candidate_name": "Jane Smith",
  "job_id": "uuid",
  "job_title": "Senior ML Engineer",
  "recruiter_id": "uuid",
  "recruiter_name": "John Doe",
  "state": "company_reviewing",
  "pitch": "Jane has 5 years of ML experience...",
  "expected_salary": 150000,
  "proposed_at": "2025-12-14T10:00:00Z",
  "reviewed_at": null,
  "expires_at": "2025-12-21T10:00:00Z"
}
```

---

### POST /api/proposals/:id/accept

**Description:** Accept a candidate proposal

**Authorization:** Requires `company_admin`, `hiring_manager`, or `platform_admin` role

**Request Body:**
```json
{
  "notes": "Great fit for the team, let's proceed with interviews"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "state": "accepted",
  "accepted_at": "2025-12-15T14:00:00Z",
  "reviewed_by": "uuid",
  "notes": "Great fit for the team, let's proceed with interviews"
}
```

---

### POST /api/proposals/:id/decline

**Description:** Decline a candidate proposal

**Authorization:** Requires `company_admin`, `hiring_manager`, or `platform_admin` role

**Request Body:**
```json
{
  "decline_reason": "overqualified",
  "notes": "Salary expectations too high for this role"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "state": "declined",
  "declined_at": "2025-12-15T14:00:00Z",
  "reviewed_by": "uuid",
  "decline_reason": "overqualified",
  "notes": "Salary expectations too high for this role"
}
```

---

### GET /api/recruiters/:id/proposals

**Description:** List all proposals for a specific recruiter

**Authorization:** Authenticated users

**Query Parameters:**
- `state` (optional): Filter by proposal state (proposed, accepted, declined, etc.)
- `job_id` (optional): Filter by specific job
- `limit` (optional): Max results (default 50)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "recruiter_id": "uuid",
  "total": 15,
  "proposals": [
    {
      "id": "uuid",
      "candidate_name": "Jane Smith",
      "job_title": "Senior ML Engineer",
      "state": "accepted",
      "proposed_at": "2025-12-14T10:00:00Z"
    }
  ]
}
```

---

### GET /api/jobs/:id/proposals

**Description:** List all proposals for a specific job

**Authorization:** Company users and admins

**Query Parameters:**
- `state` (optional): Filter by proposal state
- `limit` (optional): Max results (default 50)
- `offset` (optional): Pagination offset

**Response:** `200 OK`
```json
{
  "job_id": "uuid",
  "job_title": "Senior ML Engineer",
  "total": 8,
  "proposals": [
    {
      "id": "uuid",
      "candidate_name": "Jane Smith",
      "recruiter_name": "John Doe",
      "state": "company_reviewing",
      "proposed_at": "2025-12-14T10:00:00Z",
      "expires_at": "2025-12-21T10:00:00Z"
    }
  ]
}
```

---

### POST /api/proposals/process-timeouts

**Description:** Process all expired proposals (sets state to 'timeout')

**Authorization:** Requires `platform_admin` role

**Response:** `200 OK`
```json
{
  "processed": 5,
  "timed_out_proposals": [
    {
      "id": "uuid",
      "candidate_name": "John Smith",
      "job_title": "Backend Engineer",
      "proposed_at": "2025-12-07T10:00:00Z",
      "expired_at": "2025-12-14T10:00:00Z"
    }
  ]
}
```

---

## Reputation

### GET /api/recruiters/:id/reputation

**Description:** Get reputation score and metrics for a recruiter

**Authorization:** Authenticated users

**Response:** `200 OK`
```json
{
  "recruiter_id": "uuid",
  "recruiter_name": "John Doe",
  "reputation_score": 87,
  "total_placements": 45,
  "successful_placements": 42,
  "failed_placements": 3,
  "hire_rate": 0.35,
  "completion_rate": 0.93,
  "collaboration_score": 92,
  "avg_response_time_hours": 4.5,
  "last_updated": "2025-12-14T10:00:00Z"
}
```

---

### POST /api/recruiters/:id/reputation/recalculate

**Description:** Trigger reputation recalculation for a recruiter

**Authorization:** Requires `platform_admin` role

**Response:** `200 OK`
```json
{
  "recruiter_id": "uuid",
  "old_score": 85,
  "new_score": 87,
  "recalculated_at": "2025-12-14T10:00:00Z",
  "changes": {
    "hire_rate": { "old": 0.33, "new": 0.35 },
    "completion_rate": { "old": 0.91, "new": 0.93 }
  }
}
```

---

### GET /api/reputation/leaderboard

**Description:** Get the top recruiters by reputation score

**Authorization:** Authenticated users

**Query Parameters:**
- `limit` (optional): Number of results (default 10, max 100)
- `time_period` (optional): Filter by time period (all_time, last_year, last_month)

**Response:** `200 OK`
```json
{
  "time_period": "last_year",
  "updated_at": "2025-12-14T10:00:00Z",
  "leaderboard": [
    {
      "rank": 1,
      "recruiter_id": "uuid",
      "recruiter_name": "Alice Johnson",
      "reputation_score": 95,
      "total_placements": 67,
      "hire_rate": 0.42
    },
    {
      "rank": 2,
      "recruiter_id": "uuid",
      "recruiter_name": "John Doe",
      "reputation_score": 87,
      "total_placements": 45,
      "hire_rate": 0.35
    }
  ]
}
```

---

### GET /api/recruiters/:id/reputation/history

**Description:** Get historical reputation score changes

**Authorization:** Authenticated users

**Query Parameters:**
- `limit` (optional): Number of results (default 30)
- `start_date` (optional): Start date for history (ISO 8601)
- `end_date` (optional): End date for history (ISO 8601)

**Response:** `200 OK`
```json
{
  "recruiter_id": "uuid",
  "history": [
    {
      "date": "2025-12-14",
      "reputation_score": 87,
      "hire_rate": 0.35,
      "completion_rate": 0.93,
      "total_placements": 45
    },
    {
      "date": "2025-11-14",
      "reputation_score": 85,
      "hire_rate": 0.33,
      "completion_rate": 0.91,
      "total_placements": 42
    }
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

### 400 Bad Request
```json
{
  "error": "Bad Request",
  "message": "Candidate already sourced by another recruiter",
  "statusCode": 400
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required",
  "statusCode": 401
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden",
  "message": "Access denied: insufficient permissions",
  "statusCode": 403
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Candidate not found",
  "statusCode": 404
}
```

### 409 Conflict
```json
{
  "error": "Conflict",
  "message": "Proposal already exists for this candidate and job",
  "statusCode": 409
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "statusCode": 500
}
```

---

## Rate Limiting

All API endpoints are rate-limited:

- **Anonymous requests:** 100 requests per 15 minutes
- **Authenticated requests:** 1000 requests per 15 minutes
- **Admin requests:** Unlimited

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1702562400
```

---

## Changelog

### Version 1.0 (December 14, 2025)
- Initial Phase 2 API release
- Added 27 new endpoints across 5 categories
- Implemented RBAC for all Phase 2 routes
- Added OpenAPI documentation tags

---

## Support

For API support or questions:
- Documentation: https://docs.splits.network
- Email: api-support@splits.network
- GitHub Issues: https://github.com/splits-network/splits/issues
