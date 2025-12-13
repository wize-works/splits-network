# RBAC Implementation Guide

## Overview

Role-Based Access Control (RBAC) has been implemented in the API Gateway to enforce authorization rules based on user roles managed internally by the Splits Network platform. **We do not use Clerk's role system** - all roles are stored and managed in our `identity.memberships` table.

## Architecture

### Role Management
- **Roles are managed internally** in the `identity.memberships` table
- Each user can have multiple memberships across different organizations
- Each membership has a `role` field with one of these values:
  - `recruiter` - Independent recruiter who submits candidates
  - `company_admin` - Company administrator who manages jobs and candidates
  - `hiring_manager` - Company user who can move candidates through stages
  - `platform_admin` - Splits Network administrator with full access

### Authentication vs Authorization Flow

1. **Authentication (Clerk)** - API Gateway verifies JWT token from Clerk
2. **User Context Resolution** - Gateway fetches user profile + memberships from Identity Service
3. **Authorization (RBAC)** - Gateway checks if user has required role(s) for the endpoint

## Implementation Details

### Files Created/Modified

#### 1. `services/api-gateway/src/rbac.ts` (NEW)
Contains RBAC middleware and helper functions:

**Key Functions:**
- `requireRoles(allowedRoles: UserRole[])` - Middleware factory that checks if user has any of the allowed roles
- `hasRole(auth, role)` - Check if user has a specific role
- `hasAnyRole(auth, roles)` - Check if user has any of the specified roles
- `isAdmin(auth)` - Check if user is a platform admin
- `isRecruiter(auth)` - Check if user is a recruiter
- `isCompanyUser(auth)` - Check if user is a company admin or hiring manager
- `getUserOrganizationIds(auth)` - Get all organization IDs user belongs to
- `belongsToOrganization(auth, orgId)` - Check if user belongs to specific org

#### 2. `services/api-gateway/src/auth.ts` (MODIFIED)
Updated `AuthContext` interface to include memberships:

```typescript
export interface AuthContext {
    userId: string;
    clerkUserId: string;
    email: string;
    name: string;
    memberships: MembershipContext[];  // NEW
}
```

#### 3. `services/api-gateway/src/routes.ts` (MODIFIED)
- Added `resolveUserContext()` function that fetches user profile + memberships
- Added middleware hook to resolve user context for all `/api/*` requests
- Applied RBAC rules to all endpoints using `preHandler` hooks

## Endpoint Access Rules

### Jobs
- **GET /api/jobs** - Any authenticated user (later will filter by recruiter assignments)
- **GET /api/jobs/:id** - Any authenticated user
- **POST /api/jobs** - `company_admin` or `platform_admin` only
- **PATCH /api/jobs/:id** - `company_admin` or `platform_admin` only

### Applications
- **GET /api/applications/:id** - Any authenticated user
- **GET /api/jobs/:jobId/applications** - Any authenticated user
- **POST /api/applications** - `recruiter` only
- **PATCH /api/applications/:id/stage** - `company_admin`, `hiring_manager`, or `platform_admin`

### Placements
- **GET /api/placements** - Any authenticated user
- **GET /api/placements/:id** - Any authenticated user
- **POST /api/placements** - `company_admin` or `platform_admin` only

### Recruiters
- **GET /api/recruiters** - `platform_admin` only
- **GET /api/recruiters/:id** - Any authenticated user
- **POST /api/recruiters** - Any authenticated user (creates their own profile)
- **GET /api/recruiters/:recruiterId/jobs** - Any authenticated user

### Role Assignments
- **POST /api/assignments** - `platform_admin` only

### Billing
- **GET /api/plans** - Any authenticated user
- **GET /api/subscriptions/recruiter/:recruiterId** - Any authenticated user (TODO: add ownership check)
- **POST /api/subscriptions** - `recruiter` only

### Companies
- **POST /api/companies** - `company_admin` or `platform_admin` only

## Usage Examples

### Protecting a Route with RBAC

```typescript
// Only platform admins can access this route
app.get('/api/admin/analytics', {
    preHandler: requireRoles(['platform_admin']),
}, async (request, reply) => {
    // Implementation
});

// Multiple roles allowed
app.post('/api/jobs', {
    preHandler: requireRoles(['company_admin', 'platform_admin']),
}, async (request, reply) => {
    // Implementation
});
```

### Using Helper Functions in Route Logic

```typescript
app.get('/api/custom-endpoint', async (request, reply) => {
    const req = request as AuthenticatedRequest;
    
    if (isAdmin(req.auth)) {
        // Admin sees everything
        return getAllData();
    } else if (isRecruiter(req.auth)) {
        // Recruiter sees only their data
        return getRecruiterData(req.auth.userId);
    } else {
        throw new ForbiddenError('Access denied');
    }
});
```

## Error Handling

When a user lacks required permissions:
- **Status Code**: 403 Forbidden
- **Error Response**:
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied. Required roles: company_admin or platform_admin. Your roles: recruiter"
  }
}
```

When a user has no memberships:
- **Status Code**: 403 Forbidden
- **Error Message**: "No organization memberships found. Please contact an administrator."

## Future Enhancements

### 1. Resource-Level Authorization
Currently, RBAC only checks role-based access. Next steps:
- Check if recruiter owns the application before allowing updates
- Check if company user belongs to the company that owns the job
- Check if user can only view their own subscription data

### 2. Recruiter-Specific Job Filtering
- Filter `/api/jobs` by role assignments (recruiters only see jobs they're assigned to)
- Implement in network-service and call from API Gateway

### 3. Organization Context
- Add organization switching for users with multiple memberships
- Filter data by active organization context

### 4. Audit Logging
- Log all authorization decisions (allow/deny) for security audits
- Track which user accessed which resources with what roles

### 5. Role Hierarchy
- Implement role hierarchy (e.g., platform_admin inherits all other roles)
- Simplify permission checks

## Testing RBAC

### Setup Test Users

1. **Create a recruiter user:**
```sql
INSERT INTO identity.users (id, clerk_user_id, email, name)
VALUES ('user-recruiter-1', 'clerk_123', 'recruiter@test.com', 'Test Recruiter');

INSERT INTO identity.memberships (user_id, organization_id, role)
VALUES ('user-recruiter-1', 'org-1', 'recruiter');
```

2. **Create a company admin user:**
```sql
INSERT INTO identity.users (id, clerk_user_id, email, name)
VALUES ('user-company-1', 'clerk_456', 'admin@company.com', 'Company Admin');

INSERT INTO identity.memberships (user_id, organization_id, role)
VALUES ('user-company-1', 'org-company-1', 'company_admin');
```

3. **Create a platform admin:**
```sql
INSERT INTO identity.users (id, clerk_user_id, email, name)
VALUES ('user-admin-1', 'clerk_789', 'admin@splits.network', 'Platform Admin');

INSERT INTO identity.memberships (user_id, organization_id, role)
VALUES ('user-admin-1', 'org-platform', 'platform_admin');
```

### Test Cases

1. **Recruiter tries to create a job** → Should fail with 403
2. **Company admin creates a job** → Should succeed
3. **Recruiter submits candidate** → Should succeed
4. **Company admin changes candidate stage** → Should succeed
5. **Recruiter tries to access all recruiters** → Should fail with 403
6. **Platform admin accesses all recruiters** → Should succeed

## Security Considerations

1. **Always validate role membership server-side** - Never trust client claims
2. **User context is resolved on every request** - Ensures up-to-date permissions
3. **Memberships are fetched from Identity Service** - Single source of truth
4. **Authorization failures are logged** - For security monitoring
5. **Roles are checked before calling downstream services** - Fail fast at gateway

## Deployment Notes

- No environment variables needed for RBAC
- All role data comes from database via Identity Service
- API Gateway must have network access to Identity Service
- Ensure Identity Service is running before starting API Gateway
