
# Splits Network – Phase 1 PRD (Split-First ATS)

## 0. Phase 1 Implementation Checklist

### Infrastructure & Setup
- [x] Monorepo structure created with pnpm workspaces
- [x] Docker Compose configuration for local development
- [x] Docker Compose environment variables configured for all services
- [x] Redis service configured
- [x] RabbitMQ service configured
- [x] Supabase project created (einhgkqmxbkgdohwfayv)
- [x] Vault setup for secrets management (migrations created) - Migrated to env vars
- [x] Database schemas created (identity, ats, network, billing, notifications)
- [x] Database migrations organized per service
- [x] Supabase PostgREST schemas exposed (ats, identity, network, billing, notifications)
- [x] Database permissions granted to service_role for all schemas
- [ ] Kubernetes manifests created
- [ ] CI/CD pipeline setup (GitHub Actions)

### Shared Packages
- [x] `shared-types` package created with domain models
- [x] `shared-config` package created (base, database, Redis, RabbitMQ, Clerk config)
- [x] `shared-config` migrated from Supabase Vault to environment variables
- [x] `shared-logging` package created
- [x] `shared-fastify` package created (buildServer, errorHandler)
- [ ] `shared-clients` package created for inter-service HTTP clients
- [x] All shared packages building successfully

### Services - Core Structure
- [x] `identity-service` scaffold with Fastify server
- [x] `ats-service` scaffold with Fastify server + RabbitMQ publisher
- [x] `network-service` scaffold with Fastify server
- [x] `billing-service` scaffold with Fastify server
- [x] `notification-service` scaffold with RabbitMQ consumer
- [x] `api-gateway` scaffold with Clerk auth + rate limiting

### Identity Service
- [x] Repository structure created
- [x] Service layer created
- [x] Routes registered (users, organizations, memberships)
- [x] Database schema `identity.*` created in Supabase
- [ ] Clerk webhook integration for user sync
- [x] `/users/:id` endpoint (get user profile)
- [x] `/sync-clerk-user` endpoint (internal)
- [x] `/organizations` POST endpoint
- [x] `/memberships` POST and DELETE endpoints
- [ ] `/me` endpoint for current user profile
- [ ] Integration tests

### ATS Service
- [x] Repository structure created
- [x] Service layer created
- [x] RabbitMQ event publisher integrated
- [x] Database schema `ats.*` created in Supabase
- [x] Supabase client configured to use schema properly with .schema() method
- [x] Companies endpoints (POST)
- [x] Jobs endpoints (GET list by company, GET by ID, POST, PATCH) - Fully tested and working
- [x] Candidates endpoints (GET by ID, create via application flow)
- [x] Applications endpoints (POST, GET by job, GET by ID, PATCH stage)
- [ ] Notes endpoints (POST, GET by application) - Deferred to later phase
- [x] Placements endpoints (POST, GET by ID)
- [x] Fee calculation logic implemented (50/50 split)
- [x] Event publishing on key actions (application.created, stage_changed, placement.created)
- [ ] Integration tests
- [ ] GET /placements with filters (recruiter, company, date range)

### Network Service
- [x] Repository structure created
- [x] Service layer created
- [x] Database schema `network.*` created in Supabase
- [x] Recruiter profile endpoints (GET /recruiters/:id, GET by user, POST, GET all)
- [x] Recruiter status management (PATCH status: pending, active, suspended)
- [x] Role assignments endpoints (POST assign, DELETE unassign)
- [x] GET /recruiters/:recruiterId/jobs (jobs assigned to recruiter)
- [x] GET /jobs/:jobId/recruiters (recruiters assigned to job)
- [ ] Basic recruiter stats (submissions, placements count) - To be added
- [ ] Integration tests

### Billing Service
- [x] Repository structure created
- [x] Service layer created
- [x] Database schema `billing.*` created in Supabase
- [ ] Stripe SDK integration
- [ ] Plans endpoints (GET list, POST create)
- [ ] Subscriptions endpoints (GET /subscriptions/me)
- [ ] Checkout session creation (POST /subscriptions/checkout-session)
- [ ] Stripe webhook handler (POST /webhooks/stripe)
- [ ] Subscription status sync from Stripe
- [ ] Integration tests

### Notification Service
- [x] Event consumer structure created
- [x] Email module structure created
- [ ] Resend SDK integration
- [ ] Email templates (application.created, stage_changed, placement.created)
- [ ] RabbitMQ consumer for application.created event
- [ ] RabbitMQ consumer for application.stage_changed event
- [ ] RabbitMQ consumer for placement.created event
- [ ] Email sending via Resend
- [ ] Error handling and retry logic
- [ ] Integration tests
### API Gateway
- [x] Fastify server setup
- [x] Clerk JWT authentication middleware (using @clerk/backend verifyToken)
- [x] Clerk configuration via environment variables
- [x] Redis-based rate limiting
- [x] Service registry for backend services
- [x] Route definitions for core endpoints
- [x] `/api/me` → identity-service proxy with Clerk sync
- [x] `/api/jobs/:id` → ats-service proxy
- [x] `/api/jobs` POST → ats-service proxy
- [x] `/api/jobs/:id` PATCH → ats-service proxy
- [x] `/api/jobs/:jobId/applications` → ats-service proxy
- [x] `/api/applications` POST → ats-service proxy
- [x] `/api/applications/:id` → ats-service proxy
- [x] `/api/applications/:id/stage` PATCH → ats-service proxy
- [x] `/api/placements` POST → ats-service proxy
- [x] `/api/placements/:id` → ats-service proxy
- [x] `/api/recruiters` → network-service proxy
- [x] `/api/recruiters/:id` → network-service proxy
- [x] `/api/role-assignments` → network-service proxy
- [ ] `/api/subscriptions/me` → billing-service proxy
- [ ] Authorization logic (role-based access control) - Currently auth only, no RBAC
- [ ] Recruiter-specific job filtering (GET /api/jobs with recruiter context)
- [ ] Request/response logging with correlation IDs
- [ ] Integration testslogging with correlation IDs
- [ ] Integration tests

### Frontend - Portal App
- [x] Next.js 16 App Router setup
- [x] TailwindCSS + DaisyUI configured
- [x] Clerk authentication pages (sign-in, sign-up, SSO callback)
- [x] Custom Clerk components (not default Clerk UI)
- [x] `(authenticated)` route group layout with auth protection
- [x] Layout with sidebar navigation
- [x] Top bar with org switcher and user menu
- [x] Dashboard page (recruiter view) - `/dashboard`
- [ ] Dashboard page (company view) - Deferred
- [ ] Dashboard page (admin view) - Deferred
- [x] Roles list page - `/roles` (wired to real API, fully working with authentication)
- [x] Role detail & pipeline view page - `/roles/[id]`
- [x] Submit candidate form/modal (wired to real API)
- [x] Candidate pipeline table component (wired to real API)
- [x] Candidates page placeholder - `/candidates`
- [ ] Candidate detail page - To be added
- [x] Stage change UI (dropdown in pipeline table)
- [x] Hire flow (mark as hired with salary input)
- [x] Placements & earnings page (recruiter view) - `/placements`
- [ ] Role management page (company view) - Deferred
- [ ] Admin overview page - `/admin` placeholder exists
- [ ] Role assignment UI (admin) - Deferred
- [ ] Placement audit view (admin) - Deferred
- [x] Subscription status indicator
- [x] FontAwesome icons integrated inline
- [x] API client singleton for gateway calls
- [x] All components wired to real backend APIs (no mock data)
- [x] Development seed data script created and executed

### Integration & Testing
- [ ] End-to-end test: Recruiter signup and onboarding
- [ ] End-to-end test: Company creates role
- [ ] End-to-end test: Recruiter submits candidate
- [ ] End-to-end test: Company moves candidate through stages
- [ ] End-to-end test: Company hires candidate (placement created)
- [ ] End-to-end test: Recruiter views placement and earnings
- [ ] End-to-end test: Email notifications sent via Resend
- [ ] Load testing for gateway rate limits
- [ ] Service-to-service communication tests

### Documentation
- [x] Architecture doc created (splits-network-architecture.md)
- [x] Phase 1 PRD created (splits-network-phase1-prd.md)
- [x] Copilot instructions created
- [ ] API documentation (OpenAPI/Swagger per service)
- [ ] Database schema documentation
- [ ] Deployment guide (Kubernetes)
- [ ] Local development setup guide
- [ ] Environment variables documentation

### DevOps & Deployment
- [ ] Dockerfiles optimized for production
- [ ] Kubernetes Deployments per service
- [ ] Kubernetes Services per service
- [ ] Ingress configuration
- [ ] Secret management in Kubernetes
- [ ] Health check endpoints per service
- [ ] Monitoring setup (metrics, logs)
- [-] Staging environment deployment (later phase)
- [ ] Production environment deployment

### External Integrations
- [ ] Clerk tenant configured for Splits Network
- [ ] Clerk webhooks configured (user.created, user.updated)
- [ ] Stripe account setup
- [ ] Stripe products and prices created
- [ ] Stripe webhooks configured
- [ ] Resend account setup
- [ ] Resend sender domain verified
- [ ] Resend API key configured

### Security & Compliance
- [ ] Environment secrets stored securely (not in code)
- [ ] Database connections use TLS
- [ ] PII logging prevention verified
- [ ] Rate limiting tested and tuned
- [ ] CORS configuration reviewed
- [ ] Auth token validation tested
- [ ] Role-based access control tested

### Performance
- [ ] Pagination implemented on list endpoints
- [ ] Redis caching strategy for expensive queries
- [ ] Database indexes created for common queries
- [ ] Dashboard load time < 500ms server-side
- [ ] API response time monitoring

### Design Partner Readiness
- [ ] At least 3 design partner recruiters onboarded
- [ ] At least 2 design partner companies onboarded
- [ ] Real roles created and worked through platform
- [ ] Real placements logged
- [ ] Feedback collection process established
- [ ] Bug reporting process established

---

## 1. Overview

### 1.1 Product
Splits Network is a split-fee recruiting marketplace and platform where:

- Companies post roles that need to be filled.
- Independent recruiters join the network and submit candidates to those roles.
- When a candidate is hired, the placement fee is split between the company’s recruiting partner(s) and the platform.

Phase 1 focuses on delivering a split-first Applicant Tracking System (ATS) and basic network mechanics that enable real placements, tracked accurately end-to-end.

### 1.2 Phase 1 Goal
Enable real design-partner recruiters and companies to:

1. Operate split roles through Splits Network from job creation to hire.
2. Track candidate submissions, stages, and outcomes.
3. Log placement fees and recruiter payouts in a transparent way.
4. Gate access with basic subscriptions for recruiters.

This phase should be usable in production by a small set of design partners and form the foundation for later features (reputation, payouts, shared pools, outreach, etc.).

### 1.3 Non-Goals (Phase 1)
These are explicitly out of scope for Phase 1:

- AI assistance (deal copilot, recommendations, etc.).
- Outreach engine (bulk email campaigns, sequences).
- Browser extension.
- Shared talent pools and royalties.
- Full analytics dashboards and advanced reporting.
- Escrow / Stripe Connect marketplace payouts.
- Public job board and candidate self-service portal.
- Micro-networks / white-labeled hubs.

These may be mentioned in the data model or event structure for future compatibility, but they are not required to be implemented or exposed in the UI.

---

## 2. Personas & Use Cases

### 2.1 Personas

1. **Recruiter (Network Partner)**
   - Independent or agency recruiter who joins Splits Network to access roles and earn placement fees.
   - Needs to see assigned roles, submit candidates, track stages, and view their historical placements and earnings.

2. **Company Admin / Hiring Manager**
   - Represents a client company that has roles to fill.
   - Needs to create roles, see candidate pipelines, and mark hires.

3. **Platform Admin (Splits Network Operator)**
   - Internal admin responsible for running the network.
   - Needs to approve recruiters, assign roles, resolve issues, and view global activity.

### 2.2 Core Phase 1 Use Cases

1. Recruiter signs in and views the roles they can work.
2. Recruiter submits a candidate to a role.
3. Recruiter and company view the pipeline (stages and candidate status).
4. Company (or admin) moves candidates through stages to hired or rejected.
5. On hire, the platform records the placement, salary, fee amount, and recruiter split.
6. Recruiter sees their placement and payout history.
7. Admin sees global overview of roles, candidates, and placements.
8. Recruiter subscription status controls access (basic gating).

---

## 3. Scope – Functional Requirements

### 3.1 Apps & Services Overview

Monorepo structure (conceptual):

- `apps/`
  - `portal/` – main authenticated app for recruiters and company users (Next.js 16, App Router, DaisyUI).
- `services/`
  - `api-gateway/` – public HTTP entrypoint that fronts all backend services.
  - `identity-service/` – users, organizations, memberships (Clerk integration).
  - `ats-service/` – companies, jobs, candidates, applications, stages, placements.
  - `network-service/` – recruiters, role assignments, minimal performance stats.
  - `billing-service/` – plans, subscriptions, Stripe integration.
  - `notification-service/` – email notifications powered by Resend.
- `packages/` – shared types, config, logging, Fastify helpers, service clients, etc.

All backend services are Fastify-based Node.js services, deployed as separate pods in Kubernetes. Supabase Postgres is used as the database, with separate schemas per service.

Clerk is used for auth. Stripe is used for subscriptions. Resend is used for transactional email delivery.

---

### 3.2 apps/portal – Phase 1 UX

#### 3.2.1 Navigation

- Left sidebar:
  - Dashboard
  - Roles
  - Candidates
  - Placements
  - (Admin only) Admin
- Top bar:
  - Org switcher (if applicable)
  - User menu (profile, sign out)
  - Subscription status indicator (for recruiters)

#### 3.2.2 Recruiter Experience

**Dashboard (Recruiter)**

- Summary cards:
  - Active roles assigned to me
  - Candidates in process
  - Offers / Hires this month
- Recent activity list:
  - Last N stage changes involving the recruiter’s candidates.

**Roles List**

- Table of roles recruiter can see/work:
  - Columns: Role title, Company, Location, Fee %, Status (Active/Paused/Filled), Opened date.
  - Filters: Status, Company.
  - Action: View role details.

**Role Detail & Pipeline View**

- Role header:
  - Title, Company, Location, Fee %, Salary range, Status.
- Candidate pipeline:
  - List of candidate rows with stage, last activity, owner recruiter.
  - Stage displayed via pill (Submitted, Screen, Interview, Offer, Hired/Rejected).
- Actions:
  - Submit new candidate (for recruiters assigned to the role).
  - View candidate details.

**Submit Candidate Flow**

- Form:
  - Candidate full name (required)
  - Email (required)
  - LinkedIn URL (optional)
  - Resume upload (optional for Phase 1 if needed; can be deferred)
  - Notes (freeform text)
- On submit:
  - Creates candidate (if not existing) and application to the role in `ats-service`.
  - Stage is set to “Submitted”.
  - Application is associated with submitting recruiter (via `network-service`).

**Candidate Detail (Recruiter)**

- Profile information:
  - Name, email, LinkedIn, notes.
- Applications:
  - List of roles for which this candidate has been submitted (Phase 1 can be limited to a simple list).
- Activity log (Phase 1 basic):
  - Stage changes and timestamps.

**Placements & Earnings (Recruiter)**

- List of placements attributed to the recruiter:
  - Role, Company, Candidate, Hired date, Salary, Fee amount, Recruiter share.
- Simple earnings summary:
  - Lifetime total.
  - Last 30 days.
  - This year.

#### 3.2.3 Company / Hiring Manager Experience

**Roles Management**

- Create role:
  - Title, Department, Location, Salary range, Fee %, Description, Status (defaults to Active).
- View pipelines similar to recruiters, but can move stages and mark hires.

**Stage Management**

- For each candidate in a role, company users can:
  - Change stage (Submitted, Screen, Interview, Offer, Hired, Rejected).
  - Add simple notes.

**Hire Flow**

- When marking a candidate as “Hired”:
  - Prompt for:
    - Final salary (required)
    - Confirmation of fee % (default from role)
  - Triggers creation of placement in `ats-service` and `ats.placements`.

#### 3.2.4 Admin Experience

**Admin Overview**

- View all roles with filters (status, company, recruiter).
- View all recruiters and their basic stats (submissions, hires).

**Role Assignment**

- Assign/unassign recruiters to roles.
- Control which roles each recruiter can see.

**Placement Audit View**

- Admin table of all placements:
  - Role, company, candidate, recruiter(s), salary, fee, platform share, recruiter share.

Phase 1 does not require full dispute handling or advanced performance analytics, only basic visibility and control.

---

### 3.3 services/api-gateway – Responsibilities

**Responsibilities**

- Public entrypoint for all API requests from `apps/portal`.
- Validates Clerk JWT, extracts user identity, and resolves org context.
- Routes requests to backend services:
  - `identity-service`, `ats-service`, `network-service`, `billing-service`.
- Applies authorization checks at a coarse level (role/tenant).

**Phase 1 Requirements**

- JWT verification middleware (Clerk).
- Basic rate limiting (Redis-based if feasible).
- Endpoint routing (minimal aggregation in this phase; can proxy mostly 1:1).

Example routes (conceptual):

- `GET /me` → identity-service
- `GET /roles` → ats-service + network-service (for recruiter scoping)
- `POST /roles` → ats-service (company/admin users only)
- `POST /roles/:id/submissions` → ats-service + network-service attribution
- `GET /placements` → ats-service
- `GET /subscriptions/me` → billing-service

The exact shape will be refined in API design, but the gateway must own auth and tenant resolution.

---

### 3.4 services/identity-service – Responsibilities

**Responsibilities**

- Synchronize Clerk users into internal user records.
- Maintain organizations and memberships (user roles per org).

**Data Model (Phase 1)**

- `identity.users`
  - `id` (UUID, PK)
  - `clerk_user_id` (string, unique)
  - `email`
  - `name`
  - `created_at`, `updated_at`
- `identity.organizations`
  - `id` (UUID, PK)
  - `name`
  - `type` (e.g., `company`, `platform`)
  - `created_at`, `updated_at`
- `identity.memberships`
  - `id` (UUID, PK)
  - `user_id` (FK → users)
  - `organization_id` (FK → organizations)
  - `role` (e.g., `recruiter`, `company_admin`, `hiring_manager`, `platform_admin`)
  - `created_at`, `updated_at`

**Key Endpoints**

- `GET /me`
  - Returns user profile and memberships.
- `POST /sync-clerk-user`
  - Internal endpoint used by gateway to ensure user exists.

Phase 1 can create organizations manually or via simple flows; complex multi-org scenarios are not required yet.

---

### 3.5 services/ats-service – Responsibilities

**Responsibilities**

- Core ATS data and operations:
  - Companies (optionally mirrored or referenced from identity).
  - Jobs/roles.
  - Candidates.
  - Applications (candidate ↔ job).
  - Stages and status.
  - Placements.

**Data Model (Phase 1)**

- `ats.companies`
  - `id` (UUID, PK)
  - `identity_organization_id` (optional FK to identity.organizations)
  - `name`
  - `created_at`, `updated_at`
- `ats.jobs`
  - `id` (UUID, PK)
  - `company_id` (FK → companies)
  - `title`
  - `department`
  - `location`
  - `salary_min`, `salary_max`
  - `fee_percent`
  - `status` (`active`, `paused`, `filled`)
  - `created_at`, `updated_at`
- `ats.candidates`
  - `id` (UUID, PK)
  - `full_name`
  - `email`
  - `linkedin_url`
  - `created_at`, `updated_at`
- `ats.applications`
  - `id` (UUID, PK)
  - `candidate_id` (FK → candidates)
  - `job_id` (FK → jobs)
  - `submitted_by_recruiter_id` (FK → network.recruiters or recruiter profile ID)
  - `stage` (`submitted`, `screen`, `interview`, `offer`, `hired`, `rejected`)
  - `status` (`open`, `closed`)
  - `created_at`, `updated_at`
- `ats.notes` (minimal Phase 1)
  - `id` (UUID, PK)
  - `application_id` (FK → applications)
  - `author_user_id`
  - `body`
  - `created_at`
- `ats.placements`
  - `id` (UUID, PK)
  - `application_id` (FK → applications)
  - `job_id` (FK → jobs)
  - `candidate_id` (FK → candidates)
  - `recruiter_id` (for Phase 1: single recruiter)
  - `salary`
  - `fee_percent`
  - `fee_amount`
  - `platform_share_amount`
  - `recruiter_share_amount`
  - `created_at`

**Key Endpoints (Phase 1)**

- Jobs:
  - `GET /jobs`
  - `GET /jobs/:id`
  - `POST /jobs`
  - `PATCH /jobs/:id`
- Candidates & Applications:
  - `POST /jobs/:id/applications` (create candidate + application)
  - `GET /jobs/:id/applications`
  - `PATCH /applications/:id` (update stage/status)
- Placements:
  - `POST /applications/:id/placement`
    - Body: salary, fee_percent (optional override).
  - `GET /placements` (filter by recruiter, role, date range).

The service is responsible for calculating fee_amount, platform_share_amount, and recruiter_share_amount with simple, configurable logic.

---

### 3.6 services/network-service – Responsibilities

**Responsibilities**

- Model recruiter profiles and relationships to jobs.
- Provide recruiter-centric views of roles and applications.

**Data Model (Phase 1)**

- `network.recruiters`
  - `id` (UUID, PK)
  - `user_id` (FK → identity.users)
  - `display_name`
  - `status` (`pending`, `active`, `suspended`)
  - `created_at`, `updated_at`
- `network.role_assignments`
  - `id` (UUID, PK)
  - `recruiter_id` (FK → recruiters)
  - `job_id` (FK → ats.jobs)
  - `created_at`, `updated_at`

Phase 1 performance stats can be stubbed or derived on the fly; no dedicated stats tables are required yet.

**Key Endpoints (Phase 1)**

- `GET /recruiters/me`
  - Returns recruiter profile for current user (or 404 if not a recruiter).
- `GET /recruiters/me/jobs`
  - Returns jobs assigned to the recruiter (joined via role_assignments).
- `POST /jobs/:id/assign-recruiter`
  - Admin-only; assigns a recruiter to a job.

Later, network-service will own more advanced performance metrics and reputation data.

---

### 3.7 services/billing-service – Responsibilities

**Responsibilities**

- Manage recruiter subscription plans using Stripe.
- Gate recruiter-level features based on subscription status.

**Data Model (Phase 1)**

- `billing.plans`
  - `id` (UUID, PK)
  - `name`
  - `stripe_price_id`
  - `features` (JSONB, optional)
  - `created_at`, `updated_at`
- `billing.subscriptions`
  - `id` (UUID, PK)
  - `recruiter_id` (FK → network.recruiters)
  - `stripe_customer_id`
  - `stripe_subscription_id`
  - `plan_id` (FK → plans)
  - `status` (`trialing`, `active`, `past_due`, `canceled`)
  - `current_period_end`
  - `created_at`, `updated_at`

**Key Endpoints (Phase 1)**

- `GET /plans`
  - List available plans for recruiters.
- `GET /subscriptions/me`
  - Returns current subscription for the authenticated recruiter.
- `POST /subscriptions/checkout-session`
  - Creates a Stripe Checkout session for the recruiter to subscribe or upgrade.
- `POST /webhooks/stripe`
  - Stripe webhook endpoint (server-to-server) updating subscription records.

Feature gating logic (e.g., “free users see fewer roles”) will be enforced by `api-gateway` based on subscription status returned by billing-service.

---

### 3.8 services/notification-service – Responsibilities (Phase 1 Minimal)

**Responsibilities**

- Handle basic email notifications for key events using **Resend**:
  - New application submitted.
  - Stage change (optional).
  - Placement created (optional).

**Phase 1 Scope**

- Subscribe to RabbitMQ events from `ats-service` such as `application.created`.
- Use Resend’s Node.js SDK or HTTP API to send emails from a configured sender domain.
- Minimal template system:
  - Simple inline templates stored in code or in a small table (e.g., `notifications.templates`) if needed.

Minimal persistence (if any) is needed in Phase 1; logging to observability tools may be sufficient.

---

## 4. Non-Functional Requirements

### 4.1 Architecture Constraints

- All backend logic is implemented as discrete services under `services/`.
- No business logic in Next.js API routes.
- Microservice boundaries must reflect domain boundaries:
  - Identity, ATS, Network, Billing, Notifications.
- Monorepo with shared packages for types, logging, config, and clients.

### 4.2 Performance & Scalability

- Phase 1 scale is modest (design-partner usage), but:

  - Typical page loads for recruiter dashboard should complete in under 500ms server-side (excluding network latency).
  - Key list views (roles, applications) should support pagination from the start.

- Use Redis caching for:
  - Expensive dashboard queries (if needed).
  - Basic rate limiting in `api-gateway`.

### 4.3 Security & Authorization

- Authentication via Clerk, enforced at `api-gateway`.
- All internal services trust gateway tokens/claims, not raw Clerk tokens.
- Role-based access control:
  - Recruiter vs company vs platform admin flows.
- Candidate PII stored in Postgres must be protected via:
  - Connection encryption (TLS).
  - Limited access by service.
  - No logging of sensitive values in plain text.
- Resend API keys and Stripe keys must be stored in Secrets (not checked into source).

### 4.4 Observability

- Each service uses a shared logging package (`packages/shared-logging`).
- Log key actions with correlation IDs:
  - Requests through gateway.
  - Stage changes.
  - Placement creation.
  - Subscription status changes.
  - Notification sends via Resend (success/failure).
- Basic metrics:
  - Requests per service.
  - Error rates.
  - Latency histograms per endpoint (optional in Phase 1, but recommended).

---

## 5. Success Metrics (Phase 1)

Qualitative:

- Design-partner recruiters can run their active split roles entirely through Splits Network without needing spreadsheets for core tracking.
- Design-partner companies can view pipelines and mark hires successfully.
- Platform admin can see all roles, candidates, and placements in one place.
- Email notifications for key events are reliably delivered via Resend.

Quantitative (targets to refine):

- At least N design-partner recruiters onboarded and active.
- At least X real roles created and worked through the platform.
- At least Y real hires logged as placements.
- >80% of design partners report that the system makes split collaboration easier than their current process.

---

## 6. Dependencies & Risks

### 6.1 Dependencies

- Clerk tenant and configuration for Splits Network.
- Stripe account and basic product/price setup for recruiter plans.
- Resend account and verified sender domain for transactional email.
- Supabase Postgres instance provisioned with schemas per service.
- Kubernetes cluster with:
  - RabbitMQ
  - Redis
  - Ingress, TLS, and CI/CD already wired (reused from existing setups).

### 6.2 Risks

- **Over-engineering boundaries too early:** Mitigated by keeping Phase 1 functionality minimal while still respecting service boundaries.
- **Stripe integration delays:** Mitigated by starting with a single plan and simple “Subscribe” flow.
- **Resend configuration issues (DNS, sender reputation):** Mitigated by setting up early with a dedicated domain/subdomain and testing deliverability.
- **Product discovery risk:** Even with good architecture, if UX is clunky Phase 1 feedback will be poor. Mitigate with early UI prototypes and tight iteration with design partners.

---

## 7. Open Questions

1. How strict should recruiter subscription gating be in Phase 1 (e.g., number of roles available, number of active submissions)?
2. Do we require resume uploads for Phase 1, or is LinkedIn + notes sufficient initially?
3. Should placements live permanently in `ats-service` or be split into a dedicated `placements-service` later? For Phase 1 they can remain in `ats-service` with clear interfaces.
4. Do we want multi-recruiter splits in Phase 1, or is a single recruiter per placement acceptable initially? (Recommendation: single recruiter in Phase 1, multi-recruiter in a later phase.)

This PRD describes the Phase 1 foundations needed to run real split recruiting workflows through Splits Network, with a microservice-first architecture that remains friendly for both humans and AI agents, and with transactional email powered by Resend.
