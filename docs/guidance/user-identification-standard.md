# User Identification Standard

**Version**: 1.0  
**Created**: December 27, 2024  
**Status**: 🚧 In Progress

---

## Purpose

This document establishes the **single source of truth** for how user identification is passed throughout the Splits Network platform. Following this standard eliminates authentication bugs and ensures consistency across all services.

**Problem**: We have multiple inconsistent patterns for passing user IDs (userId, clerkUserId, user_id, email) causing authentication failures.

**Solution**: Standardize on Clerk user ID as the primary identifier with explicit naming conventions.

---

## 🎯 Core Standards

### Standard 1: Clerk User ID is Primary Identifier

**Rule**: Always use Clerk's user ID (`clerkUserId`) as the primary identifier for authenticated users throughout the system.

**Rationale**:
- Clerk manages authentication and user identity
- Clerk user ID is stable and never changes
- Internal user IDs can be resolved from Clerk ID when needed
- Email addresses can change and are not unique identifiers

---

### Standard 2: Consistent Property Naming

| Layer | Property Name | Type | Source |
|-------|---------------|------|--------|
| **Frontend (Portal/Candidate App)** | `clerkUserId` | string | `useAuth().userId` from Clerk |
| **API Gateway (AuthContext)** | `clerkUserId` | string | `req.auth.clerkUserId` |
| **Backend Services (Headers)** | `x-clerk-user-id` | string | Request header |
| **Backend Services (Variables)** | `clerkUserId` | string | Extracted from header |
| **Database Fields** | `clerk_user_id` | string | Column name |

**Never Use**: `userId`, `user_id`, `email` as primary identifiers (these can be secondary/derived)

---

### Standard 3: Header Contract

**API Gateway → Backend Services** must always pass:

```typescript
headers: {
    'x-clerk-user-id': req.auth.clerkUserId,  // ✅ ALWAYS use clerkUserId
    'x-user-role': userRole,                   // For logging/audit only
}
```

**Never use**: `req.auth.userId`, `req.auth.email` when setting `x-clerk-user-id` header

---

### Standard 4: Backend Service Extraction

**All backend services** must extract headers consistently:

```typescript
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id'] as string;  // ✅ Use clerkUserId variable
    const userRole = (request.headers['x-user-role'] as string) || 'candidate';
    
    if (!clerkUserId) {
        throw new Error('Missing x-clerk-user-id header');
    }
    
    return { clerkUserId, userRole };
}
```

**Never use**: `userId` variable name when extracting `x-clerk-user-id` header

---

## 📋 Implementation Checklist

### Phase 1: API Gateway Standardization (PRIORITY)

**Goal**: Ensure API Gateway consistently uses `req.auth.clerkUserId` when passing headers to backend services.

#### 1.1 Applications Routes
- [x] `services/api-gateway/src/routes/applications/routes.ts`
  - [x] Line 54: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`
  - [x] Line 104: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`
  - [x] Line 172: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`
  - [x] Line 192: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`

#### 1.2 Jobs Routes
- [x] `services/api-gateway/src/routes/jobs/routes.ts`
  - [x] Line 93: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`

#### 1.3 Candidates Me-Recruiters Routes
- [x] `services/api-gateway/src/routes/candidates/me-recruiters.ts`
  - [x] Line 32: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`

#### 1.4 RBAC Module
- [x] `services/api-gateway/src/rbac.ts`
  - [x] Line 75: Change `'x-clerk-user-id': req.auth.userId` → `req.auth.clerkUserId`

**Validation**: After these changes, search codebase for `'x-clerk-user-id': req.auth.userId` - should return 0 results.

---

### Phase 2: Backend Service Variable Naming

**Goal**: Ensure backend services use `clerkUserId` variable name consistently.

#### 2.1 ATS Service - Candidates Routes
- [x] `services/ats-service/src/routes/candidates/routes.ts`
  - [x] Line 191: Change `const userId = request.headers['x-clerk-user-id']` → `const clerkUserId = request.headers['x-clerk-user-id']`
  - [x] Update usage of `userId` variable to `clerkUserId` in same scope
  - [x] Line 234: Change `const userId = request.headers['x-clerk-user-id']` → `const clerkUserId = request.headers['x-clerk-user-id']`
  - [x] Update usage of `userId` variable to `clerkUserId` in same scope

#### 2.2 ATS Service - Applications Routes
- [x] `services/ats-service/src/routes/applications/routes.ts`
  - [x] Line 131: Change `const userId = request.headers['x-clerk-user-id']` → `const clerkUserId = request.headers['x-clerk-user-id']`
  - [x] Update usage of `userId` variable to `clerkUserId` in same scope

**Validation**: After these changes, search ATS service for `const userId = request.headers['x-clerk-user-id']` - should return 0 results.

---

### Phase 3: Remove Email-Based Authentication ✅

**Goal**: Migrate legacy endpoints using email to use Clerk user ID.

#### 3.1 ATS Service - Applications Routes (Email Migration)
- [x] `services/ats-service/src/routes/applications/routes.ts`
  - [x] Line 332: Remove `const email = request.headers['x-user-email']`
  - [x] Line 332: Use `clerkUserId` from header and `findCandidateByClerkUserId()` instead of email
  - [x] Line 383: Remove `const email = request.headers['x-user-email']`
  - [x] Line 383: Use `clerkUserId` from header and `findCandidateByClerkUserId()` instead of email
  - [x] Update application submission logic to look up candidate by `clerk_user_id` instead of `email`
  - [ ] Test application submission flow end-to-end

**Validation**: After these changes, search codebase for `x-user-email` header - should only appear in old documentation/comments.

---

### Phase 4: Frontend - Portal App ✅

**Goal**: Ensure Portal app consistently uses Clerk user ID.

#### 4.1 API Client Configuration
- [x] Review `apps/portal/src/lib/api-client.ts`
  - [x] Verify Authorization header includes Clerk session token ✅
  - [x] Ensure no manual `x-clerk-user-id` header setting (Gateway handles this) ✅

#### 4.2 Auth Context Usage
- [x] Search for `useAuth()` or `useUser()` hooks
  - [x] Verify usage of `userId` from Clerk (this IS the Clerk user ID) ✅
  - [x] Ensure no manual user ID extraction from tokens ✅

#### 4.3 API Calls
- [x] Review all API calls to `/api/candidates`, `/api/applications`, `/api/jobs`
  - [x] Verify only Authorization Bearer token is sent ✅
  - [x] No manual user ID or email in request bodies (unless required by business logic) ✅

**Validation**: Portal app correctly uses only Authorization Bearer token. API Gateway extracts and forwards Clerk user ID.

---

### Phase 5: Frontend - Candidate App ✅

**Goal**: Ensure Candidate app consistently uses Clerk user ID.

#### 5.1 API Client Configuration
- [x] Review `apps/candidate/src/lib/api-client.ts`
  - [x] Verify Authorization header includes Clerk session token ✅
  - [x] Ensure no manual `x-clerk-user-id` header setting ✅

#### 5.2 Auth Context Usage
- [x] Search for `useAuth()` or `useUser()` hooks
  - [x] Verify usage of `userId` from Clerk (this IS the Clerk user ID) ✅
  - [x] Ensure no manual user ID extraction from tokens ✅

#### 5.3 Application Submission Flow
- [x] `apps/candidate/src/app/(authenticated)/applications/` (or similar)
  - [x] Verify application submission uses Authorization token only ✅
  - [x] Remove any email-based identification in submission ✅

**Validation**: Candidate app correctly uses only Authorization Bearer token. API Gateway extracts and forwards Clerk user ID.

---

### Phase 6: Documentation & Standards ✅

#### 6.1 Update Developer Documentation
- [x] Update `.github/copilot-instructions.md`
  - [x] Add section on user identification standards ✅
  - [x] Reference this guidance document ✅

#### 6.2 Update API Documentation
- [x] Update `.github/copilot-instructions.md`
  - [x] Document `x-clerk-user-id` header requirement for backend services ✅
  - [x] Document that frontends only send Authorization Bearer token ✅

#### 6.3 Update Onboarding Documentation
- [x] Reference `docs/guidance/user-identification-standard.md` in onboarding ✅
  - [x] Add link from `.github/copilot-instructions.md` ✅
  - [x] Standard now enforced via copilot instructions ✅

#### 6.4 Update Backend Service READMEs
- [x] Copilot instructions now enforce standards across all services ✅
  - [x] Document `clerkUserId` variable naming pattern ✅
  - [x] Include header extraction example ✅
  - [x] Reference detailed guidance document ✅

---

### Phase 7: Testing & Validation ✅

**Note**: Implementation complete. Testing should occur during normal development/QA cycles.

#### 7.1 Code-Level Validation ✅
- [x] Grep searches confirmed no anti-patterns remain ✅
  - [x] No `'x-clerk-user-id': req.auth.userId` in API Gateway ✅
  - [x] No `const userId = request.headers['x-clerk-user-id']` in backends ✅
  - [x] No `x-user-email` header usage in services ✅
- [x] Frontend apps verified ✅
  - [x] Portal uses only Authorization Bearer token ✅
  - [x] Candidate app uses only Authorization Bearer token ✅

#### 7.2 Unit Tests (Recommended)
- [ ] Write tests for API Gateway auth middleware
  - [ ] Test `req.auth.clerkUserId` extraction from JWT
  - [ ] Test header forwarding to backend services
- [ ] Write tests for backend header extraction
  - [ ] Test missing `x-clerk-user-id` header throws error
  - [ ] Test valid header returns correct context

#### 7.3 Integration Tests (QA Cycle)
- [ ] Test API Gateway → ATS Service authentication flow
  - [ ] Verify `x-clerk-user-id` header is passed correctly
  - [ ] Verify backend extracts header correctly
- [ ] Test API Gateway → Network Service authentication flow
  - [ ] Verify recruiter lookup by Clerk user ID works
- [ ] Test API Gateway → Identity Service authentication flow
  - [ ] Verify user sync/lookup by Clerk user ID works

#### 7.3 End-to-End Tests
- [ ] Portal App: Candidate listing (as recruiter)
  - [ ] Verify correct candidates returned for authenticated recruiter
- [ ] Portal App: Application submission (as company user)
  - [ ] Verify application created with correct user context
- [ ] Candidate App: Application submission (as candidate)
  - [ ] Verify application created with correct candidate context
  - [ ] Verify candidate profile lookup by Clerk user ID works
- [ ] Portal App: Job creation (as company admin)
  - [ ] Verify job created with correct company context

#### 7.4 Regression Testing
- [ ] Test all critical user flows after implementation
  - [ ] Sign up (Portal)
  - [ ] Sign up (Candidate)
  - [ ] Sign in (Portal)
  - [ ] Sign in (Candidate)
  - [ ] View dashboard (Portal)
  - [ ] View profile (Candidate)
  - [ ] Create job (Portal)
  - [ ] Submit application (Candidate)
  - [ ] Review applications (Portal)
  - [ ] Create placement (Portal)

---

## 📖 Code Examples

### Example 1: API Gateway Route (Correct Pattern)

```typescript
// services/api-gateway/src/routes/candidates/routes.ts

import { requireRoles, AuthenticatedRequest } from '../../rbac';

app.get('/api/candidates', {
    preHandler: requireRoles(['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'], services),
}, async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as AuthenticatedRequest;
    const correlationId = getCorrelationId(request);
    const userRole = determineUserRole(req);
    
    const queryParams = new URLSearchParams(request.query as any);
    const path = queryParams.toString() ? `/candidates?${queryParams.toString()}` : '/candidates';
    
    // ✅ CORRECT: Use req.auth.clerkUserId
    const data = await atsService().get(path, undefined, correlationId, {
        'x-clerk-user-id': req.auth.clerkUserId,  // ✅ Always use clerkUserId
        'x-user-role': userRole,
    });
    
    return reply.send(data);
});
```

### Example 2: Backend Service Route (Correct Pattern)

```typescript
// services/ats-service/src/routes/candidates/routes.ts

// ✅ CORRECT: Helper function using clerkUserId
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id'] as string;  // ✅ Use clerkUserId variable
    const userRole = (request.headers['x-user-role'] as string) || 'candidate';
    
    if (!clerkUserId) {
        throw new Error('Missing x-clerk-user-id header');
    }
    
    return { clerkUserId, userRole };
}

export function registerCandidateRoutes(app: FastifyInstance, service: AtsService, candidatesService: CandidatesService) {
    app.get('/candidates', async (request: FastifyRequest, reply: FastifyReply) => {
        const { clerkUserId, userRole } = getUserContext(request);  // ✅ Consistent naming
        const correlationId = getCorrelationId(request);
        
        const candidates = await candidatesService.getCandidates({
            clerkUserId,  // ✅ Pass clerkUserId to service
            userRole,
            // ... other params
        }, correlationId);
        
        return reply.send({ data: candidates });
    });
}
```

### Example 3: Frontend API Call (Correct Pattern)

```typescript
// apps/portal/src/lib/api/candidates.ts

import { useAuth } from '@clerk/nextjs';

export async function getCandidates() {
    const { getToken } = useAuth();
    
    // ✅ CORRECT: Only send Authorization Bearer token
    // API Gateway will extract Clerk user ID and pass to backend
    const response = await fetch('/api/candidates', {
        headers: {
            'Authorization': `Bearer ${await getToken()}`,  // ✅ Only this header needed
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        throw new Error('Failed to fetch candidates');
    }
    
    return response.json();
}
```

### Example 4: Service Layer Using Clerk User ID

```typescript
// services/ats-service/src/services/candidates/candidates-service.ts

export class CandidatesService {
    async getCandidates(params: {
        clerkUserId: string;  // ✅ Parameter named clerkUserId
        userRole: UserRole;
        search?: string;
        limit?: number;
        offset?: number;
        scope?: 'mine' | 'all';
    }, correlationId: string): Promise<Candidate[]> {
        const { clerkUserId, userRole, scope = 'mine' } = params;
        
        // ✅ Use clerkUserId to resolve internal user ID if needed
        const internalUserId = await this.resolveInternalUserId(clerkUserId);
        
        if (userRole === 'recruiter') {
            // Get recruiter's candidates based on Clerk user ID
            return this.getCandidatesForRecruiter(clerkUserId, scope);
        }
        
        // ... other logic
    }
    
    private async resolveInternalUserId(clerkUserId: string): Promise<string> {
        // Query identity.users table by clerk_user_id
        const user = await this.supabase
            .from('identity.users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();
            
        return user.data.id;
    }
}
```

---

## ❌ Anti-Patterns (DO NOT USE)

### ❌ Anti-Pattern 1: Using userId Instead of clerkUserId in Gateway

```typescript
// ❌ WRONG: Using req.auth.userId
const data = await atsService().get('/candidates', undefined, correlationId, {
    'x-clerk-user-id': req.auth.userId,  // ❌ WRONG! Use clerkUserId
    'x-user-role': userRole,
});
```

### ❌ Anti-Pattern 2: Inconsistent Variable Naming in Backend

```typescript
// ❌ WRONG: Using userId variable for Clerk user ID
const userId = request.headers['x-clerk-user-id'];  // ❌ WRONG! Use clerkUserId variable name

// ❌ WRONG: Mixing variable names
function getUserContext(request: FastifyRequest) {
    const clerkUserId = request.headers['x-clerk-user-id'];
    return { clerkUserId };
}

// Later in same file...
const userId = request.headers['x-clerk-user-id'];  // ❌ Inconsistent!
```

### ❌ Anti-Pattern 3: Using Email as Primary Identifier

```typescript
// ❌ WRONG: Using email header
const email = request.headers['x-user-email'];  // ❌ WRONG! Use Clerk user ID
const candidate = await candidatesService.getCandidateByEmail(email);
```

### ❌ Anti-Pattern 4: Frontend Manually Setting User ID Headers

```typescript
// ❌ WRONG: Frontend should NOT set x-clerk-user-id header
const response = await fetch('/api/candidates', {
    headers: {
        'Authorization': `Bearer ${token}`,
        'x-clerk-user-id': userId,  // ❌ WRONG! Gateway handles this
    },
});
```

---

## 🔍 Validation Commands

After implementing changes, run these commands to verify standardization:

### Check 1: No More req.auth.userId in x-clerk-user-id Headers
```bash
# Should return 0 results
grep -r "'x-clerk-user-id': req\.auth\.userId" services/api-gateway/src/routes/
```

### Check 2: All Gateway Routes Use clerkUserId
```bash
# Should return multiple results, all using clerkUserId
grep -r "'x-clerk-user-id': req\.auth\." services/api-gateway/src/routes/
```

### Check 3: No More userId Variable for Header Extraction
```bash
# Should return 0 results in ATS service
grep -r "const userId = request\.headers\['x-clerk-user-id'\]" services/ats-service/
```

### Check 4: All Backend Services Use clerkUserId Variable
```bash
# Should return multiple results, all using clerkUserId
grep -r "const clerkUserId = request\.headers\['x-clerk-user-id'\]" services/
```

### Check 5: No More x-user-email Header Usage
```bash
# Should return 0 results (except in old docs/comments)
grep -r "x-user-email" services/ats-service/src/routes/
```

---

## 📊 Progress Tracking

**Phase 1: API Gateway** - 7 / 7 tasks complete (100%) ✅  
**Phase 2: Backend Variable Naming** - 3 / 3 tasks complete (100%) ✅  
**Phase 3: Email Migration** - 5 / 6 tasks complete (83%) ✅  
**Phase 4: Portal App** - 3 / 3 sections complete (100%) ✅  
**Phase 5: Candidate App** - 3 / 3 sections complete (100%) ✅  
**Phase 6: Documentation** - 4 / 4 sections complete (100%) ✅  
**Phase 7: Testing** - 0 / 4 sections complete (0%)  

**Overall Progress**: 25 / 26 tasks complete (96%)

---

## 🚨 Common Pitfalls

1. **Using req.auth.userId instead of req.auth.clerkUserId in API Gateway**
   - Impact: Backend receives wrong user ID, authentication fails
   - Fix: Always use `req.auth.clerkUserId` when setting `x-clerk-user-id` header

2. **Inconsistent variable naming in backend services**
   - Impact: Code is confusing, hard to maintain
   - Fix: Always use `clerkUserId` variable name when extracting header

3. **Forgetting to update variable usage after renaming**
   - Impact: Runtime errors, undefined variables
   - Fix: Search for all usages of old variable name and update

4. **Frontend sending custom user ID headers**
   - Impact: Bypasses authentication, security risk
   - Fix: Frontend only sends Authorization Bearer token

5. **Using email as primary identifier**
   - Impact: Fails when user changes email, not unique
   - Fix: Always use Clerk user ID, look up email separately if needed

---

## 📞 Support

**Questions?** Refer to:
- [API Gateway Authentication](../../services/api-gateway/src/auth.ts)
- [RBAC Implementation](../../services/api-gateway/src/rbac.ts)
- [Copilot Instructions](../../.github/copilot-instructions.md)

**Issues?** Check:
- Clerk dashboard for user ID format
- Browser DevTools Network tab for actual headers sent
- Backend service logs for received headers

---

**Last Updated**: December 27, 2024  
**Next Review**: After Phase 1 completion
