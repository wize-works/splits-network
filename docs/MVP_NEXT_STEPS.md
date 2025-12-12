# Splits Network - MVP Next Steps

**Last Updated:** December 9, 2025

## Current Status Summary

### ✅ Completed (Strong Foundation)
- **Infrastructure:** Docker Compose, Redis, RabbitMQ, Supabase schemas
- **Backend Services:** All 6 services scaffolded with Fastify
- **Database:** All schemas created (identity, ats, network, billing, notifications)
- **Core ATS:** Full CRUD for jobs, applications, candidates, placements
- **Network Service:** Recruiter management and role assignments
- **API Gateway:** Clerk auth, rate limiting, core routing
- **Shared Packages:** Types, config, logging, Fastify helpers

### 🔨 In Progress / Needs Completion

## Priority 1: Critical MVP Features (Week 1-2)

### 1. Billing Service Implementation
**Status:** Scaffold only, needs full implementation
**Required:**
- [ ] Stripe SDK integration
- [ ] Plans CRUD endpoints
- [ ] Subscriptions CRUD endpoints
- [ ] Checkout session creation
- [ ] Webhook handler for Stripe events
- [ ] Subscription status sync
**Files:** `services/billing-service/src/`

### 2. Notification Service Implementation
**Status:** Consumer scaffold only
**Required:**
- [ ] Resend SDK integration
- [ ] Email templates (inline HTML for now)
  - Application submitted notification
  - Stage change notification
  - Placement created notification
- [ ] RabbitMQ consumers for events
- [ ] Email sending logic with error handling
**Files:** `services/notification-service/src/`

### 3. Frontend Portal - Core Pages
**Status:** Auth pages only, no dashboard
**Required:**
- [ ] Layout with sidebar navigation
- [ ] Dashboard (recruiter view)
  - Active roles count
  - Candidates in process
  - Recent activity
- [ ] Roles list page
  - Table with filters
  - Job cards/rows
- [ ] Role detail & pipeline view
  - Candidate list by stage
  - Stage pills
- [ ] Submit candidate modal/form
- [ ] Candidate detail page
- [ ] Placements & earnings page (recruiter view)
**Files:** `apps/portal/src/app/`

### 4. API Gateway - Missing Routes
**Required:**
- [ ] `/api/roles` GET with recruiter filtering (aggregates ATS + Network)
- [ ] `/api/subscriptions/me` proxy to billing
- [ ] Role-based authorization middleware
- [ ] Correlation ID logging
**Files:** `services/api-gateway/src/routes.ts`

## Priority 2: Polish & Integration (Week 3)

### 5. External Service Configuration
- [ ] Clerk tenant configured
- [ ] Clerk webhooks (user.created, user.updated)
- [ ] Stripe account + products/prices
- [ ] Stripe webhooks configured
- [ ] Resend account + verified domain
- [ ] Environment variables documented

### 6. Missing API Endpoints
- [ ] GET /api/placements with filters (recruiter_id, company_id, date_range)
- [ ] GET /api/recruiters/:id/stats (submissions count, placements count)
- [ ] GET /api/companies/:id endpoint
- [ ] PATCH /api/companies/:id endpoint

### 7. Company User Experience
- [ ] Company dashboard view
- [ ] Role management page (create/edit jobs)
- [ ] Candidate pipeline management
- [ ] Hire flow (mark as hired + salary input)
- [ ] Placement view for companies

### 8. Admin Experience
- [ ] Admin dashboard overview
- [ ] Role assignment UI
- [ ] Recruiter approval flow
- [ ] Placement audit view

## Priority 3: Production Readiness (Week 4)

### 9. Testing
- [ ] Integration tests per service
- [ ] End-to-end test suite
  - Recruiter signup → submit candidate → hire flow
  - Email delivery verification
- [ ] API endpoint testing (Postman/automated)

### 10. DevOps & Deployment
- [ ] Kubernetes manifests (Deployments, Services, Ingress)
- [ ] Environment secrets management
- [ ] GitHub Actions CI/CD
- [ ] Staging environment deployment
- [ ] Production deployment guide

### 11. Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Local development setup guide
- [ ] Environment variables reference
- [ ] Deployment runbook

## Recommended Next Steps (This Week)

### Option A: Build Frontend (Fastest to Demo)
Start with portal pages to have something visual to show design partners:
1. Implement dashboard page (recruiter view)
2. Implement roles list page
3. Implement role detail + submit candidate flow
4. Test with existing backend APIs

### Option B: Complete Backend Services (More Stable)
Finish backend services so frontend can be built against complete APIs:
1. Implement billing service (Stripe integration)
2. Implement notification service (Resend integration)
3. Add missing gateway routes
4. Test all APIs with Postman

### Option C: Parallel Tracks (Fastest Overall)
- **Backend Dev:** Billing + Notification services
- **Frontend Dev:** Dashboard + Roles pages
- **DevOps:** Start Kubernetes manifests

## Known Gaps & Decisions Needed

1. **Resume uploads:** Currently not implemented. Decision: Phase 2?
2. **Multi-recruiter splits:** Current code assumes single recruiter. Phase 2?
3. **RLS (Row-Level Security):** Currently disabled in Supabase. Add for production?
4. **Rate limiting strategy:** Current is basic. Need per-user limits?
5. **Caching strategy:** Redis available but not used yet for dashboard queries
6. **File storage:** If resume uploads needed, use Supabase Storage?

## Success Metrics for MVP

- [ ] 3 design partner recruiters onboarded
- [ ] 2 design partner companies onboarded
- [ ] 5 real jobs created and tracked
- [ ] 10 candidates submitted
- [ ] 1 real placement logged
- [ ] Email notifications delivered successfully
- [ ] All critical user flows complete without errors

## Estimated Timeline

- **Week 1:** Billing + Notification services, Start frontend
- **Week 2:** Complete frontend core pages, API polish
- **Week 3:** Testing, bug fixes, company/admin views
- **Week 4:** Production deployment, design partner onboarding

**Target MVP Date:** January 6, 2026 (4 weeks from now)
