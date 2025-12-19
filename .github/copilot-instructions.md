
# Splits Network – Copilot Instructions

These instructions tell GitHub Copilot (and Copilot Chat) how to behave when working in the **Splits Network** repository.

Splits Network is a **split-fee recruiting marketplace** with a **microservice-first** architecture and a **Next.js portal** frontend.

Copilot should prioritize **clarity, strong domain boundaries, and minimal magic**.

We should only be using @latest versions of packages unless there's a specific reason not to.

**Current State:** This project is in early setup phase. The repository structure and planning documents exist, but most implementation is yet to be created. When generating code, follow the patterns defined in `docs/splits-network-architecture.md` and `docs/splits-network-phase1-prd.md`.

---

## 1. Monorepo Layout & Mental Model

The repo is organized by **responsibility**, not by technology.

```txt
/ (repo root)
├─ apps/                     # User-facing frontends ONLY
│  ├─ portal/                # Main authenticated app (Next.js 16, App Router)
│  └─ marketing/             # Public marketing site (optional)
│
├─ services/                 # Backend services / APIs / workers
│  ├─ api-gateway/           # Public API entrypoint; routes to domain services
│  ├─ identity-service/      # Users, orgs, memberships (Clerk bridge)
│  ├─ ats-service/           # Jobs, candidates, applications, placements
│  ├─ network-service/       # Recruiters, assignments, basic stats
│  ├─ billing-service/       # Plans, subscriptions, Stripe
│  └─ notification-service/  # Event-driven email (Resend)
│
├─ packages/                 # Shared code, NOT directly deployable
│  ├─ shared-types/          # Domain types, DTOs
│  ├─ shared-config/         # Config/env loader
│  ├─ shared-logging/        # Logging utilities
│  ├─ shared-fastify/        # Fastify plugins, common middleware
│  └─ shared-clients/        # Typed HTTP/SDK clients for services
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
- Handles Stripe webhooks.
- Provides subscription status to `api-gateway` for gating recruiter features.

Copilot:  
All subscription logic (free vs paid recruiter, plan changes, etc.) belongs here.

### 3.6 `services/notification-service`

- Listens to RabbitMQ events from other services.
- Sends transactional email using **Resend**.
- Example events:
  - `application.created`
  - `application.stage_changed`
  - `placement.created`

Copilot:  
Do not embed SMTP logic elsewhere. Email sending should flow through notification-service and Resend.

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

---

## 6. Events, Redis, and Resend

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
