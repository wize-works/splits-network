'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import StepIndicator from './components/step-indicator';
import StepDocuments from './components/step-documents';
import StepQuestions from './components/step-questions';
import StepReview from './components/step-review';
import { submitApplication } from '@/lib/api-client';

interface ApplicationWizardProps {
  job: any;
  questions: any[];
  documents: any[];
}

export default function ApplicationWizard({ job, questions, documents }: ApplicationWizardProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    documents: {
      selected: [] as string[],
      primary_resume_id: null as string | null,
    },
    pre_screen_answers: [] as Array<{ question_id: string; answer: string | string[] | boolean }>,
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasQuestions = questions.length > 0;
  const totalSteps = hasQuestions ? 3 : 2;

  const steps = [
    { number: 1, title: 'Documents', description: 'Select your resume' },
    ...(hasQuestions ? [{ number: 2, title: 'Questions', description: 'Answer pre-screening questions' }] : []),
    { number: totalSteps, title: 'Review', description: 'Review and submit' },
  ];

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const result = await submitApplication(
        {
          job_id: job.id,
          document_ids: formData.documents.selected,
          primary_resume_id: formData.documents.primary_resume_id!,
          pre_screen_answers: Object.entries(formData.pre_screen_answers).map(([question_id, answer]) => ({
            question_id,
            answer,
          })),
          notes: formData.notes,
        },
        token
      );

      // Success - redirect to applications with success message
      router.push(`/applications?success=true&application=${(result as any).data.application.id}`);
    } catch (err: any) {
      console.error('Failed to submit application:', err);
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
        if (hasQuestions) {
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
              documents={documents}
              selectedDocuments={formData.documents.selected}
              primaryResumeId={formData.documents.primary_resume_id}
              questions={questions}
              answers={formData.pre_screen_answers}
              additionalNotes={formData.notes}
              onSubmit={handleSubmit}
              onBack={handleBack}
            />
          );
        }
      case 3:
        return (
          <StepReview
            job={job}
            documents={documents}
            selectedDocuments={formData.documents.selected}
            primaryResumeId={formData.documents.primary_resume_id}
            questions={questions}
            answers={formData.pre_screen_answers}
            additionalNotes={formData.notes}
            onSubmit={handleSubmit}
            onBack={handleBack}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Apply to {job.title}</h1>
        <p className="text-base-content/70 mt-2">at {job.company?.name}</p>
      </div>

      {/* Step Indicator */}
      <StepIndicator steps={steps} currentStep={currentStep} />

      {/* Step Content */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
