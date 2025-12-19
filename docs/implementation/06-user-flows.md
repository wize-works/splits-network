# User Flows - Candidate Application Workflow

**Document:** 06 - User Flows  
**Created:** December 19, 2025

---

## Overview

Detailed step-by-step user experience flows for all actors in the application system.

---

## Flow 1: Candidate Applies Directly (No Recruiter)

**Actor:** Candidate  
**Entry Point:** Job listing page → "Apply" button  
**Outcome:** Application submitted to company for pre-screening request

---

### Steps

1. **Browse Jobs**
   - Candidate views job listing on `/jobs`
   - Sees job title, company, location, salary range
   - Clicks "Apply Now" button

2. **Application Wizard - Documents**
   - System checks: Has candidate already applied? → Redirect to applications list with duplicate warning
   - System loads candidate's existing documents from document service
   - Candidate sees three sections:
     - **Resumes** (Required): List of uploaded resumes with checkboxes
     - **Cover Letters** (Optional): List of cover letters
     - **Portfolio** (Optional): List of additional documents
   - If no resumes exist:
     - Show upload prompt with drag-and-drop or file picker
     - Auto-detect document type based on content/filename
   - Candidate selects at least one resume
   - Candidate marks one resume as "Primary"
   - Optional: Select cover letter and portfolio items
   - Click "Continue" → Saved as draft, proceeds to Step 2

3. **Application Wizard - Questions** (if job has pre-screen questions)
   - System loads pre-screen questions for this job
   - For each question, display:
     - Question text
     - Required indicator (red asterisk)
     - Input type: text area, yes/no radio, dropdown, or multi-select
   - Candidate answers required questions
   - Click "Continue" → Saved as draft, proceeds to Step 3

4. **Application Wizard - Review**
   - System displays summary card showing:
     - Job title & company
     - Selected documents (with primary resume highlighted)
     - Pre-screen question answers
   - Candidate can click "Back" to edit
   - Candidate clicks "Submit Application"
   - System validates:
     - At least one resume selected
     - Primary resume set
     - All required questions answered
   - If valid:
     - POST /api/applications/submit
     - Application stage: `submitted` (to company)
     - Event emitted: `application.submitted_to_company`

5. **Confirmation**
   - Redirect to `/applications?success=true`
   - Show success alert: "Application submitted! [Company] will review and may request a recruiter to pre-screen."
   - Application appears in candidate's applications list with stage badge

---

### System Behavior (No Recruiter Path)

- **Application Record:**
  - `recruiter_id`: NULL
  - `stage`: 'applied'
  - `accepted_by_company`: false
  - Audit log entry created with `action='submitted_to_company'`

- **Notifications:**
  - Email to company: "New application from [Candidate] for [Job Title]"
  - Email to candidate: "Application submitted to [Company]"

- **Next Actions:**
  - Company can request pre-screen from random recruiter
  - Company can reject directly
  - Company can accept and schedule interview

---

## Flow 2: Candidate Applies with Recruiter

**Actor:** Candidate  
**Entry Point:** Job listing page → "Apply" button  
**Prerequisite:** Candidate has active recruiter relationship in `network.recruiter_candidates`

---

### Steps

1-3. **Same as Flow 1** (Browse, Documents, Questions, Review)

4. **Submit to Recruiter**
   - Candidate clicks "Submit Application"
   - System checks:
     - Is there an active recruiter relationship? (`network.recruiter_candidates` with valid dates)
     - Yes → Application routed to recruiter for review
   - Application stage: `screen` (pending recruiter review)
   - Event emitted: `application.submitted_to_recruiter`

5. **Awaiting Recruiter Review**
   - Redirect to `/applications?pending=true`
   - Show info alert: "Application sent to [Recruiter Name] for review before submission to [Company]"
   - Application stage badge: "Pending Recruiter Review"

---

### System Behavior (Recruiter Path)

- **Application Record:**
  - `recruiter_id`: Set to candidate's recruiter ID
  - `stage`: 'screen' (pending recruiter review)
  - `accepted_by_company`: false
  - `created_at`: timestamp
  - **Temporal tracking:** Audit log entry with action='submitted_to_recruiter'

- **Notifications:**
  - Email to recruiter: "New application from [Candidate] for [Job] requires your review"
  - Email to candidate: "Application sent to [Recruiter] for review"

- **Next Actions:**
  - Recruiter reviews and approves → Flow 3
  - Recruiter requests changes → Flow 4
  - Recruiter declines → Flow 5

---

## Flow 3: Recruiter Reviews and Approves

**Actor:** Recruiter  
**Entry Point:** Email notification → "Review Application" link → `/applications/[id]/review`

---

### Steps

1. **Notification Email**
   - Subject: "Action Required: Review application from [Candidate]"
   - Body: Candidate name, job title, company, "Review Application" CTA button
   - Click → Opens portal at `/applications/[id]/review`

2. **Application Review Page**
   - Displays:
     - Job details (title, company, description)
     - Candidate profile summary
     - **Documents section:**
       - Primary resume (view/download)
       - Additional documents
     - **Pre-screen answers section:**
       - All questions and candidate's answers
     - **Recruiter notes section:**
       - Text area to add pitch, insights, endorsements

3. **Add Recruiter Notes**
   - Recruiter types insights: "I've worked with Sarah for 6 months. She's a strong fit for this role because..."
   - Notes will be visible to company

4. **Approve and Submit**
   - Recruiter clicks "Approve & Submit to Company"
   - System validates notes field (optional but recommended)
   - POST /api/applications/:id/recruiter-submit
   - Application stage changes: `screen` → `submitted` (to company)
   - Event emitted: `application.submitted_to_company` (with recruiter context)

5. **Confirmation**
   - Success toast: "Application submitted to [Company]"
   - Redirect to `/applications` with filter showing submitted applications
   - Application now in "Active Submissions" list

---

### System Behavior

- **Application Record Updated:**
  - `stage`: 'submitted' (moved from 'screen' to 'submitted')
  - `accepted_by_company`: false
  - `recruiter_notes`: Added to application
  - **Temporal tracking:** Audit log entries with actions='recruiter_reviewed' and 'submitted_to_company'

- **Notifications:**
  - Email to company: "New pre-screened application from [Candidate] via [Recruiter]"
  - Email to candidate: "[Recruiter] has submitted your application to [Company]"

- **Network Records:**
  - `network.candidate_role_assignments` created:
    - Links recruiter to candidate for this specific job
    - Used for fee tracking when placement occurs

---

## Flow 4: Recruiter Requests Changes

**Actor:** Recruiter  
**Trigger:** Finds issues with candidate's application

---

### Steps

1. **Review Application** (same as Flow 3 steps 1-2)

2. **Request Changes**
   - Recruiter clicks "Request Changes" button
   - Modal prompts: "What changes would you like [Candidate] to make?"
   - Recruiter types feedback: "Please add a cover letter explaining your interest in fintech"
   - Click "Send Request"

3. **System Updates**
   - POST /api/applications/:id/request-changes
   - Application stays at stage: `screen` (still pending recruiter review)
   - Add internal note with requested changes
   - Event emitted: `application.changes_requested`

4. **Candidate Notification**
   - Email to candidate: "[Recruiter] has requested changes to your application"
   - Email includes recruiter's feedback
   - CTA: "Update Application"

5. **Candidate Updates**
   - Candidate clicks link → Opens `/applications/[id]/edit`
   - Pre-populated with existing data
   - Candidate makes requested changes
   - Re-submit → Stage remains `screen` (pending recruiter review)
   - Recruiter notified of resubmission

---

## Flow 5: Company Requests Pre-Screen for Unrepresented Candidate

**Actor:** Company Admin  
**Trigger:** Received direct application (no recruiter)  
**Entry Point:** Portal → `/companies/[id]/applications`

---

### Steps

1. **View Direct Applications**
   - Company admin views applications list
   - Filters by "Needs Pre-Screen" (applications with no recruiter)
   - Sees candidate application card

2. **Review Application**
   - Click application → View candidate's resume and pre-screen answers
   - Decides candidate is promising but wants recruiter validation

3. **Request Pre-Screen**
   - Click "Request Pre-Screen" button
   - Modal: "Select a recruiter or let the system auto-assign"
   - Options:
     - "Auto-assign available recruiter" (recommended)
     - Manual dropdown of approved recruiters
   - Add optional message to recruiter
   - Click "Send Request"

4. **System Assigns Recruiter**
   - POST /api/applications/:id/request-prescreen
   - System logic:
     - If manual selection → Use selected recruiter
     - If auto-assign → Query active recruiters, round-robin or random selection
   - Application updated:
     - `recruiter_id`: Set to assigned recruiter
     - `stage`: 'screen' (now pending recruiter review)
     - Audit log entry created with `action='prescreen_requested'`
   - Event emitted: `prescreen.requested`

5. **Recruiter Notified**
   - Email to recruiter: "[Company] requests you pre-screen [Candidate] for [Job]"
   - Recruiter accepts or declines
   - If accepts: Reviews candidate, submits endorsement or feedback
   - If declines: System notifies company, can request another recruiter

---

## Flow 6: Application Tracking (All Actors)

### Candidate View (`/applications`)

**Statuses:**
- **Draft**: Incomplete application saved
- **Pending Recruiter Review**: Submitted to recruiter, awaiting approval
- **Submitted**: Submitted to company (with or without recruiter)
- **Under Review**: Company is reviewing
- **Interview Scheduled**: Company invited to interview
- **Rejected**: Company declined
- **Placed**: Candidate accepted offer

**Actions:**
- **Draft**: Click "Continue Application" → Resume wizard
- **Pending**: View status, no action required
- **Submitted**: View details, withdraw if desired
- **Interview**: View interview details
- **Placed**: View placement details

---

### Recruiter View (`/applications`)

**Tabs:**
- **Needs Review**: Applications awaiting recruiter approval
- **Submitted**: Applications recruiter has submitted to companies
- **Active**: Applications in company review/interview
- **Closed**: Placed or rejected

**Actions:**
- **Needs Review**: Click "Review" → Approve/Request Changes/Decline
- **Submitted**: View status, monitor progress
- **Active**: View status, support candidate
- **Closed**: View outcome

---

### Company View (`/companies/[id]/applications`)

**Tabs:**
- **New**: Unreviewed applications
- **Needs Pre-Screen**: Direct applications without recruiter
- **Reviewing**: Applications under evaluation
- **Interviewing**: Candidates in interview process
- **Offers**: Offers extended
- **Closed**: Hired or rejected

**Actions:**
- **New**: Review → Request Pre-Screen / Schedule Interview / Reject
- **Needs Pre-Screen**: Request recruiter review
- **Reviewing**: Schedule interview or reject
- **Interviewing**: Update status, make offer
- **Offers**: View acceptance status

---

## Flow 7: Draft Management (Auto-Save)

**Actor:** Candidate  
**Trigger:** Partial application completion

---

### Behavior

1. **Auto-Save on Navigation**
   - When candidate clicks "Continue" between wizard steps
   - System saves current form state to `ats.applications` with `stage='draft'`
   - Audit log entry: action='draft_saved' with metadata
   - No loading spinner, happens in background

2. **Resume Draft**
   - Candidate navigates to `/jobs`
   - Draft still saved
   - Returns to `/jobs/[id]/apply` → Wizard pre-populated from draft

3. **Draft Expiration**
   - Drafts older than 30 days are deleted automatically
   - System shows warning if draft is >7 days old: "This draft is from [date]. Would you like to continue or start fresh?"

4. **Delete Draft**
   - After successful submission, draft is deleted
   - If candidate manually withdraws/cancels, prompt: "Delete draft?"

---

## Flow 8: Error Handling

### Duplicate Application

**Scenario:** Candidate tries to apply for job they already applied to

**Flow:**
1. Candidate clicks "Apply"
2. System checks existing applications for candidate + job
3. If exists: Redirect to `/applications?duplicate=true&job=[id]`
4. Show error alert: "You have already applied to this position on [date]. View your application status below."

---

### Missing Primary Resume

**Scenario:** Candidate tries to proceed without setting primary resume

**Flow:**
1. Candidate selects multiple resumes but doesn't mark one as primary
2. Clicks "Continue"
3. Inline error below resume list: "Please select which resume is your primary resume for this application."
4. Button stays disabled

---

### Session Timeout

**Scenario:** Candidate idle for >30 minutes during application

**Flow:**
1. Candidate returns and clicks "Continue"
2. Clerk session expired
3. Redirect to `/sign-in?redirect=/jobs/[id]/apply`
4. After sign-in: Draft is loaded, candidate can resume

---

## Next Steps

1. Create wireframes based on these flows
2. Validate flows with stakeholders
3. Implement UI components from [05-ui-components.md](./05-ui-components.md)
4. Proceed to [Implementation Phases](./07-implementation-phases.md)

---

**Status:** ✅ Ready for Design & Implementation  
**Next:** [Implementation Phases](./07-implementation-phases.md)
