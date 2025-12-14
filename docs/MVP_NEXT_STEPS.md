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
**Status:** ✅ Core Implementation Complete
**Completed:**
- [x] Stripe SDK integration (Stripe API 2025-11-17.clover)
- [x] Plans CRUD endpoints (GET /plans, GET /plans/:id, POST /plans)
- [x] Subscriptions CRUD endpoints (GET by recruiter, status check, POST create, cancel)
- [x] Webhook handler for Stripe events (with signature verification)
- [x] Subscription status sync from Stripe
**Remaining:**
- [ ] Checkout session creation for frontend flow
- [ ] Integration tests
**Files:** `services/billing-service/src/` ✅

### 2. Notification Service Implementation
**Status:** ✅ COMPLETE
**Completed:**
- [x] Resend SDK integration
- [x] Email templates (inline HTML)
  - Application submitted notification ✅
  - Stage change notification ✅
  - Placement created notification ✅
- [x] RabbitMQ consumers for events (application_created, stage_changed, placement_created)
- [x] Email sending logic with error handling
- [x] Notification logging to database (status tracking)
- [x] Error handling with nack/requeue logic
- [x] Full data fetching from identity, ATS, and network services via HTTP clients
- [x] Service-to-service communication implemented and tested
- [x] Email content enriched with real user/job/candidate data
- [x] Test scripts created (basic + end-to-end)
- [x] Testing documentation (README-NOTIFICATIONS.md)
**Remaining:**
- [ ] Integration tests with assertions
- [ ] Production Resend domain verification
**Files:** `services/notification-service/src/` ✅ | `scripts/test-notification*.ts` ✅

### 3. Frontend Portal - Core Pages
**Status:** ✅ Core Pages Complete
**Completed:**
- [x] Layout with sidebar navigation
- [x] Dashboard (recruiter view) with stats cards and activity feed
- [x] Roles list page (/roles) - Table with real API data
- [x] Role detail & pipeline view (/roles/[id])
  - Candidate list by stage ✅
  - Stage pills ✅
  - Submit candidate modal ✅
- [x] Placements & earnings page (/placements) - Full implementation
- [x] Candidates page (/candidates) - Structure created
- [x] Admin page (/admin) - Structure created
- [x] Stage change UI (dropdown in pipeline)
- [x] Hire flow (mark as hired with salary input)
**Remaining:**
- [ ] Candidate detail page (dedicated page)
- [ ] Company dashboard view
- [ ] Role management page (company view)
- [ ] Admin functionality (role assignments, recruiter approval)
**Files:** `apps/portal/src/app/` ✅

### 4. API Gateway - Routes & Features
**Status:** ✅ Core Routes & RBAC Complete
**Completed:**
- [x] All job endpoints (GET /api/jobs, GET /api/jobs/:id, POST, PATCH)
- [x] All application endpoints (GET, POST, PATCH stage, GET by job)
- [x] All placement endpoints (GET /api/placements, GET /api/placements/:id, POST)
- [x] Recruiter endpoints (GET /api/recruiters, GET /api/recruiters/:id, POST)
- [x] Role assignment endpoints (GET /api/recruiters/:recruiterId/jobs, POST /api/assignments)
- [x] Billing endpoints (GET /api/plans, GET/POST /api/subscriptions)
- [x] Company endpoint (POST /api/companies)
- [x] `/api/me` with Clerk sync
- [x] **Role-based authorization (RBAC) fully implemented and enforced**
  - requireRoles() middleware applied to all protected endpoints ✅
  - Recruiter, company admin, hiring manager, platform admin roles ✅
  - Helper functions: isAdmin(), isRecruiter(), isCompanyUser() ✅
**Remaining:**
- [ ] GET /api/roles with recruiter filtering (aggregates ATS + Network)
- [ ] Correlation ID logging
- [ ] Integration tests
**Files:** `services/api-gateway/src/routes.ts` ✅ | `services/api-gateway/src/rbac.ts` ✅

## Priority 2: Polish & Integration (Week 3)

### 5. External Service Configuration
- [ ] Clerk tenant fully configured for production
- [ ] Clerk webhooks (user.created, user.updated)
- [ ] Stripe account + products/prices configured
- [ ] Stripe webhooks configured and tested
- [ ] Resend account + verified domain
- [x] Environment variables structured (using .env pattern)
- [ ] Environment variables fully documented

### 6. Missing API Features & Enhancements
- [ ] GET /api/placements with filters (recruiter_id, company_id, date_range)
- [ ] GET /api/recruiters/:id/stats (submissions count, placements count)
- [ ] GET /api/companies/:id endpoint
- [ ] PATCH /api/companies/:id endpoint
- [ ] Pagination for list endpoints
- [ ] GET /api/roles endpoint (aggregated view)

### 7. Company User Experience
- [ ] Company dashboard view (distinct from recruiter view)
- [ ] Role management page (create/edit jobs)
- [ ] Enhanced candidate pipeline management
- [ ] Bulk operations (reject multiple, etc.)

### 8. Admin Experience
- [ ] Admin dashboard overview with platform metrics
- [ ] Role assignment UI (assign recruiters to jobs)
- [ ] Recruiter approval flow (pending -> active)
- [ ] Placement audit view

## Priority 3: Production Readiness (Week 4)

### 9. Testing
- [ ] Integration tests per service
- [ ] End-to-end test suite
  - Recruiter signup → submit candidate → hire flow
  - Email delivery verification
- [ ] API endpoint testing (Postman/automated)

### 10. DevOps & Deployment
- [x] Kubernetes manifests (Deployments, Services, Ingress) ✅
- [x] Namespace configuration ✅
- [x] Cert-manager ClusterIssuer ✅
- [x] Redis and RabbitMQ deployments ✅
- [ ] Dockerfiles optimized for production (multi-stage builds)
- [ ] Environment secrets management (Kubernetes Secrets)
- [ ] Health check endpoints per service
- [ ] GitHub Actions CI/CD pipeline
- [-] Staging environment deployment
- [ ] Production deployment guide and runbook

### 11. Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Local development setup guide
- [ ] Environment variables reference
- [ ] Deployment runbook

## Recommended Next Steps (This Week)

### ✅ Completed Foundation:
- Billing service with Stripe integration
- Notification service with Resend integration
- All core frontend pages (dashboard, roles, placements, candidates, admin)
- Kubernetes deployment manifests
- Full API Gateway routing

### 🎯 Priority Focus Areas:

**Option A: External Integrations & Polish (Recommended)**
1. Configure external services:
   - Set up Clerk webhooks for user sync
   - Configure Stripe products and webhook endpoints
   - Verify Resend sender domain
2. Complete notification service data fetching (replace placeholders)
3. Add checkout session flow in billing service
4. Test end-to-end flows with real external APIs

**Option B: Enhanced Features**
1. ~~Implement role-based authorization (RBAC) in gateway~~ ✅ Already complete
2. Add GET /api/roles with recruiter filtering
3. Build out admin functionality (recruiter approval, role assignments)
4. Add pagination to list endpoints

**Option C: Testing & Production Readiness**
1. Write integration tests for all services
2. Add health check endpoints
3. Optimize Dockerfiles (multi-stage builds)
4. Set up CI/CD pipeline
5. Create production deployment guide

## Known Gaps & Decisions Needed

1. **Email data fetching:** Notification service has email templates but needs to fetch actual user/job/candidate data from other services (currently logs placeholders)
2. **Checkout sessions:** Billing service needs checkout session creation for frontend subscription flow
3. **Multi-recruiter splits:** Current code assumes single recruiter per placement. Decision: Phase 2
4. **RLS (Row-Level Security):** Currently disabled in Supabase. Decision: Add for production?
5. **Rate limiting strategy:** Current is basic per-IP. Need per-user limits?
6. **Caching strategy:** Redis available but not used yet for dashboard queries
7. **File storage:** If resume uploads needed, use Supabase Storage? (Not critical for Phase 1)
8. **RBAC:** Role-based authorization is not yet implemented (currently just auth check)

## Success Metrics for MVP

- [ ] 3 design partner recruiters onboarded
- [ ] 2 design partner companies onboarded
- [ ] 5 real jobs created and tracked
- [ ] 10 candidates submitted
- [ ] 1 real placement logged
- [ ] Email notifications delivered successfully
- [ ] All critical user flows complete without errors

## Estimated Timeline

**✅ Completed (Weeks 1-2):**
- Billing service with Stripe integration
- Notification service with Resend integration
- All core frontend pages (dashboard, roles, placements, candidates, admin)
- Kubernetes deployment manifests for all services
- Full API Gateway routing and proxying

**🔄 Current Week (Week 3): External Integrations & Polish**
- Configure Clerk/Stripe/Resend external accounts
- Complete notification service data fetching
- Add checkout session creation
- Test end-to-end flows

**Week 4: Production Readiness**
- Integration testing
- Health checks and monitoring
- CI/CD pipeline
- Production deployment preparation

**Target MVP Date:** January 6, 2026 (3 weeks remaining from December 13, 2025)
