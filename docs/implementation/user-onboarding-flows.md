# User Onboarding Flows - Complete Implementation Guide

**Version:** 2.0  
**Created:** December 21, 2025  
**Updated:** December 22, 2025  
**Status:** Implementation Ready

## 1. Overview

This document outlines the complete implementation of role-based user onboarding for Splits Network. The onboarding flow uses a two-phase approach:

1. **Phase 1: Account Creation** - Users complete basic sign-up and email verification via Clerk
2. **Phase 2: Onboarding Wizard** - After entering the dashboard, users complete a mandatory modal wizard to select their role, subscription plan, and provide required profile information

This approach provides lower friction for initial sign-up while ensuring all users complete the necessary onboarding steps before using the platform.

### 1.1 Core Requirements

- **Clerk Integration**: User authentication and email verification
- **Dashboard Entry**: Users enter the platform after email verification
- **Mandatory Onboarding Wizard**: Modal wizard that appears on dashboard until completed
- **Progress Tracking**: Database fields track onboarding status and current step
- **Role Selection**: User chooses their role in the wizard (Recruiter or Company Admin)
- **Subscription Plan Selection**: Placeholder step for future Stripe integration
- **Role-Specific Data Collection**: Collect minimum required data for each role
- **Organization & Entity Creation**: Automatic creation of organizations, companies, teams, etc.
- **Invitation Support**: Users can sign up via invitation links (skips role selection)
- **Progress Persistence**: Users can resume incomplete onboarding across sessions
- **Seamless UX**: Multi-step wizard with clear progress indicators

### 1.2 Supported Roles

1. **Recruiter** (self-signup + invitation to join team)
2. **Company Admin** (self-signup only)
3. **Hiring Manager** (invitation-only)
4. **Platform Admin** (manual provisioning only - not covered in this flow)

### 1.3 Database Schema for Onboarding Tracking

The `identity.users` table tracks onboarding progress:

```sql
ALTER TABLE identity.users 
  ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

-- Possible values for onboarding_status:
-- 'pending' - User has signed up but not started onboarding wizard
-- 'in_progress' - User has started wizard but not completed
-- 'completed' - User has completed all onboarding steps
-- 'skipped' - User was invited and skipped wizard (role predetermined)
```

**Fields:**
- `onboarding_status`: Current state of onboarding
- `onboarding_step`: Current step number (1-4) for resuming
- `onboarding_completed_at`: Timestamp when onboarding was completed

---

## 2. Onboarding Paths Matrix

| Role | Self-Signup | Invitation | Creates Organization | Creates Company | Joins Team/Organization |
|------|-------------|------------|---------------------|-----------------|------------------------|
| **Recruiter** | ✅ Yes | ✅ Yes (team invite) | ✅ Yes (personal) | ❌ No | ⚠️ Optional (team) |
| **Company Admin** | ✅ Yes | ❌ No | ✅ Yes (company org) | ✅ Yes | ❌ No |
| **Hiring Manager** | ❌ No | ✅ Yes (company invite) | ❌ No | ❌ No | ✅ Yes (company org) |
| **Platform Admin** | ❌ No | ❌ No | N/A | N/A | N/A |

---

## 3. Detailed Flows

### 3.1 Self-Signup Flow: Recruiter

**User Journey:**

**Phase 1: Account Creation**
1. User lands on `/sign-up`
2. Completes Clerk sign-up (email + password)
3. Verifies email via Clerk
4. System creates minimal user record in `identity.users` with:
   - `clerk_user_id`, `email`, `name`
   - `onboarding_status: 'pending'`
   - `onboarding_step: 1`
5. **Redirects to `/dashboard`**

**Phase 2: Onboarding Wizard (Modal)**
6. Dashboard detects `onboarding_status: 'pending'`
7. **Shows mandatory modal wizard** (cannot be dismissed)
8. **Step 1: Role Selection** - User selects "Recruiter"
   - Updates `onboarding_step: 2`, `onboarding_status: 'in_progress'`
9. **Step 2: Subscription Plan** - Placeholder step with "Continue" button
   - Updates `onboarding_step: 3`
   - *(Future: Will integrate Stripe subscription selection)*
10. **Step 3: Recruiter Profile** - User enters profile data
    - Bio/tagline (optional)
    - Phone number (optional)
    - Industries (optional)
    - Team invite code (optional)
11. **Step 4: Complete** - System creates all entities:
    - Personal organization in `identity.organizations`
    - Membership in `identity.memberships` (role: `recruiter`)
    - Recruiter profile in `network.recruiters` (status: `pending`)
    - (Optional) Team membership via invite code
    - Updates `onboarding_status: 'completed'`, `onboarding_completed_at: NOW()`
12. Modal closes, user can now use the dashboard

**Required Data:**
- ✅ Name (from Clerk)
- ✅ Email (from Clerk)
- ✅ Role selection (in wizard)
- ⚠️ Phone number (optional, in wizard)
- ⚠️ Bio/tagline (optional, in wizard)
- ⚠️ Industries/specialties (optional, in wizard)
- ⚠️ Team invite code (optional, in wizard)

**API Calls:**
```typescript
// Phase 1: Initial account creation (auto-triggered after Clerk verification)
POST /api/identity/users/sync
{
  clerk_user_id: string;
  email: string;
  name: string;
  // User record created with onboarding_status: 'pending', onboarding_step: 1
}

// Phase 2: Wizard Step 1 - Update role selection
PATCH /api/identity/users/me/onboarding
{
  step: 2;
  status: 'in_progress';
  selected_role: 'recruiter';
}

// Wizard Step 2 - Subscription plan (no-op for now, just update step)
PATCH /api/identity/users/me/onboarding
{
  step: 3;
}

// Wizard Step 3 - Complete profile and create entities
POST /api/identity/users/me/complete-onboarding
{
  role: 'recruiter';
  profile: {
    bio?: string;
    phone?: string;
    industries?: string[];
    specialties?: string[];
  };
  teamInviteCode?: string;
}
// Response creates: organization, membership, recruiter profile, optional team join
// Updates: onboarding_status: 'completed', onboarding_completed_at: NOW()
```

---

### 3.2 Self-Signup Flow: Company Admin

**User Journey:**

**Phase 1: Account Creation**
1. User lands on `/sign-up`
2. Completes Clerk sign-up (email + password)
3. Verifies email via Clerk
4. System creates minimal user record in `identity.users`
5. **Redirects to `/dashboard`**

**Phase 2: Onboarding Wizard (Modal)**
6. Dashboard detects `onboarding_status: 'pending'`
7. **Shows mandatory modal wizard**
8. **Step 1: Role Selection** - User selects "Company Admin"
9. **Step 2: Subscription Plan** - Placeholder step with "Continue" button
10. **Step 3: Company Information** - User enters company data
    - Company name (required)
    - Website (optional)
    - Industry (optional)
    - Company size (optional)
11. **Step 4: Complete** - System creates all entities:
    - Company organization in `identity.organizations` (type: `company`)
    - Membership in `identity.memberships` (role: `company_admin`)
    - Company in `ats.companies` (linked to organization)
    - Updates `onboarding_status: 'completed'`, `onboarding_completed_at: NOW()`
12. Modal closes, user can now use the dashboard

**Required Data:**
- ✅ Name (from Clerk)
- ✅ Email (from Clerk)
- ✅ Role selection (in wizard)
- ✅ Company name (in wizard)
- ⚠️ Company website (optional, in wizard)
- ⚠️ Company industry (optional, in wizard)
- ⚠️ Company size (optional, in wizard)
- ⚠️ Company logo (optional, can upload later)

**API Calls:**
```typescript
// Phase 1: Initial account creation
POST /api/identity/users/sync
{
  clerk_user_id: string;
  email: string;
  name: string;
}

// Phase 2: Wizard steps
PATCH /api/identity/users/me/onboarding  // Step 1: Role selection
{ step: 2, status: 'in_progress', selected_role: 'company_admin' }

PATCH /api/identity/users/me/onboarding  // Step 2: Subscription (placeholder)
{ step: 3 }

POST /api/identity/users/me/complete-onboarding  // Step 3: Complete
{
  role: 'company_admin';
  company: {
    name: string;
    website?: string;
    industry?: string;
    size?: string;
  };
}
// Response creates: company organization, membership, company record
// Updates: onboarding_status: 'completed', onboarding_completed_at: NOW()
```

---

### 3.3 Invitation Flow: Hiring Manager

**User Journey:**

**Phase 1: Account Creation**
1. Company admin sends invitation from their dashboard
2. User receives email with invitation link (e.g., `/sign-up?invite={token}`)
3. User clicks link, lands on `/sign-up` with pre-filled invitation
4. Completes Clerk sign-up (email + password)
5. Verifies email via Clerk
6. System creates user record with `onboarding_status: 'pending'`
7. **Redirects to `/dashboard`**

**Phase 2: Invitation Acceptance (Modal)**
8. Dashboard detects invitation token and `onboarding_status: 'pending'`
9. **Shows invitation acceptance modal** (different from role selection wizard)
10. Displays: "You've been invited to join [Company Name] as a Hiring Manager"
11. User confirms acceptance
12. System creates:
    - Membership in `identity.memberships` (role: `hiring_manager`, linked to company org)
    - Updates invitation status to `accepted`
    - Updates `onboarding_status: 'skipped'` (no full wizard needed)
13. Modal closes, redirects to company dashboard

**Note:** Invited users skip the role selection wizard since their role is predetermined by the invitation.

**Required Data:**
- ✅ Name (from Clerk)
- ✅ Email (from Clerk, must match invitation email)
- ⚠️ Department/title (optional)

**API Calls:**
```typescript
// Step 1: Fetch invitation details
GET /api/identity/invitations/{token}
{
  data: {
    email: string;
    organization_id: string;
    role: string;
    invited_by: string;
    status: "pending";
  }
}

// Step 2: Sync user from Clerk
POST /api/identity/users/sync
{
  clerk_user_id: string;
  email: string; // Must match invitation email
  name: string;
}

// Step 3: Accept invitation (creates membership)
POST /api/identity/invitations/{token}/accept
{
  user_id: string;
}
```

---

### 3.4 Invitation Flow: Recruiter Team Join

**User Journey:**

**For New Users:**
1. Team owner sends team invitation from their dashboard
2. User receives email with invitation link (e.g., `/sign-up?team_invite={token}`)
3. User clicks link, completes Clerk sign-up
4. **Redirects to `/dashboard`**
5. Shows full recruiter onboarding wizard with team invite auto-filled
6. After completing wizard, auto-joins team

**For Existing Recruiters:**
1. User clicks team invitation link
2. Signs in with existing account
3. Shows simple confirmation modal
4. Accepts invitation, joins team immediately

**Required Data:**
- ✅ Name (from Clerk)
- ✅ Email (from Clerk, must match invitation email)
- ⚠️ Bio (optional, in wizard for new users)

**API Calls:**
```typescript
// New users go through full recruiter onboarding (3.1) with team_invite_token
// Existing users:
POST /api/teams/invitations/{token}/accept
{
  recruiter_id: string;
}
```

---

## 4. Multi-Step Wizard Structure

### 4.1 Modal Wizard Behavior

**Trigger Conditions:**
- User lands on `/dashboard`
- Check `identity.users.onboarding_status`
- If `'pending'` or `'in_progress'` → Show modal wizard
- Modal is **mandatory** and cannot be dismissed
- User cannot access dashboard features until wizard is completed

**Invitation Handling:**
- If invitation token present (hiring manager or team invite)
- Show invitation acceptance modal instead of role selection wizard
- Role is predetermined, skip to acceptance confirmation

### 4.2 Step Definitions (Self-Signup Flow)

**Step 1: Role Selection**
- UI: Card-based selection (Recruiter, Company Admin)
- State: `selectedRole: 'recruiter' | 'company_admin' | null`
- API Call: `PATCH /api/identity/users/me/onboarding` (update step to 2)
- Next: Step 2

**Step 2: Subscription Plan Selection** ⚠️ PLACEHOLDER
- UI: Message explaining subscription plans (future feature)
- Text: "Choose your subscription plan - we'll set this up in the next release!"
- Button: "Continue" (no selection required)
- State: No state changes, just progression
- API Call: `PATCH /api/identity/users/me/onboarding` (update step to 3)
- Note: *Future Stripe integration will replace this placeholder with actual plan selection*
- Next: Step 3

**Step 3: Role-Specific Data Collection**
- **Recruiter Form:**
  - Bio/tagline (textarea, optional)
  - Industries (multi-select, optional)
  - Specialties (multi-select, optional)
  - Phone (input, optional)
  - Team invite code (text input, optional)
- **Company Admin Form:**
  - Company name (text input, **required**)
  - Company website (URL input, optional)
  - Company industry (select dropdown, optional)
  - Company size (select dropdown, optional)
- API Call: `POST /api/identity/users/me/complete-onboarding` (creates all entities)
- Next: Step 4

**Step 4: Completion**
- Show success message: "Welcome to Splits Network!"
- Display next steps based on role
- Close modal automatically after 2 seconds
- User can now access full dashboard
- State: `selectedRole: 'recruiter' | 'company_admin' | null`
- Next: Step 3 (role-specific form)

**Step 3: Role-Specific Data Collection**
- Recruiter Form:
  - Bio/tagline (optional)
  - Industries (multi-select, optional)
  - Specialties (multi-select, optional)
  - Phone (optional)
  - Team invite code (text input, optional)
### 4.3 Progress Indicator

**Self-Signup Flow:**
```
[ Role Selection ] → [ Subscription ] → [ Profile Setup ] → [ Complete ]
         1                   2                  3                 4
```

**Invitation Flow:**
```
[ Review Invitation ] → [ Accept ] → [ Complete ]
         1                   2             3
```

**Visual Design:**
- Stepper component at top of modal
- Current step highlighted
- Completed steps show checkmark
- Future steps greyed out
- Step titles: "Role", "Plan", "Profile", "Done"

---

## 5. API Endpoints Required

### 5.1 Identity Service Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/identity/users/sync` | POST | Sync user from Clerk (Phase 1) | ✅ Exists |
| `/api/identity/users/me` | GET | Get current user + onboarding status | ✅ Exists |
| `/api/identity/users/me/onboarding` | PATCH | Update onboarding step/status | ⚠️ **Needs Implementation** |
| `/api/identity/users/me/complete-onboarding` | POST | Complete onboarding + create entities | ⚠️ **Needs Implementation** |
| `/api/identity/organizations` | POST | Create organization | ✅ Exists |
| `/api/identity/memberships` | POST | Create membership | ✅ Exists |
| `/api/identity/invitations` | POST | Create invitation | ✅ Exists (table exists) |
| `/api/identity/invitations/:token` | GET | Get invitation details | ⚠️ **Needs Implementation** |
| `/api/identity/invitations/:token/accept` | POST | Accept invitation | ⚠️ **Needs Implementation** |

### 5.2 Network Service Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/recruiters` | POST | Create recruiter profile | ✅ Exists |
| `/api/recruiters/me` | GET | Get current recruiter | ✅ Exists |
| `/api/teams` | POST | Create team | ✅ Exists (code exists) |
| `/api/teams/invitations` | POST | Create team invitation | ⚠️ **Needs Implementation** |
| `/api/teams/invitations/:token` | GET | Get team invitation | ⚠️ **Needs Implementation** |
| `/api/teams/invitations/:token/accept` | POST | Accept team invitation | ⚠️ **Needs Implementation** |

### 5.3 ATS Service Endpoints

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/companies` | POST | Create company | ✅ Exists |
| `/api/companies/:id` | GET | Get company details | ✅ Exists |

---

## 6. Frontend Component Structure

### 6.1 File Organization

```
apps/portal/src/
├── app/
│   ├── (auth)/
│   │   └── sign-up/
│   │       └── [[...sign-up]]/
│   │           └── page.tsx                   # Basic Clerk sign-up page
│   ├── (authenticated)/
│   │   └── dashboard/
│   │       └── page.tsx                        # Dashboard with wizard trigger
│   └── ...
├── components/
│   └── onboarding/
│       ├── onboarding-wizard-modal.tsx         # Main modal container
│       ├── onboarding-provider.tsx             # Context provider for wizard state
│       ├── steps/
│       │   ├── role-selection-step.tsx         # Step 1: Role selection
│       │   ├── subscription-plan-step.tsx      # Step 2: Subscription (placeholder)
│       │   ├── recruiter-profile-step.tsx      # Step 3a: Recruiter form
│       │   ├── company-info-step.tsx           # Step 3b: Company form
│       │   └── completion-step.tsx             # Step 4: Success message
│       └── invitation-modal.tsx                # Separate modal for invitations
└── lib/
    ├── api-client.ts                           # Enhanced with onboarding methods
    └── hooks/
        └── use-onboarding.ts                   # Hook to check onboarding status
```

### 6.2 State Management

Use React Context + `useState` for wizard state:

```typescript
interface OnboardingState {
  // From database
  currentStep: number;  // 1-4
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
  
  // Wizard state
  isModalOpen: boolean;
  selectedRole: 'recruiter' | 'company_admin' | null;
  
  // Invitation handling
  invitationType: 'none' | 'company' | 'team';
  invitationToken: string | null;
  invitationData: Invitation | TeamInvitation | null;
  
  // Form data (step 3)
  formData: {
    recruiter?: {
      bio?: string;
      phone?: string;
      industries?: string[];
      specialties?: string[];
      teamInviteCode?: string;
    };
    companyAdmin?: {
      companyName: string;
      website?: string;
      industry?: string;
      size?: string;
    };
  };
  
  // UI state
  submitting: boolean;
  error: string | null;
}

// Context provider wraps dashboard to manage wizard state
export const OnboardingProvider = ({ children }) => {
  const [state, setState] = useState<OnboardingState>(/* ... */);
  // Fetch user's onboarding status on mount
  // Show modal if status is 'pending' or 'in_progress'
  return (
    <OnboardingContext.Provider value={{ state, setState }}>
      {children}
      {state.isModalOpen && <OnboardingWizardModal />}
    </OnboardingContext.Provider>
  );
};
```

### 6.3 Dashboard Integration

The dashboard page checks onboarding status and triggers the modal:

```typescript
// app/(authenticated)/dashboard/page.tsx
'use client';

import { OnboardingProvider } from '@/components/onboarding/onboarding-provider';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';

export default function DashboardPage() {
  return (
    <OnboardingProvider>
      <div className="dashboard-content">
        {/* Dashboard UI */}
      </div>
    </OnboardingProvider>
  );
}
```

---

## 7. Clerk Integration Details

### 7.1 User Sync After Verification

After Clerk email verification, the frontend calls the sync endpoint:

```typescript
// This happens in a Clerk webhook or in the app after sign-in
POST /api/identity/users/sync
{
  clerk_user_id: string;
  email: string;
  name: string;
}
// Creates user with onboarding_status: 'pending'
```

### 7.2 Checking Onboarding Status

When the dashboard loads, check the user's onboarding status:

```typescript
// lib/hooks/use-onboarding.ts
export function useOnboarding() {
  const { user } = useUser();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  
  useEffect(() => {
    if (user) {
      fetch('/api/identity/users/me')
        .then(res => res.json())
        .then(data => {
          setStatus({
            status: data.data.onboarding_status,
            step: data.data.onboarding_step,
          });
        });
    }
  }, [user]);
  
  return { status };
}
  onboarding_step?: number;
}

// Private metadata (server-only)
{
  splits_user_id?: string;      // identity.users.id
  splits_organization_id?: string;
  splits_recruiter_id?: string; // network.recruiters.id
  splits_company_id?: string;   // ats.companies.id
}
```

### 7.2 Clerk Sign-Up Callback

After Clerk sign-up completes, redirect with session:

```typescript
<SignUp
  afterSignUpUrl="/sign-up/onboarding?step=2"
  redirectUrl="/sign-up/onboarding?step=2"
/>
```

### 7.3 Invitation Link Handling

Invitation links include tokens in query params:

- Company invitation: `/sign-up?invite={token}`
- Team invitation: `/sign-up?team_invite={token}`

The sign-up page detects these params and adjusts the flow accordingly.

---

## 8. Error Handling & Edge Cases

### 8.1 Common Error Scenarios

| Scenario | Handling |
|----------|----------|
| **User closes browser mid-flow** | Save progress in Clerk metadata; resume on return |
| **Email already exists** | Clerk handles this; show "Sign in instead" |
| **Invitation expired** | Show error, offer to request new invitation |
| **Invitation email mismatch** | Block signup, require correct email |
| **API timeout during submission** | Show retry button, preserve form data |
| **Duplicate organization name** | Allow duplicates with warning (Phase 1) |
| **Team invite code invalid** | Show error, allow to skip or retry |

### 8.2 Validation Rules

**Recruiter Form:**
- Bio: Max 500 characters (optional)
- Phone: Valid phone format (optional)
- Industries: Max 5 selections (optional)
- Specialties: Max 10 selections (optional)

**Company Admin Form:**
- Company name: Required, 2-100 characters
- Website: Valid URL format (optional)
- Industry: Select from predefined list (optional)
- Size: Select from predefined ranges (optional)

**Hiring Manager Invitation:**
- Email must match invitation email
- Invitation must not be expired
- Invitation must have status: `pending`

---

## 9. Implementation Checklist

### Phase 1: Backend APIs

- [ ] **Identity Service:**
  - [ ] `GET /api/identity/invitations/:token` (fetch invitation)
  - [ ] `POST /api/identity/invitations/:token/accept` (accept invitation)
  - [ ] `POST /api/identity/invitations` (create invitation)
  - [ ] Add invitation creation endpoint to API Gateway

- [ ] **Network Service:**
  - [ ] `POST /api/teams/invitations` (create team invitation)
  - [ ] `GET /api/teams/invitations/:token` (fetch team invitation)
  - [ ] `POST /api/teams/invitations/:token/accept` (accept team invitation)
  - [ ] Add team invitation endpoints to API Gateway

- [ ] **API Gateway:**
  - [ ] Route invitation endpoints
  - [ ] Route team invitation endpoints
  - [ ] Add onboarding completion webhook handler

### Phase 2: Frontend Components

- [ ] **Onboarding Wizard:**
  - [ ] Create `onboarding-wizard.tsx` with step management
  - [ ] Create `onboarding-state.ts` context provider
  - [ ] Integrate Clerk sign-up component

- [ ] **Role Selection:**
  - [ ] Create `role-selection-step.tsx` with card UI
  - [ ] Add role descriptions and visual cues

- [ ] **Role-Specific Forms:**
  - [ ] Create `recruiter-form-step.tsx`
  - [ ] Create `company-admin-form-step.tsx`
  - [ ] Create `invitation-review-step.tsx`

- [ ] **Completion:**
  - [ ] Create `completion-step.tsx` with success message
  - [ ] Implement role-specific dashboard redirects

### Phase 3: Invitation Flows

- [ ] **Company Admin Dashboard:**
  - [ ] Add "Invite Hiring Manager" button/modal
  - [ ] Display pending invitations
  - [ ] Allow invitation revocation

- [ ] **Team Owner Dashboard:**
  - [ ] Add "Invite Team Member" button/modal
  - [ ] Display pending team invitations
  - [ ] Allow invitation revocation

- [ ] **Email Templates:**
  - [ ] Create hiring manager invitation email
  - [ ] Create team invitation email
  - [ ] Add invitation expiry reminders

### Phase 4: Testing & Polish

- [ ] **Unit Tests:**
  - [ ] Test invitation creation/acceptance
  - [ ] Test onboarding state management
  - [ ] Test form validation

- [ ] **Integration Tests:**
  - [ ] Test full recruiter self-signup flow
  - [ ] Test full company admin self-signup flow
  - [ ] Test hiring manager invitation flow
  - [ ] Test team invitation flow

- [ ] **UI/UX Polish:**
  - [ ] Add loading skeletons
  - [ ] Add error states
  - [ ] Add success animations
  - [ ] Mobile responsiveness
  - [ ] Accessibility audit

---

## 10. Security Considerations

### 10.1 Invitation Tokens

- Use secure random tokens (UUID v4 or equivalent)
- Store hashed tokens in database (optional for Phase 1)
- Set reasonable expiration (7 days default)
- Invalidate on acceptance or revocation

### 10.2 Email Verification

- Require Clerk email verification before proceeding
- Block invitation acceptance if email doesn't match
- Prevent multiple accounts with same email

### 10.3 Rate Limiting

- Limit invitation creation (10 per hour per user)
- Limit sign-up attempts (5 per IP per hour)
- Throttle API calls during onboarding

---

## 11. Analytics & Monitoring

Track key onboarding metrics:

- **Conversion Rates:**
  - Clerk sign-up started → completed
  - Role selection completed
  - Full onboarding completed
  - Time to complete onboarding

- **Drop-off Points:**
  - Which step has highest abandonment?
  - Error frequency by step

- **Invitation Performance:**
  - Invitation acceptance rate
  - Time from invitation sent → accepted
  - Invitation expiry rate

---

## 12. Future Enhancements (Post-Phase 1)

- [ ] Social sign-up (Google, LinkedIn, Microsoft)
- [ ] Domain verification for company admins
- [ ] Bulk invitation upload (CSV)
- [ ] Custom invitation messages
- [ ] Role change requests (user upgrades/downgrades)
- [ ] Organization transfer (change company admin)
- [ ] Team merging and splitting
- [ ] Advanced recruiter onboarding (portfolio, references)
- [ ] Company verification (business documents)
- [ ] Subscription selection during onboarding

---

## 13. Dependencies & Prerequisites

### 13.1 Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# API Gateway
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

# Services (internal)
IDENTITY_SERVICE_URL=http://localhost:3001
NETWORK_SERVICE_URL=http://localhost:3002
ATS_SERVICE_URL=http://localhost:3003
```

### 13.2 Database Migrations

Ensure these migrations are applied:

- ✅ `identity.invitations` table (004_create_invitations.sql)
- ✅ `network.teams` table (004_teams_and_agencies.sql)
- ✅ `network.team_members` table
- ✅ `network.team_invitations` table

---

## 14. API Response Formats

All endpoints follow the standard envelope format (see `docs/guidance/api-response-format.md`):

**Success:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid invitation token",
    "details": { ... }
  }
}
```

---

## 15. Timeline Estimate

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| **Phase 1: Backend APIs** | Identity + Network service endpoints | 2-3 days |
| **Phase 2: Frontend Components** | Wizard, forms, state management | 3-4 days |
| **Phase 3: Invitation Flows** | Dashboard integration, email templates | 2-3 days |
| **Phase 4: Testing & Polish** | Tests, UI polish, bug fixes | 2-3 days |
| **Total** | | **9-13 days** |

---

**End of Document**

**Next Steps:**
1. Review and approve this document
2. Identify any missing requirements
3. Begin Phase 1 implementation (backend APIs)
4. Proceed sequentially through phases
