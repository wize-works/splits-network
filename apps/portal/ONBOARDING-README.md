# Onboarding System

Complete implementation of the two-phase user onboarding system for Splits Network.

## Overview

The onboarding system consists of two phases:

1. **Phase 1: Account Creation** (Already Implemented)
   - Sign up with Clerk (email/password or OAuth)
   - Email verification
   - Creates basic user record in `identity.users`

2. **Phase 2: Onboarding Wizard** (This Implementation)
   - Mandatory modal wizard on first dashboard visit
   - 4-step flow: Role → Subscription → Profile → Complete
   - Creates organization and membership records
   - Cannot be dismissed until completed

## Database Schema

### Migration: `005_add_onboarding_tracking.sql`

```sql
ALTER TABLE identity.users 
    ADD COLUMN IF NOT EXISTS onboarding_status VARCHAR(50) DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_onboarding_status 
    ON identity.users(onboarding_status);
```

**Fields:**
- `onboarding_status`: 'pending' | 'in_progress' | 'completed' | 'skipped'
- `onboarding_step`: Current step (1-4) in the wizard
- `onboarding_completed_at`: Timestamp when onboarding was completed

## Backend API

### Endpoints

#### Update Onboarding Progress
```
PATCH /api/identity/users/:id/onboarding
```

**Request Body:**
```json
{
  "step": 2,
  "status": "in_progress"
}
```

**Response:**
```json
{
  "data": {
    "id": "user-123",
    "onboarding_status": "in_progress",
    "onboarding_step": 2,
    ...
  }
}
```

#### Complete Onboarding
```
POST /api/identity/users/:id/complete-onboarding
```

**Request Body (Recruiter):**
```json
{
  "role": "recruiter",
  "data": {
    "bio": "Experienced tech recruiter...",
    "phone": "+1 555-123-4567",
    "industries": "Technology, Healthcare",
    "team_invite_code": "TEAM-ABC123"
  }
}
```

**Request Body (Company Admin):**
```json
{
  "role": "company_admin",
  "data": {
    "name": "Acme Corporation",
    "website": "https://acme.com",
    "industry": "technology",
    "size": "51-200"
  }
}
```

**Response:**
```json
{
  "data": {
    "user": { ... },
    "organization_id": "org-456"
  }
}
```

## Frontend Components

### Component Structure

```
apps/portal/src/components/onboarding/
├── index.ts                        # Public exports
├── types.ts                        # TypeScript interfaces
├── onboarding-provider.tsx         # Context provider + hook
├── onboarding-wizard-modal.tsx     # Main modal container
└── steps/
    ├── role-selection-step.tsx     # Step 1: Choose role
    ├── subscription-plan-step.tsx  # Step 2: Plan (placeholder)
    ├── recruiter-profile-step.tsx  # Step 3a: Recruiter form
    ├── company-info-step.tsx       # Step 3b: Company form
    └── completion-step.tsx         # Step 4: Review & submit
```

### Usage

The onboarding system is automatically integrated into the authenticated layout:

```tsx
// apps/portal/src/app/(authenticated)/layout.tsx
import { AuthenticatedLayoutClient } from './layout-client';

export default async function AuthenticatedLayout({ children }) {
  return (
    <AuthenticatedLayoutClient>
      {children}
    </AuthenticatedLayoutClient>
  );
}
```

The `AuthenticatedLayoutClient` wraps all authenticated pages with:
- `OnboardingProvider` (context for state management)
- `OnboardingWizardModal` (the modal wizard)

### Context API

```tsx
import { useOnboarding } from '@/components/onboarding';

function MyComponent() {
  const { state, actions } = useOnboarding();

  // State
  state.currentStep          // 1-4
  state.status               // 'pending' | 'in_progress' | 'completed'
  state.isModalOpen          // boolean
  state.selectedRole         // 'recruiter' | 'company_admin'
  state.recruiterProfile     // { bio, phone, industries, team_invite_code }
  state.companyInfo          // { name, website, industry, size }
  state.submitting           // boolean
  state.error                // string | null

  // Actions
  actions.setStep(step)
  actions.setRole(role)
  actions.setRecruiterProfile(data)
  actions.setCompanyInfo(data)
  actions.submitOnboarding()
}
```

## Wizard Flow

### Step 1: Role Selection
- User chooses between "Recruiter" or "Company Admin"
- Card-based UI with icons and descriptions
- Automatically proceeds to Step 2 on selection

### Step 2: Subscription Plan (Placeholder)
- Shows "Coming Soon" message
- Explains that billing is being configured
- Currently allows continuation with full access
- Will be replaced with actual Stripe integration later

### Step 3: Profile Information

**For Recruiters:**
- Bio (textarea, required)
- Phone (tel input, required)
- Industries (text input, optional)
- Team invite code (text input, optional)

**For Company Admins:**
- Company name (text, required)
- Website (url, required)
- Industry (select dropdown, required)
- Company size (select dropdown, required)

### Step 4: Review & Complete
- Shows summary of all entered information
- "What happens next?" guidance
- Submit button finalizes onboarding
- Modal closes after 2-second success delay

## Modal Behavior

- **Non-dismissible**: User cannot close the modal until onboarding is complete
- **Backdrop**: Black overlay prevents interaction with dashboard
- **Progress indicator**: Shows current step and percentage completion
- **Navigation**: Back/Continue buttons for step control
- **Validation**: Form validation on Step 3 before proceeding
- **Error handling**: Shows error alerts for API failures

## API Integration Flow

1. **On Dashboard Load:**
   ```
   GET /api/users/me
   → Check onboarding_status
   → If 'pending' or 'in_progress', show modal
   ```

2. **On Step Change:**
   ```
   PATCH /api/identity/users/:id/onboarding
   → Update onboarding_step and status
   ```

3. **On Completion:**
   ```
   POST /api/identity/users/:id/complete-onboarding
   → Create organization
   → Create membership
   → Update onboarding_status to 'completed'
   → Set onboarding_completed_at timestamp
   ```

## Backend Business Logic

### `UsersService.completeOnboarding()`

This method handles the final onboarding submission:

**For Recruiters:**
1. Creates a personal organization (name = user's full name)
2. Creates membership with role = 'recruiter'
3. Marks onboarding as completed

**For Company Admins:**
1. Creates company organization (name = company name from form)
2. Creates membership with role = 'company_admin'
3. Marks onboarding as completed

## Testing Checklist

### Database
- [ ] Run migration on identity database
- [ ] Verify columns added to identity.users
- [ ] Check index creation

### Backend
- [ ] Start identity-service
- [ ] Test PATCH /users/:id/onboarding endpoint
- [ ] Test POST /users/:id/complete-onboarding (recruiter)
- [ ] Test POST /users/:id/complete-onboarding (company_admin)
- [ ] Verify organization created
- [ ] Verify membership created

### Frontend
- [ ] Sign up new user
- [ ] Verify redirect to dashboard
- [ ] Confirm modal appears
- [ ] Test Step 1: Role selection
- [ ] Test Step 2: Subscription placeholder
- [ ] Test Step 3a: Recruiter profile form
- [ ] Test Step 3b: Company info form
- [ ] Test Step 4: Review & complete
- [ ] Verify modal closes after completion
- [ ] Verify user can access dashboard features
- [ ] Test back navigation between steps
- [ ] Test form validation
- [ ] Test error handling

## Future Enhancements

### Phase 3: Stripe Integration
- Replace subscription placeholder step
- Show actual plan options (Free, Pro, Enterprise)
- Integrate Stripe Checkout
- Handle payment success/failure
- Update billing-service

### Phase 4: Progressive Onboarding
- Make some fields optional
- Allow "Skip for now" on certain steps
- Progressive profile completion prompts
- Gamification (profile completion percentage)

### Phase 5: Invitation Flows
- Pre-fill data from invitations
- Skip role selection if invited
- Auto-join organization if company invite

## Troubleshooting

### Modal doesn't appear
- Check `/api/users/me` response
- Verify `onboarding_status` is 'pending' or 'in_progress'
- Check browser console for errors

### API calls fail
- Verify identity-service is running
- Check NEXT_PUBLIC_API_GATEWAY_URL env var
- Verify Clerk token is valid
- Check network tab for error responses

### Data not saving
- Check browser console for errors
- Verify PATCH endpoint receives correct data
- Check database for updated records
- Verify no validation errors in backend

## Environment Variables

```env
# Frontend (.env.local in apps/portal)
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:3000

# Backend (.env in services/identity-service)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Related Documentation

- [User Onboarding Flows](../../docs/implementation/user-onboarding-flows.md)
- [Identity Service README](../../services/identity-service/README.md)
- [Form Controls Guidance](../../docs/guidance/form-controls.md)
- [API Response Format](../../docs/guidance/api-response-format.md)

---

**Last Updated**: January 2025  
**Version**: 1.0.0
