# Phase 2: Notification Templates for Recruiter Submission Flow

**Status**: Ready to Start  
**Priority**: High  
**Dependencies**: Phase 1 (Backend) - ✅ Complete

---

## Overview

This phase implements three email notification templates for the recruiter submission flow events. These templates will be consumed by the notification-service, which listens to RabbitMQ events published by the ATS service.

---

## Notification Templates to Create

### 1. New Job Opportunity from [Recruiter]

**Event**: `application.recruiter_proposed`

**Recipient**: Candidate

**Trigger**: When recruiter sends job opportunity

**Purpose**: Alert candidate to new job opportunity, request approval/decline decision

**Email Content Structure**:

```
Subject: New Job Opportunity from [Recruiter Name]

Header:
- "New Job Opportunity"
- Recruiter name and role

Body:
- Greeting: "Hi [Candidate Name],"
- Opening: "[Recruiter Name] has found a great opportunity for you"
- Job Details:
  - Job Title (bold)
  - Company (bold)
  - Location
  - Salary range (if available)
- Recruiter Pitch: (if provided)
  "[Recruiter's message about why they think this is a good fit]"
- What's Next:
  "If you're interested, simply approve the opportunity and complete your application.
   If this isn't a good fit, you can decline and [Recruiter Name] will respect your decision."

Call to Action (two buttons):
- [Green] "View Opportunity"
  Links to: /opportunities/pending or /opportunities/:applicationId
- [Gray] "Decline"
  Opens decline modal or links to decline endpoint

Footer:
- About the opportunity
- Recruiter contact info (if available)
- Unsubscribe option
```

**Data Needed**:
```typescript
interface RecruiterProposedData {
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  recruiter_id: string;
  recruiter_name: string;
  recruiter_email?: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  recruiter_pitch?: string;
  application_id: string; // For creating response links
}
```

**Template File Location**:
`services/notification-service/src/emails/recruiter-submission/new-opportunity.ts`

---

### 2. [Candidate] Interested in [Job]

**Event**: `application.candidate_approved`

**Recipient**: Recruiter

**Trigger**: When candidate approves job opportunity

**Purpose**: Alert recruiter that candidate is interested, ready to complete application

**Email Content Structure**:

```
Subject: [Candidate Name] is interested in [Job Title]

Header:
- "Candidate Approved Your Opportunity"
- Success/green indicator

Body:
- Greeting: "Hi [Recruiter Name],"
- Main message: "[Candidate Name] is interested in the [Job Title] position at [Company]
               They've approved the opportunity and will now complete their application."
- Candidate Details:
  - Name
  - Email
  - LinkedIn Profile (if available)
  - Current Title (if available)
- Next Steps:
  1. "Candidate will submit their application with resume and pre-screen answers"
  2. "You'll receive a notification when they submit"
  3. "Review the application and decide next steps (screen, submit to company, etc.)"

Call to Action (one button):
- [Blue] "View Candidate Profile"
  Links to: /candidates/:candidateId

Footer:
- Timeline: "Candidate has [X hours] to complete their application"
- Quick tips for reviewing applications
```

**Data Needed**:
```typescript
interface CandidateApprovedData {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_linkedin_url?: string;
  candidate_current_title?: string;
  recruiter_id: string;
  recruiter_name: string;
  recruiter_email: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
}
```

**Template File Location**:
`services/notification-service/src/emails/recruiter-submission/candidate-approved.ts`

---

### 3. [Candidate] Declined [Job]

**Event**: `application.candidate_declined`

**Recipient**: Recruiter

**Trigger**: When candidate declines job opportunity

**Purpose**: Alert recruiter that candidate declined, include reason if provided

**Email Content Structure**:

```
Subject: [Candidate Name] declined [Job Title]

Header:
- "Candidate Declined Opportunity"
- Neutral/gray indicator

Body:
- Greeting: "Hi [Recruiter Name],"
- Main message: "[Candidate Name] has declined the [Job Title] opportunity at [Company]."
- Decline Reason (if provided):
  Reason: [Display decline_reason code as human-readable text]
  Notes: [Show decline_notes if provided]
  Example: "Reason: Not interested in this role right now"
           "Additional notes: Looking for remote opportunities only"

- Relationship Status:
  "This doesn't affect your relationship with [Candidate Name]. You can send them
   other opportunities in the future, and they can change their mind at any time."

- Next Steps:
  "Feel free to reach out to discuss, or move on to other candidates."

Call to Action (optional):
- [Gray] "View Other Candidates"
  Links to: /candidates

Footer:
- Encouragement: "Every decline brings you closer to the right fit!"
- Tips for following up with candidates
```

**Data Needed**:
```typescript
interface CandidateDeclinedData {
  application_id: string;
  candidate_id: string;
  candidate_name: string;
  candidate_email: string;
  recruiter_id: string;
  recruiter_name: string;
  recruiter_email: string;
  job_id: string;
  job_title: string;
  company_id: string;
  company_name: string;
  decline_reason?: string; // e.g., "not_interested", "salary_mismatch", etc.
  decline_notes?: string; // Free-form text from candidate
}
```

**Template File Location**:
`services/notification-service/src/emails/recruiter-submission/candidate-declined.ts`

---

## Implementation Details

### Email Template System

The notification-service uses a template system based on:
- **Email Builder Library**: Likely using something like `mjml` or custom HTML builder
- **Data Binding**: Templates receive typed data objects and render values
- **HTML Output**: Templates return complete HTML email content

### Event Listening Setup

Each event needs a listener in notification-service that:
1. Consumes event from RabbitMQ
2. Extracts data from event payload
3. Calls template function with data
4. Sends email via Resend

**Pattern** (example):
```typescript
// In notification-service/src/domain-consumer.ts or similar
eventBus.subscribe('application.recruiter_proposed', async (event) => {
  const data: RecruiterProposedData = {
    candidate_id: event.payload.candidate_id,
    candidate_name: event.payload.candidate_name,
    // ... map other fields
  };
  
  const html = recruiterProposedEmail(data);
  await resend.emails.send({
    from: 'opportunities@splits.network',
    to: event.payload.candidate_email,
    subject: `New Job Opportunity from ${data.recruiter_name}`,
    html
  });
});
```

---

## Implementation Steps

### Step 1: Create Template Files (3 files)

1. **File**: `services/notification-service/src/emails/recruiter-submission/new-opportunity.ts`
   - Export function: `recruiterProposedEmail(data: RecruiterProposedData): string`
   - Return: HTML string
   
2. **File**: `services/notification-service/src/emails/recruiter-submission/candidate-approved.ts`
   - Export function: `candidateApprovedEmail(data: CandidateApprovedData): string`
   - Return: HTML string
   
3. **File**: `services/notification-service/src/emails/recruiter-submission/candidate-declined.ts`
   - Export function: `candidateDeclinedEmail(data: CandidateDeclinedData): string`
   - Return: HTML string

### Step 2: Export from Index

**File**: `services/notification-service/src/emails/recruiter-submission/index.ts`
```typescript
export { recruiterProposedEmail, type RecruiterProposedData };
export { candidateApprovedEmail, type CandidateApprovedData };
export { candidateDeclinedEmail, type CandidateDeclinedData };
```

### Step 3: Create Event Listeners

**File**: `services/notification-service/src/domain-consumer.ts`

Add three event listeners:
- `'application.recruiter_proposed'` → send recruiter proposed email
- `'application.candidate_approved'` → send candidate approved email
- `'application.candidate_declined'` → send candidate declined email

Each listener should:
1. Extract and validate required fields from event payload
2. Call corresponding email template function
3. Send email via Resend SDK
4. Log success/failure
5. Handle errors gracefully

### Step 4: Test Email Delivery

1. Create test events matching event payload structure
2. Verify emails render correctly
3. Check all links are correct
4. Verify personalization (names, emails, etc.)

---

## Design Notes

### Styling & Branding
- Use consistent email styling from existing templates
- Include Splits Network branding/logo
- Use brand colors for CTAs
- Responsive design (mobile-friendly)

### Links in Templates
- "View Opportunity" → candidate portal `/opportunities/:applicationId`
- "Decline" → candidate portal `/opportunities/:applicationId/decline`
- "View Candidate Profile" → recruiter portal `/candidates/:candidateId`
- "View Other Candidates" → recruiter portal `/candidates`

### Email Addresses
- From: `opportunities@splits.network` (or adjust based on existing setup)
- Reply-To: Recruiter email (optional, for recruiter-proposed and candidate-declined)

### Personalization
- Use candidate/recruiter names in greeting and body
- Show recruiter pitch exactly as provided
- Display decline reason with human-readable mapping

---

## Testing Checklist

- [ ] All three templates render valid HTML
- [ ] Personalization works (names, emails, company, job)
- [ ] Links are correctly formatted
- [ ] Email looks good on mobile (responsive)
- [ ] Images/logos load correctly
- [ ] Event listeners consume events correctly
- [ ] Emails sent via Resend successfully
- [ ] No errors in notification-service logs
- [ ] Emails appear in test inbox within 2 minutes

---

## Success Criteria

✅ All three email templates created and working  
✅ Event listeners receiving and processing events  
✅ Emails sending successfully to candidates and recruiters  
✅ Email content matches specifications  
✅ Links are functional and lead to correct pages  
✅ No errors or warnings in logs  

---

## Timeline Estimate

- Template creation: 2-3 hours
- Event listener setup: 1-2 hours
- Testing: 1-2 hours
- **Total**: 4-7 hours

---

## Next Steps After Phase 2

Once notifications are working:
1. Phase 3: Build candidate portal UI for pending opportunities
2. Phase 4: Build recruiter portal UI for proposal dashboard
3. Phase 5: Update documentation and final testing
