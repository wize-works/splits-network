'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface ReviewFormProps {
  application: any;
  job: any;
  candidate: any;
  documents: any[];
  preScreenAnswers: any[];
  questions: any[];
}

export default function ReviewForm({
  application,
  job,
  candidate,
  documents,
  preScreenAnswers,
  questions,
}: ReviewFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [recruiterNotes, setRecruiterNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primaryResume = documents.find((d: any) => d.is_primary);

  const getQuestionText = (questionId: string) => {
    return questions.find((q: any) => q.id === questionId)?.question_text || 'Unknown question';
  };

  const formatAnswer = (answer: any) => {
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
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const client = createAuthenticatedClient(token);
      await client.recruiterSubmitApplication(application.id, {
        recruiterNotes: recruiterNotes || undefined,
      });

      // Success - redirect to pending list with success message
      router.push('/applications/pending?success=true');
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="alert alert-error">
          <i className="fa-solid fa-circle-exclamation"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Job & Candidate Info */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Position & Candidate</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">Position</h3>
              <p className="text-xl font-bold text-primary">{job.title}</p>
              <p className="text-base-content/70">{job.company?.name}</p>
              {job.location && (
                <p className="text-sm text-base-content/60 mt-1">
                  <i className="fa-solid fa-location-dot"></i> {job.location}
                </p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Candidate</h3>
              <p className="text-xl font-bold">{candidate.full_name}</p>
              <p className="text-base-content/70">{candidate.email}</p>
              {candidate.phone && (
                <p className="text-sm text-base-content/60 mt-1">
                  <i className="fa-solid fa-phone"></i> {candidate.phone}
                </p>
              )}
              {candidate.linkedin_url && (
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  <i className="fa-brands fa-linkedin"></i> LinkedIn Profile
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            <i className="fa-solid fa-file"></i>
            Documents
          </h2>
          {documents.length === 0 ? (
            <p className="text-base-content/60">No documents attached</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-base-100 rounded">
                  <div className="flex items-center gap-3">
                    <i className="fa-solid fa-file-pdf text-2xl text-error"></i>
                    <div>
                      <div className="font-medium">{doc.file_name}</div>
                      <div className="text-sm text-base-content/60">
                        {doc.document_type}
                        {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(1)} KB`}
                      </div>
                    </div>
                    {doc.is_primary && (
                      <span className="badge badge-primary badge-sm">
                        <i className="fa-solid fa-star"></i>
                        Primary
                      </span>
                    )}
                  </div>
                  <a
                    href={doc.file_url || `/api/documents/${doc.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-ghost"
                  >
                    <i className="fa-solid fa-download"></i>
                    Download
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pre-Screen Answers */}
      {preScreenAnswers.length > 0 && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <i className="fa-solid fa-clipboard-question"></i>
              Pre-Screening Answers
            </h2>
            <div className="space-y-4">
              {preScreenAnswers.map((answer: any, index: number) => (
                <div key={answer.question_id} className="p-4 bg-base-100 rounded">
                  <div className="font-semibold mb-2">
                    {index + 1}. {getQuestionText(answer.question_id)}
                  </div>
                  <div className="text-base-content/70 pl-4">
                    {formatAnswer(answer.answer)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Candidate Notes */}
      {application.notes && (
        <div className="card bg-base-200">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <i className="fa-solid fa-note-sticky"></i>
              Candidate's Notes
            </h2>
            <p className="text-base-content/70 whitespace-pre-wrap">{application.notes}</p>
          </div>
        </div>
      )}

      {/* Recruiter Notes */}
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-xl mb-4">
            <i className="fa-solid fa-pen-to-square"></i>
            Add Your Notes (Optional)
          </h2>
          <p className="text-sm text-base-content/60 mb-4">
            Add any additional context, achievements, or recommendations before submitting to the company.
          </p>
          <div className="fieldset">
            <label className="label">Recruiter Notes</label>
            <textarea
              className="textarea h-32"
              value={recruiterNotes}
              onChange={(e) => setRecruiterNotes(e.target.value)}
              placeholder="Example: Candidate has 5+ years experience with React and led a team of 3 engineers. Strong communication skills demonstrated in our call. Highly recommend for this role."
            />
          </div>
        </div>
      </div>

      {/* Important Info */}
      <div className="alert">
        <i className="fa-solid fa-circle-info"></i>
        <div>
          <div className="font-semibold">Ready to submit?</div>
          <p className="text-sm mt-1">
            Once you submit this application to the company, they will be able to review it and
            proceed with their hiring process. You can track the application status in your dashboard.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between gap-4">
        <button
          type="button"
          className="btn"
          onClick={() => router.back()}
          disabled={submitting}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Back
        </button>
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Submitting to Company...
            </>
          ) : (
            <>
              <i className="fa-solid fa-paper-plane"></i>
              Submit to Company
            </>
          )}
        </button>
      </div>
    </div>
  );
}
