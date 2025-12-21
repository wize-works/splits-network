'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import JobDetailModal from './job-detail-modal';
import CandidateDetailModal from './candidate-detail-modal';
import DocumentViewerModal from './document-viewer-modal';

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
    const [showJobModal, setShowJobModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);

    const primaryResume = documents.find((d: any) => d.is_primary);
    console.log(documents);

    const handleDownloadDocument = async (doc: any) => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const response: any = await client.getDocument(doc.id);
            const signedUrl = response.data?.downloadUrl || response.downloadUrl;

            if (signedUrl) {
                window.open(signedUrl, '_blank');
            }
        } catch (error) {
            console.error('Failed to download document:', error);
            setError('Failed to download document');
        }
    };

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
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-xl">
                        <i className="fa-solid fa-briefcase text-primary mr-2"></i>
                        Position & Candidate
                    </h2>
                    <div className="divider my-2"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <div className="text-sm font-semibold text-base-content/60 uppercase mb-2">Position</div>
                            <button
                                onClick={() => setShowJobModal(true)}
                                className="text-left hover:bg-base-200/50 p-3 rounded-lg transition-colors w-full"
                            >
                                <p className="text-2xl font-bold text-primary mb-1 hover:underline">{job.title}</p>
                                <p className="text-base-content/70 mb-2">{job.company?.name}</p>
                                {job.location && (
                                    <p className="text-sm text-base-content/60">
                                        <i className="fa-solid fa-location-dot mr-1"></i> {job.location}
                                    </p>
                                )}
                                <div className="text-xs text-primary mt-2 flex items-center gap-1">
                                    <i className="fa-solid fa-eye"></i>
                                    <span>Click to view full details</span>
                                </div>
                            </button>
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-base-content/60 uppercase mb-2">Candidate</div>
                            <button
                                onClick={() => setShowCandidateModal(true)}
                                className="text-left hover:bg-base-200/50 p-3 rounded-lg transition-colors w-full"
                            >
                                <p className="text-2xl font-bold mb-1 hover:underline">{candidate.full_name}</p>
                                <p className="text-base-content/70 mb-2">{candidate.email}</p>
                                {candidate.phone && (
                                    <p className="text-sm text-base-content/60 mb-1">
                                        <i className="fa-solid fa-phone mr-1"></i> {candidate.phone}
                                    </p>
                                )}
                                {candidate.linkedin_url && (
                                    <div className="text-sm text-primary inline-flex items-center gap-1">
                                        <i className="fa-brands fa-linkedin"></i> LinkedIn Profile
                                    </div>
                                )}
                                <div className="text-xs text-primary mt-2 flex items-center gap-1">
                                    <i className="fa-solid fa-eye"></i>
                                    <span>Click to view full profile</span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-xl">
                        <i className="fa-solid fa-file-pdf text-error mr-2"></i>
                        Documents
                    </h2>
                    <div className="divider my-2"></div>
                    {documents.length === 0 ? (
                        <div className="text-center py-8 text-base-content/60">
                            <i className="fa-solid fa-folder-open text-4xl mb-2"></i>
                            <p>No documents attached</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {documents.map((doc: any) => (
                                <div key={doc.id} className="flex items-center justify-between p-4 bg-base-200/50 rounded-lg hover:bg-base-200 transition-colors">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <i className="fa-solid fa-file-pdf text-3xl text-error flex-shrink-0"></i>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{doc.file_name}</div>
                                            <div className="text-sm text-base-content/60 flex items-center gap-2 flex-wrap">
                                                <span className="capitalize">{doc.document_type}</span>
                                                {doc.file_size && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                                                    </>
                                                )}
                                                {doc.is_primary && (
                                                    <span className="badge badge-primary badge-sm ml-2">
                                                        <i className="fa-solid fa-star mr-1"></i>
                                                        Primary
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => {
                                                setSelectedDocument(doc);
                                                setShowDocumentModal(true);
                                            }}
                                            className="btn btn-sm btn-ghost"
                                            title="View document"
                                        >
                                            <i className="fa-solid fa-eye"></i>
                                        </button>
                                        <button
                                            onClick={() => handleDownloadDocument(doc)}
                                            className="btn btn-sm btn-ghost flex-shrink-0"
                                            title="Download document"
                                        >
                                            <i className="fa-solid fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Pre-Screen Answers */}
            {preScreenAnswers.length > 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-xl">
                            <i className="fa-solid fa-clipboard-question text-info mr-2"></i>
                            Pre-Screening Answers
                        </h2>
                        <div className="divider my-2"></div>
                        <div className="space-y-4">
                            {preScreenAnswers.map((answer: any, index: number) => (
                                <div key={answer.question_id} className="p-4 bg-base-200/50 rounded-lg">
                                    <div className="font-semibold mb-3 flex items-start gap-2">
                                        <span className="badge badge-primary badge-sm mt-0.5">{index + 1}</span>
                                        <span className="flex-1">{getQuestionText(answer.question_id)}</span>
                                    </div>
                                    <div className="text-base-content/80 pl-7">
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
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-xl">
                            <i className="fa-solid fa-note-sticky text-warning mr-2"></i>
                            Candidate's Notes
                        </h2>
                        <div className="divider my-2"></div>
                        <div className="p-4 bg-base-200/50 rounded-lg">
                            <p className="text-base-content/80 whitespace-pre-wrap">{application.notes}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recruiter Notes */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-xl">
                        <i className="fa-solid fa-pen-to-square text-success mr-2"></i>
                        Add Your Notes (Optional)
                    </h2>
                    <div className="divider my-2"></div>
                    <div className="alert alert-info mb-4">
                        <i className="fa-solid fa-lightbulb"></i>
                        <span className="text-sm">
                            Add any additional context, achievements, or recommendations before submitting to the company.
                        </span>
                    </div>
                    <div className="fieldset">
                        <label className="label">Recruiter Notes</label>
                        <textarea
                            className="textarea h-32 w-full"
                            value={recruiterNotes}
                            onChange={(e) => setRecruiterNotes(e.target.value)}
                            placeholder="Example: Candidate has 5+ years experience with React and led a team of 3 engineers. Strong communication skills demonstrated in our call. Highly recommend for this role."
                        />
                    </div>
                </div>
            </div>

            {/* Important Info & Actions */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="alert alert-info">
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
                    <div className="card-actions justify-between mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost"
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
            </div>

            {/* Modals */}
            <JobDetailModal
                job={job}
                isOpen={showJobModal}
                onClose={() => setShowJobModal(false)}
            />
            <CandidateDetailModal
                candidate={candidate}
                isOpen={showCandidateModal}
                onClose={() => setShowCandidateModal(false)}
            />
            <DocumentViewerModal
                document={selectedDocument}
                isOpen={showDocumentModal}
                onClose={() => {
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                }}
            />
            <DocumentViewerModal
                document={selectedDocument}
                isOpen={showDocumentModal}
                onClose={() => {
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                }}
            />
        </div>
    );
}
