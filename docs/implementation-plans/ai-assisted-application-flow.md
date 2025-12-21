# AI-Assisted Application Flow - Implementation Plan

**Document:** AI-Assisted Application Screening Implementation  
**Created:** December 21, 2025  
**Status:** Implementation Plan - Phase 1.5  
**Priority:** High - Core Platform Intelligence  
**Target:** Q1 2026

---

## Executive Summary

This document outlines the implementation of AI-assisted candidate screening that evaluates candidate-job fit automatically after application submission. The AI provides ratings and feedback to both candidates and recruiters, streamlining the application review process while maintaining human oversight.

**Key Features:**
- ✅ Automatic AI evaluation of all applications
- ✅ Advisory (non-blocking) fit scores and feedback
- ✅ Notifications to candidates and recruiters with AI insights
- ✅ Different flows for direct vs represented candidates
- ✅ Future: Company-paid blocking/gatekeeper mode

---

## Updated Application Stage Flow

### Stage Definitions

| Stage | Description | Who Controls? |
|-------|-------------|---------------|
| `draft` | Application not yet complete | Candidate/Recruiter |
| `ai_review` | AI evaluates candidate-job fit, generates rating and feedback | System (automatic) |
| `screen` | Initial phone screen by Splits recruiter network | Recruiter (represented only) |
| `submitted` | Submitted to company, awaiting company review | System/Recruiter |
| `interview` | Formal interviews with company recruiter/HR (multiple rounds) | Company |
| `offer` | Offer extended to candidate | Company |
| `hired` | Candidate accepted offer and started | Company |
| `rejected` | Application rejected (by recruiter, AI, or company) | Recruiter/Company |
| `withdrawn` | Candidate withdrew application | Candidate |

**Note:** The `recruiter_review` stage has been **removed**. AI insights inform the recruiter's screen decision instead.

---

## Application Flows

### Represented Candidate Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ REPRESENTED CANDIDATE APPLICATION FLOW                           │
└──────────────────────────────────────────────────────────────────┘

1. Recruiter creates draft application
        ↓
2. draft → ai_review (automatic on completion)
        ↓
3. AI analyzes:
   - Resume vs job description match
   - Skills alignment
   - Experience level fit
   - Location compatibility
        ↓
4. AI generates:
   - Fit score (0-100)
   - Strengths (3-5 bullet points)
   - Concerns (0-3 bullet points)
   - Recommendation (Strong/Good/Fair/Poor fit)
        ↓
5. Notifications sent:
   - Recruiter: "AI reviewed [Candidate] for [Job]. Score: 85/100"
   - Candidate: "Your application for [Job] has been AI-screened"
        ↓
6. ai_review → screen (automatic, recruiter notified)
        ↓
7. Recruiter conducts phone screen
   - Reviews AI insights
   - Validates candidate interest
   - Assesses communication skills
   - Decides: Submit or Reject
        ↓
8a. screen → submitted (recruiter approves)
    - Goes to company
    - Company reviews application + AI insights
        ↓
9. submitted → interview (company interested)
        ↓
10. interview → offer → hired

8b. screen → rejected (recruiter declines)
    - Application ends
    - Candidate notified with recruiter feedback
```

**Key Points:**
- Recruiter sees AI insights BEFORE phone screen
- Recruiter makes final decision to submit to company
- AI insights help recruiter prepare for screen call
- Company sees AI analysis when application arrives

---

### Direct Candidate Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ DIRECT CANDIDATE APPLICATION FLOW                                │
└──────────────────────────────────────────────────────────────────┘

1. Candidate completes application (candidate portal)
        ↓
2. Candidate clicks "Submit Application"
        ↓
3. draft → ai_review (automatic on submission)
        ↓
4. AI analyzes (same as above)
   - Resume vs job description
   - Skills, experience, location
        ↓
5. AI generates insights
   - Fit score
   - Strengths and concerns
        ↓
6. Notification sent to candidate:
   "Your application has been submitted and AI-screened.
    Fit Score: 78/100. Company will review shortly."
        ↓
7. ai_review → submitted (automatic, skips screen)
   - No recruiter phone screen (direct application)
   - Goes straight to company
        ↓
8. submitted → interview (company interested)
        ↓
9. interview → offer → hired

OR

7b. ai_review → rejected (future: if company enables blocking mode)
    - Only if company pays for gatekeeper AI
    - Requires minimum score threshold
    - Candidate notified: "Your application did not meet minimum requirements"
```

**Key Points:**
- No recruiter screen for direct candidates
- AI review happens instantly (< 30 seconds)
- Candidate sees fit score immediately after submission
- Company sees AI analysis when reviewing application
- **Future:** Companies can pay to enable auto-rejection based on AI score

---

## AI Review Process

### Input Data

The AI will analyze:

1. **Candidate Data:**
   - Resume/CV text
   - Listed skills
   - Years of experience
   - Education history
   - Location
   - LinkedIn profile (if provided)

2. **Job Data:**
   - Job title
   - Job description
   - Required skills
   - Preferred skills
   - Experience requirements (min/max years)
   - Location (remote/hybrid/onsite)
   - Salary range

3. **Contextual Data:**
   - Application notes (if any)
   - Candidate's cover letter (if provided)

### AI Analysis Output

```typescript
interface AIReviewResult {
  application_id: string;
  fit_score: number; // 0-100
  recommendation: 'strong_fit' | 'good_fit' | 'fair_fit' | 'poor_fit';
  strengths: string[]; // 3-5 bullet points
  concerns: string[]; // 0-3 bullet points
  skills_match: {
    matched_skills: string[];
    missing_skills: string[];
    match_percentage: number;
  };
  experience_analysis: {
    required_years: number;
    candidate_years: number;
    meets_requirement: boolean;
  };
  location_compatibility: 'perfect' | 'good' | 'challenging' | 'mismatch';
  overall_summary: string; // 2-3 sentences
  confidence_level: number; // 0-100, how confident AI is in its analysis
  analyzed_at: Date;
  model_version: string; // e.g., "gpt-4-2024" or "claude-3.5"
}
```

### AI Review Modes

#### Mode 1: Advisory (Default, Phase 1)

- **Behavior:** AI provides insights but does NOT block applications
- **Use Case:** All applications by default
- **Who sees insights:**
  - Recruiters (before screen)
  - Companies (when reviewing applications)
  - Candidates (basic feedback after submission)
- **Cost:** Free (included in platform)

#### Mode 2: Gatekeeper (Future, Paid Feature)

- **Behavior:** AI can auto-reject applications below threshold
- **Requirements:**
  - Company must enable and configure
  - Company pays premium fee per job posting
  - Minimum score threshold set by company (e.g., 60/100)
- **Use Case:** High-volume jobs needing filtering
- **Who sees insights:**
  - Rejected candidates (basic feedback: "Did not meet requirements")
  - Company (can see what was auto-rejected)
- **Cost:** Paid add-on per job posting ($50-100/job)

**Implementation Timeline:**
- Mode 1 (Advisory): Phase 1.5 (Q1 2026)
- Mode 2 (Gatekeeper): Phase 3 (Q3 2026)

---

## Database Changes

### New Table: `ats.ai_reviews`

```sql
CREATE TABLE ats.ai_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES ats.applications(id) ON DELETE CASCADE,
    
    -- AI Analysis Results
    fit_score INTEGER NOT NULL CHECK (fit_score >= 0 AND fit_score <= 100),
    recommendation VARCHAR(50) NOT NULL CHECK (recommendation IN ('strong_fit', 'good_fit', 'fair_fit', 'poor_fit')),
    overall_summary TEXT NOT NULL,
    confidence_level INTEGER NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 100),
    
    -- Detailed Analysis
    strengths TEXT[] NOT NULL DEFAULT '{}',
    concerns TEXT[] NOT NULL DEFAULT '{}',
    matched_skills TEXT[] NOT NULL DEFAULT '{}',
    missing_skills TEXT[] NOT NULL DEFAULT '{}',
    skills_match_percentage INTEGER CHECK (skills_match_percentage >= 0 AND skills_match_percentage <= 100),
    
    -- Experience Analysis
    required_years INTEGER,
    candidate_years DECIMAL(4,1),
    meets_experience_requirement BOOLEAN,
    
    -- Location
    location_compatibility VARCHAR(50) CHECK (location_compatibility IN ('perfect', 'good', 'challenging', 'mismatch')),
    
    -- Metadata
    model_version VARCHAR(100) NOT NULL,
    processing_time_ms INTEGER, -- How long AI took
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Indexes
    UNIQUE(application_id)
);

CREATE INDEX idx_ai_reviews_application_id ON ats.ai_reviews(application_id);
CREATE INDEX idx_ai_reviews_fit_score ON ats.ai_reviews(fit_score);
CREATE INDEX idx_ai_reviews_recommendation ON ats.ai_reviews(recommendation);
CREATE INDEX idx_ai_reviews_analyzed_at ON ats.ai_reviews(analyzed_at);
```

### New Table: `ats.ai_review_config` (Future - Phase 3)

```sql
CREATE TABLE ats.ai_review_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES ats.jobs(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES ats.companies(id),
    
    -- Gatekeeper Settings
    mode VARCHAR(50) NOT NULL DEFAULT 'advisory' CHECK (mode IN ('advisory', 'gatekeeper')),
    minimum_score_threshold INTEGER CHECK (minimum_score_threshold >= 0 AND minimum_score_threshold <= 100),
    auto_reject_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Billing
    paid_feature_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    billing_subscription_id UUID, -- Link to billing service
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(job_id)
);
```

### Update: `ats.applications`

**Add column:**
```sql
ALTER TABLE ats.applications 
ADD COLUMN ai_reviewed BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_applications_ai_reviewed ON ats.applications(ai_reviewed);
```

### Update: `ApplicationStage` Type

**In `packages/shared-types/src/models.ts`:**

```typescript
export type ApplicationStage = 
  | 'draft'       // Application not yet complete
  | 'ai_review'   // AI evaluating candidate-job fit
  | 'screen'      // Initial phone screen (recruiter only, for represented)
  | 'submitted'   // Submitted to company, awaiting company review
  | 'interview'   // Formal interviews with company
  | 'offer'       // Offer extended
  | 'hired'       // Candidate accepted offer
  | 'rejected'    // Rejected by recruiter or company
  | 'withdrawn';  // Candidate withdrew
```

**Remove:** `'recruiter_review'` (no longer used)

---

## API Changes

### New Service: `services/ai-service` (or integration in `ats-service`)

**Decision:** Implement as part of `ats-service` initially, extract to separate service if needed later.

### New Endpoints

#### 1. **POST /api/applications/:id/ai-review** (Internal)

**Purpose:** Trigger AI review for an application

**Called by:** System (automatic after draft completion)

**Request:**
```json
{
  "application_id": "uuid"
}
```

**Response:**
```json
{
  "data": {
    "review_id": "uuid",
    "status": "processing", // or "completed"
    "estimated_completion_ms": 5000
  }
}
```

**Process:**
1. Fetch application + candidate + job data
2. Call AI service (OpenAI/Anthropic/custom)
3. Parse AI response
4. Save to `ats.ai_reviews`
5. Update application stage: `ai_review` → next stage
6. Trigger notifications

---

#### 2. **GET /api/applications/:id/ai-review**

**Purpose:** Retrieve AI review results for an application

**Auth:** Recruiter (if their candidate), Company (if their job), Admin

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "application_id": "uuid",
    "fit_score": 85,
    "recommendation": "strong_fit",
    "overall_summary": "Excellent match with 8 years React experience...",
    "confidence_level": 92,
    "strengths": [
      "Strong React and TypeScript skills matching job requirements",
      "8 years experience exceeds 5-year minimum",
      "Previous experience in SaaS companies",
      "Located in compatible timezone for remote work"
    ],
    "concerns": [
      "Limited AWS experience (job prefers AWS)",
      "No GraphQL experience mentioned"
    ],
    "skills_match": {
      "matched_skills": ["React", "TypeScript", "Node.js", "PostgreSQL"],
      "missing_skills": ["AWS", "GraphQL"],
      "match_percentage": 80
    },
    "experience_analysis": {
      "required_years": 5,
      "candidate_years": 8,
      "meets_requirement": true
    },
    "location_compatibility": "perfect",
    "analyzed_at": "2025-12-21T10:30:00Z",
    "model_version": "gpt-4-turbo-2024"
  }
}
```

---

#### 3. **GET /api/jobs/:jobId/ai-review-stats**

**Purpose:** Aggregate AI review statistics for a job

**Auth:** Company, Admin

**Response:**
```json
{
  "data": {
    "job_id": "uuid",
    "total_applications": 50,
    "ai_reviewed_count": 48,
    "average_fit_score": 72,
    "recommendation_breakdown": {
      "strong_fit": 12,
      "good_fit": 20,
      "fair_fit": 10,
      "poor_fit": 6
    },
    "most_matched_skills": ["React", "TypeScript", "Node.js"],
    "most_missing_skills": ["AWS", "Docker", "Kubernetes"]
  }
}
```

---

### Updated Endpoints

#### **POST /api/applications** (Create Application)

**Update behavior:**
- After creating application with `stage: 'draft'`
- When recruiter/candidate marks complete
- Automatically trigger: `draft` → `ai_review`
- Enqueue AI review job

#### **PATCH /api/applications/:id/stage** (Update Stage)

**Add validation:**
- `draft` can only → `ai_review`
- `ai_review` can only → `screen` (represented) or `submitted` (direct)
- `screen` can only → `submitted` or `rejected`
- `submitted` can only → `interview` or `rejected`
- etc.

**Update ApplicationAuditLog:**
```typescript
{
  action: 'stage_changed',
  old_value: { stage: 'draft' },
  new_value: { stage: 'ai_review' },
  metadata: {
    trigger: 'automatic',
    reason: 'application_completed'
  }
}
```

---

## Notification Requirements

### Notification Events

#### 1. **AI Review Started**

**Trigger:** Application moves from `draft` to `ai_review`

**Recipients:**
- Candidate (if direct)
- Recruiter (if represented)

**Template:**

**To Candidate (Direct):**
```
Subject: Your application is being reviewed

Hi [Candidate Name],

Thank you for applying to [Job Title] at [Company Name].

Our AI is currently analyzing your application to evaluate your fit for this role. 
This typically takes less than 30 seconds.

You'll receive another notification once the review is complete.

- The Splits Network Team
```

**To Recruiter (Represented):**
```
Subject: AI reviewing [Candidate] for [Job]

Hi [Recruiter Name],

The application for [Candidate Name] to [Job Title] at [Company] is now being 
AI-reviewed. You'll be notified once the analysis is complete.

- Splits Network
```

---

#### 2. **AI Review Completed**

**Trigger:** AI analysis finishes, application moves to next stage

**Recipients:**
- Candidate (always)
- Recruiter (if represented)
- Company (if submitted to them)

**Template:**

**To Candidate (Direct):**
```
Subject: Your application has been reviewed

Hi [Candidate Name],

Great news! Your application for [Job Title] at [Company] has been AI-reviewed 
and submitted to the company.

AI Fit Score: [85]/100
Recommendation: [Strong Fit]

The company will review your application shortly. We'll notify you of any updates.

[View Application Status] (link to candidate portal)

- The Splits Network Team
```

**To Recruiter (Represented):**
```
Subject: AI Review Complete: [Candidate] for [Job] - [85/100]

Hi [Recruiter Name],

The AI review for [Candidate Name]'s application to [Job Title] is complete.

Fit Score: 85/100
Recommendation: Strong Fit

Key Strengths:
• Strong React and TypeScript skills matching job requirements
• 8 years experience exceeds 5-year minimum
• Previous experience in SaaS companies

Minor Concerns:
• Limited AWS experience (job prefers AWS)

The application is now ready for your phone screen.

[View AI Analysis & Schedule Screen] (link)

- Splits Network
```

**To Company (When Submitted):**
```
Subject: New Application: [Candidate] for [Job] - AI Fit Score: 85/100

Hi [Company Name],

A new candidate has been submitted for [Job Title]:

Candidate: [Initials - masked if represented]
AI Fit Score: 85/100
Recommendation: Strong Fit

[View Application & AI Analysis] (link)

- Splits Network
```

---

#### 3. **Recruiter Screen Completed** (Represented Only)

**Trigger:** Recruiter advances from `screen` to `submitted`

**Recipients:**
- Candidate
- Company

**Template to Candidate:**
```
Subject: Your application has been submitted to [Company]

Hi [Candidate Name],

Good news! After reviewing your application and completing an initial screen, 
[Recruiter Name] has submitted your profile to [Company Name] for [Job Title].

Next Steps:
• The company will review your application
• If interested, they'll reach out for interviews
• We'll keep you updated on any progress

[View Application Status] (link)

- Splits Network
```

---

## Frontend Changes

### Candidate Portal (`apps/candidate`)

#### 1. **Application Form Page**

**Add:** AI review status indicator after submission

```tsx
{stage === 'ai_review' && (
  <div className="alert alert-info">
    <i className="fa-solid fa-robot"></i>
    <div>
      <h4>AI Review in Progress</h4>
      <p>Our AI is analyzing your application. This typically takes less than 30 seconds.</p>
      <progress className="progress progress-primary w-full"></progress>
    </div>
  </div>
)}

{stage === 'submitted' && aiReview && (
  <div className="alert alert-success">
    <i className="fa-solid fa-check-circle"></i>
    <div>
      <h4>Application Submitted</h4>
      <p>AI Fit Score: <strong>{aiReview.fit_score}/100</strong> ({aiReview.recommendation})</p>
      <p>Your application has been submitted to {company.name}.</p>
    </div>
  </div>
)}
```

#### 2. **My Applications Page**

**Add:** AI score badge in application list

```tsx
<div className="badge badge-primary">
  AI: {aiReview.fit_score}/100
</div>
```

#### 3. **Application Detail Page**

**Add:** "AI Analysis" section

```tsx
<div className="card">
  <div className="card-body">
    <h3 className="card-title">
      <i className="fa-solid fa-robot"></i> AI Analysis
    </h3>
    
    <div className="stats shadow">
      <div className="stat">
        <div className="stat-title">Fit Score</div>
        <div className="stat-value">{aiReview.fit_score}/100</div>
        <div className="stat-desc">{aiReview.recommendation}</div>
      </div>
      <div className="stat">
        <div className="stat-title">Skills Match</div>
        <div className="stat-value">{aiReview.skills_match.match_percentage}%</div>
        <div className="stat-desc">{aiReview.skills_match.matched_skills.length} matched</div>
      </div>
    </div>
    
    <div className="mt-4">
      <h4>Strengths</h4>
      <ul>
        {aiReview.strengths.map(s => <li key={s}>{s}</li>)}
      </ul>
    </div>
    
    {aiReview.concerns.length > 0 && (
      <div className="mt-4">
        <h4>Areas to Address</h4>
        <ul>
          {aiReview.concerns.map(c => <li key={c}>{c}</li>)}
        </ul>
      </div>
    )}
  </div>
</div>
```

---

### Recruiter Portal (`apps/portal`)

#### 1. **Application List Page** (`/applications`)

**Add:** AI score column and filter

```tsx
<table className="table">
  <thead>
    <tr>
      <th>Candidate</th>
      <th>Job</th>
      <th>AI Score</th>
      <th>Stage</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    {applications.map(app => (
      <tr key={app.id}>
        <td>{app.candidate.full_name}</td>
        <td>{app.job.title}</td>
        <td>
          {app.ai_review ? (
            <div className="badge badge-primary">
              {app.ai_review.fit_score}/100
            </div>
          ) : (
            <span className="text-gray-400">Pending</span>
          )}
        </td>
        <td>
          <div className="badge">{formatStage(app.stage)}</div>
        </td>
        <td>
          {app.stage === 'screen' && (
            <button className="btn btn-sm btn-primary">
              View & Screen
            </button>
          )}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

**Add filter:**
```tsx
<select onChange={handleFilterChange}>
  <option value="all">All Applications</option>
  <option value="needs_screen">Needs Screen (screen stage)</option>
  <option value="high_fit">High Fit (score ≥ 80)</option>
  <option value="medium_fit">Medium Fit (60-79)</option>
  <option value="low_fit">Low Fit (&lt; 60)</option>
</select>
```

#### 2. **Application Detail / Screen Page**

**Add:** Comprehensive AI insights panel

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Left: Candidate Info */}
  <div className="lg:col-span-2">
    <CandidateDetails candidate={application.candidate} />
    <ResumeViewer resume={application.candidate.resume} />
  </div>
  
  {/* Right: AI Insights */}
  <div className="lg:col-span-1">
    <div className="card bg-base-100 shadow-xl sticky top-4">
      <div className="card-body">
        <h3 className="card-title">
          <i className="fa-solid fa-robot"></i> AI Analysis
        </h3>
        
        {/* Fit Score */}
        <div className="radial-progress text-primary" 
             style={{"--value": aiReview.fit_score}}>
          {aiReview.fit_score}
        </div>
        <p className="text-center font-semibold">
          {aiReview.recommendation.replace('_', ' ').toUpperCase()}
        </p>
        
        {/* Summary */}
        <div className="divider"></div>
        <p className="text-sm">{aiReview.overall_summary}</p>
        
        {/* Strengths */}
        <div className="divider"></div>
        <h4 className="font-semibold text-success">
          <i className="fa-solid fa-check"></i> Strengths
        </h4>
        <ul className="text-sm space-y-1">
          {aiReview.strengths.map(s => (
            <li key={s}>• {s}</li>
          ))}
        </ul>
        
        {/* Concerns */}
        {aiReview.concerns.length > 0 && (
          <>
            <div className="divider"></div>
            <h4 className="font-semibold text-warning">
              <i className="fa-solid fa-exclamation-triangle"></i> Concerns
            </h4>
            <ul className="text-sm space-y-1">
              {aiReview.concerns.map(c => (
                <li key={c}>• {c}</li>
              ))}
            </ul>
          </>
        )}
        
        {/* Skills Match */}
        <div className="divider"></div>
        <h4 className="font-semibold">Skills Match</h4>
        <p className="text-sm">
          {aiReview.skills_match.match_percentage}% match
        </p>
        <div className="flex flex-wrap gap-1 mt-2">
          {aiReview.skills_match.matched_skills.map(skill => (
            <div key={skill} className="badge badge-success badge-sm">
              {skill}
            </div>
          ))}
          {aiReview.skills_match.missing_skills.map(skill => (
            <div key={skill} className="badge badge-ghost badge-sm">
              {skill}
            </div>
          ))}
        </div>
        
        {/* Actions */}
        <div className="divider"></div>
        <div className="card-actions justify-end">
          <button 
            className="btn btn-success btn-block"
            onClick={handleSubmitToCompany}
          >
            <i className="fa-solid fa-paper-plane"></i>
            Submit to Company
          </button>
          <button 
            className="btn btn-error btn-outline btn-block"
            onClick={handleReject}
          >
            <i className="fa-solid fa-times"></i>
            Decline to Submit
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### 3. **Create Application Flow**

**Update:** After recruiter creates draft and clicks "Submit for Review"
- Show loading state: "Sending to AI for review..."
- Redirect to applications list or screen page
- Show success toast: "Application submitted for AI review. You'll be notified when ready for screen."

---

### Company Portal (Future - Phase 2)

**Not implemented in Phase 1, but planned:**

- Companies can see AI insights when reviewing applications
- Companies can filter by AI score
- Companies can enable "Gatekeeper Mode" (paid feature)

---

## Implementation Phases

### Phase 1.5: Advisory AI Review (Q1 2026)

**Timeline:** 6-8 weeks

**Week 1-2: Database & Types**
- [ ] Create `ats.ai_reviews` table migration
- [ ] Update `ApplicationStage` type in shared-types
- [ ] Add `ai_reviewed` column to applications table
- [ ] Create indexes

**Week 3-4: Backend Service**
- [ ] Implement AI review service in `ats-service`
- [ ] Create OpenAI/Anthropic integration
- [ ] Implement POST `/api/applications/:id/ai-review` endpoint
- [ ] Implement GET `/api/applications/:id/ai-review` endpoint
- [ ] Add automatic stage transition logic
- [ ] Add job queue for AI review processing

**Week 5-6: Notifications**
- [ ] Create email templates for AI review events
- [ ] Implement notification triggers in notification-service
- [ ] Test notification flow end-to-end

**Week 7: Frontend - Candidate Portal**
- [ ] Add AI review status indicators
- [ ] Show AI analysis on application detail page
- [ ] Update application list to show AI scores

**Week 8: Frontend - Recruiter Portal**
- [ ] Update application list with AI scores
- [ ] Add AI insights panel on screen page
- [ ] Add filter by AI score
- [ ] Update create application flow

**Week 9: Testing & Launch**
- [ ] E2E testing of all flows
- [ ] Load testing (100+ concurrent AI reviews)
- [ ] UAT with beta recruiters
- [ ] Production launch

---

### Phase 3: Gatekeeper Mode (Q3 2026)

**Timeline:** 4-6 weeks

**Features:**
- [ ] Create `ats.ai_review_config` table
- [ ] Add company settings page for AI config
- [ ] Implement auto-reject logic based on threshold
- [ ] Add billing integration for paid feature
- [ ] Add "rejected by AI" notifications
- [ ] Add dashboard for companies to see auto-rejected candidates

---

## AI Service Integration

### Option 1: OpenAI GPT-4

**Pros:**
- Excellent at analyzing unstructured text (resumes)
- Strong reasoning capabilities
- Function calling for structured output

**Cons:**
- More expensive per request (~$0.10-0.30 per review)
- Rate limits may be restrictive at scale

**Example Prompt:**
```
You are an expert recruiter assistant. Analyze the candidate's resume against 
the job description and provide a detailed fit assessment.

Candidate Resume:
[resume text]

Job Description:
[job description]

Required Skills: [skills list]
Experience Required: [years]

Provide your analysis in the following JSON format:
{
  "fit_score": 0-100,
  "recommendation": "strong_fit|good_fit|fair_fit|poor_fit",
  "strengths": ["bullet point 1", "bullet point 2", ...],
  "concerns": ["concern 1", "concern 2", ...],
  ...
}
```

---

### Option 2: Anthropic Claude

**Pros:**
- Longer context window (better for long resumes)
- Often more nuanced in analysis
- Competitive pricing

**Cons:**
- Slightly less common (less tooling/examples)
- Similar rate limits

---

### Option 3: Custom Fine-Tuned Model

**Pros:**
- Lower cost at scale
- Faster response times
- More control over output format

**Cons:**
- Requires training data (1000+ labeled examples)
- Upfront investment in training
- Maintenance overhead

**Recommendation:** Start with OpenAI GPT-4 (Option 1) in Phase 1.5, evaluate custom model in Phase 4.

---

## Testing Strategy

### Unit Tests

```typescript
// Test AI review creation
describe('AIReviewService', () => {
  it('should generate fit score between 0-100', async () => {
    const result = await aiReviewService.analyzeApplication(applicationId);
    expect(result.fit_score).toBeGreaterThanOrEqual(0);
    expect(result.fit_score).toBeLessThanOrEqual(100);
  });
  
  it('should identify matched and missing skills', async () => {
    const result = await aiReviewService.analyzeApplication(applicationId);
    expect(result.skills_match.matched_skills).toBeInstanceOf(Array);
    expect(result.skills_match.missing_skills).toBeInstanceOf(Array);
  });
});
```

### Integration Tests

```typescript
// Test application flow with AI review
describe('Application Flow with AI Review', () => {
  it('should move from draft to ai_review on submission', async () => {
    const application = await createApplication({ stage: 'draft' });
    await completeApplication(application.id);
    
    const updated = await getApplication(application.id);
    expect(updated.stage).toBe('ai_review');
  });
  
  it('should send notifications after AI review', async () => {
    const application = await createApplication({ stage: 'ai_review' });
    await completeAIReview(application.id);
    
    // Check notification sent
    const notifications = await getNotifications({ application_id: application.id });
    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].type).toBe('ai_review_completed');
  });
});
```

### E2E Tests

```typescript
// Candidate submits direct application
test('Direct candidate application flow', async ({ page }) => {
  await page.goto('/jobs/123');
  await page.click('button:text("Apply Now")');
  
  // Fill application form
  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('textarea[name="cover_letter"]', 'I am interested...');
  
  // Submit
  await page.click('button:text("Submit Application")');
  
  // Should see AI review in progress
  await expect(page.locator('text=AI Review in Progress')).toBeVisible();
  
  // Wait for AI to complete (max 30 seconds)
  await page.waitForSelector('text=Application Submitted', { timeout: 30000 });
  
  // Should see fit score
  await expect(page.locator('text=/AI Fit Score: \\d+\\/100/')).toBeVisible();
});
```

---

## Monitoring & Observability

### Metrics to Track

1. **AI Review Performance:**
   - Average processing time (target: < 10 seconds)
   - Success rate (target: > 99%)
   - Error rate by error type

2. **AI Quality Metrics:**
   - Average fit scores by job
   - Distribution of recommendations (strong/good/fair/poor)
   - Recruiter override rate (how often recruiter rejects "strong fit")
   - Company acceptance rate by AI score

3. **Cost Metrics:**
   - Cost per AI review
   - Total AI costs per month
   - Cost per hire (with AI vs without)

4. **Business Metrics:**
   - Time-to-submit improvement (draft → submitted)
   - Recruiter productivity (applications reviewed per day)
   - Company satisfaction with candidate quality

### Alerts

- AI service downtime > 5 minutes
- AI processing time > 30 seconds (90th percentile)
- Error rate > 5%
- Daily cost > budget threshold

---

## Security & Privacy

### Data Handling

1. **PII Protection:**
   - Candidate resumes may contain PII (address, SSN, etc.)
   - Strip unnecessary PII before sending to AI
   - Use data processing agreements with AI providers

2. **Data Retention:**
   - AI reviews stored indefinitely (valuable for analytics)
   - Resume text NOT stored in AI review table (reference original)
   - AI provider does NOT retain data (zero data retention policy)

3. **Access Control:**
   - Recruiters can only see AI reviews for their candidates
   - Companies can only see AI reviews for applications to their jobs
   - Candidates can see their own AI reviews (simplified version)

### Compliance

- **GDPR:** Right to explanation (AI insights must be human-readable)
- **CCPA:** Candidate can request deletion of AI reviews
- **Fair Hiring:** AI must not discriminate (monitor for bias)

---

## Cost Analysis

### Per-Review Cost Estimate

**Using OpenAI GPT-4:**
- Average resume: 1,000 tokens
- Average job description: 500 tokens
- Response: 500 tokens
- **Total: ~2,000 tokens**

**Pricing:**
- Input: $0.03 per 1K tokens = $0.045
- Output: $0.06 per 1K tokens = $0.030
- **Total per review: ~$0.08**

### Monthly Cost Projection

**Scenario 1: 1,000 applications/month**
- Cost: 1,000 × $0.08 = **$80/month**

**Scenario 2: 10,000 applications/month**
- Cost: 10,000 × $0.08 = **$800/month**

**Scenario 3: 100,000 applications/month**
- Cost: 100,000 × $0.08 = **$8,000/month**
- Consider switching to fine-tuned model

### Revenue Opportunity (Gatekeeper Mode)

**Pricing:** $75 per job posting for gatekeeper AI

**Scenario:** 100 companies enable gatekeeper mode
- Revenue: 100 × $75 = **$7,500/month**
- AI cost (if 10,000 apps): $800/month
- **Profit margin: 89%**

---

## Success Metrics

### Phase 1.5 (Advisory Mode) Success Criteria:

- [ ] 95% of applications receive AI review within 30 seconds
- [ ] AI service uptime > 99.5%
- [ ] Recruiter satisfaction score > 4/5 for AI insights
- [ ] Time from draft to submitted reduced by 30%
- [ ] Company-reported candidate quality unchanged or improved

### Phase 3 (Gatekeeper Mode) Success Criteria:

- [ ] 50+ companies adopt gatekeeper mode (paid feature)
- [ ] Auto-rejection accuracy > 90% (confirmed by company review)
- [ ] Zero discrimination complaints
- [ ] Revenue covers AI costs + 50% margin

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI service downtime | Applications stuck in queue | Fallback to manual review, skip AI |
| AI bias/discrimination | Legal/reputation damage | Regular audits, human oversight |
| High AI costs at scale | Negative margins | Switch to custom model at 50K+ apps/mo |
| Poor AI accuracy | Recruiters ignore insights | Continuous model improvement, feedback loop |
| Slow AI processing | Poor UX, bottleneck | Optimize prompts, use caching, parallel processing |

---

## Future Enhancements (Phase 4+)

1. **Learning from Outcomes:**
   - Track which AI predictions led to hires
   - Retrain model based on successful placements
   - Personalized AI models per company/industry

2. **Interview Question Suggestions:**
   - AI generates interview questions based on concerns
   - Tailored to address specific gaps in candidate profile

3. **Candidate Coaching:**
   - AI provides feedback to candidates on improving applications
   - Suggestions for skills to add, experience to highlight

4. **Dynamic Job Descriptions:**
   - AI suggests improvements to job descriptions based on application quality
   - "Your required skills are too broad/narrow"

5. **Predictive Hiring:**
   - AI predicts likelihood of hire based on historical data
   - "Candidates with this profile have 80% hire rate for this company"

---

## Conclusion

The AI-assisted application flow represents a significant enhancement to the Splits Network platform, providing:

- **For Candidates:** Immediate feedback and transparency
- **For Recruiters:** Data-driven screening and time savings
- **For Companies:** Higher quality candidates and better hiring outcomes

By starting with advisory mode and iterating based on real-world usage, we can build confidence in the AI system before introducing gatekeeper features. The phased approach minimizes risk while delivering value quickly.

**Next Steps:**
1. Review and approve this implementation plan
2. Allocate engineering resources (2 backend + 1 frontend)
3. Set up AI service accounts (OpenAI/Anthropic)
4. Begin Phase 1.5 implementation (Week 1: Database migrations)

---

**Document Version:** 1.0  
**Last Updated:** December 21, 2025  
**Owner:** Engineering Team  
**Reviewers:** Product, CTO, Legal (for compliance)
