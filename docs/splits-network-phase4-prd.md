
# Splits Network – Phase 4 PRD (Platform Expansion, Network Effects & Defensibility)

Phase 4 begins after:
- Phase 3 payouts, automation infrastructure, and trust controls are live
- The marketplace operates with minimal manual intervention
- Economics, ownership, and payouts are stable under real volume

Phase 4 is not about adding features.
Phase 4 is about locking in network effects, expanding surfaces, and making Splits Network hard to replace.

---

## 0. Phase 4 Implementation Checklist

### Platform Expansion
- [x] Public API (read + write scopes) - **OAuth 2.0, JWT tokens, 7 scopes**
- [x] Webhooks for partner integrations - **13 event types, HMAC verification, retry logic**
- [x] API versioning (v1) - **URL-based versioning, deprecation headers**
- [x] External recruiter team support - **Teams database, 4 member roles, split configurations**
- [x] Company ATS integrations - **Greenhouse integration, sync worker, encrypted credentials**
- [ ] Platform admin organization-company management - **Link/unlink orgs to companies, auto-create on onboarding**
- [ ] Identity federation for enterprise clients - **Planned: Okta, Azure AD**

### Network Effects
- [x] Recruiter team accounts - **Full team hierarchy with owner/admin/member/collaborator**
- [x] Agency-level economics and reporting - **4 split models, consolidated billing**
- [ ] Cross-network candidate portability rules
- [ ] Internal liquidity optimization
- [ ] Invite-only premium roles

### Product Surfaces
- [ ] Recruiter browser extension
- [ ] Lightweight candidate portal
- [ ] Embedded company intake widgets
- [ ] White-label intake pages

### Governance & Defensibility
- [ ] Policy engine (rules-as-code)
- [ ] Economic simulations
- [ ] Regulatory readiness
- [ ] Platform-level SLAs

---

**Implementation Status (as of December 15, 2025):**

**✅ Completed:**
- **Phase 4A: Platform APIs** - OAuth 2.0 system with 7 scopes, token manager, 4 REST routes
- **Phase 4A: Webhooks** - 13 event types, HMAC-SHA256 signing, delivery service with retry logic (3 attempts with exponential backoff), 8 webhook management routes
- **Phase 4A: API Versioning** - v1 routing in gateway, deprecation headers, Swagger documentation
- **Phase 4B: Teams & Agencies** - Complete team hierarchy (5 tables: teams, members, splits, configurations, invitations), team service layer (485 lines), team repository (542 lines), 16 REST routes, team UI (2 pages: list + detail with tabs)
- **Phase 4C: ATS Integrations** - Greenhouse API client (415 lines), integration service with AES-256 encryption (543 lines), sync worker with background queue processing (426 lines), 4 database tables (integrations, sync_logs, external_entity_map, sync_queue), 9 REST routes, 3 frontend pages (list, detail, new integration wizard), Docker deployment ready

**🔄 In Progress:**
- None currently

**📋 Next Up:**
- Phase 4D: Platform Admin Organization Management (link orgs to companies)
- Phase 4E: Company Onboarding Automation (auto-create companies for company_admin)
- Phase 4F: Browser Extension (recruiter tools)
- Phase 4G: Candidate Portal (lightweight status tracking)
- Phase 4H: Company Widgets (embeddable intake forms)

---

## 1. Phase 4 Goals

1. Create irreversible network effects
2. Expand beyond a single UI
3. Lock in recruiters and companies structurally
4. Increase switching costs ethically
5. Enable new revenue surfaces safely

---

## 2. Platform APIs & Extensibility

### 2.1 Public API

**Goal:** Enable partners, agencies, and power users to integrate Splits Network into their workflows.

**API Scopes:**
- `read:roles` – List and view open roles
- `read:candidates` – View candidate profiles (scoped to own submissions)
- `read:placements` – View placement records and status
- `read:payouts` – View payout history and amounts
- `write:submissions` – Submit candidates to roles
- `write:updates` – Update candidate status and notes
- `write:roles` (Company only) – Create and manage roles

**Authentication:**
- OAuth 2.0 with refresh tokens
- API keys for server-to-server integrations
- Clerk JWT verification for authenticated requests
- Scoped access by role type (recruiter, company, admin)

**Rate Limiting:**
- Standard tier: 100 requests/hour
- Premium tier: 1,000 requests/hour
- Enterprise tier: Custom limits + dedicated support

**API Versioning:**
- Version in URL path: `/api/v1/roles`
- Maintain v1 for minimum 12 months after v2 release
- Deprecation warnings in response headers

**Documentation:**
- OpenAPI 3.0 spec auto-generated from routes
- Interactive docs via Swagger UI
- SDK examples in JavaScript, Python, Ruby
- Postman collection with sample requests

### 2.2 Webhooks

**Goal:** Enable real-time notifications for partner systems.

**Event Types:**
- `role.created` – New role posted
- `role.updated` – Role details changed
- `role.closed` – Role no longer accepting submissions
- `application.submitted` – New candidate submitted
- `application.stage_changed` – Candidate moved to new stage
- `placement.created` – Placement finalized
- `payout.processed` – Payment completed
- `payout.failed` – Payment error occurred

**Webhook Configuration:**
- Register webhook URLs via UI or API
- Secret signing for payload verification (HMAC-SHA256)
- Automatic retry with exponential backoff (3 attempts)
- Webhook history and delivery logs
- Ability to replay failed events

**Payload Format:**
```json
{
  "event": "application.stage_changed",
  "timestamp": "2025-12-15T10:30:00Z",
  "data": {
    "application_id": "uuid",
    "role_id": "uuid",
    "candidate_id": "uuid",
    "old_stage": "screening",
    "new_stage": "interview",
    "changed_by": "user_uuid"
  }
}
```

**Security:**
- Webhook secrets rotatable via API
- IP allowlisting for enterprise clients
- TLS 1.2+ required for endpoints
- Webhook signature validation required

### 2.3 API Gateway Extensions

**New Gateway Responsibilities:**
- OAuth token issuance and validation
- Scope enforcement per endpoint
- Rate limiting by API key/user
- Webhook delivery queue management
- API usage analytics and billing

**Audit Logging:**
- Log all API requests with timestamp, user, endpoint, response code
- Store for compliance (12 months minimum)
- Queryable via admin dashboard
- Export to SIEM systems for enterprise clients

---

## 3. Recruiter Teams & Agencies

### 3.1 Team Accounts

**Goal:** Enable recruiting agencies to operate as unified entities with multiple team members.

**Team Structure:**
- Team owner (billing responsible party)
- Team admins (manage members, view all activity)
- Team members (individual recruiters)
- External collaborators (limited access, no payout visibility)

**Team Features:**
- Shared candidate pipeline visibility
- Team-level analytics dashboard
- Consolidated billing and payout distribution
- Internal role assignment and handoffs
- Team chat/notes on candidates (Phase 5)

**Database Schema:**

**`network.teams`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `name` | text | Team/agency name |
| `owner_user_id` | uuid | FK → `identity.users` |
| `billing_organization_id` | uuid | FK → `identity.organizations` |
| `status` | enum | `active`, `suspended` |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

**`network.team_members`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `team_id` | uuid | FK → `network.teams` |
| `recruiter_id` | uuid | FK → `network.recruiters` |
| `role` | enum | `owner`, `admin`, `member`, `collaborator` |
| `joined_at` | timestamptz | |
| `status` | enum | `active`, `invited`, `removed` |

### 3.2 Agency-Level Economics

**Split Distribution Models:**
1. **Flat Split:** All team members split equally
2. **Tiered Split:** Owner takes fixed percentage, remainder split
3. **Individual Credit:** Each member keeps their own earnings
4. **Hybrid:** Team overhead fee (e.g., 20%) + individual splits

**Configuration:**
- Team owner sets default split model
- Per-placement overrides allowed
- Historical split rules preserved for past placements
- Transparent splits visible to all team members

**Consolidated Billing:**
- Single subscription for team (covers all members)
- Volume discounts at team level (e.g., 10+ recruiters get 20% off)
- Team owner receives unified invoice
- Payout statements show individual and team totals

### 3.3 Team Reporting & Analytics

**Team Dashboard:**
- Total placements by team
- Revenue by team member
- Pipeline health (submissions → placements conversion)
- Top performing roles/companies
- Time-to-placement averages

**Benchmarking:**
- Compare team performance to network averages
- Identify top performers within team
- Highlight underperforming roles or candidates

---

## 4. Company Integrations

### 4.1 ATS Synchronization

**Goal:** Reduce manual work for companies by syncing role data and candidate stages.

**Supported ATS Platforms (Phase 4):**
1. Greenhouse
2. Lever
3. Workable
4. Ashby
5. (Generic API for others)

**Sync Capabilities:**

**Inbound (ATS → Splits Network):**
- New roles automatically posted to network
- Role updates (title, salary, requirements) synced
- Role closures automatically marked as filled
- Interview feedback synced to candidate records

**Outbound (Splits Network → ATS):**
- Submitted candidates appear as new applications
- Candidate profile data pre-fills ATS form
- Stage changes in Splits trigger ATS updates
- Placement records tagged with recruiter attribution

**Implementation:**

**`ats.integrations`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `company_id` | uuid | FK → `ats.companies` |
| `platform` | enum | `greenhouse`, `lever`, etc. |
| `api_key_encrypted` | text | Encrypted ATS API key |
| `webhook_url` | text | ATS webhook endpoint |
| `sync_enabled` | boolean | Master on/off switch |
| `sync_roles` | boolean | Auto-sync roles |
| `sync_candidates` | boolean | Auto-sync candidates |
| `last_synced_at` | timestamptz | |
| `created_at` | timestamptz | |

**`ats.sync_logs`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `integration_id` | uuid | FK → `ats.integrations` |
| `entity_type` | enum | `role`, `candidate`, `stage` |
| `entity_id` | uuid | |
| `action` | enum | `created`, `updated`, `deleted` |
| `status` | enum | `success`, `failed`, `skipped` |
| `error_message` | text | Nullable |
| `synced_at` | timestamptz | |

**Service Layer:**
- Create `services/ats-integration-service` (or extend ATS service)
- Poll ATS APIs every 5 minutes for changes
- Consume webhooks from ATS platforms (faster updates)
- Handle conflicts (e.g., role closed in both systems)
- Retry failed syncs with exponential backoff

---

**✅ Implementation Notes (Phase 4C - Completed December 15, 2025):**

**Database Schema (4 tables):**
- `ats.integrations` - Stores integration configurations with encrypted API keys (AES-256-CBC)
- `ats.sync_logs` - Audit trail of all sync operations with success/failure tracking
- `ats.external_entity_map` - Maps Splits entities to ATS entities for bidirectional sync
- `ats.sync_queue` - Async job queue for background processing with priority levels (1-10)

**Backend Implementation:**
- **Greenhouse Client** (`greenhouse-client.ts`, 415 lines):
  - Board API for public job listings
  - Harvest API for authenticated operations (jobs, candidates, applications, users, departments, offices)
  - Webhook signature verification with HMAC-SHA256
  - Rate limiting support with configurable delays
  - Comprehensive error handling with typed responses

- **Integration Service** (`integration-service.ts`, 551 lines):
  - CRUD operations for integrations with encrypted credential storage
  - Sync execution with direction support (pull_jobs, pull_candidates, push_candidates)
  - External entity mapping for ID translation
  - Queue management with priority-based scheduling
  - Statistics tracking (total syncs, successes, failures, last sync time)

- **Sync Worker** (`sync-worker.ts`, 426 lines):
  - Background queue processor polling every 5 seconds (configurable)
  - Batch processing (10 items per batch, configurable)
  - Concurrent execution (max 5, configurable)
  - Exponential backoff retry logic (1, 2, 4, 8, 16 minutes, max 3 retries)
  - Periodic scheduling for regular syncs
  - Health check endpoint
  - Graceful shutdown handling

- **REST API** (`routes.ts`, 254 lines):
  - 9 endpoints for integration management
  - CRUD operations with validation
  - Manual sync triggers
  - Statistics retrieval
  - Queue item management

**Frontend Implementation (3 pages, 680 lines):**
- **List Page** (`integrations/page.tsx`, 312 lines):
  - Grid view of all integrations with status indicators
  - Last sync timestamp display
  - Quick actions (view, sync, delete)
  - Create new integration button

- **Detail Page** (`integrations/[id]/page.tsx`, 441 lines):
  - Tabbed interface (Overview, Sync History, Settings, Danger Zone)
  - Real-time sync status with last 10 sync logs
  - Manual sync trigger with direction selection
  - Configuration management
  - Delete integration with confirmation

- **New Integration Wizard** (`integrations/new/page.tsx`, 427 lines):
  - Multi-step form (Platform → Credentials → Sync Settings → Confirm)
  - Platform selection (Greenhouse currently supported)
  - Credential input with visibility toggle
  - Test connection before saving
  - Sync direction and frequency configuration

**Docker Deployment:**
- Separate container for sync worker (`ats-sync-worker`)
- Dockerfile with multi-stage build
- docker-compose.yml configuration with health checks
- Environment variable configuration for all settings
- Kubernetes manifests ready (Deployment, Service, ConfigMap, Secret)

**Configuration:**
- Schema-aware Supabase client (uses 'ats' schema by default)
- Encrypted credential storage with secret key from environment
- Configurable polling intervals, batch sizes, and concurrency limits
- Webhook endpoints for real-time sync triggers from ATS platforms

**Documentation:**
- Comprehensive README with architecture, setup, and troubleshooting
- API examples for all endpoints
- Queue processing flow diagrams
- Error handling and retry logic documentation

**Known Limitations:**
- Only Greenhouse integration implemented (Lever, Workable, Ashby pending)
- Webhook consumption from ATS platforms not yet implemented (polling only)
- No conflict resolution UI (uses last-write-wins currently)
- Single-threaded worker (horizontal scaling requires queue coordination)

**Next Steps for Phase 4C+:**
- Add Lever, Workable, and Ashby integrations
- Implement webhook consumption from ATS platforms
- Add conflict resolution UI for manual intervention
- Add horizontal scaling support with distributed queue coordination
- Add sync analytics dashboard for admins

---

### 4.2 Enterprise SSO & Identity Federation

**Goal:** Enable large companies to manage access via their identity provider.

**Supported Providers:**
- Okta
- Azure AD (Microsoft Entra)
- Google Workspace
- SAML 2.0 (generic)

**Implementation:**
- Clerk supports SSO connections out of the box
- Company admin configures SSO via portal
- Users log in with corporate credentials
- JIT (Just-in-Time) provisioning creates accounts automatically
- SCIM support for user lifecycle management (create, update, deactivate)

**Access Control:**
- Company can enforce SSO (disable password login)
- Role-based access mapped from IdP groups
- Automatic user deprovisioning on termination

### 4.3 Custom Contracts & White-Label Terms

**Goal:** Allow enterprise clients to use custom fee structures and terms.

**Custom Fee Structures:**
- Negotiated flat fees per placement
- Volume discounts (e.g., 10+ placements per year = 10% off)
- Exclusive recruiter pools
- Dedicated account manager

**Database:**

**`billing.custom_contracts`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `company_id` | uuid | FK → `ats.companies` |
| `fee_percentage` | decimal | Override standard 20% |
| `flat_fee_cents` | integer | Nullable, alternative to % |
| `min_placements_per_year` | integer | Commitment |
| `discount_percentage` | decimal | Volume discount |
| `contract_start_date` | date | |
| `contract_end_date` | date | Nullable |
| `terms_document_url` | text | Custom legal terms |
| `approved_by_admin_id` | uuid | FK → `identity.users` |
| `created_at` | timestamptz | |

**Enforcement:**
- Billing service checks for custom contract before calculating fees
- Override standard 20% platform fee if contract exists
- Track compliance with minimum placement commitments
- Alert account manager if contract nearing expiration

---

## 4.4 Platform Admin: Organization-Company Management

**Goal:** Enable platform admins to manage the relationship between identity organizations and ATS companies, and automate company creation during onboarding.

**Background:**
- Not all organizations need companies (e.g., recruiter agencies work on other companies' roles)
- Hiring companies have organizations WITH linked companies (to manage job postings)
- Currently 1:1 relationship (one organization can link to one company)
- May evolve to 1:many in future phases

### 4.4.1 Platform Admin Management UI

**Organization-Company Linking Interface:**

**Page:** `/admin/organizations`

**Features:**
- **Organization List View:**
  - Display all organizations with columns: Name, Type, Linked Company, Created Date, Status
  - Filter by: has company / no company, organization type
  - Search by organization name or company name
  - Bulk actions: Export to CSV

- **Link/Unlink Actions:**
  - "Link Company" button for organizations without companies
  - Modal with dropdown to select existing company OR create new company
  - "Unlink Company" button with confirmation dialog
  - Display warning if unlinking will affect active roles or team members

- **Audit Trail:**
  - Log all linking/unlinking actions with timestamp, admin user, reason
  - Display history in organization detail view
  - Track changes to company assignments over time

**Implementation:**

**Database Schema:**

No schema changes needed - use existing `ats.companies.identity_organization_id` field.

**`identity.organization_change_log`** (new table for audit trail):
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `organization_id` | uuid | FK → `identity.organizations` |
| `change_type` | enum | `company_linked`, `company_unlinked`, `company_changed` |
| `old_company_id` | uuid | Nullable, FK → `ats.companies` |
| `new_company_id` | uuid | Nullable, FK → `ats.companies` |
| `changed_by_user_id` | uuid | FK → `identity.users` |
| `reason` | text | Optional explanation |
| `changed_at` | timestamptz | |

**Backend Endpoints:**

```typescript
// In api-gateway/src/routes.ts (platform_admin only)
GET    /api/admin/organizations                    // List all orgs with company links
GET    /api/admin/organizations/:id                // Get org details with company
POST   /api/admin/organizations/:id/link-company   // Link org to company
DELETE /api/admin/organizations/:id/unlink-company // Unlink org from company
GET    /api/admin/organizations/:id/change-log     // Get audit trail
```

**Service Implementation:**

```typescript
// In services/identity-service/src/organization-service.ts
export class OrganizationService {
  async linkOrganizationToCompany(
    organizationId: string, 
    companyId: string, 
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    // Validate organization exists and has no company
    // Validate company exists and has no organization
    // Update ats.companies.identity_organization_id
    // Log change in organization_change_log
    // Emit event: organization.company_linked
  }

  async unlinkOrganizationFromCompany(
    organizationId: string,
    adminUserId: string,
    reason?: string
  ): Promise<void> {
    // Validate organization has company
    // Check for active dependencies (roles, team members)
    // Update ats.companies.identity_organization_id to NULL
    // Log change in organization_change_log
    // Emit event: organization.company_unlinked
  }

  async getOrganizationWithCompany(organizationId: string) {
    // Join identity.organizations with ats.companies
    // Return combined data
  }
}
```

**Frontend Implementation:**

**File:** `apps/portal/src/app/(authenticated)/admin/organizations/page.tsx`

- DataTable with all organizations
- "Link Company" button opens modal with company selector
- "Unlink" button with confirmation dialog
- Filter/search bar
- Export functionality

**File:** `apps/portal/src/app/(authenticated)/admin/organizations/[id]/page.tsx`

- Organization details with linked company info
- Change log timeline
- Quick actions: Link/Unlink, Edit org details

### 4.4.2 Company Onboarding Automation

**Goal:** Automatically create companies when company_admin users complete onboarding.

**Onboarding Flow:**

1. **User Signs Up** → Clerk creates user account
2. **User Invited as company_admin** → Organization membership created
3. **Onboarding Wizard Triggered** → User sees company setup form
4. **Company Created** → System creates company in `ats.companies` with `identity_organization_id`
5. **Link Established** → Organization now has company

**Implementation:**

**Onboarding Wizard Page:**

**File:** `apps/portal/src/app/(authenticated)/onboarding/company/page.tsx`

Displayed when:
- User has `company_admin` role
- User's organization has no linked company
- User has not completed onboarding

**Form Fields:**
- Company name (required)
- Company website (optional)
- Industry (dropdown: Technology, Finance, Healthcare, etc.)
- Company size (dropdown: 1-10, 11-50, 51-200, 201-500, 501+)
- Headquarters location (optional)
- Description (optional)

**Backend Logic:**

```typescript
// In services/ats-service/src/onboarding-service.ts
export class OnboardingService {
  async createCompanyForOrganization(
    organizationId: string,
    companyData: CreateCompanyDTO,
    userId: string
  ): Promise<Company> {
    // Create company in ats.companies
    // Set identity_organization_id = organizationId
    // Mark user as onboarded
    // Emit event: company.created_from_onboarding
    // Send welcome email
  }
}
```

**Endpoints:**

```typescript
// In api-gateway/src/routes.ts
POST /api/onboarding/company  // Create company during onboarding
GET  /api/onboarding/status   // Check if user needs onboarding
```

**Navigation Guard:**

```typescript
// In apps/portal/src/middleware.ts or layout
if (userRole === 'company_admin' && !hasLinkedCompany && !onboardingComplete) {
  redirect('/onboarding/company');
}
```

### 4.4.3 Validation & Business Rules

**Linking Rules:**
- Organization can only link to one company (1:1 enforcement)
- Company can only link to one organization (1:1 enforcement)
- Platform admins can override and unlink/relink
- Unlinking requires confirmation if company has active roles

**Onboarding Rules:**
- Only company_admin role triggers onboarding wizard
- Onboarding can be skipped (user can complete later)
- Once company created, cannot be deleted via UI (only unlinked)
- Company name must be unique within platform

**Error Handling:**
- If organization already has company → Show error
- If company already linked to different org → Show error
- If onboarding fails → Allow retry, save draft

### 4.4.4 Migration & Data Cleanup

**Existing Data:**
- All current companies have `identity_organization_id = NULL`
- Need to identify which companies should be linked
- Manual linking by platform admin required

**Migration Script:**

```sql
-- Find companies that match organization names
SELECT 
  c.id as company_id,
  c.name as company_name,
  o.id as organization_id,
  o.name as org_name
FROM ats.companies c
LEFT JOIN identity.organizations o ON LOWER(c.name) = LOWER(o.name)
WHERE c.identity_organization_id IS NULL
ORDER BY c.name;

-- Platform admin reviews and approves links
-- Then executes updates via UI or API
```

**Backfill Process:**
1. Generate report of unmapped companies
2. Platform admin reviews and maps companies to organizations
3. Use admin UI to link in batches
4. Verify links don't break existing permissions
5. Monitor for issues post-migration

### 4.4.5 Future Enhancements (1:many)

**If evolving to 1:many relationship:**
- Organization can have multiple companies
- Add `primary_company_id` to organizations
- Update UI to show company list instead of single company
- Add company switcher for multi-company organizations
- Scope permissions by company within organization

---

## 5. New Product Surfaces

### 5.1 Recruiter Browser Extension

**Goal:** Enable recruiters to submit candidates directly from LinkedIn, GitHub, or personal sites.

**Features:**
- Detect profile pages (LinkedIn, GitHub, personal portfolio)
- Parse name, title, company, location, contact info
- Show "Submit to Splits Network" button overlay
- One-click submission with pre-filled candidate form
- Quick role search/selection
- Local candidate list for tracking prospects

**Tech Stack:**
- Chrome Extension Manifest V3
- React for popup UI
- Content scripts for page parsing
- Background service worker for API calls
- Local storage for offline candidate drafts

**Distribution:**
- Chrome Web Store
- Firefox Add-ons
- Edge Add-ons (same codebase)

**Privacy:**
- No data collection beyond submitted candidates
- Explicit user consent before sending data
- Clear privacy policy in extension details

### 5.2 Lightweight Candidate Portal

**Goal:** Give candidates visibility into their application status without full platform access.

**Candidate Portal Features:**
- Magic link or email + code login (no password)
- View all active applications
- See current stage and last update timestamp
- Upload additional documents (resume updates, portfolios)
- Withdraw from consideration
- Provide interview availability

**URL Structure:**
- `candidate.splits.network/{token}` or
- `portal.splits.network/candidate/{token}`

**Database:**

**`ats.candidate_portal_tokens`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `candidate_id` | uuid | FK → `ats.candidates` |
| `token` | text | Unique, URL-safe |
| `expires_at` | timestamptz | |
| `created_at` | timestamptz | |
| `last_accessed_at` | timestamptz | |

**Security:**
- Tokens expire after 90 days of inactivity
- Candidate can only see their own applications
- No recruiter or company PII exposed
- Read-only access (no stage changes)

### 5.3 Embedded Company Intake Widgets

**Goal:** Allow companies to embed role submission forms on their website/careers page.

**Widget Types:**
1. **Inline Form:** Full role intake embedded in page
2. **Modal Popup:** Triggered by "Submit a Role" button
3. **Floating Button:** Persistent "Partner with Us" CTA

**Configuration:**
- Company generates embed code in portal
- Choose widget type and styling (colors, logo)
- Pre-fill company ID for attribution
- Track submissions via webhook or API

**Technical Implementation:**
- JavaScript snippet (similar to Intercom, Calendly)
- Loads widget from CDN (fast, cacheable)
- Posts submissions to API Gateway
- CORS-enabled endpoints for cross-origin requests

**Example Embed Code:**
```html
<script>
  (function(w,d,s,o,f,js,fjs){
    w['SplitsWidget']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','sw','https://cdn.splits.network/widget.js'));
  sw('init', {companyId: 'company-uuid-here'});
</script>
```

### 5.4 White-Label Intake Pages

**Goal:** Give companies branded intake pages they can share with recruiting partners.

**Features:**
- Custom subdomain: `{company-slug}.roles.splits.network`
- Company logo and brand colors
- Public role listings (if company allows)
- Direct submission flow with pre-filled company context
- Thank you page with company messaging

**Configuration:**
- Company admin sets up white-label page in portal
- Choose public vs private (requires access code)
- Select which roles to display
- Custom welcome message and instructions

**URL Examples:**
- `acme.roles.splits.network` – Public role list
- `acme.roles.splits.network/software-engineer` – Specific role
- `acme.roles.splits.network/submit?role_id=uuid` – Direct submission

---

## 6. Network Optimization & Liquidity

### 6.1 Smart Role Routing

**Goal:** Increase placement rates by matching roles to the most qualified recruiters.

**Routing Signals:**
- Recruiter specialization (industry, function, level)
- Historical placement success rate
- Geographic proximity to role location
- Candidate pipeline quality (past submissions)
- Current workload (active roles)

**Routing Algorithm:**
1. Score all eligible recruiters for each role
2. Send role to top 20% (or min 10 recruiters)
3. If no submissions after 48 hours, expand to next tier
4. Continue expanding until submissions received or role closed

**Recruiter Profiles:**

**`network.recruiter_specializations`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `recruiter_id` | uuid | FK → `network.recruiters` |
| `industry` | text[] | e.g., `{fintech, healthcare}` |
| `function` | text[] | e.g., `{engineering, sales}` |
| `seniority` | text[] | e.g., `{senior, executive}` |
| `locations` | text[] | Geographic specialties |
| `updated_at` | timestamptz | |

**Implementation:**
- Recruiter fills out specialization form on signup
- System learns from successful placements over time
- Admin can override routing for specific roles
- Recruiters can opt out of auto-routing (manual discovery only)

### 6.2 Premium Role Programs

**Goal:** Incentivize recruiters to prioritize high-value or hard-to-fill roles.

**Premium Designations:**
1. **Urgent Roles:** Need filled within 30 days, +10% fee
2. **Executive Roles:** C-level or VP+, higher base fees
3. **Niche Specialties:** Rare skills, +15% bonus
4. **Volume Commitments:** Company needs 5+ hires, bulk bonus

**Badge System:**
- Roles tagged with premium badges in UI
- Sorting/filtering to surface premium roles first
- Email notifications for premium role drops
- Leaderboard for premium role placements

**Economics:**
- Company pays premium (e.g., 25% instead of 20%)
- Recruiter receives standard payout + bonus
- Platform keeps marginal increase (5% on premium roles)

### 6.3 Liquidity Balancing

**Goal:** Ensure healthy supply/demand balance across role types and locations.

**Imbalance Detection:**
- Track submission-to-role ratios by category
- Flag roles with zero submissions after 7 days
- Identify "overcrowded" roles (50+ submissions)
- Monitor geographic gaps (no recruiters in region)

**Balancing Actions:**
1. **Recruiter Incentives:** Offer bonuses for underserved categories
2. **Throttling:** Limit submissions to overcrowded roles
3. **Recruiter Recruitment:** Actively source recruiters in gap areas
4. **Company Guidance:** Suggest role adjustments for better visibility

**Analytics Dashboard:**
- Real-time supply/demand metrics by industry, function, location
- Historical trends (seasonality, market shifts)
- Predictive modeling for future imbalances
- Alerts for admin intervention

### 6.4 Invite-Only Premium Roles

**Goal:** Create exclusivity for top recruiters and high-value roles.

**Invitation System:**
- Companies can mark roles as "invite-only"
- Only recruiters with proven track record can access
- Invitation criteria:
  - 5+ successful placements in category
  - 90-day average time-to-placement < 45 days
  - 4.5+ star rating from companies
- Admin can manually invite recruiters

**Database:**

**`ats.role_invitations`**
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | PK |
| `role_id` | uuid | FK → `ats.roles` |
| `recruiter_id` | uuid | FK → `network.recruiters` |
| `invited_by` | enum | `system`, `company`, `admin` |
| `invited_at` | timestamptz | |
| `expires_at` | timestamptz | Nullable |
| `accepted_at` | timestamptz | Nullable |

**UI Treatment:**
- Invited roles show "Exclusive Invitation" badge
- Email notification with role details and deadline
- Track invitation acceptance rate
- Remove invitation after 7 days if not accepted

---

## 7. Governance, Policy & Trust

### 7.1 Policy Engine (Rules-as-Code)

**Goal:** Encode platform rules programmatically for consistency and auditability.

**Policy Types:**
1. **Submission Rules:** Max submissions per role, duplicate detection
2. **Payout Rules:** Fee calculations, split distributions, timing
3. **Access Rules:** Who can see which roles, data visibility
4. **Quality Rules:** Minimum submission standards, auto-rejection criteria
5. **Compliance Rules:** GDPR, CCPA, employment law adherence

**Policy Language:**
- Use Open Policy Agent (OPA) or similar
- Policies written in Rego or JSON-based DSL
- Version controlled in Git
- Tested with automated policy tests

**Example Policy (Rego):**
```rego
package splits.submissions

# Deny submission if recruiter already submitted to this role
deny[msg] {
  input.recruiter_id == previous_submission.recruiter_id
  input.role_id == previous_submission.role_id
  msg := "Duplicate submission detected"
}

# Deny submission if candidate lacks required fields
deny[msg] {
  not input.candidate.email
  msg := "Candidate email is required"
}
```

**Enforcement Points:**
- API Gateway checks policies before allowing actions
- ATS Service validates submissions against policies
- Billing Service applies payout policies
- Audit logs record policy decisions

**Admin Interface:**
- View active policies by domain
- Test policies with sample inputs
- Deploy new policy versions
- Rollback to previous versions if needed

### 7.2 Economic Simulations

**Goal:** Model impact of fee changes, split structures, and incentive programs before deploying.

**Simulation Capabilities:**
- **Fee Adjustments:** What if platform fee drops to 15%? Impact on revenue and recruiter behavior.
- **Split Models:** Compare flat splits vs tiered splits on team adoption.
- **Premium Programs:** Model ROI of premium role bonuses.
- **Volume Discounts:** Predict company retention with tiered pricing.

**Implementation:**
- Historical data export to CSV/Parquet
- Python-based simulation engine (Jupyter notebooks)
- Monte Carlo simulations for probabilistic outcomes
- Scenario comparison dashboard

**Metrics to Track:**
- Total GMV (Gross Marketplace Value)
- Platform revenue (fees collected)
- Recruiter earnings per placement
- Company cost per hire
- Churn rates by cohort

**Decision Framework:**
- Run simulations before major pricing changes
- Require executive approval for >5% fee adjustments
- A/B test new structures with small cohorts first
- Document assumptions and outcomes

### 7.3 Regulatory Readiness

**Goal:** Ensure platform complies with employment law, data privacy, and financial regulations.

**Compliance Areas:**

**1. Employment Law:**
- Platform is not employer of record
- Recruiters are independent contractors
- Clear terms for worker classification (1099 vs W-2)
- No discrimination in role access or candidate submission

**2. Data Privacy:**
- GDPR compliance (EU candidates)
- CCPA compliance (California candidates)
- Data retention policies (delete after 2 years of inactivity)
- Candidate consent for data sharing
- Right to be forgotten (delete candidate data on request)

**3. Financial Regulations:**
- 1099 tax reporting for recruiters (U.S.)
- Stripe Connect compliance for payouts
- Anti-money laundering (AML) checks
- Fraud detection and prevention

**4. Platform Liability:**
- Terms of Service clearly define platform vs user responsibilities
- Indemnification clauses for company-side issues
- Insurance coverage for platform errors
- Dispute resolution process (arbitration)

**Legal Reviews:**
- Annual compliance audit by external counsel
- Quarterly reviews of ToS and policies
- Regional legal reviews before international expansion
- Proactive monitoring of regulatory changes

### 7.4 Platform-Level SLAs

**Goal:** Provide reliability guarantees to enterprise clients.

**SLA Tiers:**

**Standard (Free):**
- 99% uptime
- 24-hour email support response
- Best-effort issue resolution

**Premium ($500/month):**
- 99.5% uptime
- 4-hour support response
- Dedicated account manager
- Monthly business reviews

**Enterprise (Custom pricing):**
- 99.9% uptime with financial penalties for breach
- 1-hour critical issue response
- 24/7 phone support
- Quarterly roadmap reviews
- Custom SLA terms

**SLA Enforcement:**
- Real-time uptime monitoring (StatusPage.io)
- Automated alerting for outages
- Service credits for SLA breaches (e.g., 10% monthly fee back)
- Transparent incident post-mortems

**Infrastructure Requirements:**
- Multi-region deployment for redundancy
- Database replication and automatic failover
- Load balancing across availability zones
- DDoS protection (Cloudflare or AWS Shield)

---

## 8. Non-Goals for Phase 4

**Explicitly out of scope:**

1. **Public Free-for-All APIs**
   - We will not open write APIs to the general public without vetting
   - All API access requires approval and scoped tokens
   - Prevent abuse, spam, and low-quality submissions

2. **Social Networking Features**
   - No recruiter-to-recruiter messaging (yet)
   - No public profiles or follower counts
   - Focus on professional transactions, not social graph

3. **Candidate-First Marketplace**
   - Platform remains recruiter- and company-centric
   - Candidates are passive participants (for now)
   - No candidate-initiated job applications

4. **Programmatic Job Posting**
   - Companies cannot auto-post hundreds of roles via API (spam risk)
   - Roles must be individually created or synced from trusted ATS
   - Quality over quantity

5. **Marketplace Fragmentation**
   - No separate "marketplaces" for different industries or regions (yet)
   - Maintain single unified network for maximum liquidity
   - Regional expansion is separate from platform fragmentation

6. **Recruiter Rating Systems**
   - No public star ratings or reviews of recruiters (quality signal, not social proof)
   - Internal quality scores remain admin-only
   - Avoid gamification that encourages bad behavior

---

## 9. Success Metrics

**Platform Expansion:**
- 50+ companies using API integrations within 6 months
- 20+ teams (agencies) onboarded within 6 months
- 10+ ATS syncs active within 6 months

**Network Effects:**
- Reduce recruiter churn by 30% (teams increase stickiness)
- Increase average placements per recruiter by 25% (better routing)
- 80%+ submission-to-interview rate on premium roles

**Product Surfaces:**
- 1,000+ browser extension installs within 3 months
- 500+ candidates using portal monthly
- 100+ embedded widgets deployed

**Engagement:**
- 40% of recruiters active weekly (up from 25% in Phase 3)
- 60% of roles receive first submission within 24 hours
- 90%+ webhook delivery success rate

**Revenue Impact:**
- 15% increase in GMV from premium role fees
- 20% increase in enterprise contracts (custom terms)
- 10% reduction in support costs (self-service APIs)

**Trust & Governance:**
- Zero major compliance incidents
- 99.9% uptime for enterprise SLA clients
- 95%+ policy enforcement rate (no false negatives)

---

## 10. Technical Architecture Updates

### 10.1 New Services

**API Service (or extend API Gateway):**
- OAuth server (token issuance, refresh, revocation)
- Webhook delivery queue and retry logic
- API usage analytics and rate limiting

**Integration Service:**
- ATS sync workers (polling and webhook consumers)
- Conflict resolution for bidirectional sync
- Integration health monitoring

**Policy Service:**
- OPA or custom policy engine
- Policy evaluation endpoints
- Policy version management and deployment

### 10.2 Database Changes

**New Tables:**
- `network.teams`
- `network.team_members`
- `network.recruiter_specializations`
- `ats.integrations`
- `ats.sync_logs`
- `ats.role_invitations`
- `ats.candidate_portal_tokens`
- `billing.custom_contracts`
- `api.oauth_tokens`
- `api.webhooks`
- `api.webhook_deliveries`

### 10.3 Infrastructure

**CDN for Static Assets:**
- Serve browser extension, widget JS, and white-label pages via CDN
- CloudFront or Cloudflare for global distribution

**Webhook Queue:**
- RabbitMQ or AWS SQS for webhook delivery queue
- Separate workers for retry logic
- Dead letter queue for permanently failed webhooks

**Policy Engine:**
- Deploy OPA as sidecar or standalone service
- Load policies from Git repo on boot
- Cache policy decisions for performance

**Multi-Region Deployment:**
- Primary region: US-East (AWS or GCP)
- Failover region: US-West
- Database replication with read replicas in both regions
- DNS-based failover for automatic region switching

---

## 11. Migration Path & Rollout Strategy

### 11.1 Rollout Phases

**Phase 4A: Platform APIs (Months 1-2)**
- Deploy OAuth server and API documentation
- Onboard 5 beta partners for API testing
- Launch public API docs and developer portal
- Implement webhook delivery infrastructure

**Phase 4B: Teams & Agencies (Months 2-3)**
- Build team management UI
- Onboard 3 pilot agencies with 5+ recruiters each
- Validate split distribution logic
- Launch team billing and analytics

**Phase 4C: ATS Integrations (Months 3-4)**
- Implement Greenhouse sync first (most requested)
- Add Lever and Workable support
- Launch integration marketplace in portal
- Document custom integration API for other ATS platforms

**Phase 4D: New Product Surfaces (Months 4-5)**
- Release browser extension (Chrome first, then others)
- Launch candidate portal MVP
- Deploy embeddable widgets with 5 pilot companies
- Test white-label pages with 2 enterprise clients

**Phase 4E: Network Optimization (Months 5-6)**
- Enable smart role routing with manual override
- Launch premium role program with 10 test roles
- Deploy invite-only role system
- Monitor liquidity metrics and adjust incentives

**Phase 4F: Governance & Policy (Ongoing)**
- Implement policy engine with initial ruleset
- Run economic simulations quarterly
- Complete compliance audit and certifications
- Establish enterprise SLA program

### 11.2 Backward Compatibility

**API Versioning:**
- Maintain API v1 even after v2 launch
- Deprecation notices 6 months before sunset
- Automatic migration tools for partners

**Database Migrations:**
- All new tables are additive (no schema breaking changes)
- Existing services continue to function during rollout
- Gradual feature flag rollout for new capabilities

**UI Changes:**
- Teams are opt-in (existing solo recruiters unaffected)
- Premium roles are additive (standard roles unchanged)
- Browser extension and widgets are optional tools

---

## 12. Risks & Mitigation

### 12.1 Technical Risks

**Risk:** API abuse or spam submissions
**Mitigation:** Rate limiting, manual approval for new API keys, aggressive monitoring

**Risk:** ATS sync conflicts or data loss
**Mitigation:** Immutable audit logs, manual conflict resolution UI, ability to pause sync

**Risk:** Webhook delivery failures at scale
**Mitigation:** Retry logic with exponential backoff, dead letter queue, customer alerts

### 12.2 Business Risks

**Risk:** Teams fragment recruiter activity (reduce individual productivity)
**Mitigation:** Team analytics to prove value, showcase collaboration benefits

**Risk:** Premium roles cannibalize standard role submissions
**Mitigation:** Limit premium designation to <10% of roles, monitor submission rates

**Risk:** Enterprises demand custom terms that erode margins
**Mitigation:** Minimum contract values, volume commitments, executive approval required

### 12.3 Competitive Risks

**Risk:** Competitors copy API and integration strategy
**Mitigation:** Network effects and liquidity are defensible, API is commodity

**Risk:** ATS platforms build native recruiter networks
**Mitigation:** Move fast, lock in companies with integrations, differentiate on economics

**Risk:** Recruiter teams defect to build own platform
**Mitigation:** Provide superior tools and liquidity, enforce non-compete where legal

---

## 13. Open Questions (with Proposed Answers)

1. Should we offer white-label platform licensing to large agencies?
Yes, but only after Phase 4 to avoid distraction.
2. What % of platform fee should go to team overhead vs individual recruiter?
We should make this configurable, with a default of 20% overhead.
3. Should candidate portal be opt-in or automatic for all candidates?
Automatic, but with clear opt-out options.  We should also not require a unique login for each application/company.  A user should be able to see all their applications in one place.
4. How do we handle ATS sync when company role is closed but Splits role is active?
We should prioritize the company's ATS status and automatically close the Splits role, notifying recruiters of the change.
5. Should premium roles be visible to all recruiters, or only those invited?
Only invited recruiters should see premium roles to maintain exclusivity and quality.
6. What's the minimum team size to qualify for team account features?
A minimum of 3 recruiters should be required to form a team account.
7. Should API pricing be usage-based or flat monthly tiers?
Flat monthly tiers with usage limits, plus overage charges for high-volume users.
8. How do we prevent recruiter arbitrage (gaming premium role bonuses)?
We should implement monitoring for suspicious activity and enforce strict submission quality standards.

---

## 14. Summary

**Phase 4 makes Splits Network irreplaceable.**

By expanding beyond a single UI and embedding into recruiters' and companies' workflows, we create structural lock-in. APIs, integrations, and team accounts increase switching costs ethically. Premium roles, smart routing, and liquidity optimization improve marketplace efficiency.

**The goal is not more features—it's more surface area and deeper roots.**

After Phase 4, recruiters and companies won't just use Splits Network—they'll depend on it. The platform becomes infrastructure, not just a tool.

**Phase 5 will focus on intelligence, automation, and international expansion—but Phase 4 lays the foundation for inevitable network effects.**
