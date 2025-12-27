
# Splits Network – Copilot Instructions

These instructions tell GitHub Copilot (and Copilot Chat) how to behave when working in the **Splits Network** repository.

Splits Network is a **split-fee recruiting marketplace** with a **microservice-first** architecture and a **Next.js portal** frontend.

Copilot should prioritize **clarity, strong domain boundaries, and minimal magic**.

We should only be using @latest versions of packages unless there's a specific reason not to.

IMPORTANT: DO NOT MAKE ASSUMPTIONS, YOU MUST INVESTIGATE THE CURRENT CODEBASE AND DOCUMENTATION BEFORE SUGGESTING ANYTHING.

**Current State:** This project is actively under development with functional services and frontends. The core architecture is established and several services are operational. When generating code, follow the existing patterns in the codebase and reference `docs/guidance/` for standards.

---

## 1. Monorepo Layout & Mental Model

The repo is organized by **responsibility**, not by technology.

```txt
/ (repo root)
├─ apps/                     # User-facing frontends ONLY
│  ├─ portal/                # Main authenticated app (Next.js 16, App Router)
│  ├─ candidate/             # Candidate-facing portal (Next.js)
│  └─ corporate/             # Marketing/corporate site (Next.js)
│
├─ services/                 # Backend services / APIs / workers
│  ├─ api-gateway/           # Public API entrypoint; routes to domain services
│  ├─ identity-service/      # Users, orgs, memberships (Clerk bridge)
│  ├─ ats-service/           # Jobs, candidates, applications, placements
│  ├─ network-service/       # Recruiters, assignments, basic stats
│  ├─ billing-service/       # Plans, subscriptions, Stripe, payouts
│  ├─ notification-service/  # Event-driven email (Resend)
│  ├─ automation-service/    # AI matching, fraud detection, metrics
│  └─ document-service/      # File storage and processing (Supabase Storage)
│
├─ packages/                 # Shared code, NOT directly deployable
│  ├─ shared-types/          # Domain types, DTOs
│  ├─ shared-config/         # Config/env loader
│  ├─ shared-logging/        # Logging utilities
│  ├─ shared-fastify/        # Fastify plugins, common middleware
│  ├─ shared-clients/        # Typed HTTP/SDK clients for services
│  └─ shared-job-queue/      # Job queue abstraction (RabbitMQ)
│
├─ infra/
│  └─ k8s/                   # Raw Kubernetes YAML (Deployments, Services, Ingress)
│
└─ docs/                     # PRDs, architecture, API contracts, design docs
```

**Key rules for Copilot:**

1. **Do NOT put backend logic in `apps/`.**  
   - All APIs and business logic go in `services/*`.  
   - Next.js app should call `api-gateway`, not talk directly to domain services.
2. **Treat each service as independent.**  
   - No reaching across into other service folders at runtime.
   - Use HTTP clients in `packages/shared-clients` to call other services.
3. **Use shared packages** instead of copy-pasting common code.
4. **ALWAYS use server-side filtering, searching, pagination, and sorting for list views.**
   - Client-side filtering does NOT scale and will cause performance issues with large datasets.
   - Backend endpoints MUST support query parameters: `?page=1&limit=25&search=query&sort_by=field&sort_order=asc`
   - Backend should return enriched data with JOINs (e.g., applications with candidate, job, company data)
   - Frontend should use pagination controls and pass all filters to the server
   - Search should be debounced (300ms delay) to avoid excessive API calls
   - Example pagination response format:
     ```json
     {
       "data": [...],
       "pagination": {
         "total": 1000,
         "page": 1,
         "limit": 25,
         "total_pages": 40
       }
     }
     ```

---

## 2. Core Technologies & Integrations

Copilot should assume and suggest the following stack:

- **Frontend**
  - Next.js 16 (App Router) in `apps/portal`.
  - React + TypeScript.
  - TailwindCSS + DaisyUI for UI and theming.
  - Clerk for auth components (sign-in, sign-up, user profile), these should be custom pages/components, not clerk provided components.
  - FontAwesome for icons. inline (<i className='fa-solid fa-icon'></>) not react objects

- **Backend**
  - Node.js (current LTS) with **Fastify** in all services.
  - TypeScript for all services.
  - REST APIs with OpenAPI documentation.

- **Data & Infra**
  - Supabase Postgres with **schema-per-service**:
    - `identity.*`, `ats.*`, `network.*`, `billing.*`, `notifications.*`.
    - Each service owns its schema and migrations.
    - Supabase project-ref: `einhgkqmxbkgdohwfayv`.
    - Use Supabase MCP tools for database operations when available.
  - Kubernetes with raw YAML manifests (no Helm).
  - Redis for caching and rate limiting.
  - RabbitMQ for domain events.

- **Monorepo & Workflow**
  - **pnpm workspaces** for dependency management.
  - Commands:
    - `pnpm install` – install all dependencies (run from root).
    - `pnpm --filter <service-name> build` – build a specific service.
    - `pnpm --filter <service-name> dev` – run a service in dev mode.
    - `pnpm --filter <service-name> test` – run tests for a service.
  - Each service has its own `package.json` and can be built independently.

- **3rd Parties**
  - Clerk – authentication and user identity.
  - Stripe – recruiter subscription billing.
  - Resend – transactional email, used by `notification-service`.

Copilot should **prefer these tools by default** when generating new code.

---

## 3. Service Responsibilities (for Copilot)

When editing or generating code, Copilot should respect these boundaries:

### 3.1 `services/api-gateway`

- Verifies Clerk JWT.
- Resolves user + org (via `identity-service`).
- Applies coarse auth (recruiter vs company vs admin).
- Applies rate limiting (Redis).
- Routes requests to domain services.
- Optionally aggregates data for dashboard endpoints.

**Gateway rule:**  
No domain-specific business logic here. It should mostly proxy and enforce auth/limits.

### 3.2 `services/identity-service`

- Owns:
  - `identity.users`
  - `identity.organizations`
  - `identity.memberships`
- Syncs users from Clerk (`clerk_user_id`).
- Returns `/me` and memberships.

Copilot: keep this service focused on identity, not ATS or billing concerns.

### 3.3 `services/ats-service`

- Owns ATS domain:
  - Companies (optionally linked to `identity.organizations`).
  - Jobs / roles.
  - Candidates.
  - Applications (candidate ↔ job).
  - Stages and notes.
  - Placements (Phase 1: single recruiter per placement).

Copilot:  
When adding endpoints or models here, keep them about **jobs, candidates, applications, and placements**. Anything about recruiter permissions or subscriptions belongs to `network-service` or `billing-service`.

### 3.4 `services/network-service`

- Owns recruiter-centric data:
  - `network.recruiters`
  - `network.role_assignments`
- Answers questions like:
  - “Which jobs is this recruiter allowed to see?”
  - “Is this user an active recruiter?”

Copilot:  
Do not add ATS-like logic here. Stay focused on recruiters and their access to jobs.

### 3.5 `services/billing-service`

- Owns Stripe integration and subscription state:
  - `billing.plans`
  - `billing.subscriptions`
  - `billing.payouts` - recruiter payment tracking
- Handles Stripe webhooks.
- Provides subscription status to `api-gateway` for gating recruiter features.
- Manages payout processing and tracking.

Copilot:  
All subscription logic (free vs paid recruiter, plan changes, etc.) and payout processing belongs here.

### 3.6 `services/notification-service`

- Listens to RabbitMQ events from other services.
- Sends transactional email using **Resend**.
- Example events:
  - `application.created`
  - `application.stage_changed`
  - `placement.created`

Copilot:  
Do not embed SMTP logic elsewhere. Email sending should flow through notification-service and Resend.

### 3.7 `services/automation-service`

- AI-assisted candidate-job matching with explainable scoring.
- Fraud detection and anomaly monitoring.
- Rule-based automation execution with human approval workflows.
- Marketplace metrics aggregation and health scoring.
- Handles:
  - Match generation and review
  - Fraud signal detection and admin workflows
  - Automated actions (stage advances, notifications, etc.)
  - Daily metrics and analytics

Copilot:  
This service orchestrates intelligent automation and monitoring. Keep it focused on matching, fraud detection, automation rules, and metrics - not core ATS or billing logic.

### 3.8 `services/document-service`

- Universal document storage using Supabase Storage.
- Handles uploads for:
  - Candidate resumes and cover letters
  - Job descriptions and company documents
  - Contracts and agreements (future)
- Provides secure pre-signed URLs for uploads/downloads.
- File type validation and size limits.
- Multi-entity attachments (candidates, jobs, applications, companies).

Copilot:  
All file storage operations should go through this service. Do not implement file handling in other services.

---

## 4. Frontend Guidelines (`apps/portal`)

When Copilot generates React/Next.js code:

1. **Routing**
   - Use Next.js 16 **App Router** (`app/` directory, server components first where reasonable).
   - All authenticated routes MUST be placed in the `(authenticated)` route group folder: `app/(authenticated)/`.
   - Keep routes grouped by domain:
     - `(authenticated)/dashboard`, `(authenticated)/roles`, `(authenticated)/roles/[id]`, `(authenticated)/candidates`, `(authenticated)/placements`, `(authenticated)/admin`, etc.
   - NEVER create duplicate route groups like `(dashboard)` - always use `(authenticated)` for protected pages.

2. **Data Fetching**
   - Use fetch / Axios to call **`api-gateway`**, not individual services.
   - Handle auth via Clerk (session, tokens) and send bearer token to gateway.

3. **UI & Styling**
   - Use TailwindCSS utility classes and **DaisyUI** components (e.g. `btn`, `card`, `badge`, `alert`).
   - Prefer clean, utility-style UI similar to Lever:
     - Lots of whitespace.
     - Simple cards and tables.
     - Subtle borders and status pills.

4. **Forms & Validation**
   - Use controlled components or `react-hook-form` if already present.
   - Validate required fields (e.g., candidate name/email, job title) both client-side and server-side.
   - **IMPORTANT**: Follow the form control patterns defined in [`docs/guidance/form-controls.md`](../docs/guidance/form-controls.md).
     - Always use `fieldset` wrapper, NOT `form-control`
     - Use simple label markup: `<label className="label">Text</label>`
     - Never use `-bordered` suffixes on inputs, selects, or textareas

5. **No Business Logic in Components**
   - Components should orchestrate calls to the gateway and display data.
   - Domain rules (allowed stage transitions, fee calculations, etc.) belong in services.

---

## 5. Backend Code Style & Patterns

Copilot should follow these patterns for all services:

1. **Fastify Setup**
   - Use a central `buildServer` function (if present) per service.
   - Register routes in feature-specific modules (e.g., `routes/jobs.ts`, `routes/applications.ts`).

2. **Layering**
   - Controller/route handlers: translate HTTP ↔ DTO / service calls.
   - Service layer: domain logic (e.g., `AtsService`, `BillingService`).
   - Data layer: repository functions that talk to Postgres (via Supabase client or pg library).

3. **Error Handling**
   - Use appropriate HTTP status codes:
     - `400` for validation issues.
     - `401`/`403` for auth/permission issues.
     - `404` when a resource is not found.
     - `409` for conflicts (e.g., duplicate submissions).
   - Prefer structured errors over generic `Error` when practical.
   - Return errors in standard format: `{ error: { code: "ERROR_CODE", message: "..." } }`

4. **API Response Format**
   - **ALL successful responses MUST use**: `reply.send({ data: <payload> })`
   - **NEVER return unwrapped data**: `reply.send(payload)` is incorrect
   - See `docs/guidance/api-response-format.md` for complete standard
   - API Gateway proxies responses as-is, so backend services MUST wrap correctly
   - Frontend clients expect and unwrap the `{ data: ... }` envelope

5. **TypeScript**
   - Use explicit types and interfaces for:
     - Request DTOs.
     - Response DTOs.
     - Domain models.
   - Reuse shared types from `packages/shared-types` wherever possible.

6. **Config & Secrets**
   - Use `packages/shared-config` to load environment variables.
   - Never hardcode API keys (Stripe, Resend, Clerk, etc.).
   - Assume Kubernetes Secrets are wired to env vars.

7. **Database Migrations**
   - Each service owns migrations for its schema only.
   - Use Supabase migration tools or SQL migration files.
   - Never create hard foreign keys across schemas unless absolutely necessary.
   - Prefer referencing by ID and resolving via service calls.
   - Example: `ats.companies.identity_organization_id` references `identity.organizations.id` logically, not via DB FK.

8. **User Identification Standards** ⚠️ **CRITICAL**
   - **Frontend apps** (Portal, Candidate): 
     - Send **ONLY** Authorization Bearer token (Clerk JWT)
     - **NEVER** manually set `x-clerk-user-id` or user ID headers
   - **API Gateway**:
     - Extract Clerk user ID from verified JWT
     - **ALWAYS** use `req.auth.clerkUserId` when setting `x-clerk-user-id` header to backend services
     - **NEVER** use `req.auth.userId` (internal ID) when setting headers
   - **Backend Services**:
     - Extract user ID from headers: `const clerkUserId = request.headers['x-clerk-user-id'] as string;`
     - **ALWAYS** use variable name `clerkUserId` (not `userId`) for clarity
     - **NEVER** use `x-user-email` header for authentication (removed - security risk)
     - Look up candidates/recruiters by Clerk user ID, not email
   - See `docs/guidance/user-identification-standard.md` for complete implementation guide

9. **Authorization & RBAC**
   - **ALL authorization is enforced at the API Gateway level** using `services/api-gateway/src/rbac.ts`
   - **Backend services MUST NOT implement their own authorization checks**
   - Backend services should trust headers from api-gateway:
     - `x-clerk-user-id`: The authenticated user's Clerk ID
     - `x-user-role`: The user's role (for logging/audit)
   - Services focus on business logic, gateway handles RBAC

---

## 6. Authorization & RBAC (API Gateway)

All authorization in Splits Network is centralized in `services/api-gateway/src/rbac.ts`. Backend services **MUST NOT** implement authorization - they should trust the API Gateway.

### 6.1 Authorization Architecture

**Single Source of Truth**: API Gateway enforces all RBAC via the `requireRoles()` middleware.

**Flow**:
1. Request hits API Gateway
2. Clerk JWT verified, user context loaded (memberships)
3. `requireRoles()` middleware checks authorization:
   - Check memberships for company-affiliated roles (fast path)
   - Check network service for independent recruiters
   - Deny if no match
4. If authorized, request proxied to backend service with headers:
   - `x-clerk-user-id`: User ID
   - `x-user-role`: Role (for logging)
5. Backend service processes request without authorization checks

**Backend Service Pattern**:
```typescript
// ❌ WRONG - Do not check authorization in backend services
if (!isRecruiter(userId)) {
  throw new ForbiddenError('Only recruiters can access this');
}

// ✅ CORRECT - Trust the gateway, focus on business logic
// If request made it here, user is authorized
const candidates = await candidateRepository.list(userId);
```

### 6.2 requireRoles() Middleware

Use `requireRoles()` as preHandler on all protected endpoints in `api-gateway`.

**Signature**:
```typescript
requireRoles(allowedRoles: UserRole[], services?: ServiceRegistry)
```

**Parameters**:
- `allowedRoles`: Array of roles that can access this endpoint
  - `'platform_admin'`: Platform administrators
  - `'company_admin'`: Company administrators
  - `'hiring_manager'`: Hiring managers
  - `'recruiter'`: Recruiters (both affiliated and independent)
- `services`: **REQUIRED** when allowing recruiters to enable network service check

**Example**:
```typescript
import { requireRoles } from '../rbac';

export async function candidatesRoutes(
  app: FastifyInstance, 
  services: ServiceRegistry
) {
  // Protected endpoint - requires recruiter or admin
  app.get('/api/candidates', {
    preHandler: requireRoles(
      ['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'],
      services  // ← CRITICAL: Pass services for recruiter check
    ),
    schema: { /* ... */ }
  }, async (request, reply) => {
    // User is authorized if we reach here
    const data = await atsService().get('/candidates', /* ... */);
    return reply.send({ data });
  });
}
```

**Authorization Flow**:
1. **Memberships check** (fast path): If user has membership with allowed role, grant access
2. **Network service check** (for recruiters): If `'recruiter'` in allowedRoles AND services provided:
   - Query `GET /recruiters/by-user/:userId` from network service
   - If recruiter exists with `status === 'active'`, grant access
3. **ATS service check** (for candidates): If `'candidate'` in allowedRoles AND services provided:
   - Query `GET /candidates?email={email}` from ATS service
   - If candidate profile found, grant access
4. **Deny**: If no match, throw `ForbiddenError`

**Critical Rules**:
- **ALWAYS pass `services` parameter** when allowing recruiters or candidates
- Without services parameter, independent recruiters and candidates (no memberships) will be denied
- Services parameter enables network service check for recruiters and ATS service check for candidates

### 6.3 Role Helpers

Helper functions in `rbac.ts` check user roles. These are used by frontend components and can be used in route handlers when needed.

**Available Helpers**:
```typescript
// Check if user is platform admin
function isPlatformAdmin(memberships: MembershipRecord[]): boolean

// Check if user is company admin (for specific or any org)
function isCompanyAdmin(
  memberships: MembershipRecord[], 
  orgId?: string
): boolean

// Check if user is hiring manager (for specific or any org)
function isHiringManager(
  memberships: MembershipRecord[], 
  orgId?: string
): boolean

// Check if user is company user (admin or hiring manager)
function isCompanyUser(
  memberships: MembershipRecord[], 
  orgId?: string
): boolean

// Check if user is recruiter (membership or network service)
async function isRecruiter(
  memberships: MembershipRecord[], 
  userId: string,
  networkService: NetworkServiceClient
): Promise<boolean>
```

**Usage Pattern**:
```typescript
// In route handler, after requireRoles() has authorized
const userMemberships = request.auth.memberships || [];
const userId = request.auth.userId;

// Check specific role for business logic
if (isCompanyAdmin(userMemberships, orgId)) {
  // Allow company admin to see all org candidates
  query.organizationId = orgId;
} else if (await isRecruiter(userMemberships, userId, services.network)) {
  // Limit independent recruiter to their assigned candidates
  query.recruiterId = userId;
}
```

**Note**: Role helpers are for **business logic**, not authorization. Authorization is enforced by `requireRoles()` middleware.

### 6.4 Independent Recruiters

Independent recruiters are users without company affiliations (no memberships).

**Storage**: `network.recruiters` table
**Identification**: `GET /recruiters/by-user/:userId` returns recruiter with `status: 'active'`
**Authorization**: Network service check in `requireRoles()` grants access

**Why Network Service Check**:
- Recruiters can exist without company memberships
- They need access to marketplace jobs and candidates
- `identity.memberships` won't include them
- Must query network service to verify recruiter status

**Pattern**:
```typescript
// ✅ CORRECT - Services parameter enables network check
app.get('/api/jobs', {
  preHandler: requireRoles(['recruiter', 'company_admin'], services),
}, async (request, reply) => {
  // Independent recruiters can access this
});

// ❌ WRONG - No services parameter = independent recruiters denied
app.get('/api/jobs', {
  preHandler: requireRoles(['recruiter', 'company_admin']),
}, async (request, reply) => {
  // Independent recruiters will get 403 Forbidden
});
```

### 6.4.1 Candidates

Candidates are authenticated users with profiles in the ATS service but no memberships.

**Storage**: `ats.candidates` table
**Identification**: `GET /candidates?email={email}` returns candidate profile
**Authorization**: ATS service check in `requireRoles()` grants access

**Why ATS Service Check**:
- Candidates don't have company affiliations (no memberships)
- They need access to their profile and recruiter relationships
- `identity.memberships` won't include them
- Must query ATS service to verify candidate profile exists

**Pattern**:
```typescript
// ✅ CORRECT - Services parameter enables ATS check
app.get('/api/candidates/me/recruiters', {
  preHandler: requireRoles(['candidate'], services),
}, async (request, reply) => {
  // Candidates with profiles can access this
});

// ❌ WRONG - No services parameter = candidates denied
app.get('/api/candidates/me/recruiters', {
  preHandler: requireRoles(['candidate']),
}, async (request, reply) => {
  // Candidates will get 403 Forbidden
});
```

### 6.5 Backend Service Implementation

Backend services (ATS, network, billing, etc.) **MUST NOT** check authorization.

**Correct Pattern**:
```typescript
// services/ats-service/src/routes.ts
export async function candidatesRoutes(app: FastifyInstance) {
  app.get('/candidates', async (request, reply) => {
    // Gateway already authorized - trust it
    const userId = request.headers['x-clerk-user-id'] as string;
    const userRole = request.headers['x-user-role'] as string;
    
    // Business logic only
    const candidates = await candidateRepository.listForUser(userId);
    return reply.send({ data: candidates });
  });
}
```

**Incorrect Pattern**:
```typescript
// ❌ WRONG - Do not check roles in backend services
export async function candidatesRoutes(app: FastifyInstance) {
  app.get('/candidates', async (request, reply) => {
    const userRole = request.headers['x-user-role'] as string;
    
    // This duplicates gateway authorization and will cause bugs
    if (!['recruiter', 'admin'].includes(userRole)) {
      return reply.code(403).send({ 
        error: 'Forbidden: Only recruiters and admins can list candidates' 
      });
    }
    
    // Business logic...
  });
}
```

**Why No Service-Level Authorization**:
- Duplicates logic (harder to maintain)
- Creates inconsistencies (gateway allows, service denies)
- Violates separation of concerns
- Makes debugging harder (multiple auth points)
- Gateway already enforced RBAC before proxying

**Service Responsibility**:
- Process business logic
- Access data layer
- Return results
- Trust gateway has authorized request

### 6.6 Common Patterns

**Pattern 1: Read Operations** (candidates, jobs, applications)
```typescript
app.get('/api/candidates', {
  preHandler: requireRoles(
    ['recruiter', 'company_admin', 'hiring_manager', 'platform_admin'],
    services
  ),
}, async (request, reply) => { /* ... */ });
```

**Pattern 2: Write Operations** (create, update)
```typescript
app.post('/api/candidates', {
  preHandler: requireRoles(['recruiter', 'platform_admin'], services),
}, async (request, reply) => { /* ... */ });
```

**Pattern 3: Admin-Only Operations**
```typescript
app.delete('/api/users/:id', {
  preHandler: requireRoles(['platform_admin']),
  // No services needed - platform_admin always in memberships
}, async (request, reply) => { /* ... */ });
```

**Pattern 4: Company-Scoped Operations**
```typescript
app.get('/api/companies/:companyId/jobs', {
  preHandler: requireRoles(
    ['company_admin', 'hiring_manager', 'platform_admin'],
    services
  ),
}, async (request, reply) => {
  // Additional business logic check (not authorization)
  const memberships = request.auth.memberships || [];
  const companyId = request.params.companyId;
  
  if (!isPlatformAdmin(memberships) && 
      !isCompanyUser(memberships, companyId)) {
    throw new ForbiddenError('Access denied to this company');
  }
  
  // Proceed with business logic...
});
```

---

## 7. Events, Redis, and Resend

### 6.1 Events (RabbitMQ)

Copilot should:

- Encourage small, domain-oriented events.
- Use consistent naming like `application.created`, `application.stage_changed`, `placement.created`.
- Include IDs and minimal context, not whole objects.

### 6.2 Redis

- Use Redis for rate limiting and simple caching where needed.
- Do not use Redis as a primary data store.

### 6.3 Resend (Email)

- All email sending should go through `notification-service` and **Resend**.
- Use the Resend Node SDK if available in the repo; otherwise use their HTTP API.
- Keep email content simple and transactional in Phase 1 (no heavy templating engine unless added to the project).

---

## 7. CI/CD & Infra Expectations

Copilot should assume:

- CI/CD is done via **GitHub Actions** workflows (`.github/workflows/*.yml`).
- Docker images are built for each service/app.
- `infra/k8s/**` contains raw Kubernetes manifests for Deployments, Services, and Ingress.
- Deploy steps run `kubectl apply -f infra/k8s/<service>/` with updated image tags.

When suggesting infra changes:

- Prefer editing existing YAML manifests instead of inventing Helm charts.
- Keep manifests explicit and readable.

---

## 8. Initial Setup & Getting Started

When setting up new services or apps:

1. **New Service Setup**
   - Create directory under `services/<service-name>/`.
   - Add `package.json` with workspace reference: `"name": "@splits-network/<service-name>"`.
   - Create `src/` directory with `index.ts` or `server.ts` entry point.
   - Add `tsconfig.json` extending shared config if available.
   - Create `Dockerfile` for containerization.
   - Add corresponding Kubernetes manifests in `infra/k8s/<service-name>/`.

2. **New Schema Setup**
   - Use Supabase MCP tools or SQL migrations.
   - Create schema: `CREATE SCHEMA IF NOT EXISTS <service_schema>;`
   - Store migrations in service directory (e.g., `services/ats-service/migrations/`).
   - Document schema ownership in service README.

3. **References**
   - See `docs/splits-network-architecture.md` for detailed service responsibilities.
   - See `docs/splits-network-phase1-prd.md` for Phase 1 scope and data models.
   - See `docs/guidance/form-controls.md` for form implementation standards.
   - See `docs/guidance/user-roles-and-permissions.md` for comprehensive RBAC, user roles, capabilities, restrictions, API endpoints, and workflows.
   - See `docs/guidance/api-response-format.md` for API response format standards (all endpoints must comply).
   - See `docs/guidance/pagination.md` for pagination implementation standards.
   - See `docs/guidance/grid-table-view-switching.md` for implementing grid/table view toggles.
   - See `docs/guidance/service-architecture-pattern.md` for service layer patterns.
   - Check `.vscode/mcp.json` for configured Supabase MCP server.

---

## 9. How to Help the Human Best

Copilot should prioritize:

1. **Small, focused suggestions** that respect the existing patterns.
2. **Completing existing code** over generating large new abstractions.
3. **Using existing helpers** from `packages/*` before creating duplicates.
4. **Explaining assumptions in comments** when generating complex logic, so it's easy to review and adjust.
5. **Checking docs first** – when unsure, reference `docs/` for context before inventing patterns.

When unsure about a domain decision, Copilot should lean toward:

- Thin controllers.
- Clear domain separation.
- Simple, explicit data models.
- Explicit > implicit (prefer obvious code over clever abstractions).

Splits Network should feel like a **clean, well-structured recruiting and payouts platform**, not a ball of mud.
