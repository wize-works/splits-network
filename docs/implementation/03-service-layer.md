# Service Layer - Candidate Application Workflow

**Document:** 03 - Service Layer  
**Created:** December 19, 2025

---

## Overview

Service layer specifications including business logic, repository methods, and service interfaces for the candidate application workflow.

---

## 1. ATS Service Updates

### 1.1 ApplicationService Extensions

**File:** `services/ats-service/src/services/applications/service.ts`

#### New Methods

```typescript
/**
 * Create application (including drafts with stage='draft')
 */
async createApplication(params: {
  candidateId: string;
  jobId: string;
  stage: 'draft' | 'screen' | 'submitted';  // Use 'draft' for incomplete
  documentIds?: string[];
  primaryResumeId?: string;
  preScreenAnswers?: PreScreenAnswer[];
  notes?: string;
}): Promise<Application>

/**
 * Update application (including draft updates)
 */
async updateApplication(
  applicationId: string,
  updates: Partial<Application>
): Promise<Application>

/**
 * Submit candidate-initiated application
 */
async submitCandidateApplication(params: {
  candidateId: string;
  jobId: string;
  documentIds: string[];
  primaryResumeId: string;
  preScreenAnswers?: PreScreenAnswer[];
  notes?: string;
}): Promise<{
  application: Application;
  hasRecruiter: boolean;
  nextSteps: string;
}>

/**
 * Get applications for candidate
 */
async getApplicationsByCandidateId(
  candidateId: string,
  filters?: { status?: string }
): Promise<Application[]>

/**
 * Get pending applications for recruiter review
 */
async getPendingApplicationsForRecruiter(
  recruiterId: string
): Promise<Application[]>

/**
 * Recruiter approves and submits application
 */
async recruiterSubmitApplication(
  applicationId: string,
  recruiterId: string,
  options?: {
    recruiterNotes?: string;
    enhancedResumeId?: string;
    additionalDocumentIds?: string[];
  }
): Promise<Application>

/**
 * Recruiter requests changes from candidate
 */
async requestApplicationChanges(
  applicationId: string,
  recruiterId: string,
  requestedChanges: string
): Promise<Application>

/**
 * Candidate withdraws application
 */
async withdrawApplication(
  applicationId: string,
  candidateId: string,
  reason?: string
): Promise<Application>

/**
 * Company requests pre-screen for non-represented candidate
 */
async requestPreScreen(
  applicationId: string,
  companyId: string
): Promise<{
  application: Application;
  recruiterAssigned: Recruiter;
  invitationSent: boolean;
}>
```

---

### 1.2 PreScreenService (New)

**File:** `services/ats-service/src/services/pre-screen/service.ts`

```typescript
export class PreScreenService {
  constructor(
    private repository: AtsRepository
  ) {}

  /**
   * Get pre-screen questions for a job
   */
  async getQuestionsForJob(jobId: string): Promise<PreScreenQuestion[]>

  /**
   * Validate answers completeness
   */
  async validateAnswers(
    jobId: string,
    answers: PreScreenAnswer[]
  ): Promise<{
    valid: boolean;
    missingRequired: string[];
  }>

  /**
   * Save answers for an application
   */
  async saveAnswers(
    applicationId: string,
    answers: PreScreenAnswer[]
  ): Promise<PreScreenAnswer[]>

  /**
   * Get answers for an application
   */
  async getAnswersForApplication(
    applicationId: string
  ): Promise<PreScreenAnswerWithQuestion[]>
}
```

---

### 1.3 ApplicationDocumentService (New)

**File:** `services/ats-service/src/services/application-documents/service.ts`

```typescript
export class ApplicationDocumentService {
  constructor(
    private repository: AtsRepository,
    private documentServiceClient: DocumentServiceClient
  ) {}

  /**
   * Link documents to application
   */
  async linkDocuments(
    applicationId: string,
    documentIds: string[],
    primaryResumeId: string
  ): Promise<ApplicationDocument[]>

  /**
   * Verify candidate owns all documents
   */
  async verifyDocumentOwnership(
    candidateId: string,
    documentIds: string[]
  ): Promise<boolean>

  /**
   * Ensure at least one resume exists
   */
  async validateDocuments(
    documentIds: string[]
  ): Promise<{
    valid: boolean;
    hasResume: boolean;
    invalidIds: string[];
  }>

  /**
   * Get documents for application
   */
  async getDocumentsForApplication(
    applicationId: string
  ): Promise<ApplicationDocumentWithDetails[]>

  /**
   * Add additional documents (recruiter enhancement)
   */
  async addDocuments(
    applicationId: string,
    documentIds: string[]
  ): Promise<ApplicationDocument[]>

  /**
   * Update primary resume
   */
  async updatePrimaryResume(
    applicationId: string,
    newPrimaryResumeId: string
  ): Promise<void>
}
```

---

## 2. Network Service Updates

### 2.1 RecruiterCandidateService Extensions

**File:** `services/network-service/src/services/recruiter-candidates/service.ts`

#### New Methods

```typescript
/**
 * Get active recruiter for candidate
 */
async getActiveRecruiterForCandidate(
  candidateId: string
): Promise<RecruiterCandidate | null>

/**
 * Create recruiter-candidate relationship from pre-screen request
 */
async createRelationshipFromPreScreen(
  candidateId: string,
  recruiterId: string,
  jobId: string
): Promise<RecruiterCandidate>

/**
 * Find random active recruiter for assignment
 */
async findRandomActiveRecruiter(
  excludeIds?: string[]
): Promise<Recruiter | null>
```

---

### 2.2 CandidateRoleAssignmentService Extensions

**File:** `services/network-service/src/services/proposals/service.ts`

#### New Methods

```typescript
/**
 * Create assignment when candidate applies
 * (For fiscal tracking purposes)
 */
async createAssignmentForApplication(
  jobId: string,
  candidateId: string,
  recruiterId: string,
  applicationId: string
): Promise<CandidateRoleAssignment>

/**
 * Get assignment for application
 */
async getAssignmentForApplication(
  applicationId: string
): Promise<CandidateRoleAssignment | null>
```

---

## 3. Repository Methods

### 3.1 AtsRepository Extensions

**File:** `services/ats-service/src/repository.ts`

```typescript
// ============================================
// Application Drafts
// ============================================

async createOrUpdateDraft(data: {
  candidate_id: string;
  job_id: string;
  draft_data: any;
}): Promise<ApplicationDraft>

async findDraft(
  candidateId: string,
  jobId: string
): Promise<ApplicationDraft | null>

async deleteDraft(draftId: string): Promise<void>

async deleteStaleDrafts(olderThanDays: number): Promise<number>

// ============================================
// Pre-Screen Answers
// ============================================

async createPreScreenAnswers(
  answers: Array<{
    application_id: string;
    question_id: string;
    answer_text?: string;
    answer_boolean?: boolean;
    answer_json?: any;
  }>
): Promise<PreScreenAnswer[]>

async findPreScreenAnswers(
  applicationId: string
): Promise<PreScreenAnswerWithQuestion[]>

async deletePreScreenAnswers(applicationId: string): Promise<void>

// ============================================
// Application Documents
// ============================================

async linkDocumentsToApplication(
  applicationId: string,
  documents: Array<{
    document_id: string;
    document_type: string;
    is_primary: boolean;
  }>
): Promise<ApplicationDocument[]>

async findApplicationDocuments(
  applicationId: string
): Promise<ApplicationDocument[]>

async updatePrimaryResume(
  applicationId: string,
  newPrimaryId: string
): Promise<void>

async addDocumentsToApplication(
  applicationId: string,
  documentIds: string[]
): Promise<ApplicationDocument[]>

// ============================================
// Application Queries
// ============================================

async findPendingApplicationsForRecruiter(
  recruiterId: string
): Promise<Application[]>

async checkDuplicateApplication(
  candidateId: string,
  jobId: string
): Promise<boolean>

async updateApplicationStatus(
  applicationId: string,
  status: ApplicationStatus,
  metadata?: any
): Promise<Application>
```

---

## 4. Business Logic Flows

### 4.1 Submit Candidate Application Flow

```typescript
async submitCandidateApplication(params: {
  candidateId: string;
  jobId: string;
  documentIds: string[];
  primaryResumeId: string;
  preScreenAnswers?: PreScreenAnswer[];
  notes?: string;
}): Promise<SubmitApplicationResult> {
  // 1. Verify job exists and is active
  const job = await this.repository.findJobById(params.jobId);
  if (!job || job.status !== 'active') {
    throw new ApplicationError('JOB_NOT_FOUND', 'Job not found or closed');
  }

  // 2. Check for duplicate application
  const isDuplicate = await this.repository.checkDuplicateApplication(
    params.candidateId,
    params.jobId
  );
  if (isDuplicate) {
    throw new ApplicationError('DUPLICATE_APPLICATION', 
      'You have already applied to this job');
  }

  // 3. Verify and validate documents
  const docValidation = await this.applicationDocumentService.validateDocuments(
    params.documentIds
  );
  if (!docValidation.valid || !docValidation.hasResume) {
    throw new ApplicationError('MISSING_RESUME', 
      'At least one resume document is required');
  }

  // 4. Verify document ownership
  const ownsDocuments = await this.applicationDocumentService.verifyDocumentOwnership(
    params.candidateId,
    params.documentIds
  );
  if (!ownsDocuments) {
    throw new ApplicationError('INVALID_DOCUMENT', 
      'One or more documents do not belong to you');
  }

  // 5. Validate pre-screen answers if required
  if (params.preScreenAnswers) {
    const validation = await this.preScreenService.validateAnswers(
      params.jobId,
      params.preScreenAnswers
    );
    if (!validation.valid) {
      throw new ApplicationError('MISSING_REQUIRED_ANSWERS', 
        'Required pre-screen questions not answered', 
        { missing: validation.missingRequired });
    }
  }

  // 6. Check for active recruiter relationship
  const recruiterRelationship = await this.networkService.getActiveRecruiterForCandidate(
    params.candidateId
  );

  const hasRecruiter = !!recruiterRelationship;
  const recruiterId = recruiterRelationship?.recruiter_id || null;

  // 7. Determine application stage based on recruiter presence
  const stage = hasRecruiter 
    ? 'screen'      // Pending recruiter review
    : 'submitted';  // Direct to company

  const submittedAt = hasRecruiter ? null : new Date();
  const submittedToRecruiterAt = hasRecruiter ? new Date() : null;

  // 8. Create application
  const application = await this.repository.createApplication({
    job_id: params.jobId,
    candidate_id: params.candidateId,
    recruiter_id: recruiterId,
    stage: stage,
    notes: params.notes,
  });

  // Track submission to recruiter in audit log if applicable
  if (hasRecruiter) {
    await this.repository.createAuditLog({
      application_id: application.id,
      action: 'submitted_to_recruiter',
      performed_by_user_id: params.candidateId,
      metadata: { recruiter_id: recruiterId },
    });
  }

  // 9. Link documents to application
  await this.applicationDocumentService.linkDocuments(
    application.id,
    params.documentIds,
    params.primaryResumeId
  );

  // 10. Save pre-screen answers
  if (params.preScreenAnswers && params.preScreenAnswers.length > 0) {
    await this.preScreenService.saveAnswers(
      application.id,
      params.preScreenAnswers
    );
  }

  // 11. Create candidate role assignment for fiscal tracking (if has recruiter)
  if (recruiterId) {
    await this.networkService.createAssignmentForApplication(
      params.jobId,
      params.candidateId,
      recruiterId,
      application.id
    );
  }

  // 12. Delete draft if exists
  const draft = await this.repository.findDraft(params.candidateId, params.jobId);
  if (draft) {
    await this.repository.deleteDraft(draft.id);
  }

  // 13. Log audit entry
  await this.repository.createAuditLog({
    application_id: application.id,
    action: 'created',
    performed_by_user_id: params.candidateId,
    performed_by_role: 'candidate',
    new_value: { status, submitted_by: 'candidate' },
  });

  // 14. Publish event
  await this.eventPublisher.publish(
    hasRecruiter ? 'application.submitted_to_recruiter' : 'application.submitted_to_company',
    {
      application_id: application.id,
      job_id: params.jobId,
      candidate_id: params.candidateId,
      recruiter_id: recruiterId,
      has_recruiter: hasRecruiter,
    },
    'ats-service'
  );

  // 15. Return result
  const nextSteps = hasRecruiter
    ? 'Your application has been sent to your recruiter for review. They will enhance and submit it to the company.'
    : 'Your application has been submitted directly to the company. They will review and contact you if interested.';

  return {
    application,
    hasRecruiter,
    nextSteps,
  };
}
```

---

### 4.2 Recruiter Submit Application Flow

```typescript
async recruiterSubmitApplication(
  applicationId: string,
  recruiterId: string,
  options?: {
    recruiterNotes?: string;
    enhancedResumeId?: string;
    additionalDocumentIds?: string[];
  }
): Promise<Application> {
  // 1. Get application and verify state
  const application = await this.repository.findApplicationById(applicationId);
  if (!application) {
    throw new ApplicationError('NOT_FOUND', 'Application not found');
  }

  if (application.recruiter_id !== recruiterId) {
    throw new ApplicationError('FORBIDDEN', 'Not your application');
  }

  if (application.stage !== 'screen') {
    throw new ApplicationError('INVALID_STATE', 
      'Application not in pending review state (must be in screen stage)');
  }

  // 2. Update primary resume if provided
  if (options?.enhancedResumeId) {
    await this.applicationDocumentService.updatePrimaryResume(
      applicationId,
      options.enhancedResumeId
    );
  }

  // 3. Add additional documents if provided
  if (options?.additionalDocumentIds && options.additionalDocumentIds.length > 0) {
    await this.applicationDocumentService.addDocuments(
      applicationId,
      options.additionalDocumentIds
    );
  }

  // 4. Update application stage and notes
  const updatedApplication = await this.repository.updateApplication(applicationId, {
    stage: 'submitted',  // Move from 'screen' to 'submitted'
    recruiter_notes: options?.recruiterNotes || null,
  });

  // 5. Log audit entry - use application_audit_log table
  await this.repository.createAuditLog({
    application_id: applicationId,
    action: 'recruiter_reviewed',
    performed_by_user_id: recruiterId,
    metadata: { notes: options?.recruiterNotes, approved: true },
  });
  
  await this.repository.createAuditLog({
    application_id: applicationId,
    action: 'submitted_to_company',
    performed_by_user_id: recruiterId,
    metadata: {},
  });

  // 6. Publish event
  await this.eventPublisher.publish(
    'application.submitted_to_company',
    {
      application_id: applicationId,
      job_id: application.job_id,
      candidate_id: application.candidate_id,
      recruiter_id: recruiterId,
    },
    'ats-service'
  );

  return updatedApplication;
}
```

---

### 4.3 Request Pre-Screen Flow

```typescript
async requestPreScreen(
  applicationId: string,
  companyId: string
): Promise<PreScreenRequestResult> {
  // 1. Get and validate application
  const application = await this.repository.findApplicationById(applicationId);
  if (!application) {
    throw new ApplicationError('NOT_FOUND', 'Application not found');
  }

  // Verify this is company's job
  const job = await this.repository.findJobById(application.job_id);
  if (job.company_id !== companyId) {
    throw new ApplicationError('FORBIDDEN', 'Not your job');
  }

  // Application must not already have recruiter
  if (application.recruiter_id) {
    throw new ApplicationError('CONFLICT', 'Application already has recruiter');
  }

  // 2. Find random active recruiter
  const recruiter = await this.networkService.findRandomActiveRecruiter();
  if (!recruiter) {
    throw new ApplicationError('NO_RECRUITERS', 'No active recruiters available');
  }

  // 3. Create recruiter-candidate relationship invitation
  const relationship = await this.networkService.createRelationshipFromPreScreen(
    application.candidate_id,
    recruiter.id,
    application.job_id
  );

  // 4. Update application with assigned recruiter
  await this.repository.updateApplication(applicationId, {
    recruiter_id: recruiter.user_id,
    stage: 'screen',  // Move to recruiter review stage
  });

  // Track recruiter assignment in audit log
  await this.repository.createAuditLog({
    application_id: applicationId,
    action: 'recruiter_assigned',
    performed_by_user_id: application.candidate_id,
    metadata: { recruiter_id: recruiter.user_id, via: 'company_request' },
  });

  // 5. Create candidate role assignment
  await this.networkService.createAssignmentForApplication(
    application.job_id,
    application.candidate_id,
    recruiter.id,
    applicationId
  );

  // 6. Publish events
  await this.eventPublisher.publish(
    'prescreen.requested',
    {
      application_id: applicationId,
      candidate_id: application.candidate_id,
      recruiter_id: recruiter.id,
      company_id: companyId,
      invitation_token: relationship.invitation_token,
    },
    'ats-service'
  );

  return {
    application: await this.repository.findApplicationById(applicationId),
    recruiterAssigned: recruiter,
    invitationSent: true,
  };
}
```

---

## 5. Type Definitions

```typescript
// Application Draft
interface ApplicationDraft {
  id: string;
  candidate_id: string;
  job_id: string;
  draft_data: ApplicationDraftData;
  last_saved_at: Date;
  created_at: Date;
}

interface ApplicationDraftData {
  step?: number;
  documents?: {
    selected: string[];
    primary_resume_id?: string;
  };
  pre_screen_answers?: {
    [questionId: string]: {
      answer_text?: string;
      answer_boolean?: boolean;
      answer_json?: any;
    };
  };
  notes?: string;
  last_step_completed?: number;
}

// Pre-Screen Answer
interface PreScreenAnswer {
  question_id: string;
  answer: any;                  // JSONB matching question_type
}

interface PreScreenAnswerWithQuestion extends PreScreenAnswer {
  question: PreScreenQuestion;
}

// Application Document
interface ApplicationDocument {
  id: string;
  application_id: string;
  document_id: string;
  document_type: 'resume' | 'cover_letter' | 'portfolio' | 'other';
  is_primary: boolean;
  created_at: Date;
}

// Application Stage (using existing ats.applications.stage column)
type ApplicationStage =
  | 'screen'      // Pending recruiter review
  | 'submitted'   // Submitted to company
  | 'interview'   // Company interviewing
  | 'offer'       // Offer extended
  | 'hired'       // Candidate hired
  | 'rejected';   // Application rejected
```

---

## 6. Error Handling

```typescript
class ApplicationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApplicationError';
  }
}

// Error codes
const ERROR_CODES = {
  JOB_NOT_FOUND: 'Job not found or closed',
  DUPLICATE_APPLICATION: 'Already applied to this job',
  MISSING_RESUME: 'At least one resume required',
  INVALID_DOCUMENT: 'Document not found or not owned',
  MISSING_REQUIRED_ANSWERS: 'Required questions not answered',
  INVALID_STATE: 'Invalid application state',
  FORBIDDEN: 'Not authorized',
  NOT_FOUND: 'Resource not found',
  NO_RECRUITERS: 'No recruiters available',
};
```

---

## 7. Next Steps

1. Implement service methods
2. Add unit tests for business logic
3. Proceed to [Event System](./04-event-system.md)

---

**Status:** ✅ Ready for Implementation  
**Next:** [Event System](./04-event-system.md)
