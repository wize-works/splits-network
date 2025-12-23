# Phase 3 Frontend Implementation - Component Overview

## Summary

Phase 3 frontend UI implementation for the recruiter job proposal flow is now complete. All components follow Next.js App Router patterns, use DaisyUI for styling, and integrate with the Phase 2 backend APIs.

---

## Components Created

### 1. **Candidate Opportunities List** 
📍 `apps/portal/src/app/(authenticated)/opportunities/components/opportunities-list-client.tsx`

**Purpose**: Main candidate-facing page showing all pending opportunities

**Features**:
- Fetches from `GET /api/candidates/{id}/pending-opportunities`
- Card-based layout with job title, company, recruiter name, recruiter pitch
- Countdown timer showing days remaining (color-coded: info/warning)
- "View Details" button linking to opportunity detail view
- Loading, error, and empty states
- Uses Clerk authentication for user context

**Key Functions**:
- `getDaysRemaining()` - Calculates expiration countdown
- `formatDate()` - Formats dates for display
- Responsive design (mobile-first with grid)

---

### 2. **Opportunities Page (Server Wrapper)**
📍 `apps/portal/src/app/(authenticated)/opportunities/page.tsx`

**Purpose**: Server component wrapper for opportunities list

**Pattern**: Minimal server page that imports client component
- Reduces file size and improves code organization
- Follows existing portal conventions (applications, proposals)

---

### 3. **Opportunity Detail View**
📍 `apps/portal/src/app/(authenticated)/opportunities/[id]/components/opportunity-detail-client.tsx`

**Purpose**: Full opportunity detail page with accept/decline flow

**Features**:
- Fetches from `GET /api/applications/{id}`
- Full job description display
- Recruiter pitch in highlighted box
- Expiration countdown (large display, 4 columns wide)
- Accept button: POSTs to `POST /api/applications/{id}/approve-opportunity`
- Decline button: Opens modal with optional reason field
- Decline modal: POSTs to `POST /api/applications/{id}/decline-opportunity` with `decline_reason`
- Expired opportunity state (disables actions, shows warning alert)
- Back navigation to opportunities list
- Two-column layout (3 col on desktop, 1 col on mobile)

**Key Components**:
- Decline modal with form validation
- Status-based styling (error/warning/info)
- Loading and error state handling

---

### 4. **Opportunity Detail Page (Dynamic Route)**
📍 `apps/portal/src/app/(authenticated)/opportunities/[id]/page.tsx`

**Purpose**: Server wrapper for dynamic opportunity detail route

**Pattern**: Minimal wrapper importing client component

---

### 5. **Propose Job Modal**
📍 `apps/portal/src/app/(authenticated)/candidates/[id]/components/propose-job-modal.tsx`

**Purpose**: Modal form for recruiters to propose jobs to candidates

**Features**:
- Displays candidate name and job title in header
- Textarea for recruiter pitch (character count display)
- Form validation (pitch required)
- POSTs to `POST /api/applications/{id}/propose`
- Loading state on submit button
- Error handling with alert display
- Integrates with Next.js router for refresh after success
- Modal backdrop click to close

**Usage**: Embedded in candidate detail pages with `onClose` and `onSuccess` callbacks

---

### 6. **Proposed Jobs List Component**
📍 `apps/portal/src/app/(authenticated)/dashboard/components/proposed-jobs-list.tsx`

**Purpose**: Reusable component showing recruiter's proposed jobs

**Features**:
- Fetches from `GET /api/recruiters/{id}/proposed-jobs`
- Two display modes:
  - `compact={true}`: Minimal view for dashboard widget
  - `compact={false}`: Full view for dedicated page
- Status filtering (All, Pending, Approved, Declined)
- Filter buttons for status (only in full view)
- Status badges with color coding:
  - Info: Pending Response
  - Success: Approved
  - Error: Declined
  - Warning: Expired
- Days remaining countdown (pending jobs only)
- Links to candidate profiles
- Empty state messaging

**Key Functions**:
- `getDaysRemaining()` - Calculates expiration
- `getStatusBadge()` - Maps stage to DaisyUI badge class
- `getStatusLabel()` - Human-readable status text

---

### 7. **Proposed Jobs Page**
📍 `apps/portal/src/app/(authenticated)/proposed-jobs/page.tsx`

**Purpose**: Dedicated page for recruiters to view all proposed jobs

**Features**:
- Full-page view of ProposedJobsList component (not compact)
- Page header with title and description
- Card wrapper for content
- All filtering options visible
- Shows comprehensive view of all proposals with status

---

### 8. **Updated Recruiter Dashboard**
📍 `apps/portal/src/app/(authenticated)/dashboard/components/recruiter-dashboard.tsx`

**Changes**:
- Added import for `ProposedJobsList`
- Added "Proposed Jobs" button to Quick Actions menu
- Added "Recent Proposals" section above "Recent Activity"
  - Shows compact view of recent proposals
  - Link to full proposed jobs page
  - Displays up to 5 most recent proposals with status

**Layout**: Now shows proposed jobs prominently on recruiter dashboard

---

## API Integration Points

All components are integrated with Phase 2 backend APIs:

### Candidate APIs
- `GET /api/candidates/{id}/pending-opportunities` - List opportunities
- `GET /api/applications/{id}` - Get opportunity details
- `POST /api/applications/{id}/approve-opportunity` - Accept opportunity
- `POST /api/applications/{id}/decline-opportunity` - Decline with optional reason

### Recruiter APIs
- `GET /api/recruiters/{id}/proposed-jobs` - List proposed jobs
- `POST /api/applications/{id}/propose` - Propose job to candidate

---

## Styling & UX Patterns

### Colors & Badges
- **Pending**: `badge-info` (blue)
- **Approved**: `badge-success` (green)
- **Declined**: `badge-error` (red)
- **Expired**: `badge-warning` (yellow)

### Typography
- Page headers: `text-4xl font-bold`
- Card titles: `card-title` or `text-xl font-bold`
- Subtitles: `text-base-content/70`
- Helper text: `text-sm`

### Forms
- Uses DaisyUI `fieldset` pattern (per form-controls.md)
- Simple label markup: `<label className="label">Text</label>`
- No `-bordered` suffixes on inputs
- Textarea with character counter

### Modals
- DaisyUI modal component with backdrop
- Modal actions buttons in standard layout
- Form submission handling with error display

### Responsive Design
- Grid layouts use responsive breakpoints (e.g., `grid-cols-1 lg:grid-cols-3`)
- Buttons adapt: `btn-sm` for compact views
- Cards stack on mobile, side-by-side on desktop

---

## Component Hierarchy

```
Portal App
├─ (authenticated)
│  ├─ opportunities/
│  │  ├─ page.tsx (server)
│  │  ├─ components/
│  │  │  └─ opportunities-list-client.tsx
│  │  └─ [id]/
│  │     ├─ page.tsx (server)
│  │     └─ components/
│  │        └─ opportunity-detail-client.tsx
│  ├─ proposed-jobs/
│  │  └─ page.tsx (server)
│  ├─ dashboard/
│  │  └─ components/
│  │     ├─ recruiter-dashboard.tsx (updated)
│  │     └─ proposed-jobs-list.tsx (new)
│  └─ candidates/[id]/
│     └─ components/
│        └─ propose-job-modal.tsx
```

---

## State Management

All components use React hooks:
- `useState()` for local UI state (loading, error, data)
- `useEffect()` for data fetching on mount
- `useRouter()` for navigation after actions
- `useUser()` from Clerk for authentication context
- `useParams()` for dynamic route parameters

No external state management library required (parity with existing app).

---

## Error Handling

All components implement:
1. Try-catch blocks for API calls
2. Error state display with alert component
3. User-friendly error messages
4. Fallback UI for failed states

Example:
```tsx
if (error) {
    return (
        <div className="alert alert-error">
            <i className="fa-solid fa-circle-exclamation"></i>
            <span>{error}</span>
        </div>
    );
}
```

---

## Loading States

All components implement loading indicators:
- Skeleton spinner for initial page load: `loading-spinner`
- Button spinner for form submission: `loading-spinner loading-sm`
- Disabled state on buttons during action

---

## Accessibility

Components include:
- Semantic HTML (button, form, nav links)
- ARIA labels where appropriate
- Icon + text button labels (icons not sole content)
- Keyboard navigation (form fields, buttons, links)
- Color + text for status indication (not color-only)

---

## Testing Checklist

- [ ] Opportunities list loads candidate pending opportunities
- [ ] Countdown timer shows correct days remaining
- [ ] "View Details" navigates to opportunity detail page
- [ ] Opportunity detail shows full job description
- [ ] Accept button submits to approve endpoint
- [ ] Decline modal appears, accepts reason input
- [ ] Decline button submits to decline endpoint
- [ ] Expired opportunities disable actions
- [ ] Proposed jobs list loads recruiter's proposals
- [ ] Status filtering works correctly
- [ ] Propose modal validates pitch field
- [ ] Propose modal submits to propose endpoint
- [ ] Dashboard shows proposed jobs widget
- [ ] Dashboard link to proposed-jobs page works
- [ ] All pages responsive on mobile
- [ ] Error states display correctly
- [ ] Loading states show spinners

---

## Next Steps

1. **Integration Testing**: Test all API calls with backend
2. **Email Links**: Add email link handlers for opportunity emails
3. **Notifications**: Add toast notifications on success/error
4. **Mobile Testing**: Verify responsive design on devices
5. **Performance**: Monitor API response times, optimize if needed
6. **Analytics**: Add tracking for proposal accept/decline rates

---

## Files Summary

| File | Type | Purpose |
|------|------|---------|
| `opportunities-list-client.tsx` | Client Component | Candidate opportunity list |
| `opportunities/page.tsx` | Server Page | Opportunity list wrapper |
| `opportunity-detail-client.tsx` | Client Component | Opportunity detail view |
| `opportunities/[id]/page.tsx` | Server Page | Detail page wrapper |
| `propose-job-modal.tsx` | Client Component | Recruiter proposal form |
| `proposed-jobs-list.tsx` | Client Component | Recruiter proposals listing |
| `proposed-jobs/page.tsx` | Server Page | Proposed jobs page wrapper |
| `recruiter-dashboard.tsx` | Client Component | Updated with proposals |

---

**Total Components**: 8  
**Total Files**: 8  
**Pattern**: Server page wrapper + Client component (for all routes)  
**API Endpoints Integrated**: 7  
**Status**: ✅ Phase 3 Frontend Complete
