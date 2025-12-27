# User Identification Patterns Audit Report

## Executive Summary

This report documents all user identification patterns across the Splits Network codebase to enable standardization. The system currently uses **4 primary methods** of passing user identification, with **significant inconsistency** in how these are referenced.

**Key Finding**: The API Gateway uses `req.auth.clerkUserId` in some routes and `req.auth.userId` in others when passing headers to backend services, creating confusion and potential bugs.

---

## 1. User Identification Patterns Overview

### Pattern 1: HTTP Headers (Service-to-Service)
Headers passed from API Gateway → Backend Services

| Header Name | Description | Count | Used In |
|------------|-------------|-------|---------|
| `x-clerk-user-id` | Clerk's unique user identifier | **~90+ occurrences** | ATS service, API Gateway routes |
| `x-user-role` | User's role (for logging/audit) | **~90+ occurrences** | ATS service, API Gateway routes |
| `x-user-email` | User's email address | **2 occurrences** | ATS service applications routes |

**Files Using These Headers:**
- **API Gateway Routes** (passing headers):
  - `services/api-gateway/src/routes/candidates/routes.ts` - 14 instances
  - `services/api-gateway/src/routes/proposals/routes.ts` - 10 instances  
  - `services/api-gateway/src/routes/applications/routes.ts` - 6 instances
  - `services/api-gateway/src/routes/jobs/routes.ts` - 2 instances
  - `services/api-gateway/src/routes/candidates/me-recruiters.ts` - 1 instance
  - `services/api-gateway/src/rbac.ts` - 1 instance

- **ATS Service Routes** (receiving headers):
  - `services/ats-service/src/routes/candidates/routes.ts` - 5 instances
  - `services/ats-service/src/routes/applications/routes.ts` - 7 instances
  - `services/ats-service/src/routes/proposals/routes.ts` - 2 instances

---

### Pattern 2: AuthContext Properties (API Gateway)
Properties available on `req.auth` object in API Gateway after JWT verification

| Property | Type | Description | Usage Count |
|----------|------|-------------|-------------|
| `req.auth.userId` | string | Internal user ID from Identity service | **~30 occurrences** |
| `req.auth.clerkUserId` | string | Clerk's user ID | **~20 occurrences** |
| `req.auth.email` | string | User's email address | **~3 occurrences** |
| `req.auth.memberships` | array | User's organization memberships | Used for RBAC |

**Critical Inconsistency**: API Gateway uses BOTH `userId` and `clerkUserId` when setting `x-clerk-user-id` header!

#### Files Using `req.auth.userId`:
- `services/api-gateway/src/routes/applications/routes.ts` - 6 instances
- `services/api-gateway/src/routes/jobs/routes.ts` - 2 instances
- `services/api-gateway/src/routes/recruiters/routes.ts` - 2 instances
- `services/api-gateway/src/routes/marketplace/routes.ts` - 12 instances
- `services/api-gateway/src/routes/identity/routes.ts` - 5 instances
- `services/api-gateway/src/routes/notifications/routes.ts` - 6 instances
- `services/api-gateway/src/routes/recruiter-candidates/routes.ts` - 4 instances
- `services/api-gateway/src/rbac.ts` - 9 instances

#### Files Using `req.auth.clerkUserId`:
- `services/api-gateway/src/routes/candidates/routes.ts` - 14 instances
- `services/api-gateway/src/routes/proposals/routes.ts` - 10 instances
- `services/api-gateway/src/routes/identity/routes.ts` - 1 instance (cache clearing)

---

### Pattern 3: Variable Naming Conventions

| Variable Name | Context | Count | Files |
|---------------|---------|-------|-------|
| `clerkUserId` | ATS service extracting header | ~15 | candidates, applications, proposals routes |
| `userId` | ATS service (inconsistent with above) | ~10 | candidates, applications routes |
| `user_id` | Database fields, request bodies | ~100+ | Models, repositories |
| `clerk_user_id` | Database fields | ~50+ | Models, repositories |

**Example of Inconsistency in Same File:**
```typescript
// services/ats-service/src/routes/candidates/routes.ts
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id']; // Uses clerkUserId variable
    // ...
}

// Later in same file:
const userId = request.headers['x-clerk-user-id']; // Uses userId variable!
```

---

### Pattern 4: Database Schema Fields

Multiple user ID fields exist in the database with different purposes:

| Field Name | Schema | Purpose | Count |
|------------|--------|---------|-------|
| `clerk_user_id` | identity, ats | Primary Clerk user identifier | ~30 tables |
| `user_id` | identity, network, billing | Internal user ID | ~20 tables |
| `recruiter_user_id` | network | Specific to recruiter role | ~5 tables |
| `candidate_user_id` | ats | Specific to candidate role | ~5 tables |
| `sourcer_user_id` | ats | User who sourced a candidate | ~3 tables |
| `performed_by_user_id` | ats | Audit trail field | ~5 tables |
| `recipient_user_id` | notifications | Target user for notification | ~3 tables |

---

## 2. Critical Issues Found

### Issue 1: Mixed Usage of userId vs clerkUserId in API Gateway

**Problem**: API Gateway inconsistently uses `req.auth.userId` and `req.auth.clerkUserId` when passing `x-clerk-user-id` header to backend services.

**Examples**:
```typescript
// services/api-gateway/src/routes/candidates/routes.ts
headers: {
    'x-clerk-user-id': req.auth.clerkUserId, // Uses clerkUserId ✓
}

// services/api-gateway/src/routes/applications/routes.ts  
headers: {
    'x-clerk-user-id': req.auth.userId, // Uses userId ✗
}

// services/api-gateway/src/routes/jobs/routes.ts
headers: {
    'x-clerk-user-id': req.auth.userId, // Uses userId ✗
}
```

**Impact**: 
- Confusion for developers
- Potential bugs if userId and clerkUserId differ
- Inconsistent behavior across endpoints

**Affected Files**:
- ❌ Using `req.auth.userId`: applications, jobs, candidates/me-recruiters
- ✅ Using `req.auth.clerkUserId`: candidates, proposals

---

### Issue 2: x-user-email Header Usage is Rare

**Problem**: Only 2 endpoints in ATS service use `x-user-email` header:
- `services/ats-service/src/routes/applications/routes.ts` (lines 332, 383)

**Context**: These are older endpoints for application submission that were using email before Clerk integration.

**Recommendation**: Should be migrated to use `x-clerk-user-id` like all other endpoints.

---

### Issue 3: Inconsistent Variable Naming in Backend Services

**Problem**: ATS service uses both `clerkUserId` and `userId` variable names when extracting the same `x-clerk-user-id` header.

**Example from `services/ats-service/src/routes/candidates/routes.ts`**:
```typescript
// Line 6 - function uses clerkUserId
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id'];
    return { clerkUserId, ... };
}

// Line 191 - endpoint uses userId for same header
const userId = request.headers['x-clerk-user-id'];

// Line 234 - endpoint uses userId for same header  
const userId = request.headers['x-clerk-user-id'];
```

**Impact**: Makes code harder to understand and maintain.

---

## 3. Standardization Recommendations

### Recommendation 1: Standardize Header Source in API Gateway

**Action**: Always use `req.auth.clerkUserId` when passing `x-clerk-user-id` header to backend services.

**Rationale**: 
- `clerkUserId` explicitly indicates this is Clerk's identifier
- Matches the header name `x-clerk-user-id`
- More clear and self-documenting

**Files to Update**:
1. `services/api-gateway/src/routes/applications/routes.ts` - 4 instances (lines 54, 104, 172, 192)
2. `services/api-gateway/src/routes/jobs/routes.ts` - 1 instance (line 93)
3. `services/api-gateway/src/routes/candidates/me-recruiters.ts` - 1 instance (line 32)
4. `services/api-gateway/src/rbac.ts` - 1 instance (line 75)

**Total Changes**: 7 instances across 4 files

---

### Recommendation 2: Standardize Variable Naming in Backend Services

**Action**: Always use `clerkUserId` when extracting `x-clerk-user-id` header in backend services.

**Rationale**:
- Matches the header name
- Distinguishes from internal `user_id` database fields
- Consistent with API Gateway usage

**Files to Update**:
1. `services/ats-service/src/routes/candidates/routes.ts` - Change lines 191, 234 from `userId` to `clerkUserId`
2. `services/ats-service/src/routes/applications/routes.ts` - Change line 131 from `userId` to `clerkUserId`

**Total Changes**: 3 instances across 2 files

---

### Recommendation 3: Remove x-user-email Header Usage

**Action**: Migrate the 2 endpoints using `x-user-email` to use `x-clerk-user-id` instead.

**Rationale**:
- Email is not a reliable unique identifier
- All other endpoints use Clerk user ID
- Simplifies authentication flow

**Files to Update**:
1. `services/ats-service/src/routes/applications/routes.ts` - Lines 332, 383

**Total Changes**: 2 instances in 1 file

---

### Recommendation 4: Document Header Convention

**Action**: Create documentation specifying the header passing convention:

**Standard Headers from API Gateway to Backend Services**:
```typescript
headers: {
    'x-clerk-user-id': req.auth.clerkUserId,  // ALWAYS use clerkUserId
    'x-user-role': userRole,                   // For logging/audit only
}
```

**Standard Extraction in Backend Services**:
```typescript
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id']; // ALWAYS use clerkUserId variable
    const userRole = request.headers['x-user-role'];
    
    if (!clerkUserId) {
        throw new Error('Missing x-clerk-user-id header');
    }
    
    return { clerkUserId, userRole };
}
```

---

## 4. Implementation Plan

### Phase 1: Low-Risk Changes (No Breaking Changes)
1. ✅ Update API Gateway to use `req.auth.clerkUserId` consistently (7 changes)
2. ✅ Update ATS service variable naming to `clerkUserId` (3 changes)
3. ✅ Create header convention documentation

**Estimated Effort**: 1-2 hours
**Risk**: Very low - cosmetic changes only

---

### Phase 2: Medium-Risk Changes (Functional Changes)
1. ⚠️ Migrate `x-user-email` endpoints to use `x-clerk-user-id` (2 changes)
2. ⚠️ Test all affected endpoints thoroughly

**Estimated Effort**: 2-4 hours
**Risk**: Medium - functional change to authentication flow

---

### Phase 3: Validation & Documentation
1. 📝 Update API documentation
2. 📝 Update developer onboarding docs
3. ✅ Add linting rules to enforce conventions (optional)

**Estimated Effort**: 2-3 hours
**Risk**: None

---

## 5. Summary Statistics

| Category | Count | Details |
|----------|-------|---------|
| **Header Types** | 3 | x-clerk-user-id, x-user-role, x-user-email |
| **Header Usage (Gateway → Services)** | ~100 | Across all route files |
| **Inconsistent userId/clerkUserId** | 7 | In API Gateway routes |
| **Inconsistent Variable Names** | 3 | In ATS service routes |
| **Email-based Auth** | 2 | Legacy endpoints to migrate |
| **Total Files Affected** | 10 | 4 in Gateway, 2 in ATS, 4 docs |
| **Total Code Changes Needed** | 12 | 10 logic, 2 migration |

---

## 6. Testing Checklist

After implementing changes, test:

- [ ] Candidate listing (recruiters, admins)
- [ ] Candidate profile retrieval (self-service)
- [ ] Candidate creation (recruiters)
- [ ] Application listing
- [ ] Application creation
- [ ] Application submission (candidates)
- [ ] Job listing
- [ ] Job creation
- [ ] Proposal creation/retrieval
- [ ] Authentication flows (all user types)
- [ ] RBAC enforcement

---

## Appendix A: Complete File Inventory

### API Gateway Files Using User Identification
1. `services/api-gateway/src/auth.ts` - Defines AuthContext
2. `services/api-gateway/src/routes.ts` - Resolves user context
3. `services/api-gateway/src/rbac.ts` - RBAC checks using userId
4. `services/api-gateway/src/routes/applications/routes.ts` - ❌ Uses userId
5. `services/api-gateway/src/routes/candidates/routes.ts` - ✅ Uses clerkUserId
6. `services/api-gateway/src/routes/proposals/routes.ts` - ✅ Uses clerkUserId
7. `services/api-gateway/src/routes/jobs/routes.ts` - ❌ Uses userId
8. `services/api-gateway/src/routes/candidates/me-recruiters.ts` - ❌ Uses userId
9. `services/api-gateway/src/routes/identity/routes.ts` - Uses both
10. `services/api-gateway/src/routes/marketplace/routes.ts` - Uses userId
11. `services/api-gateway/src/routes/notifications/routes.ts` - Uses userId
12. `services/api-gateway/src/routes/recruiter-candidates/routes.ts` - Uses userId
13. `services/api-gateway/src/routes/recruiters/routes.ts` - Uses userId
14. `services/api-gateway/src/routes/roles/routes.ts` - Uses userId

### Backend Service Files Using User Identification
1. `services/ats-service/src/routes/candidates/routes.ts` - Mixed clerkUserId/userId
2. `services/ats-service/src/routes/applications/routes.ts` - Mixed clerkUserId/userId/email
3. `services/ats-service/src/routes/proposals/routes.ts` - Uses clerkUserId
4. `services/identity-service/src/routes/users/routes.ts` - Uses user_id
5. `services/identity-service/src/routes/consent/routes.ts` - Uses user_id
6. `services/network-service/src/routes/recruiters/routes.ts` - Uses user_id
7. `services/billing-service/src/routes/subscriptions/routes.ts` - Uses recruiter_id (not user_id)
8. `services/notification-service/src/routes.ts` - Uses recipient_user_id

---

**Report Generated**: [Current Date]
**Author**: GitHub Copilot
**Purpose**: Enable standardization of user identification patterns across Splits Network
