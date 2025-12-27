'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import JobDetailModal from './job-detail-modal';
import CandidateDetailModal from './candidate-detail-modal';
import DocumentViewerModal from './document-viewer-modal';

interface ScreenFormProps {
    proposal: any;
    job: any;
    candidate: any;
    documents: any[];
}

export default function ScreenForm({
    proposal,
    job,
    candidate,
    documents,
}: ScreenFormProps) {
    const router = useRouter();
    const { getToken } = useAuth();
    const [responseNotes, setResponseNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showJobModal, setShowJobModal] = useState(false);
    const [showCandidateModal, setShowCandidateModal] = useState(false);
    const [showDocumentModal, setShowDocumentModal] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<any>(null);

    // Ensure documents is an array
    const documentsList = Array.isArray(documents) ? documents : [];
    const primaryResume = documentsList.find((d: any) => d.is_primary);

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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getDueStatus = () => {
        const dueDate = new Date(proposal.response_due_at);
        const now = new Date();
        const hoursRemaining = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursRemaining < 0) {
            return { text: 'Overdue', color: 'text-error', urgent: true };
        } else if (hoursRemaining < 24) {
            return { text: `${Math.round(hoursRemaining)}h remaining`, color: 'text-warning', urgent: true };
        } else {
            const daysRemaining = Math.round(hoursRemaining / 24);
            return { text: `${daysRemaining}d remaining`, color: 'text-base-content/60', urgent: false };
        }
    };

    const dueStatus = getDueStatus();

    const handleAccept = async () => {
        setSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const client = createAuthenticatedClient(token);
            await client.post(`/proposals/${proposal.id}/accept`, {
                response_notes: responseNotes || undefined
            });

            // Success - redirect to proposals list with success message
            router.push('/proposals?success=accepted');
        } catch (err: any) {
            setError(err.message || 'Failed to accept proposal');
            setSubmitting(false);
        }
    };

    const handleDecline = async () => {
        if (!responseNotes.trim()) {
            setError('Please provide a reason for declining');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const client = createAuthenticatedClient(token);
            await client.post(`/proposals/${proposal.id}/decline`, {
                response_notes: responseNotes
            });

            // Success - redirect to proposals list with success message
            router.push('/proposals?success=declined');
        } catch (err: any) {
            setError(err.message || 'Failed to decline proposal');
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

            {/* Response Deadline Warning */}
            {dueStatus.urgent && (
                <div className={`alert ${dueStatus.color === 'text-error' ? 'alert-error' : 'alert-warning'}`}>
                    <i className="fa-solid fa-clock"></i>
                    <div>
                        <div className="font-semibold">
                            {dueStatus.text === 'Overdue' ? 'Response Overdue!' : 'Urgent Response Needed'}
                        </div>
                        <p className="text-sm mt-1">
                            {dueStatus.text === 'Overdue'
                                ? 'This proposal response is overdue. Please respond as soon as possible.'
                                : `You have ${dueStatus.text} to respond to this proposal.`
                            }
                        </p>
                    </div>
                </div>
            )}

            {/* Proposal Context */}
            {proposal.proposal_notes && (
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title text-xl">
                            <i className="fa-solid fa-comment-dots text-info mr-2"></i>
                            Proposal Context
                        </h2>
                        <div className="divider my-2"></div>
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <div className="text-sm text-base-content/60 mb-2">
                                    <i className="fa-solid fa-calendar-plus mr-1"></i>
                                    Proposed {formatDate(proposal.proposed_at)}
                                    <span className="mx-2">•</span>
                                    <span className={dueStatus.color}>
                                        <i className="fa-solid fa-clock mr-1"></i>
                                        {dueStatus.text}
                                    </span>
                                </div>
                                <div className="p-4 bg-base-200/50 rounded-lg">
                                    <p className="text-base-content/80 whitespace-pre-wrap">{proposal.proposal_notes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Job & Candidate Info */}
            <div className="card bg-base-100 shadow">
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
                                {job.salary_min && job.salary_max && (
                                    <p className="text-sm text-base-content/60 mt-1">
                                        <i className="fa-solid fa-dollar-sign mr-1"></i>
                                        ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
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
                                {candidate.current_title && (
                                    <p className="text-sm text-base-content/60 mb-1">
                                        <i className="fa-solid fa-briefcase mr-1"></i> {candidate.current_title}
                                        {candidate.current_company && ` at ${candidate.current_company}`}
                                    </p>
                                )}
                                {candidate.linkedin_url && (
                                    <div className="text-sm text-primary inline-flex items-center gap-1 mt-1">
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
            {documentsList.length > 0 && (
                <div className="card bg-base-100 shadow">
                    <div className="card-body">
                        <h2 className="card-title text-xl">
                            <i className="fa-solid fa-file-pdf text-error mr-2"></i>
                            Candidate Documents
                        </h2>
                        <div className="divider my-2"></div>
                        <div className="space-y-3">
                            {documentsList.map((doc: any) => (
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
                                                        Primary Resume
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
                    </div>
                </div>
            )}

            {/* Response Notes */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <h2 className="card-title text-xl">
                        <i className="fa-solid fa-pen-to-square text-success mr-2"></i>
                        Your Response
                    </h2>
                    <div className="divider my-2"></div>
                    <div className="alert alert-info mb-4">
                        <i className="fa-solid fa-lightbulb"></i>
                        <span className="text-sm">
                            {responseNotes.trim()
                                ? 'Add notes about your decision. Required for declining, optional for accepting.'
                                : 'Add notes about why you are accepting or declining this proposal (required for decline).'
                            }
                        </span>
                    </div>
                    <div className="fieldset">
                        <label className="label">Response Notes</label>
                        <textarea
                            className="textarea h-32 w-full"
                            value={responseNotes}
                            onChange={(e) => setResponseNotes(e.target.value)}
                            placeholder="Example: This candidate's experience aligns well with the role requirements. I'm confident they would be a strong fit for the team..."
                        />
                    </div>
                </div>
            </div>

            {/* Decision Actions */}
            <div className="card bg-base-100 shadow">
                <div className="card-body">
                    <div className="alert alert-warning mb-4">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <div>
                            <div className="font-semibold">Important Decision</div>
                            <p className="text-sm mt-1">
                                Accepting this proposal means you will work with this candidate for this specific role.
                                Declining will notify the proposer and free up the opportunity for other recruiters.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-3 justify-between mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost order-last sm:order-first"
                            onClick={() => router.back()}
                            disabled={submitting}
                        >
                            <i className="fa-solid fa-arrow-left"></i>
                            Back
                        </button>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                className="btn btn-error btn-lg"
                                onClick={handleDecline}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Declining...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-times"></i>
                                        Decline Proposal
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                className="btn btn-success btn-lg"
                                onClick={handleAccept}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        Accept Proposal
                                    </>
                                )}
                            </button>
                        </div>
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
        </div>
    );
}
