'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PreScreenQuestion {
  id: string;
  question_text: string;
  question_type: 'text' | 'yes_no' | 'select' | 'multi_select';
}

interface Answer {
  question_id: string;
  answer: string | string[] | boolean;
}

interface StepReviewProps {
  job: any;
  documents: any[];
  selectedDocuments: string[];
  primaryResumeId: string | null;
  questions: PreScreenQuestion[];
  answers: Answer[];
  additionalNotes: string;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

export default function StepReview({
  job,
  documents,
  selectedDocuments,
  primaryResumeId,
  questions,
  answers,
  additionalNotes,
  onBack,
  onSubmit,
}: StepReviewProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDocs = documents.filter(d => selectedDocuments.includes(d.id));
  const primaryResume = documents.find(d => d.id === primaryResumeId);

  const getQuestionText = (questionId: string) => {
    return questions.find(q => q.id === questionId)?.question_text || 'Unknown question';
  };

  const formatAnswer = (answer: string | string[] | boolean) => {
    if (typeof answer === 'boolean') {
      return answer ? 'Yes' : 'No';
    }
    if (Array.isArray(answer)) {
      return answer.join(', ');
    }
    return answer;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await onSubmit();
      // Success - redirect to applications list
      router.push('/applications?success=true');
    } catch (err: any) {
      setError(err.message || 'Failed to submit application. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Review Your Application</h2>
        <p className="text-base-content/70">
          Please review your application before submitting.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Job Info */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Position</h3>
          <div>
            <div className="font-semibold">{job.title}</div>
            <div className="text-sm text-base-content/70">
              {job.company?.name || 'Unknown Company'}
            </div>
            {job.location && (
              <div className="text-sm text-base-content/60">
                <i className="fa-solid fa-location-dot"></i> {job.location}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h3 className="card-title text-lg">Documents</h3>
          <div className="space-y-2">
            {selectedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center gap-2">
                <i className="fa-solid fa-file text-base-content/60"></i>
                <span>{doc.file_name}</span>
                {doc.id === primaryResumeId && (
                  <span className="badge badge-primary badge-sm">
                    <i className="fa-solid fa-star"></i>
                    Primary
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pre-Screen Answers */}
      {answers.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">Pre-Screening Answers</h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div key={answer.question_id}>
                  <div className="font-medium text-sm mb-1">
                    {index + 1}. {getQuestionText(answer.question_id)}
                  </div>
                  <div className="text-base-content/70">
                    {formatAnswer(answer.answer)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {additionalNotes && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title text-lg">Additional Notes</h3>
            <p className="text-base-content/70 whitespace-pre-wrap">{additionalNotes}</p>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="alert">
        <i className="fa-solid fa-circle-info"></i>
        <div>
          <div className="font-semibold">Before you submit:</div>
          <ul className="list-disc list-inside text-sm mt-1">
            <li>Review all information for accuracy</li>
            <li>Ensure you've attached the correct documents</li>
            <li>Double-check your answers to pre-screening questions</li>
          </ul>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          className="btn"
          onClick={onBack}
          disabled={submitting}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Submitting...
            </>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane"></i>
              Submit Application
            </>
          )}
        </button>
      </div>
    </div>
  );
}
