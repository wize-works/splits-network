# UI Components - Candidate Application Workflow

**Document:** 05 - UI Components  
**Created:** December 19, 2025

---

## Overview

React component specifications for the candidate application wizard and recruiter review interface.

---

## 1. Candidate App Components

### 1.1 Application Wizard (`/jobs/[id]/apply`)

#### File Structure
```
apps/candidate/src/app/(authenticated)/jobs/[id]/apply/
├── page.tsx                      # Main application page
├── application-wizard.tsx        # Wizard orchestrator
├── components/
│   ├── step-indicator.tsx        # Progress indicator
│   ├── step-documents.tsx        # Step 1: Document selection
│   ├── step-questions.tsx        # Step 2: Pre-screen questions
│   ├── step-review.tsx           # Step 3: Review & submit
│   └── document-selector.tsx     # Reusable document picker
```

---

#### Main Page Component

**File:** `page.tsx`

```tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { getJob, getCandidate, getDraftApplication, getPreScreenQuestions, getMyDocuments } from '@/lib/api';
import ApplicationWizard from './application-wizard';

export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId, getToken } = await auth();
  const { id: jobId } = await params;

  if (!userId) {
    redirect('/sign-in?redirect=' + encodeURIComponent(`/jobs/${jobId}/apply`));
  }

  const token = await getToken();
  if (!token) {
    redirect('/sign-in');
  }

  // Fetch all necessary data
  const [job, candidate, draft, questions, documents] = await Promise.all([
    getJob(jobId, token),
    getCandidate('me', token),
    getDraftApplication(jobId, token),
    getPreScreenQuestions(jobId, token),
    getMyDocuments(token),
  ]);

  // Check for duplicate application
  const hasApplied = candidate.applications?.some(app => app.job_id === jobId);
  if (hasApplied) {
    redirect(`/applications?duplicate=true&job=${jobId}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ApplicationWizard
        job={job}
        candidate={candidate}
        draft={draft}
        questions={questions}
        documents={documents}
      />
    </div>
  );
}
```

---

#### Application Wizard Component

**File:** `application-wizard.tsx`

```tsx
'use client';

import { useState } from 'react';
import StepIndicator from './components/step-indicator';
import StepDocuments from './components/step-documents';
import StepQuestions from './components/step-questions';
import StepReview from './components/step-review';
import { saveDraft, submitApplication } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ApplicationWizard({ job, candidate, draft, questions, documents }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(draft?.draft_data?.step || 1);
  const [formData, setFormData] = useState({
    documents: {
      selected: draft?.draft_data?.documents?.selected || [],
      primary_resume_id: draft?.draft_data?.documents?.primary_resume_id || null,
    },
    pre_screen_answers: draft?.draft_data?.pre_screen_answers || {},
    notes: draft?.draft_data?.notes || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const steps = [
    { number: 1, title: 'Documents', description: 'Upload or select resume' },
    ...(questions.length > 0 ? [{ number: 2, title: 'Questions', description: 'Answer pre-screening questions' }] : []),
    { number: questions.length > 0 ? 3 : 2, title: 'Review', description: 'Review and submit' },
  ];

  const handleSaveDraft = async () => {
    try {
      await saveDraft(job.id, {
        step: currentStep,
        ...formData,
        last_step_completed: currentStep,
      });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleNext = async () => {
    await handleSaveDraft();
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitApplication({
        job_id: job.id,
        document_ids: formData.documents.selected,
        primary_resume_id: formData.documents.primary_resume_id,
        pre_screen_answers: Object.entries(formData.pre_screen_answers).map(([question_id, answer]) => ({
          question_id,
          ...answer,
        })),
        notes: formData.notes,
      });

      // Success - redirect to applications with success message
      router.push(`/applications?success=true&application=${result.data.application.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
      setSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepDocuments
            documents={documents}
            selected={formData.documents.selected}
            primaryResumeId={formData.documents.primary_resume_id}
            onChange={(docs) => setFormData({ ...formData, documents: docs })}
            onNext={handleNext}
          />
        );
      case 2:
        if (questions.length > 0) {
          return (
            <StepQuestions
              questions={questions}
              answers={formData.pre_screen_answers}
              onChange={(answers) => setFormData({ ...formData, pre_screen_answers: answers })}
              onNext={handleNext}
              onBack={handleBack}
            />
          );
        } else {
          return (
            <StepReview
              job={job}
              formData={formData}
              documents={documents}
              questions={questions}
              onSubmit={handleSubmit}
              onBack={handleBack}
              submitting={submitting}
              error={error}
            />
          );
        }
      case 3:
        return (
          <StepReview
            job={job}
            formData={formData}
            documents={documents}
            questions={questions}
            onSubmit={handleSubmit}
            onBack={handleBack}
            submitting={submitting}
            error={error}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Apply to {job.title}</h1>
        <p className="text-base-content/70">{job.company.name}</p>
      </div>

      {/* Progress Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="mt-8">
        {renderStep()}
      </div>

      {/* Auto-save indicator */}
      <div className="mt-4 text-center text-sm text-base-content/60">
        <i className="fa-solid fa-save"></i> Changes are automatically saved as you go
      </div>
    </div>
  );
}
```

---

#### Step 1: Documents

**File:** `components/step-documents.tsx`

```tsx
'use client';

import { useState } from 'react';
import { uploadDocument } from '@/lib/api';

export default function StepDocuments({ documents, selected, primaryResumeId, onChange, onNext }) {
  const [uploading, setUploading] = useState(false);

  const resumes = documents.filter(d => d.document_type === 'resume');
  const coverLetters = documents.filter(d => d.document_type === 'cover_letter');
  const other = documents.filter(d => !['resume', 'cover_letter'].includes(d.document_type));

  const toggleDocument = (docId: string) => {
    const newSelected = selected.includes(docId)
      ? selected.filter(id => id !== docId)
      : [...selected, docId];
    
    onChange({
      selected: newSelected,
      primary_resume_id: primaryResumeId,
    });
  };

  const setPrimaryResume = (docId: string) => {
    if (!selected.includes(docId)) {
      toggleDocument(docId);
    }
    onChange({
      selected: selected.includes(docId) ? selected : [...selected, docId],
      primary_resume_id: docId,
    });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // File upload logic
  };

  const canProceed = selected.length > 0 && primaryResumeId && resumes.some(r => r.id === primaryResumeId);

  return (
    <div className="space-y-6">
      <div className="alert alert-info">
        <i className="fa-solid fa-info-circle"></i>
        <span>Select at least one resume to continue. You can also include cover letters and portfolio items.</span>
      </div>

      {/* Resume Section */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Resume (Required)</h3>
        {resumes.length === 0 ? (
          <div className="card bg-base-200 p-4">
            <p className="text-center mb-4">No resumes uploaded yet</p>
            <label className="btn btn-primary">
              <i className="fa-solid fa-upload mr-2"></i>
              Upload Resume
              <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleUpload} />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            {resumes.map(doc => (
              <div key={doc.id} className="card bg-base-100 border border-base-300">
                <div className="card-body p-4 flex-row items-center gap-4">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selected.includes(doc.id)}
                    onChange={() => toggleDocument(doc.id)}
                  />
                  <div className="flex-1">
                    <div className="font-semibold">{doc.file_name}</div>
                    <div className="text-sm text-base-content/60">
                      {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.created_at)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selected.includes(doc.id) && (
                      <button
                        className={`btn btn-sm ${primaryResumeId === doc.id ? 'btn-success' : 'btn-outline'}`}
                        onClick={() => setPrimaryResume(doc.id)}
                      >
                        {primaryResumeId === doc.id ? (
                          <><i className="fa-solid fa-star"></i> Primary</>
                        ) : (
                          'Set as Primary'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cover Letters (Optional) */}
      {coverLetters.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Cover Letter (Optional)</h3>
          {/* Similar structure */}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!canProceed}
        >
          Continue to {questions.length > 0 ? 'Questions' : 'Review'}
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
```

---

#### Step 2: Pre-Screen Questions

**File:** `components/step-questions.tsx`

```tsx
'use client';

export default function StepQuestions({ questions, answers, onChange, onNext, onBack }) {
  const handleAnswerChange = (questionId: string, answer: any) => {
    onChange({
      ...answers,
      [questionId]: answer,
    });
  };

  const renderQuestion = (question) => {
    const answer = answers[question.id] || {};

    switch (question.question_type) {
      case 'text':
        return (
          <textarea
            className="textarea textarea-bordered w-full h-32"
            value={answer?.text || ''}
            onChange={(e) => handleAnswerChange(question.id, { text: e.target.value })}
            placeholder="Type your answer here..."
            required={question.is_required}
          />
        );

      case 'yes_no':
        return (
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                className="radio radio-primary"
                checked={answer?.boolean === true}
                onChange={() => handleAnswerChange(question.id, { boolean: true })}
                required={question.is_required}
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                className="radio radio-primary"
                checked={answer?.boolean === false}
                onChange={() => handleAnswerChange(question.id, { boolean: false })}
                required={question.is_required}
              />
              <span>No</span>
            </label>
          </div>
        );

      case 'select':
        return (
          <select
            className="select select-bordered w-full"
            value={answer?.choice || ''}
            onChange={(e) => handleAnswerChange(question.id, { choice: e.target.value })}
            required={question.is_required}
          >
            <option value="">Select an option...</option>
            {question.options.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="space-y-2">
            {question.options.map((opt, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={answer?.choices?.includes(opt)}
                  onChange={(e) => {
                    const current = answer?.choices || [];
                    const updated = e.target.checked
                      ? [...current, opt]
                      : current.filter(v => v !== opt);
                    handleAnswerChange(question.id, { choices: updated });
                  }}
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const allRequiredAnswered = questions
    .filter(q => q.is_required)
    .every(q => {
      const answer = answers[q.id];
      if (!answer) return false;
      if (q.question_type === 'text') return !!answer.text;
      if (q.question_type === 'yes_no') return answer.boolean !== undefined;
      if (q.question_type === 'select') return !!answer.choice;
      if (q.question_type === 'multi_select') return answer.choices?.length > 0;
      return false;
    });

  return (
    <div className="space-y-8">
      <div className="alert alert-info">
        <i className="fa-solid fa-clipboard-question"></i>
        <span>Please answer all required questions to continue.</span>
      </div>

      {questions.map((question, idx) => (
        <div key={question.id} className="fieldset">
          <label className="label">
            <span className="text-lg font-medium">
              {idx + 1}. {question.question}
              {question.is_required && <span className="text-error ml-1">*</span>}
            </span>
          </label>
          {renderQuestion(question)}
        </div>
      ))}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button className="btn btn-ghost" onClick={onBack}>
          <i className="fa-solid fa-arrow-left"></i>
          Back to Documents
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onNext}
          disabled={!allRequiredAnswered}
        >
          Continue to Review
          <i className="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
}
```

---

#### Step 3: Review & Submit

**File:** `components/step-review.tsx`

```tsx
'use client';

export default function StepReview({ job, formData, documents, questions, onSubmit, onBack, submitting, error }) {
  const selectedDocs = documents.filter(d => formData.documents.selected.includes(d.id));
  const primaryResume = selectedDocs.find(d => d.id === formData.documents.primary_resume_id);

  return (
    <div className="space-y-6">
      <div className="alert alert-success">
        <i className="fa-solid fa-check-circle"></i>
        <span>Review your application before submitting</span>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fa-solid fa-exclamation-circle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Job Summary */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Position</h3>
          <div>
            <div className="text-xl font-semibold">{job.title}</div>
            <div className="text-base-content/70">{job.company.name}</div>
            {job.location && <div className="text-sm mt-1">{job.location}</div>}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h3 className="card-title">Documents</h3>
          <div className="space-y-2">
            {selectedDocs.map(doc => (
              <div key={doc.id} className="flex items-center gap-2">
                <i className={`fa-solid ${doc.id === primaryResume?.id ? 'fa-star text-warning' : 'fa-file'}`}></i>
                <span>{doc.file_name}</span>
                {doc.id === primaryResume?.id && (
                  <span className="badge badge-sm badge-warning">Primary</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Screen Answers */}
      {questions.length > 0 && (
        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title">Pre-Screening Answers</h3>
            <div className="space-y-4">
              {questions.map(q => {
                const answer = formData.pre_screen_answers[q.id];
                return (
                  <div key={q.id}>
                    <div className="font-medium">{q.question}</div>
                    <div className="text-base-content/70 mt-1">
                      {q.question_type === 'text' && answer?.text}
                      {q.question_type === 'yes_no' && (answer?.boolean ? 'Yes' : 'No')}
                      {q.question_type === 'select' && answer?.choice}
                      {q.question_type === 'multi_select' && answer?.choices?.join(', ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button className="btn btn-ghost" onClick={onBack} disabled={submitting}>
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Submitting...
            </>
          ) : (
            <>
              Submit Application
              <i className="fa-solid fa-paper-plane"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
```

---

## 2. Recruiter Portal Components

### 2.1 Pending Applications Page

**File:** `apps/portal/src/app/(authenticated)/applications/pending/page.tsx`

```tsx
import { getPendingApplications } from '@/lib/api-client';
import PendingApplicationsList from './pending-applications-list';

export default async function PendingApplicationsPage() {
  const applications = await getPendingApplications();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Applications Awaiting Review</h1>
      <PendingApplicationsList applications={applications} />
    </div>
  );
}
```

---

### 2.2 Application Review Component

**File:** `apps/portal/src/app/(authenticated)/applications/[id]/review/page.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { recruiterSubmitApplication, requestApplicationChanges } from '@/lib/api-client';

export default function ApplicationReviewPage({ application }) {
  const router = useRouter();
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApproveAndSubmit = async () => {
    setSubmitting(true);
    try {
      await recruiterSubmitApplication(application.id, {
        recruiterNotes,
      });
      router.push('/applications?submitted=true');
    } catch (err) {
      alert('Failed to submit');
      setSubmitting(false);
    }
  };

  const handleRequestChanges = async () => {
    const changes = prompt('What changes would you like to request?');
    if (!changes) return;

    try {
      await requestApplicationChanges(application.id, changes);
      router.push('/applications');
    } catch (err) {
      alert('Failed to request changes');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Review Application</h1>

      {/* Application details */}
      {/* ... */}

      {/* Recruiter Actions */}
      <div className="card bg-base-100 shadow mt-8">
        <div className="card-body">
          <h3 className="card-title">Add Your Notes</h3>
          <textarea
            className="textarea textarea-bordered h-32"
            placeholder="Add your insights, pitch, or additional context..."
            value={recruiterNotes}
            onChange={(e) => setRecruiterNotes(e.target.value)}
          />
          
          <div className="flex gap-3 justify-end mt-4">
            <button
              className="btn btn-ghost"
              onClick={handleRequestChanges}
            >
              Request Changes
            </button>
            <button
              className="btn btn-primary"
              onClick={handleApproveAndSubmit}
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Approve & Submit to Company'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Next Steps

1. Implement all component files
2. Add form validation
3. Style with DaisyUI and Tailwind
4. Test wizard flow end-to-end
5. Proceed to [User Flows](./06-user-flows.md)

---

**Status:** ✅ Ready for Implementation  
**Next:** [User Flows](./06-user-flows.md)
