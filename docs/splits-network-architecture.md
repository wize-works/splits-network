
# Splits Network – Architecture Overview (Phase 1 Foundations, with Resend)

## 1. Purpose

This document describes the initial architecture for Splits Network, aligned with:

- A **microservice-first** backend (no monolith).
- A **monorepo** for shared code, tooling, and CI.
- A **clear separation** between front-end apps, backend services, shared packages, and infrastructure.
- An architecture that is friendly to **AI agents** (small, well-defined domains and APIs).
- A standardized email delivery path using **Resend** for transactional email.

This architecture covers Phase 1 but is designed to scale into later phases (reputation, payouts, shared talent pools, AI deal copilot, etc.) without major rewrites.

---

## 2. High-Level System Diagram (Conceptual)

**Users:**

- Recruiters (network partners)
- Company admins / hiring managers
- Splits Network platform admins

**Core pieces:**

- **apps/portal** (Next.js 16) – main UI for all authenticated users.
- **services/api-gateway** – public API entrypoint.
- **services/identity-service** – user/org/membership management (Clerk integration).
- **services/ats-service** – core ATS (jobs, candidates, applications, placements).
- **services/network-service** – recruiter profiles, role assignments.
- **services/billing-service** – subscriptions and Stripe integration.
- **services/notification-service** – event-driven notifications using Resend.
- **Supabase Postgres** – single DB instance with multiple schemas (identity, ats, network, billing, notifications).
- **Supabase Vault** – secure storage for API keys and secrets.
- **Redis** – caching, rate limiting, and lightweight coordination.
- **RabbitMQ** – event bus for internal domain events.
- **Kubernetes** – hosting for all services and the portal app.
- **Clerk** – authentication and user identity provider.
- **Stripe** – recruiter subscription billing.
- **Resend** – transactional email provider for system notifications.

---

## 3. Monorepo Structure

Top-level structure:

```txt
/ (repository root)
├─ apps/                     # User-facing frontends ONLY
│  ├─ portal/                # Main authenticated app (NextJS 16, App Router)
│  └─ marketing/             # Public marketing site (optional / later)
│
├─ services/                 # Backend services / APIs / workers
│  ├─ api-gateway/           # Public entrypoint; routes to domain services
│  ├─ identity-service/      # Users, orgs, memberships (Clerk bridge)
│  ├─ ats-service/           # Jobs, candidates, applications, placements
│  ├─ network-service/       # Recruiters, assignments, basic stats
│  ├─ billing-service/       # Plans, subscriptions, Stripe
│  └─ notification-service/  # Email + in-app notifications (event-driven, Resend)
│
├─ packages/                 # Shared libraries
│  ├─ shared-types/          # Domain and DTO types
│  ├─ shared-config/         # Env/config loading, validation
│  ├─ shared-logging/        # Logging/tracing utilities
│  ├─ shared-fastify/        # Fastify plugins, common middleware
│  └─ shared-clients/        # Typed HTTP/SDK clients for services
│
├─ infra/                    # Infrastructure manifests and scripts
│  ├─ k8s/                   # Raw Kubernetes YAML (Deployments, Services, Ingress, etc.)
│  └─ scripts/               # kubectl/apply scripts if needed
│
└─ docs/                     # Product & architecture documentation
```

**Principles:**

- `apps/` = only frontends. No APIs or backend business logic.
- `services/` = all backend services, each with its own Fastify server, migrations, and Dockerfile.
- `packages/` = *non-deployable* shared code only.
- `infra/` = how everything gets deployed and wired in the cluster (using raw YAML, not Helm).
- `docs/` = living documentation (PRDs, architecture, API contracts).

---

## 4. Technology Stack

### 4.1 Frontend

- **Next.js 16 (App Router)** for apps/portal and apps/marketing.
- **React** with **TypeScript**.
- **DaisyUI** on top of **TailwindCSS** for theming and UI components.
- **Clerk** React components for login, signup, and session handling.
- **Deployed** as a container in Kubernetes, fronted by existing ingress (NGINX or similar).

### 4.2 Backend

- **Node.js** with **Fastify** for all services.
- **Separation of concerns** by domain:
  - `identity-service`
  - `ats-service`
  - `network-service`
  - `billing-service`
  - `notification-service`
  - `api-gateway`

- Each service exposes a REST API (OpenAPI documented), and can later add GraphQL if needed.

### 4.3 Data & Storage

- **Supabase Postgres** as the primary data store.
- **Schema-per-service** pattern in a single DB instance:
  - `identity.*`
  - `ats.*`
  - `network.*`
  - `billing.*`
  - `notifications.*` (if needed)
- Migrations are owned and run by each service, scoped to its schema.

### 4.4 Messaging & Caching

- **Redis**:
  - Caching read-heavy queries (e.g., dashboards).
  - Rate limiting in `api-gateway`.
  - Ephemeral state if needed.

- **RabbitMQ**:
  - Domain event bus.
  - `ats-service` publishes events such as:
    - `application.created`
    - `application.stage_changed`
    - `placement.created`
  - `billing-service` can emit events such as:
    - `subscription.activated`
    - `subscription.canceled`
  - `notification-service` consumes these for email/in-app notifications via Resend.
  - Future: analytics consumers, reputation scoring, etc.

### 4.5 Third-Party Integrations

- **Clerk** – Authentication, user identity, session handling.
- **Stripe** – Subscription billing for recruiters.
- **Resend** – Transactional email provider for notifications (Node SDK / HTTP API).
- **(Optional later)** – Analytics, monitoring vendors, etc.

---

## 5. Services – Responsibilities & Boundaries

### 5.1 api-gateway

**Role:** Single public HTTP entrypoint for frontend apps and future external clients.

**Responsibilities:**

- Verify Clerk JWT and extract user identity.
- Resolve organization/tenant context.
- Basic authorization: recruiter vs company vs admin.
- Rate limiting using Redis.
- Route / proxy requests to domain services.
- Optionally aggregate data for complex views (dashboard endpoints).

**Key Patterns:**

- No business logic beyond auth, routing, and coarse-grained authorization.
- Every request passes through gateway → domain services never see raw Clerk tokens.

---

### 5.2 identity-service

**Role:** Source of truth for internal users, organizations, and memberships.

**Responsibilities:**

- Sync Clerk users into `identity.users` table.
- Manage organizations (`companies`, potential recruiter orgs later).
- Manage memberships (user → org → role).

**Data:**

- `identity.users` – internal representation of a user (maps to a Clerk user).
- `identity.organizations` – companies / platform orgs.
- `identity.memberships` – roles like `recruiter`, `company_admin`, `hiring_manager`, `platform_admin`.

**Interactions:**

- Called by `api-gateway` to fetch `/me` and memberships.
- Referenced indirectly by `ats-service` (via org IDs) and `network-service` (via user IDs).

---

### 5.3 ats-service

**Role:** Core ATS engine.

**Responsibilities:**

- Companies (optional mirror of identity organizations).
- Jobs / roles.
- Candidates.
- Applications (candidate ↔ job).
- Stages and basic notes.
- Placements (Phase 1: single recruiter per placement).

**Phase 1 Entities (examples):**

- `ats.companies`
- `ats.jobs`
- `ats.candidates`
- `ats.applications`
- `ats.notes`
- `ats.placements`

**Interactions:**

- `api-gateway` proxies job, candidate, application, and placement requests.
- `network-service` provides recruiter visibility (role assignments).
- `ats-service` publishes domain events to RabbitMQ.

---

### 5.4 network-service

**Role:** Model the **recruiter network** and job-recruiter relationships.

**Responsibilities:**

- Recruiter profiles tied to identity users.
- Role assignments (which recruiters can work which jobs).
- Simple views: “jobs assigned to me” for recruiters.

**Phase 1 Entities (examples):**

- `network.recruiters`
- `network.role_assignments`

**Interactions:**

- `api-gateway` uses network-service to:
  - Resolve “current recruiter” from current user.
  - Filter jobs by assigned recruiter.
- Future: track recruiter performance metrics, reputation graph, etc.

---

### 5.5 billing-service

**Role:** Plans, subscriptions, and Stripe integration for recruiter billing.

**Responsibilities:**

- Define recruiter subscription plans and pricing via Stripe.
- Track subscription state per recruiter.
- Handle Stripe webhooks for subscription lifecycle events.
- Provide subscription status to `api-gateway` for feature gating.

**Phase 1 Entities (examples):**

- `billing.plans`
- `billing.subscriptions`

**Interactions:**

- `apps/portal` → `api-gateway` → `billing-service` for:
  - `GET /plans`
  - `GET /subscriptions/me`
  - creating a checkout session.
- Stripe → `billing-service` via webhook:
  - Updates subscription state.
  - May emit internal events on RabbitMQ.

---

### 5.6 notification-service

**Role:** Event-driven notifications using Resend.

**Responsibilities (Phase 1):**

- Subscribe to RabbitMQ events:
  - `application.created`
  - optionally `application.stage_changed`
  - optionally `placement.created`
- For each event:
  - Map event payload to a transactional email template.
  - Use **Resend** to send the email:
    - Node.js SDK or HTTP API.
    - From a pre-configured sender domain/subdomain.
- Log sends and failures for observability and potential retries.

**Data (optional Phase 1):**

- `notifications.sent_emails` (if needed):
  - `id`
  - `event_type`
  - `recipient_email`
  - `template_id` or identifier
  - `status` (sent, failed)
  - `error_message` (nullable)
  - `created_at`

**Interactions:**

- Does not expose HTTP endpoints in Phase 1.
- Reacts purely to events on RabbitMQ and Resend responses.

---

## 6. Data Architecture

### 6.1 Database Strategy

- One Supabase Postgres instance.
- Strict schema-per-service model.
- Each service:
  - Owns its schema.
  - Owns migrations for its schema.
  - Exposes its data via HTTP API.

### 6.2 Cross-Service Relationships

- Hard FKs can exist across schemas, but should be used sparingly.
- Prefer referencing by ID and resolving via service calls where it makes sense.
- Example:
  - `ats.companies.identity_organization_id` → `identity.organizations.id` (logical FK).
  - `network.recruiters.user_id` → `identity.users.id`.

Where performance becomes an issue, consider:

- Read models / denormalized views for dashboards.
- Materialized views owned and refreshed by relevant services.

---

## 7. Authentication & Authorization

### 7.1 Authentication (Clerk)

- Frontend uses Clerk for all auth flows (sign up, sign in, session).
- `api-gateway` extracts Clerk JWT from `Authorization: Bearer` header or cookies.
- `api-gateway` verifies JWT using Clerk SDK, then attaches identity info to request context.

### 7.2 Authorization

- Authorization decisions are made in two layers:

1. **Gateway Level (coarse):**
   - Determine if user is authenticated.
   - Fetch memberships (via `identity-service`) and ensure user has required role (recruiter, company_admin, admin) for route.
   - Enforce subscription gating for recruiters (via `billing-service`).

2. **Service Level (fine-grained):**
   - Services enforce resource-level rules:
     - Example: `ats-service` ensures a recruiter can only access jobs where they are assigned (via `network-service` claims or queries).
   - Services trust the claims forwarded from gateway, not Clerk tokens.

- All services trust `api-gateway` as the only entry point for external traffic (other than Stripe webhooks).

---

## 8. Messaging & Events

### 8.1 Event Design

Events should be:

- **Domain-oriented**, not technical:
  - `application.created` instead of `ats.insert_application_row`.
- **Small and referential**:
  - Include IDs plus essential attributes, not entire row blobs.

Example `application.created` payload:

```json
{
  "event": "application.created",
  "applicationId": "uuid",
  "jobId": "uuid",
  "candidateId": "uuid",
  "submittedByRecruiterId": "uuid",
  "occurredAt": "ISO-8601 timestamp"
}
```

### 8.2 Event Bus Usage (Phase 1)

Producers:

- `ats-service`: `application.created`, `application.stage_changed`, `placement.created`.

Consumers:

- `notification-service`: send emails via Resend on key events.
- Future: analytics/reputation service, billing adjustments, etc.

RabbitMQ is used as the transport; queues and bindings follow a simple naming convention per service and event type.

---

## 9. Caching & Performance

### 9.1 Redis

Use Redis for:

- **Rate limiting** in `api-gateway`:
  - Simple per-IP and per-user limits for critical endpoints.
- **Caching** expensive reads:
  - Example: recruiter dashboard metrics (counts of active roles, pipeline stats).
  - TTL-based cache invalidation.

### 9.2 Performance Targets (Phase 1)

- API response time for typical list/detail endpoints:
  - < 300–500 ms server-side under normal load.
- Paginated queries for:
  - Roles list.
  - Applications list.
  - Placements list.

Future optimizations can include:
- Index tuning in Postgres.
- Read replicas if required.
- More aggressive caching strategies for analytics-heavy views.

---

## 10. Deployment & Operations

### 10.1 Kubernetes Manifests (No Helm)

All services and apps are deployed to an existing Kubernetes cluster with:

- Ingress controller (e.g., NGINX).
- cert-manager for TLS certificates.
- RabbitMQ and Redis already installed.

Deployment is managed using **raw Kubernetes YAML** stored in `infra/k8s/`:

- One Deployment YAML per service/app.
- One Service YAML per service/app.
- Shared or app-specific Ingress resources as needed.
- ConfigMaps and Secrets for environment-specific configuration, including:
  - Clerk keys.
  - Stripe keys.
  - Resend API keys.

Structure example:

```txt
infra/k8s/
  api-gateway/
    deployment.yaml
    service.yaml
    ingress.yaml
    configmap.yaml
  ats-service/
    deployment.yaml
    service.yaml
    configmap.yaml
  notification-service/
    deployment.yaml
    service.yaml
    configmap.yaml
  portal/
    deployment.yaml
    service.yaml
    ingress.yaml
```

### 10.2 CI/CD with GitHub Actions

CI/CD is implemented using **GitHub Actions workflows** (YAML files under `.github/workflows/`).

Each deployable target (service or app) has a workflow or a shared workflow with matrix support, for example:

1. **On PR / push to main:**
   - Run lint and tests for changed workspaces.
   - Build Docker image for changed services/apps.
   - Push images to container registry.

2. **On successful build to main (or tagged release):**
   - Apply corresponding Kubernetes manifests using `kubectl`:
     - Update image tags in manifests (via `envsubst`, `yq`, or `kustomize edit set image`).
     - `kubectl apply -f infra/k8s/<service>/`

Example workflow outline:

```yaml
name: Deploy ats-service

on:
  push:
    paths:
      - 'services/ats-service/**'
      - 'packages/**'
      - '.github/workflows/deploy-ats-service.yaml'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install deps
        run: pnpm install

      - name: Build ats-service
        run: pnpm --filter ats-service build

      - name: Build & push Docker image
        # login to registry, build image, push

      - name: Configure kubectl
        # set KUBECONFIG or use cloud-specific login

      - name: Apply Kubernetes manifests
        run: kubectl apply -f infra/k8s/ats-service/
```

This approach keeps deployment logic explicit and YAML-driven without Helm.

### 10.3 Observability

- Logging:
  - Shared logging package ensures consistent format (JSON logs, correlation IDs).
  - Logs shipped to centralized log storage (e.g., Loki/ELK/Datadog).
- Metrics:
  - Basic HTTP metrics via Fastify plugins: request count, error rate, latency.
  - Future: domain metrics (placements created, active roles, etc.).
- Tracing (optional in Phase 1):
  - OpenTelemetry integration across gateway and services for distributed tracing.
- Notifications:
  - Log Resend responses (success/failure) to support debugging deliverability issues.

---

## 11. AI-Agent Friendliness

The architecture is designed with AI agent orchestration in mind:

- **Clear service boundaries**:
  - Each service has a narrow domain and a small, focused API surface.
- **Per-service OpenAPI specs**:
  - Agents can be given a single spec instead of a giant mega-schema.
- **Directory-level scoping**:
  - An ATS-focused agent can be limited to `services/ats-service` + `packages/shared-*` + relevant docs, keeping context tight.
- **Gateway-level abstraction**:
  - For external agents (e.g., integrations), `api-gateway` offers a stable, simplified entrypoint.

This enables future patterns like:
- An “ATS agent” that manages job/candidate logic.
- A “Billing agent” that handles subscription and Stripe flows.
- A “Router agent” that understands which service to call for a given request.

---

## 12. Future Evolution

This architecture should evolve to support:

- Dedicated **placements-service** if placement logic becomes complex (multi-recruiter splits, royalties, insurance).
- **Reputation / analytics services** consuming events for scoring recruiters and companies.
- **Outreach / sourcing services** plugging into email providers, LinkedIn integrations, etc.
- **Micro-networks / white-label hubs** where agencies run their own networks on shared rails.
- Expanded usage of Resend templates and categories for richer communication (digest emails, weekly summaries, etc.).

All of these can be added as new services under `services/` without breaking existing boundaries.

---

## 13. Summary

Splits Network’s architecture is:

- Microservice-based, not monolithic.
- Organized by domain, not by technology.
- Backed by a single Postgres instance using schema-per-service.
- Integrated with Clerk for auth, Stripe for billing, and Resend for transactional email.
- Event-driven for notifications and future analytics.
- Deployed to Kubernetes using **raw YAML manifests** and **GitHub Actions workflows**, not Helm.
- Friendly to both human developers and AI agents through small, focused services and clear repo structure.

This provides a solid foundation for Phase 1 while remaining flexible enough to power the more advanced features envisioned in later phases.
