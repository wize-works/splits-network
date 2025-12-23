# Phase 3 Quick Reference - Frontend Routes & Features

## 🗺️ Route Map

### Candidate Routes

#### `/opportunities`
**Candidate Opportunities List**
- View all pending opportunities
- Countdown timer for each (7-day expiration)
- Recruiter pitch preview
- Quick "View Details" action
- **Component**: `opportunities-list-client.tsx`

#### `/opportunities/[id]`
**Opportunity Detail & Action Page**
- Full job description
- Recruiter pitch in highlighted box
- Accept button (primary green action)
- Decline button (secondary action)
- Large countdown timer
- Decline modal with optional reason field
- **Component**: `opportunity-detail-client.tsx`

---

### Recruiter Routes

#### `/proposed-jobs`
**View All Proposed Jobs**
- List of all recruiter's proposals
- Status filter buttons: All, Pending, Approved, Declined
- Status badges with color coding
- Days remaining countdown (pending jobs)
- Links to candidate profiles
- **Component**: `proposed-jobs-list.tsx`

#### `/dashboard` (Updated)
**Recruiter Dashboard**
- New "Recent Proposals" widget
- Shows 5 most recent proposals
- Link to full proposed jobs page
- Added "Proposed Jobs" to Quick Actions menu
- **Component**: `recruiter-dashboard.tsx` (updated)

#### `/candidates/[id]` (Feature)
**Propose Job Modal** (from candidate profile)
- Modal form appears when recruiter clicks "Propose Job"
- Textarea for recruiter pitch
- Character counter (shows count / 500)
- Submit button (disabled until pitch entered)
- Cancel & close options
- **Component**: `propose-job-modal.tsx`

---

## 🔑 API Endpoints Called

### GET Endpoints
```
GET /api/candidates/{candidateId}/pending-opportunities
→ Response: { data: Opportunity[] }

GET /api/applications/{applicationId}
→ Response: { data: Opportunity }

GET /api/recruiters/{recruiterId}/proposed-jobs
→ Response: { data: ProposedJob[] }
```

### POST Endpoints
```
POST /api/applications/{applicationId}/approve-opportunity
→ Body: {} (empty)
→ Response: { data: Application }

POST /api/applications/{applicationId}/decline-opportunity
→ Body: { decline_reason: string }
→ Response: { data: Application }

POST /api/applications/{applicationId}/propose
→ Body: { recruiter_pitch: string }
→ Response: { data: Application }
```

---

## 📊 Component State Models

### Opportunity Object
```typescript
interface Opportunity {
    id: string;
    stage: string;  // 'recruiter_proposed' | 'approved' | 'declined' | 'expired'
    job: {
        id: string;
        title: string;
        description: string;
        company: {
            id: string;
            name: string;
        };
    };
    recruiter: {
        id: string;
        user_id: string;
        full_name: string;
    };
    metadata?: {
        recruiter_pitch?: string;
    };
    created_at: string;  // ISO date
    expires_at: string;  // ISO date (7 days from created_at)
}
```

### ProposedJob Object
```typescript
interface ProposedJob {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    stage: string;  // 'recruiter_proposed' | 'approved' | 'declined' | 'expired'
    metadata?: {
        recruiter_pitch?: string;
    };
    created_at: string;
    expires_at: string;
}
```

---

## 🎨 UI Patterns Used

### Status Badges
- **Pending Response**: `badge badge-info` (blue)
- **Approved**: `badge badge-success` (green)
- **Declined**: `badge badge-error` (red)
- **Expired**: `badge badge-warning` (yellow)

### Button Styles
- **Primary Actions**: `btn btn-primary` (Accept, Send Proposal)
- **Secondary Actions**: `btn btn-outline` (Decline, View)
- **Danger Actions**: `btn btn-error` (Confirm Decline)
- **Text Links**: `link link-primary` (View all, Back)

### Card Layout
- **Opportunities Card**: Image, job title, company, recruiter, countdown
- **Proposed Job Card**: Job title, candidate name, status, timestamp
- **Detail Card**: Full content in `card bg-base-100` wrapper

### Forms
- **Fieldset Wrapper**: `<div className="fieldset">`
- **Labels**: `<label className="label">Text</label>`
- **Textareas**: `<textarea className="textarea h-24">`
- **Validation**: Client-side `required` attribute

### Modals
- **Decline Modal**: DaisyUI `modal modal-open`
- **Backdrop Click**: Closes modal (unless loading)
- **Actions**: Cancel and Confirm buttons in `modal-action`

---

## 🔄 User Flows

### Candidate Accepts Opportunity
```
1. Visit /opportunities
2. Browse list of opportunities
3. Click "View Details" on card
4. Review full job description & recruiter pitch
5. Click "Accept Opportunity" button
6. Confirmation message
7. Redirect to /opportunities
8. Email sent to recruiter
```

### Candidate Declines Opportunity
```
1. On opportunity detail page
2. Click "Decline" button
3. Modal opens with text area
4. Enter optional decline reason
5. Click "Confirm Decline"
6. Confirmation message
7. Redirect to /opportunities
8. Email sent to recruiter with reason
```

### Recruiter Proposes Job
```
1. Visit /candidates/[id] profile
2. Click "Propose Job" button
3. Modal opens with pitch form
4. Enter personalized pitch
5. Click "Send Proposal"
6. Loading indicator
7. Success message
8. Page refreshes
9. Email sent to candidate with link
```

### Recruiter Views Proposals
```
1. From /dashboard, click "Proposed Jobs"
2. OR navigate to /proposed-jobs
3. See list of all proposals
4. Use filter buttons to filter by status
5. View countdown timers for pending proposals
6. Click on job to view candidate
```

---

## ⚙️ Technical Setup

### Authentication
- Uses Clerk `useUser()` hook
- Token automatically added to API calls via ApiClient
- User ID used for candidate/recruiter lookup

### State Management
- React `useState()` for UI state
- React `useEffect()` for data fetching
- Local error/loading states in each component
- No Redux/Zustand (follows portal pattern)

### Routing
- Next.js App Router with dynamic routes `[id]`
- Server pages (`page.tsx`) import client components
- Client components handle all logic and state
- Proper error boundaries with user messaging

### Styling
- DaisyUI 5.5.8 components only
- Tailwind CSS utility classes
- Responsive design: `md:` and `lg:` prefixes
- Dark mode support via DaisyUI themes

---

## 🐛 Troubleshooting

### Opportunities list is empty
- Check user is authenticated (Clerk)
- Verify API endpoint `/api/candidates/{id}/pending-opportunities`
- Check candidate has pending opportunities in database
- Review browser console for API errors

### Buttons not responding
- Check loading states (disabled during submission)
- Verify API endpoint is accessible
- Check for 401/403 auth errors in console
- Confirm JWT token in Authorization header

### Modals not appearing
- Verify modal component is mounted
- Check `showDeclineModal` state is true
- Confirm modal backdrop styling
- Check z-index in CSS (DaisyUI modals use proper z-index)

### Countdown timer wrong
- Verify `expires_at` date is ISO format
- Check system timezone
- Confirm date math: `new Date()` vs `new Date(string)`
- Check for daylight saving time issues

### Styling looks wrong
- Verify TailwindCSS build is running
- Check for conflicting custom CSS
- Ensure DaisyUI plugin loaded in config
- Clear browser cache (Ctrl+Shift+Delete)

---

## 📱 Responsive Breakpoints

### Mobile (< 768px)
- Single column layout
- Full-width cards
- Stacked action buttons
- Bottom drawer for modals (on some screens)

### Tablet (768px - 1024px)
- 2-column layouts for side-by-side content
- Buttons side-by-side
- Sidebar visible but condensed

### Desktop (> 1024px)
- 3-column layouts
- Full sidebar visible
- Multiple cards visible
- Hover effects on buttons

---

## 📚 Related Documentation

- **Phase 1**: `docs/recruiter-proposal-flow-design.md`
- **Phase 2**: `docs/phase2-notification-implementation.md`
- **Phase 3 Components**: `docs/phase3-frontend-components.md`
- **Phase 3 Summary**: `docs/phase3-completion-summary.md`
- **Complete Feature**: `docs/recruiter-proposal-feature-complete.md`

---

## 🚀 Quick Start Checklist

### For Testing Phase 3
- [ ] Ensure backend services are running (Phase 2)
- [ ] Verify database migrations applied
- [ ] Check RabbitMQ is running (for events)
- [ ] Confirm Resend API key configured
- [ ] Load `/opportunities` as candidate user
- [ ] Load `/proposed-jobs` as recruiter user
- [ ] Test accept/decline flow
- [ ] Test propose job flow
- [ ] Verify emails sent to Resend
- [ ] Check countdown timers are accurate

### For Deploying to Production
- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] API endpoints verified working
- [ ] Email templates look good
- [ ] Mobile design verified
- [ ] Auth token handling secure
- [ ] Error messages user-friendly
- [ ] Loading states showing
- [ ] No hardcoded URLs or secrets
- [ ] Documentation up to date

---

**Last Updated**: December 14, 2024  
**Phase**: 3 (Frontend Complete)  
**Status**: ✅ Ready for Testing
