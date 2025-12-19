# Event System - Candidate Application Workflow

**Document:** 04 - Event System  
**Created:** December 19, 2025

---

## Overview

Event definitions, notification triggers, and message flows for the candidate application workflow using RabbitMQ and Resend.

---

## 1. Event Definitions

### 1.1 Application Events

#### `application.submitted_to_recruiter`

**Published by:** ATS Service  
**When:** Candidate submits application and has active recruiter

**Payload:**
```typescript
{
  application_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  has_recruiter: true;
  timestamp: string;  // ISO 8601
}
```

**Consumers:**
- Notification Service → Email to recruiter

---

#### `application.submitted_to_company`

**Published by:** ATS Service  
**When:** Candidate submits without recruiter OR recruiter submits to company

**Payload:**
```typescript
{
  application_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string | null;
  timestamp: string;
}
```

**Consumers:**
- Notification Service → Email to company hiring managers

---

#### `application.withdrawn`

**Published by:** ATS Service  
**When:** Candidate withdraws application

**Payload:**
```typescript
{
  application_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string | null;
  reason?: string;
  timestamp: string;
}
```

**Consumers:**
- Notification Service → Email to recruiter (if applicable) and company

---

#### `application.changes_requested`

**Published by:** ATS Service  
**When:** Recruiter requests changes from candidate

**Payload:**
```typescript
{
  application_id: string;
  job_id: string;
  candidate_id: string;
  recruiter_id: string;
  requested_changes: string;
  timestamp: string;
}
```

**Consumers:**
- Notification Service → Email to candidate

---

### 1.2 Pre-Screen Events

#### `prescreen.requested`

**Published by:** ATS Service  
**When:** Company requests pre-screen for non-represented candidate

**Payload:**
```typescript
{
  application_id: string;
  candidate_id: string;
  recruiter_id: string;
  company_id: string;
  job_id: string;
  invitation_token: string;
  timestamp: string;
}
```

**Consumers:**
- Notification Service → Email to candidate (invitation to work with recruiter)
- Notification Service → Email to recruiter (new opportunity)

---

### 1.3 Draft Save Events

> **Note:** Draft saves are tracked via `application_audit_log` with action='draft_saved'. No RabbitMQ events needed for drafts.

---

## 2. Notification Templates

### 2.1 Candidate Notifications

#### Application Submitted (No Recruiter)

**Template:** `candidate-application-submitted-direct`

**Subject:** `Your Application to {{job_title}} at {{company_name}}`

**Body:**
```
Hi {{candidate_name}},

Your application to {{job_title}} at {{company_name}} has been successfully submitted!

The hiring team will review your application and reach out if they'd like to move forward.

Application Details:
- Position: {{job_title}}
- Company: {{company_name}}
- Location: {{job_location}}
- Submitted: {{submitted_at}}

Documents Submitted:
{{#each documents}}
- {{name}} ({{type}})
{{/each}}

You can track your application status at:
{{application_url}}

Good luck!

The Splits Network Team
```

---

#### Application Submitted (Has Recruiter)

**Template:** `candidate-application-submitted-to-recruiter`

**Subject:** `Your Application to {{job_title}} - Sent to Your Recruiter`

**Body:**
```
Hi {{candidate_name}},

Your application to {{job_title}} at {{company_name}} has been sent to your recruiter {{recruiter_name}} for review!

{{recruiter_name}} will review your application, may enhance it with additional context, and then submit it to the company on your behalf.

Next Steps:
- Your recruiter will review within 24-48 hours
- They may reach out if they need any clarifications
- Once approved, they'll submit to {{company_name}}

Track your application: {{application_url}}

Questions? Reply to this email or contact your recruiter at {{recruiter_email}}.

Best regards,
The Splits Network Team
```

---

#### Changes Requested by Recruiter

**Template:** `candidate-application-changes-requested`

**Subject:** `Action Required: Updates Needed for {{job_title}} Application`

**Body:**
```
Hi {{candidate_name}},

Your recruiter {{recruiter_name}} has reviewed your application to {{job_title}} at {{company_name}} and is requesting some changes before submission.

Requested Changes:
{{requested_changes}}

Please update your application as soon as possible to move forward.

Update your application: {{application_url}}

Best regards,
The Splits Network Team
```

---

#### Pre-Screen Invitation

**Template:** `candidate-prescreen-invitation`

**Subject:** `{{company_name}} Requests Recruiter Support for Your Application`

**Body:**
```
Hi {{candidate_name}},

Great news! {{company_name}} is interested in your application for {{job_title}} and has requested a recruiter pre-screen to help move your application forward.

We've matched you with {{recruiter_name}}, a specialized recruiter who can enhance your application and represent you throughout the hiring process.

Benefits of Working with a Recruiter:
✓ Professional representation to the company
✓ Application enhancement and optimization
✓ Interview preparation and coaching
✓ Salary negotiation support
✓ This service is completely FREE for you

Accept this opportunity: {{invitation_url}}

This invitation expires in 7 days.

Questions? Reply to this email.

Best regards,
The Splits Network Team
```

---

### 2.2 Recruiter Notifications

#### New Candidate Application

**Template:** `recruiter-candidate-application-received`

**Subject:** `New Application from {{candidate_name}} for {{job_title}}`

**Body:**
```
Hi {{recruiter_name}},

{{candidate_name}} has applied to {{job_title}} at {{company_name}} and the application has been routed to you for review.

Candidate Details:
- Name: {{candidate_name}}
- Email: {{candidate_email}}
- Current Role: {{candidate_current_title}} at {{candidate_current_company}}

Job Details:
- Position: {{job_title}}
- Company: {{company_name}}
- Location: {{job_location}}
- Salary Range: {{salary_range}}

Application Includes:
{{#each documents}}
- {{name}} ({{type}})
{{/each}}

Next Steps:
1. Review the candidate's application and documents
2. Enhance with your insights and pitch
3. Submit to {{company_name}}

Review Application: {{application_url}}

This candidate is counting on your expertise!

Best regards,
The Splits Network Team
```

---

#### Pre-Screen Opportunity

**Template:** `recruiter-prescreen-opportunity`

**Subject:** `New Pre-Screen Opportunity: {{job_title}} at {{company_name}}`

**Body:**
```
Hi {{recruiter_name}},

{{company_name}} has requested a recruiter pre-screen for a candidate who applied to {{job_title}}.

This is a great opportunity to:
- Work with an interested candidate
- Represent them to {{company_name}}
- Earn placement fees if successful

Candidate: {{candidate_name}}
Position: {{job_title}}
Company: {{company_name}}
Fee: {{fee_percentage}}%

The candidate will receive an invitation to work with you. Once they accept, you can begin the pre-screen process.

View Details: {{opportunity_url}}

Best regards,
The Splits Network Team
```

---

### 2.3 Company Notifications

#### New Application Received

**Template:** `company-application-received`

**Subject:** `New Candidate for {{job_title}}: {{candidate_name}}`

**Body:**
```
Hi {{hiring_manager_name}},

A new candidate has applied to {{job_title}}:

Candidate: {{candidate_name}}
{{#if recruiter_name}}
Recruiter: {{recruiter_name}}
{{/if}}
Applied: {{submitted_at}}

{{#if recruiter_name}}
This candidate is represented by {{recruiter_name}}, who has pre-screened and endorsed them for this role.
{{else}}
This candidate applied directly through Applicant Network.
{{/if}}

Quick Actions:
- Review Application: {{application_url}}
- View Resume: {{resume_url}}
{{#unless recruiter_name}}
- Request Recruiter Pre-Screen: {{request_prescreen_url}}
{{/unless}}

Login to your dashboard to review all details and take action:
{{dashboard_url}}

Best regards,
Splits Network
```

---

## 3. Event Handlers

### 3.1 Notification Service Event Consumers

**File:** `services/notification-service/src/consumers/applications/consumer.ts`

```typescript
export class ApplicationEventConsumer {
  constructor(
    private notificationService: NotificationService,
    private resendClient: ResendClient
  ) {}

  async handleApplicationSubmittedToRecruiter(event: ApplicationEvent) {
    const { application_id, recruiter_id, candidate_id } = event;
    
    // Get application details
    const application = await this.atsClient.getApplication(application_id);
    const recruiter = await this.identityClient.getUser(recruiter_id);
    const candidate = await this.atsClient.getCandidate(candidate_id);
    const job = await this.atsClient.getJob(application.job_id);
    
    // Send email to recruiter
    await this.resendClient.sendEmail({
      to: recruiter.email,
      from: 'notifications@applicant.network',
      subject: `New Application from ${candidate.full_name} for ${job.title}`,
      template: 'recruiter-candidate-application-received',
      data: {
        recruiter_name: recruiter.name,
        candidate_name: candidate.full_name,
        candidate_email: candidate.email,
        candidate_current_title: candidate.current_title,
        candidate_current_company: candidate.current_company,
        job_title: job.title,
        company_name: job.company.name,
        job_location: job.location,
        salary_range: formatSalaryRange(job),
        documents: application.documents,
        application_url: `https://portal.splits.network/applications/${application_id}`,
      },
    });

    // Send confirmation to candidate
    await this.resendClient.sendEmail({
      to: candidate.email,
      from: 'notifications@applicant.network',
      subject: `Your Application to ${job.title} - Sent to Your Recruiter`,
      template: 'candidate-application-submitted-to-recruiter',
      data: {
        candidate_name: candidate.full_name,
        job_title: job.title,
        company_name: job.company.name,
        recruiter_name: recruiter.name,
        recruiter_email: recruiter.email,
        application_url: `https://applicant.network/applications/${application_id}`,
      },
    });
  }

  async handleApplicationSubmittedToCompany(event: ApplicationEvent) {
    // Similar implementation for company notification
  }

  async handlePreScreenRequested(event: PreScreenEvent) {
    // Send invitations to both candidate and recruiter
  }

  async handleApplicationWithdrawn(event: ApplicationEvent) {
    // Notify recruiter and company
  }
}
```

---

## 4. RabbitMQ Configuration

### 4.1 Exchange Configuration

```typescript
const EXCHANGES = {
  applications: {
    name: 'splits.applications',
    type: 'topic',
    durable: true,
  },
};
```

### 4.2 Queue Configuration

```typescript
const QUEUES = {
  'notifications.applications': {
    exchange: 'splits.applications',
    routingKeys: [
      'application.submitted_to_recruiter',
      'application.submitted_to_company',
      'application.withdrawn',
      'application.changes_requested',
      'prescreen.requested',
    ],
    durable: true,
    prefetch: 10,
  },
};
```

---

## 5. Notification Preferences

### 5.1 User Preferences Table (Optional Enhancement)

```sql
CREATE TABLE IF NOT EXISTS identity.notification_preferences (
  user_id UUID PRIMARY KEY REFERENCES identity.users(id),
  email_applications BOOLEAN DEFAULT true,
  email_application_updates BOOLEAN DEFAULT true,
  email_prescreen_invitations BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 6. Next Steps

1. Implement event consumers in notification-service
2. Create email templates in Resend
3. Test event flows end-to-end
4. Proceed to [UI Components](./05-ui-components.md)

---

**Status:** ✅ Ready for Implementation  
**Next:** [UI Components](./05-ui-components.md)
