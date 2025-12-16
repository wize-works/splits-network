# User Roles and Permissions

**Version:** 1.0  
**Last Updated:** December 15, 2025  
**Status:** Active

## 1. Overview

Splits Network implements a role-based access control (RBAC) system with four primary user roles and additional team-level roles (Phase 4+). Users can have multiple memberships across different organizations, with each membership defining their role and permissions within that organization's context.

### 1.1 Key Concepts

- **User**: An individual authenticated via Clerk with a unique identity
- **Organization**: A company or platform entity (e.g., hiring company, recruiting agency, or Splits Network itself)
- **Company**: A hiring entity within the ATS system. Organizations can be linked to companies (1:1 relationship for now), but not all organizations need companies (e.g., recruiter agencies operate without companies)
- **Membership**: A relationship connecting a user to an organization with a specific role
- **Multi-tenancy**: Users can be members of multiple organizations with different roles in each

**Organization-Company Relationship:**
- Recruiter agencies: Have organizations but NO companies (they work on other companies' roles)
- Hiring companies: Have organizations WITH linked companies (manage their own job postings)
- Platform: Has an organization but NO company
- Linking: Platform admins can link organizations to companies; company creation happens during company_admin onboarding
- Ratio: Currently 1:1 (one organization → one company max), may evolve to 1:many in future phases

---

## 2. Primary User Roles

### 2.1 Platform Admin

**Role Code:** `platform_admin`

**Purpose:** Manages the Splits Network platform itself, not tied to any specific company or recruiting agency.

**Capabilities:**
- View and manage all organizations, users, and memberships
- Access admin dashboard with system-wide analytics
- Manage platform settings and configurations
- Override business rules when necessary
- Access audit logs and system health metrics
- Manage billing plans and subscription tiers
- Handle dispute resolution between companies and recruiters
- Monitor and manage platform-wide data quality

**Restrictions:**
- Should not perform day-to-day recruiting or hiring activities
- Limited access to sensitive company proprietary data (except for support/audit purposes)

**Typical User:** Splits Network team members, customer support leads, system administrators

**Organization Type:** `platform` (the Splits Network organization itself)

---

### 2.2 Company Admin

**Role Code:** `company_admin`

**Purpose:** Full control over a hiring company's presence on the platform, including jobs, candidates, and internal team management.

**Capabilities:**
- Create, edit, publish, and close job postings (roles)
- Assign jobs to recruiters (internal or external)
- View all applications and candidates for their company's jobs
- Manage candidate pipeline stages
- Create and manage placements
- View company-wide analytics and reports
- Invite and manage hiring managers within their organization
- Configure company profile and integration settings (ATS sync, API keys)
- Manage subscription and billing (if applicable for company-level subscriptions)
- Set hiring policies and approval workflows
- Review and approve recruiter submissions

**Restrictions:**
- Cannot access other companies' data
- Cannot modify platform-wide settings
- Cannot directly access recruiter financial details (splits, payouts) unless explicitly shared

**Typical User:** VP of Talent, Director of Recruiting, Talent Operations Manager

**Organization Type:** `company`

---

### 2.3 Hiring Manager

**Role Code:** `hiring_manager`

**Purpose:** Collaborates on hiring within a company but with limited administrative capabilities.

**Capabilities:**
- View job postings (roles) for their company
- View applications and candidates assigned to their departments/roles
- Review candidate profiles and notes
- Provide feedback on candidates
- Move candidates through pipeline stages (with approval workflow if configured)
- Schedule and track interviews
- Request new job openings (subject to company admin approval)

**Restrictions:**
- Cannot create or publish jobs without approval
- Cannot manage company settings or integrations
- Cannot invite new team members
- Cannot assign recruiters to jobs
- Cannot view company-wide financials or analytics (only their department/roles)

**Typical User:** Engineering Manager, Sales Director, Department Head

**Organization Type:** `company`

---

### 2.4 Recruiter

**Role Code:** `recruiter`

**Purpose:** Sources and submits candidates for open roles, earns fees for successful placements.

**Capabilities:**
- View assigned jobs (roles) or all open jobs depending on assignment model
- Search and browse candidate opportunities
- Submit candidates to roles (with automatic duplicate/conflict detection)
- Track submissions and application status
- Claim sourcing rights for candidates
- View placement confirmations and earnings
- Manage recruiter profile (bio, specialties, contact info)
- View personal analytics (submissions, placements, earnings)
- Join or create recruiting teams (Phase 4+)
- Configure notification preferences

**Restrictions:**
- Cannot view other recruiters' candidates (except team members)
- Cannot edit job postings or company information
- Cannot manually change application stages (only companies can do this)
- Cannot view other recruiters' earnings (except within team context)
- Cannot access company's internal notes or restricted information

**Typical User:** Independent recruiters, recruiting agency employees, staffing professionals

**Organization Type:** `company` (if internal recruiter) or personal/agency organization

**Subscription Status:**
- **Free Tier:** Limited to X submissions per month, basic features
- **Paid Tier:** Unlimited submissions, advanced features, lower platform fee

---

## 3. Team Roles (Phase 4+)

For recruiting agencies and collaborative recruiting groups, additional team-level roles are introduced:

### 3.1 Team Owner

**Role Code:** `owner` (within `network.team_members` context)

**Purpose:** Founder/owner of a recruiting team or agency.

**Capabilities:**
- All recruiter capabilities
- Create and manage team
- Invite and remove team members
- Set team-wide split configurations
- Manage team subscription and billing
- View all team members' activities and earnings
- Configure team policies and workflows
- Set team visibility and branding

**Restrictions:**
- Cannot force splits on placements from before split agreement was established
- Must honor platform-wide rules and policies

---

### 3.2 Team Admin

**Role Code:** `admin` (within `network.team_members` context)

**Purpose:** Trusted team administrator with most owner capabilities except ownership transfer and billing.

**Capabilities:**
- All recruiter capabilities
- Invite new team members (pending owner approval)
- Manage team member permissions (except owner role)
- View team analytics
- Configure team workflows
- Reassign jobs between team members

**Restrictions:**
- Cannot remove team owner
- Cannot change billing or subscription settings
- Cannot dissolve the team

---

### 3.3 Team Member

**Role Code:** `member` (within `network.team_members` context)

**Purpose:** Full team participant with shared pipeline and split earnings.

**Capabilities:**
- All recruiter capabilities
- View team pipeline and shared candidates
- Collaborate on submissions
- Participate in split earnings per team configuration
- View team analytics and reports
- Communicate with team members

**Restrictions:**
- Cannot invite new members
- Cannot change team configuration
- Cannot view individual team member earnings (only team totals)

---

### 3.4 Team Collaborator

**Role Code:** `collaborator` (within `network.team_members` context)

**Purpose:** Limited participant, typically external or temporary team member.

**Capabilities:**
- View specific assigned jobs only
- Submit candidates with team attribution
- Earn fees per individual agreement (not subject to team split rules by default)
- Limited access to team pipeline

**Restrictions:**
- Cannot view full team analytics
- Cannot collaborate on other members' candidates
- Limited visibility into team operations

---

## 4. Permission Matrix

| Capability | Platform Admin | Company Admin | Hiring Manager | Recruiter | Team Owner | Team Admin |
|------------|:--------------:|:-------------:|:--------------:|:---------:|:----------:|:----------:|
| **Jobs/Roles** |
| View open jobs | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Create jobs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit jobs | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Close jobs | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Assign recruiters | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ |
| **Candidates** |
| Search candidates | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit candidates | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| View submissions | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ |
| Move stages | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| Claim sourcing | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Placements** |
| Create placements | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| View placements | ✅ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| **Organizations** |
| Manage org settings | ✅ | ✅ | ❌ | ❌ | ⚠️ | ⚠️ |
| Invite members | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ |
| Remove members | ✅ | ✅ | ❌ | ❌ | ✅ | ⚠️ |
| **Billing** |
| Manage subscription | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| View earnings | ✅ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| Configure splits | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Analytics** |
| Platform-wide | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Company-wide | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Department/Role | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Personal/Team | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **System** |
| Manage API keys | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| View audit logs | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ |
| Configure webhooks | ✅ | ✅ | ❌ | ❌ | ⚠️ | ❌ |

**Legend:**
- ✅ Full access
- ⚠️ Limited/scoped access (see role details)
- ❌ No access

---

## 5. Data Scoping Rules

### 5.1 Recruiter Data Scoping

Recruiters can only view:
- Jobs explicitly assigned to them OR all open jobs (depending on company preference)
- Their own candidate submissions
- Applications and stages for candidates they submitted
- Placements where they are the recruiter of record
- Their own earnings and payout history
- Team data (if part of a team)

### 5.2 Company Data Scoping

Company admins and hiring managers can view:
- All jobs for their organization
- All applications to their organization's jobs
- All candidates submitted to their jobs (regardless of recruiter)
- All placements for their organization
- Company-wide or department-specific analytics

### 5.3 Platform Admin Data Scoping

Platform admins can view:
- All system data across all organizations
- Audit logs and system metrics
- Aggregated anonymized analytics
- Specific company/recruiter data for support and compliance purposes

---

## 6. Role Assignment & Management

### 6.1 Initial Role Assignment

**New User Onboarding:**
1. User signs up via Clerk authentication
2. User is synced to `identity.users` table
3. During onboarding flow, user selects their role intent:
   - "I'm hiring" → Creates company organization + assigns `company_admin` role
   - "I'm recruiting" → Creates personal organization + assigns `recruiter` role
4. Membership created in `identity.memberships` table

**Invitation Flow:**
1. Company admin or team owner sends invite
2. Invited user creates account (or uses existing)
3. Membership created with specified role
4. User accepts invitation to activate membership

### 6.2 Role Changes

**Elevation (e.g., Hiring Manager → Company Admin):**
- Requires existing company admin approval
- Logged in audit trail
- Previous permissions immediately replaced

**Demotion:**
- Requires company admin or platform admin action
- Logged in audit trail
- Access immediately restricted

**Role Transitions:**
- Users can have multiple memberships (e.g., recruiter at Agency A + hiring manager at Company B)
- Each membership is independent with its own role
- Authentication context includes all active memberships

### 6.3 Deactivation

**Membership Removal:**
- Membership set to inactive
- User loses access to that organization's data
- Historical data (submissions, placements) remains attributed
- User can still access other active memberships

**Account Deactivation:**
- All memberships deactivated
- User cannot log in
- Historical audit trail preserved

---

## 7. Authentication & Authorization Flow

### 7.1 Authentication (Who are you?)

1. User authenticates via Clerk (sign-in, SSO, etc.)
2. Clerk issues JWT session token
3. API Gateway verifies token with Clerk
4. Gateway resolves user identity via Identity Service

### 7.2 Authorization (What can you do?)

1. Gateway retrieves user's memberships from Identity Service
2. Memberships include organization_id and role for each
3. Gateway attaches `AuthContext` to request:
   ```typescript
   {
     userId: string;
     clerkUserId: string;
     email: string;
     name: string;
     memberships: [
       {
         id: string;
         organization_id: string;
         organization_name: string;
         role: 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin';
       }
     ]
   }
   ```
4. Route handlers use RBAC middleware to check roles:
   ```typescript
   fastify.get('/jobs', {
     preHandler: requireRoles(['company_admin', 'hiring_manager', 'recruiter'])
   }, handler);
   ```
5. Business logic applies additional data scoping based on role

### 7.3 Context Switching (Future Enhancement)

For users with multiple memberships:
- UI provides organization switcher
- Selected organization stored in session/context
- API requests include `X-Organization-Id` header
- Backend validates user has membership in requested organization

---

## 8. Security Considerations

### 8.1 Principle of Least Privilege

- Users are granted only the permissions necessary for their role
- Default deny: if not explicitly permitted, access is denied
- Scope all queries by organization_id or user_id where applicable

### 8.2 Audit Logging

All role-based actions are logged:
- Who performed the action (user_id)
- What role they used (role from membership)
- What organization context (organization_id)
- What action was performed
- When it occurred (timestamp)

### 8.3 Cross-Organization Isolation

- Strict validation that users can only access data within organizations they're members of
- Platform admins log use of cross-organization data access for compliance
- API responses filtered by membership context

### 8.4 Sensitive Data Protection

- Recruiter earnings visible only to that recruiter (and platform admin)
- Company proprietary information not visible to external recruiters
- Candidate PII access logged and restricted

---

## 9. Implementation References

### 9.1 Key Files

- **RBAC Logic:** [services/api-gateway/src/rbac.ts](../services/api-gateway/src/rbac.ts)
- **Auth Middleware:** [services/api-gateway/src/auth.ts](../services/api-gateway/src/auth.ts)
- **Identity Service:** [services/identity-service/src/service.ts](../services/identity-service/src/service.ts)
- **Shared Types:** [packages/shared-types/src/](../packages/shared-types/src/)

### 9.2 Database Tables

- **Users:** `identity.users`
- **Organizations:** `identity.organizations` (with `type`: `company` or `platform`)
- **Memberships:** `identity.memberships` (links users to organizations with roles)
- **Teams:** `network.teams` (Phase 4+)
- **Team Members:** `network.team_members` (Phase 4+, with team-level roles)

### 9.3 Type Definitions

```typescript
// From api-gateway/src/auth.ts
export type UserRole = 'recruiter' | 'company_admin' | 'hiring_manager' | 'platform_admin';

// Team roles from network.team_members
export type TeamRole = 'owner' | 'admin' | 'member' | 'collaborator';
```

---

## 10. Future Enhancements

### 10.1 Custom Roles (Backlog)

- Allow companies to define custom roles (e.g., "Sourcing Specialist", "Recruiting Coordinator")
- Map custom roles to base permission sets
- UI for companies to manage custom role definitions

### 10.2 Fine-Grained Permissions (Backlog)

- Permission flags beyond role (e.g., `can_approve_placements`, `can_view_salary_data`)
- Role templates with customizable permission sets

### 10.3 Temporary Access (Backlog)

- Time-bound role assignments (e.g., contractor with 90-day access)
- Automatic expiration and notifications

### 10.4 Delegation (Backlog)

- Allow users to temporarily delegate authority (e.g., out-of-office coverage)
- Audit trail of delegated actions

---

## 11. FAQ

**Q: Can a user be both a recruiter and a company admin?**  
A: Yes. A user can have multiple memberships across different organizations. For example, a recruiter who also works as a hiring manager at their own company would have two memberships with different roles.

**Q: What happens if a recruiter's subscription expires?**  
A: They revert to free tier limitations (limited submissions, restricted features). Their role remains `recruiter`, but feature access is gated by subscription status checked via Billing Service.

**Q: Can hiring managers view recruiter earnings?**  
A: No. Recruiter earnings are private to the recruiter and platform admins. Companies see only the placement fee they're paying, not how it's split.

**Q: How are disputes between recruiters handled?**  
A: Platform admins have override capabilities to resolve sourcing conflicts, adjust placements, and mediate disputes. All actions are logged.

**Q: Can a company admin become a recruiter?**  
A: Yes, by creating or joining a recruiter organization. They would have two separate memberships with different roles in each context.

**Q: What role does the API Gateway assign if a user has multiple memberships?**  
A: The gateway includes all memberships in the AuthContext. Business logic can then determine which membership applies for a given request (e.g., based on organization context or resource ownership).

---

**Document Owner:** Platform Team  
**Review Cycle:** Quarterly  
**Related Documents:**
- [Architecture Overview](./splits-network-architecture.md)
- [Phase 1 PRD](./splits-network-phase1-prd.md)
- [Phase 4 PRD - Teams](./splits-network-phase4-prd.md)
- [API Documentation](./API-DOCUMENTATION.md)
