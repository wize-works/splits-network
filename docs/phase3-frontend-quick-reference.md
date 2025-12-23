# Phase 3: Frontend UI Implementation - Quick Reference

**Status**: Ready to Start  
**Scope**: Candidate and recruiter portal UIs for recruiter job proposals  
**Estimated Duration**: 2-3 days  

---

## Backend API Endpoints (Ready to Use)

### Recruiter: Propose Job
```
POST /api/applications/:applicationId/propose
Authorization: Bearer {token}
Content-Type: application/json

{
  "recruiterPitch": "Great fit for your background!"
}

Response (200 OK):
{
  "data": {
    "application": {
      "id": "uuid",
      "job_id": "uuid",
      "candidate_id": "uuid",
      "recruiter_id": "uuid",
      "stage": "recruiter_proposed",
      "created_at": "2025-12-14T...",
      "metadata": {
        "recruiter_pitch": "Great fit..."
      }
    }
  }
}
```

### Candidate: Get Pending Opportunities
```
GET /api/candidates/:candidateId/pending-opportunities
Authorization: Bearer {token}

Response (200 OK):
{
  "data": {
    "applications": [
      {
        "id": "uuid",
        "stage": "recruiter_proposed",
        "job": {
          "id": "uuid",
          "title": "Senior Software Engineer",
          "description": "...",
          "company": {
            "id": "uuid",
            "name": "Acme Corp"
          }
        },
        "recruiter": {
          "id": "uuid",
          "user_id": "uuid",
          "full_name": "John Recruiter"
        },
        "metadata": {
          "recruiter_pitch": "Great fit for your background!"
        },
        "created_at": "2025-12-14T...",
        "expires_at": "2025-12-21T..."
      }
    ]
  }
}
```

### Candidate: Approve Opportunity
```
POST /api/applications/:applicationId/approve-opportunity
Authorization: Bearer {token}

Response (200 OK):
{
  "data": {
    "application": {
      "id": "uuid",
      "stage": "draft",  // Changed from recruiter_proposed
      "job_id": "uuid",
      "candidate_id": "uuid",
      "recruiter_id": "uuid",
      "updated_at": "2025-12-14T..."
    }
  }
}
```

### Candidate: Decline Opportunity
```
POST /api/applications/:applicationId/decline-opportunity
Authorization: Bearer {token}
Content-Type: application/json

{
  "declineReason": "Not interested in this role",
  "candidateNotes": "Looking for remote-only positions"
}

Response (200 OK):
{
  "data": {
    "application": {
      "id": "uuid",
      "stage": "rejected",  // Changed from recruiter_proposed
      "job_id": "uuid",
      "candidate_id": "uuid",
      "recruiter_id": "uuid",
      "updated_at": "2025-12-14T..."
    }
  }
}
```

### Recruiter: View Proposed Jobs
```
GET /api/recruiters/:recruiterId/proposed-jobs
Authorization: Bearer {token}

Response (200 OK):
{
  "data": {
    "applications": [
      {
        "id": "uuid",
        "stage": "recruiter_proposed",
        "job": {
          "id": "uuid",
          "title": "Senior Software Engineer",
          "company": { "id": "uuid", "name": "Acme Corp" }
        },
        "candidate": {
          "id": "uuid",
          "full_name": "Jane Candidate",
          "email": "jane@example.com"
        },
        "metadata": {
          "recruiter_pitch": "..."
        },
        "created_at": "2025-12-14T...",
        "expires_at": "2025-12-21T..."
      }
    ]
  }
}
```

---

## Frontend Features to Build

### 1. Candidate Portal: Opportunities View

**Route**: `/app/(authenticated)/opportunities`  
**Component**: `OpportunitiesPage.tsx`

**Features**:
- [ ] List all pending opportunities (recruiter_proposed stage)
- [ ] Show countdown timer (7-day expiration)
- [ ] Display recruiter name and pitch
- [ ] Show job title, company, description
- [ ] Cards/rows layout with DaisyUI components
- [ ] Click to expand full details
- [ ] Approve/Decline buttons with confirmation
- [ ] Empty state when no opportunities
- [ ] Loading skeleton while fetching

**Data Needed**:
- `GET /api/candidates/:candidateId/pending-opportunities`
- Use `useAuth()` to get candidate ID from Clerk session
- Pass candidate ID from user context

**UI Components**:
- `card` - Main opportunity card container
- `badge` - Status badge (e.g., "Expires in 5 days")
- `btn` - Approve/Decline buttons
- `btn btn-sm btn-outline` - Secondary actions
- `divider` - Separate opportunities
- `loading loading-spinner` - Loading state
- `alert alert-info` - Empty state message

---

### 2. Candidate Portal: Opportunity Detail View

**Route**: `/app/(authenticated)/opportunities/[id]`  
**Component**: `OpportunityDetailPage.tsx`

**Features**:
- [ ] Full job description
- [ ] Company information and logo
- [ ] Recruiter details and message
- [ ] Salary range (if available)
- [ ] Location and job type
- [ ] Detailed recruiter pitch
- [ ] Days remaining countdown
- [ ] Large Approve/Decline CTA buttons
- [ ] Back navigation

**Data Needed**:
- `GET /api/applications/:applicationId`
- `GET /api/jobs/:jobId` (may be included in response)
- `GET /api/recruiters/:recruiterId` (may be included in response)

**Interactions**:
- Approve button: 
  - Shows confirmation modal
  - POST to `/api/applications/:id/approve-opportunity`
  - Redirects to `/dashboard` with success message
- Decline button:
  - Opens modal with optional reason/notes fields
  - POST to `/api/applications/:id/decline-opportunity`
  - Redirects to `/opportunities` with success message

---

### 3. Recruiter Portal: Propose Job UI

**Route**: `/app/(authenticated)/roles/[id]/propose`  
**Component**: `ProposeJobModal.tsx` or dedicated page

**Features**:
- [ ] Form to select candidate
- [ ] Textarea for recruiter pitch
- [ ] Job details preview (read-only)
- [ ] Submit button with loading state
- [ ] Form validation (pitch required?)
- [ ] Success message on submit
- [ ] Error handling with user feedback

**Data Flow**:
1. Recruiter selects a job
2. Recruiter selects one or more candidates
3. Recruiter enters pitch message (optional but encouraged)
4. Click "Propose" → POST to `/api/applications/:applicationId/propose`
5. Show success: "Proposal sent to [Candidate Name]"
6. Option to propose to another candidate

**Implementation Notes**:
- May need candidate selection UI
- Could integrate with existing candidate search/filter
- Need to determine which candidates are eligible:
  - Not already in this job's pipeline
  - Not already proposed to
  - Match job criteria

---

### 4. Recruiter Portal: Proposed Jobs List

**Route**: `/app/(authenticated)/dashboard/proposals`  
**Component**: `ProposedJobsPage.tsx`

**Features**:
- [ ] List all proposed jobs
- [ ] Filter by status: Pending, Approved, Declined, Expired
- [ ] Show candidate name, email, phone
- [ ] Show job title and company
- [ ] Show proposal date and expiration date
- [ ] Show candidate response status
  - "Pending response" (blinking or badge)
  - "Approved" (green badge)
  - "Declined" (red badge with reason if available)
  - "Expired" (gray badge)
- [ ] Candidate contact information (email/phone)
- [ ] Action: Send reminder (if still pending)
- [ ] Action: View candidate profile
- [ ] Action: View job details

**Data Needed**:
- `GET /api/recruiters/:recruiterId/proposed-jobs`
- Use pagination if many proposals
- Filter/sort client-side or server-side

**UI Components**:
- `table` - List of proposals
- `badge` - Status badges (pending, approved, declined)
- `btn btn-sm` - Action buttons
- `alert` - Empty state
- `loading` - Skeleton or spinner

---

### 5. Email Links Integration

**Feature**: Clicking email links should navigate correctly

**Links to Support**:
- New Opportunity Email → `/opportunities/[applicationId]`
- Approved/Declined Notification → `/dashboard/proposals`

**Implementation**:
- Extract application ID from URL
- Verify user owns this application
- Redirect to appropriate view

---

## Data Structures

### Opportunity Object
```typescript
interface Opportunity {
  id: string;                    // application_id
  stage: 'recruiter_proposed';
  job: {
    id: string;
    title: string;
    description: string;
    salary_min?: number;
    salary_max?: number;
    location?: string;
    job_type?: string;
    company: {
      id: string;
      name: string;
      logo_url?: string;
    };
  };
  recruiter: {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
  };
  metadata: {
    recruiter_pitch?: string;
  };
  created_at: string;           // ISO timestamp
  expires_at: string;           // 7 days from created_at
}
```

### Proposed Job Object (Recruiter View)
```typescript
interface ProposedJob {
  id: string;                    // application_id
  stage: 'recruiter_proposed' | 'draft' | 'rejected';
  job: {
    id: string;
    title: string;
    company: {
      id: string;
      name: string;
    };
  };
  candidate: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
  status: 'pending' | 'approved' | 'declined' | 'expired';
  metadata: {
    recruiter_pitch?: string;
    decline_reason?: string;      // If declined
    candidate_notes?: string;     // If declined
  };
  created_at: string;
  expires_at: string;
  responded_at?: string;         // When candidate responded
}
```

---

## Form Validation Rules

### Approve Opportunity
- No form (confirmation only)
- Show: "Are you sure? You'll need to complete your application."

### Decline Opportunity
- `declineReason`: optional, string, max 500 chars
- `candidateNotes`: optional, string, max 1000 chars
- At least one field recommended but not required

### Propose Job
- `recruiterPitch`: optional, string, max 2000 chars
- Candidate selection: required
- Job: required (from route params)

---

## Email Link Handling

### When Email Link Clicked

**Scenario 1**: New Opportunity Email
- Link: `/opportunities/[applicationId]`
- Should show opportunity details page
- User must be authenticated
- Redirect to login if not authenticated
- Verify user is the candidate for this application

**Scenario 2**: Approved/Declined Notification Email
- Link: `/dashboard/proposals` or `/applications/[id]`
- Should show recruiter's proposals dashboard
- User must be authenticated recruiter
- Verify user is the recruiter who made the proposal

---

## Styling Guidelines

### Use DaisyUI Components
- `card` - Opportunity cards
- `badge` - Status badges
- `btn` - Primary/secondary buttons
- `alert` - Info, success, error messages
- `divider` - Section separators
- `loading` - Loading states
- `avatar` - Recruiter/candidate photos
- `progress` - Countdown timer (optional)
- `modal` - Confirmation dialogs
- `tooltip` - Hover explanations

### Form Controls
- Follow [form-controls.md](../guidance/form-controls.md)
- Use `fieldset` wrapper (not `form-control`)
- Use simple label markup: `<label className="label">Text</label>`
- No `-bordered` suffixes on inputs

### Colors
- Status colors:
  - Pending: `badge-warning` (yellow)
  - Approved: `badge-success` (green)
  - Declined: `badge-error` (red)
  - Expired: `badge-neutral` (gray)
- Primary actions: `btn btn-primary`
- Secondary actions: `btn btn-secondary`
- Destructive actions: `btn btn-error`

---

## State Management Patterns

### Using React Hooks
```typescript
// Fetch opportunities
const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/candidates/${candidateId}/pending-opportunities`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data } = await response.json();
      setOpportunities(data.applications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };
  
  if (candidateId) fetchOpportunities();
}, [candidateId, token]);
```

---

## Error Handling

### API Errors
- `400 Bad Request` - Validation failed
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Application/opportunity not found
- `409 Conflict` - Invalid stage transition
- `500 Internal Server Error` - Server error

### User Feedback
- Show `alert alert-error` with message
- Log errors to console for debugging
- Suggest action: "Please try again" or "Contact support"

---

## Performance Considerations

### Pagination
- Load first 10 opportunities by default
- Implement "Load More" or pagination controls
- Cache in state to avoid re-fetching

### Images
- Use responsive image sizing
- Lazy load company logos
- Use next/image for optimization

### Timestamps
- Show relative time: "5 days remaining" (not ISO)
- Update countdown in real-time with useEffect interval
- Format with date-fns or similar library

---

## Accessibility Requirements

- [ ] Semantic HTML (`<button>`, `<form>`, `<section>`)
- [ ] ARIA labels for icons
- [ ] Keyboard navigation support
- [ ] Color not the only indicator (use badges + text)
- [ ] Form labels connected to inputs
- [ ] Error messages linked to fields
- [ ] Focus indicators visible
- [ ] Mobile touch targets ≥ 44px

---

## Testing Checklist

### Unit Tests
- [ ] Date/expiration calculations
- [ ] Decline form validation
- [ ] Status badge logic

### Integration Tests
- [ ] API calls with mock data
- [ ] Form submission flow
- [ ] Error states and recovery
- [ ] Loading states

### E2E Tests
- [ ] Candidate approves opportunity
- [ ] Candidate declines opportunity
- [ ] Recruiter proposes job
- [ ] View proposed jobs list
- [ ] Email links navigate correctly

---

## Deployment Notes

### Environment Variables
- `NEXT_PUBLIC_API_URL` - API gateway endpoint
- `NEXT_PUBLIC_PORTAL_URL` - Portal base URL (for email links)

### Database Backups
- No schema changes in Phase 3
- Phase 2 migration already applied

### Feature Flags
- Consider feature flag for recruiter proposal UI
- Allow gradual rollout to recruiters

---

## Timeline Estimate

| Task | Estimate | Notes |
|------|----------|-------|
| Candidate Opportunities Page | 4 hours | List + filter view |
| Opportunity Detail View | 3 hours | Full details + CTA |
| Approve/Decline Modals | 2 hours | Forms + validation |
| Recruiter Propose Job UI | 5 hours | Candidate search + form |
| Proposed Jobs Dashboard | 4 hours | List + status filters |
| Email Link Integration | 1 hour | Redirect logic |
| Testing & QA | 4 hours | Unit + integration tests |
| **Total** | **~23 hours** | ~3 days for 1 developer |

---

## Success Criteria

- ✅ All endpoints fully integrated and working
- ✅ No compilation errors or warnings
- ✅ All UI components styled consistently
- ✅ Email links navigate correctly
- ✅ Form validation working
- ✅ Error states show helpful messages
- ✅ Loading states show spinner/skeleton
- ✅ Mobile responsive (tested on mobile device)
- ✅ Accessibility audit passing
- ✅ E2E tests passing

---

**Next Step**: Start with Candidate Opportunities page  
**Backend Ready**: ✅ All APIs operational  
**Questions**: Refer to Phase 2 documentation or backend implementation
