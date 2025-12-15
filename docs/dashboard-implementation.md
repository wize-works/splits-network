# Dashboard Implementation Guide

## Overview

The main dashboard (`/dashboard`) now provides **persona-specific experiences** based on user role:
- **Recruiter Dashboard**: Focus on assigned roles, active candidates, placements, and earnings
- **Company Dashboard**: Focus on hiring pipeline, role-by-role breakdown, and recruiting performance
- **Admin Dashboard**: Platform-wide health metrics, automation tools, and operational alerts

## Implementation

### Files Created/Modified

#### Frontend Components

1. **`apps/portal/src/app/(authenticated)/dashboard/page.tsx`**
   - Root dashboard page with persona-based routing
   - Determines user role from Clerk memberships
   - Routes to appropriate dashboard component
   - Includes fallback onboarding UI for users without roles

2. **`apps/portal/src/app/(authenticated)/dashboard/recruiter-dashboard.tsx`**
   - Recruiter-focused dashboard showing:
     - Active roles assigned to recruiter
     - Candidates in process
     - Pending offers
     - Placements and earnings (YTD and monthly)
     - Pending payouts
     - Recent activity feed (application submissions, stage changes, offers, placements)
     - Quick actions (browse roles, view candidates, placements, earnings)
     - Top active roles with candidate counts

3. **`apps/portal/src/app/(authenticated)/dashboard/company-dashboard.tsx`**
   - Company admin/member dashboard showing:
     - Active roles posted by company
     - Total applications in pipeline
     - Interviews scheduled
     - Offers extended and hires made
     - Average time to hire
     - Active recruiters working on company roles
     - Role-by-role breakdown table (applications, interviews, offers, days open, status)
     - Recent activity feed (applications received, interviews, offers, placements, new roles)
     - Insights and alerts (e.g., roles open 60+ days with low candidate flow)
     - Quick actions (post new role, manage roles, view candidates, placements)

4. **`apps/portal/src/app/(authenticated)/dashboard/admin-dashboard.tsx`**
   - Platform admin dashboard showing:
     - Platform-wide stats (total roles, recruiters, companies, applications, placements)
     - Revenue and payout metrics (YTD revenue, pending payouts, pending approvals)
     - Marketplace health indicators (recruiter/company satisfaction, time to first candidate, time to placement, fill rate)
     - Recent platform activity (placements, company/recruiter signups, role creation, payouts, alerts)
     - Alert system for pending approvals, fraud signals, automation reviews
     - Links to Phase 3 admin tools (payouts, automation, fraud, decision log)
     - Core platform management links (users, companies, roles, metrics)

#### Backend API Routes

**`services/api-gateway/src/routes.ts`** - Added dashboard endpoints:

**Recruiter Dashboard:**
- `GET /api/recruiter/dashboard/stats` - Active roles, candidates, offers, placements, earnings
- `GET /api/recruiter/dashboard/activity` - Recent activity feed

**Company Dashboard:**
- `GET /api/company/dashboard/stats` - Active roles, applications, interviews, offers, hires, avg time to hire
- `GET /api/company/dashboard/roles` - Role breakdown with pipeline stats
- `GET /api/company/dashboard/activity` - Recent activity feed

**Admin Dashboard:**
- `GET /api/admin/dashboard/stats` - Platform-wide metrics
- `GET /api/admin/dashboard/health` - Marketplace health indicators
- `GET /api/admin/dashboard/activity` - Platform activity feed
- `GET /api/admin/dashboard/alerts` - Operational alerts

## Role Detection Logic

The dashboard routing uses Clerk membership data:

```typescript
// Check if user is platform admin
const isAdmin = profile.data.memberships?.some(
    (m: any) => m.type === 'platform' && m.role === 'admin'
);

// Check if user is company admin/member
const isCompanyUser = profile.data.memberships?.some(
    (m: any) => m.type === 'organization' && ['admin', 'member'].includes(m.role)
);

// Check if user is recruiter
const isRecruiter = profile.data.memberships?.some(
    (m: any) => m.type === 'recruiter'
);
```

Priority order:
1. **Admin** - If user is platform admin, show Admin Dashboard
2. **Company** - Else if user is company admin/member, show Company Dashboard
3. **Recruiter** - Else if user is recruiter, show Recruiter Dashboard
4. **Onboarding** - Else show onboarding prompts to set up profile

## Data Loading Pattern

All dashboard components follow this pattern:

1. **Initial Load**: Show loading spinner
2. **Parallel Data Fetching**: Use `ApiClient` to fetch all required data
3. **Error Handling**: Catch and log errors, show fallback UI
4. **Render**: Display stats, charts, activity feeds, and quick actions

Example:
```typescript
const loadDashboardData = async () => {
    setLoading(true);
    try {
        const api = new ApiClient(undefined, token);
        const statsResponse = await api.get('/recruiter/dashboard/stats');
        setStats(statsResponse.data);
        // ... load other data
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    } finally {
        setLoading(false);
    }
};
```

## UI Components Used

All dashboards use DaisyUI components:
- **Stats cards** (`stats`, `stat`) - Key metrics display
- **Cards** (`card`, `card-body`) - Content sections
- **Badges** (`badge`) - Status indicators
- **Tables** (`table`, `table-zebra`) - Data display (Company dashboard roles)
- **Alerts** (`alert`, `alert-info`, `alert-warning`) - Insights and notifications
- **Buttons** (`btn`, `btn-primary`, `btn-outline`) - Actions
- **Loading** (`loading-spinner`) - Loading states
- **Radial Progress** (`radial-progress`) - Health metrics (Admin dashboard)
- **Gradients** - Hero sections

## Backend Implementation Status

### ✅ Implemented
- API Gateway routes with RBAC (role-based access control)
- Persona detection middleware
- Basic endpoint structure

### ❌ Not Yet Implemented (Returning Mock Data)
The following endpoints currently return empty/zero data with TODOs:

**Recruiter Dashboard:**
- Candidate count aggregation
- Offers pending count
- Placements by date range
- Earnings calculations
- Activity feed from ATS events

**Company Dashboard:**
- Company-specific stats from ATS
- Role breakdown with pipeline counts
- Average time-to-hire calculation
- Active recruiters count
- Activity feed for company roles
- Insights/alerts logic

**Admin Dashboard:**
- Platform-wide aggregations across services
- Marketplace health metrics calculation
- Satisfaction scores (requires survey system)
- Platform activity stream
- Alert aggregation system

## Next Steps to Complete Implementation

### 1. ATS Service Enhancements

Add dedicated dashboard endpoints in `services/ats-service/src/routes.ts`:

```typescript
// Recruiter stats
GET /recruiter/:recruiterId/stats?start_date=&end_date=

// Company stats
GET /company/:companyId/stats

// Company role breakdown
GET /company/:companyId/roles-breakdown

// Platform-wide stats (admin only)
GET /admin/platform-stats
```

### 2. Network Service Enhancements

Add recruiter activity tracking:

```typescript
// Recruiter activity feed
GET /recruiters/:recruiterId/activity?limit=10

// Active recruiters for company
GET /companies/:companyId/active-recruiters
```

### 3. Billing Service Enhancements

Add earnings and payout endpoints:

```typescript
// Recruiter earnings
GET /recruiters/:recruiterId/earnings?year=2025

// Pending payouts
GET /recruiters/:recruiterId/pending-payouts

// Platform revenue
GET /admin/revenue-stats?year=2025
```

### 4. Activity Feed System

Implement event-driven activity tracking:
- Capture key events from all services (applications, stage changes, offers, placements)
- Store in centralized activity log or per-service tables
- Expose via API with filtering by user/company/platform

### 5. Health Metrics Calculation

Implement marketplace health calculations:
- **Recruiter/Company Satisfaction**: Survey system with NPS scoring
- **Time to First Candidate**: Track time from role creation to first application
- **Time to Placement**: Track time from role creation to placement
- **Fill Rate**: Calculate (filled roles / total roles) * 100

### 6. Alert System

Build alert aggregation:
- Query pending payouts from billing service
- Query fraud signals from automation service
- Query automation approvals from automation service
- Return consolidated alert list with links

## Testing

### Manual Testing Checklist

**Recruiter Dashboard:**
- [ ] View as recruiter with assigned roles
- [ ] View as recruiter with no assigned roles
- [ ] View stats cards (all should show 0 initially)
- [ ] Check quick actions links work
- [ ] Verify activity feed shows "No recent activity"

**Company Dashboard:**
- [ ] View as company admin
- [ ] View as company member
- [ ] View with active roles
- [ ] View with no roles (should prompt to create first role)
- [ ] Check role breakdown table displays correctly
- [ ] Verify "Create Role" button links correctly

**Admin Dashboard:**
- [ ] View as platform admin
- [ ] Check all platform stats display
- [ ] Verify marketplace health indicators render
- [ ] Check Phase 3 tools links work
- [ ] Test alert system displays (will be empty initially)

**Routing:**
- [ ] Admin user sees Admin Dashboard (highest priority)
- [ ] Company user (non-admin) sees Company Dashboard
- [ ] Recruiter (non-company, non-admin) sees Recruiter Dashboard
- [ ] User with no roles sees onboarding UI

## Design Patterns

### 1. Persona-Based Routing
Dashboard routing happens at the page level, not with navigation or URL parameters. Clean separation of concerns.

### 2. Component Isolation
Each dashboard is self-contained with its own data fetching, state management, and UI.

### 3. Progressive Enhancement
Dashboards work with empty data (graceful degradation), will automatically populate when backend is implemented.

### 4. Consistent API Patterns
All endpoints follow REST conventions and use `{ data: {...} }` wrapper format.

### 5. RBAC Enforcement
API Gateway enforces role requirements via `requireRoles()` middleware before proxying to services.

## References

- **Architecture**: `docs/splits-network-architecture.md`
- **Phase 1 PRD**: `docs/splits-network-phase1-prd.md` (defines roles, users, placements)
- **Phase 3 PRD**: `docs/splits-network-phase3-prd.md` (defines automation, payouts, metrics)
- **Persona Navigation**: `docs/splits-network-nav-by-persona.md`
- **Form Controls**: `docs/guidance/form-controls.md`
- **API Gateway RBAC**: `services/api-gateway/src/rbac.ts`
- **Admin Dashboard**: `docs/admin-dashboard-implementation.md`

---

**Status**: Frontend complete with API contracts defined. Backend implementation required for real data.
**Version**: 1.0
**Date**: December 14, 2025
