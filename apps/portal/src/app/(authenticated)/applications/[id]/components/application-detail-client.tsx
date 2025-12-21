'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useAuth } from '@clerk/nextjs';
import StageUpdateModal from './stage-update-modal';
import AddNoteModal from './add-note-modal';
import ApplicationTimeline from './application-timeline';
import AIReviewPanel from '@/components/ai-review-panel';

interface ApplicationDetailClientProps {
    application: any;
    job: any;
    candidate: any;
    documents: any[];
    preScreenAnswers: any[];
    questions: any[];
    recruiter: any;
    relationship: any;
    auditLogs: any[];
}

const STAGE_LABELS: Record<string, string> = {
    draft: 'Draft',
    ai_review: 'AI Review',
    screen: 'Screening',
    submitted: 'Submitted',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
};

const STAGE_COLORS: Record<string, string> = {
    draft: 'badge-neutral',
    ai_review: 'badge-warning',
    screen: 'badge-info',
    submitted: 'badge-primary',
    interview: 'badge-warning',
    offer: 'badge-success',
    hired: 'badge-success',
    rejected: 'badge-error',
};

export default function ApplicationDetailClient({
    application,
    job,
    candidate,
    documents,
    preScreenAnswers,
    questions,
    recruiter,
    relationship,
    auditLogs,
}: ApplicationDetailClientProps) {
    const router = useRouter();
    const { getToken } = useAuth();
    const [showStageModal, setShowStageModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    // Get token on mount for AI Review Panel
    useState(() => {
        getToken().then(t => setToken(t));
    });

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleStageUpdate = async (newStage: string, notes?: string) => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const client = createAuthenticatedClient(token);
            await client.updateApplicationStage(application.id, newStage, notes);

            setShowStageModal(false);
            router.refresh();
        } catch (error: any) {
            console.error('Failed to update stage:', error);
            alert(error.message || 'Failed to update application stage');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async (note: string) => {
        setLoading(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const client = createAuthenticatedClient(token);
            await client.addApplicationNote(application.id, note);

            setShowNoteModal(false);
            router.refresh();
        } catch (error: any) {
            console.error('Failed to add note:', error);
            alert(error.message || 'Failed to add note');
        } finally {
            setLoading(false);
        }
    };

    const relationshipWarning = relationship && relationship.status !== 'active';

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumbs */}
            <div className="text-sm breadcrumbs mb-4">
                <ul>
                    <li>
                        <Link href="/dashboard">
                            <i className="fa-solid fa-home mr-2"></i>
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link href="/applications">Applications</Link>
                    </li>
                    <li>Application Details</li>
                </ul>
            </div>

            {/* Relationship Warning */}
            {relationshipWarning && (
                <div className="alert alert-warning mb-4">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <h3 className="font-bold">Relationship Status Changed</h3>
                        <div className="text-sm">
                            Your relationship with this candidate is {relationship.status}.
                            Historical data is preserved but you may have limited editing capabilities.
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="card-title text-2xl mb-2">
                                {candidate.full_name} → {job.title}
                            </h1>
                            <div className="flex gap-2 items-center text-sm text-base-content/70">
                                <span>Application ID: {application.id.slice(0, 8)}</span>
                                <span>•</span>
                                <span>Last updated: {formatDate(application.updated_at)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 items-center">
                            <span className={`badge ${STAGE_COLORS[application.stage]} badge-lg`}>
                                {STAGE_LABELS[application.stage]}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowStageModal(true)}
                            className="btn btn-primary gap-2"
                            disabled={loading}
                        >
                            <i className="fa-solid fa-arrow-right-arrow-left"></i>
                            Update Stage
                        </button>
                        <button
                            onClick={() => setShowNoteModal(true)}
                            className="btn btn-outline gap-2"
                            disabled={loading}
                        >
                            <i className="fa-solid fa-note-sticky"></i>
                            Add Note
                        </button>
                        <Link
                            href={`/candidates/${candidate.id}`}
                            className="btn btn-outline gap-2"
                        >
                            <i className="fa-solid fa-user"></i>
                            View Candidate
                        </Link>
                        <Link
                            href={`/roles/${job.id}`}
                            className="btn btn-outline gap-2"
                        >
                            <i className="fa-solid fa-briefcase"></i>
                            View Job
                        </Link>
                        {application.stage === 'screen' && (
                            <Link
                                href={`/applications/${application.id}/review`}
                                className="btn btn-accent gap-2"
                            >
                                <i className="fa-solid fa-clipboard-check"></i>
                                Review & Submit
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Job Details */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-briefcase"></i>
                                Job Details
                            </h2>
                            <div className="space-y-2">
                                <div>
                                    <strong>Title:</strong> {job.title}
                                </div>
                                {job.company && (
                                    <div>
                                        <strong>Company:</strong> {job.company.name}
                                    </div>
                                )}
                                {job.location && (
                                    <div>
                                        <strong>Location:</strong> {job.location}
                                    </div>
                                )}
                                {(job.salary_min || job.salary_max) && (
                                    <div>
                                        <strong>Salary Range:</strong> $
                                        {job.salary_min?.toLocaleString()} - $
                                        {job.salary_max?.toLocaleString()}
                                    </div>
                                )}
                                {job.description && (
                                    <div className="mt-4">
                                        <strong>Description:</strong>
                                        <div className="mt-2 text-sm text-base-content/70 line-clamp-3">
                                            {job.description}
                                        </div>
                                        <Link
                                            href={`/roles/${job.id}`}
                                            className="link link-primary text-sm mt-2 inline-block"
                                        >
                                            View full job posting →
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Candidate Information */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-user"></i>
                                Candidate Information
                            </h2>
                            <div className="space-y-2">
                                <div>
                                    <strong>Name:</strong> {candidate.full_name}
                                </div>
                                <div>
                                    <strong>Email:</strong> {candidate.email}
                                </div>
                                {candidate.phone && (
                                    <div>
                                        <strong>Phone:</strong> {candidate.phone}
                                    </div>
                                )}
                                {candidate.current_title && (
                                    <div>
                                        <strong>Current Title:</strong> {candidate.current_title}
                                    </div>
                                )}
                                {candidate.current_company && (
                                    <div>
                                        <strong>Current Company:</strong> {candidate.current_company}
                                    </div>
                                )}
                                {candidate.linkedin_url && (
                                    <div>
                                        <strong>LinkedIn:</strong>{' '}
                                        <a
                                            href={candidate.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="link link-primary"
                                        >
                                            View Profile
                                        </a>
                                    </div>
                                )}
                                <Link
                                    href={`/candidates/${candidate.id}`}
                                    className="btn btn-sm btn-outline mt-4"
                                >
                                    View Full Profile →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-note-sticky"></i>
                                Notes
                            </h2>

                            {application.notes && (
                                <div className="mb-4">
                                    <h3 className="font-semibold mb-2">Candidate Notes:</h3>
                                    <p className="text-sm text-base-content/70 whitespace-pre-wrap">
                                        {application.notes}
                                    </p>
                                </div>
                            )}

                            {application.recruiter_notes && (
                                <div>
                                    <h3 className="font-semibold mb-2">Recruiter Notes:</h3>
                                    <p className="text-sm text-base-content/70 whitespace-pre-wrap">
                                        {application.recruiter_notes}
                                    </p>
                                </div>
                            )}

                            {!application.notes && !application.recruiter_notes && (
                                <p className="text-sm text-base-content/50 italic">No notes added yet</p>
                            )}
                        </div>
                    </div>

                    {/* Pre-Screen Answers */}
                    {preScreenAnswers && preScreenAnswers.length > 0 && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title">
                                    <i className="fa-solid fa-clipboard-question"></i>
                                    Pre-Screen Responses
                                </h2>
                                <div className="space-y-4">
                                    {preScreenAnswers.map((answer: any, index: number) => {
                                        const question = questions.find((q: any) => q.id === answer.question_id);
                                        return (
                                            <div key={index} className="border-l-4 border-primary pl-4">
                                                <p className="font-semibold mb-1">
                                                    {question?.question || `Question ${index + 1}`}
                                                </p>
                                                <p className="text-sm text-base-content/70">
                                                    {typeof answer.answer === 'string'
                                                        ? answer.answer
                                                        : JSON.stringify(answer.answer)}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column - Sidebar */}
                <div className="space-y-6">
                    {/* Status Card */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-lg">Status</h2>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-sm text-base-content/70 mb-1">Current Stage</div>
                                    <span className={`badge ${STAGE_COLORS[application.stage]} badge-lg`}>
                                        {STAGE_LABELS[application.stage]}
                                    </span>
                                </div>
                                <div>
                                    <div className="text-sm text-base-content/70 mb-1">Created</div>
                                    <div className="text-sm">{formatDate(application.created_at)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-base-content/70 mb-1">Last Updated</div>
                                    <div className="text-sm">{formatDate(application.updated_at)}</div>
                                </div>
                                {application.accepted_by_company && application.accepted_at && (
                                    <div>
                                        <div className="text-sm text-base-content/70 mb-1">Accepted</div>
                                        <div className="text-sm">{formatDate(application.accepted_at)}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AI Review Panel */}
                    {token && (application.ai_reviewed || application.stage === 'ai_review' ||
                        ['screen', 'submitted', 'interview', 'offer', 'hired'].includes(application.stage)) && (
                            <AIReviewPanel
                                applicationId={application.id}
                                token={token}
                                compact={true}
                            />
                        )}

                    {/* Documents Card */}
                    {documents && documents.length > 0 && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title text-lg">
                                    <i className="fa-solid fa-file"></i>
                                    Documents
                                </h2>
                                <div className="space-y-2">
                                    {documents.map((doc: any) => (
                                        <div key={doc.id} className="flex items-center gap-2">
                                            <i className="fa-solid fa-file-pdf text-error"></i>
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="link link-primary text-sm truncate flex-1"
                                            >
                                                {doc.name || 'Document'}
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Actions Card */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-lg">Quick Actions</h2>
                            <div className="space-y-2">
                                {application.stage === 'submitted' && (
                                    <button
                                        onClick={() => handleStageUpdate('interview')}
                                        className="btn btn-sm btn-block btn-success gap-2"
                                        disabled={loading}
                                    >
                                        <i className="fa-solid fa-calendar"></i>
                                        Move to Interview
                                    </button>
                                )}
                                {application.stage === 'interview' && (
                                    <button
                                        onClick={() => handleStageUpdate('offer')}
                                        className="btn btn-sm btn-block btn-success gap-2"
                                        disabled={loading}
                                    >
                                        <i className="fa-solid fa-handshake"></i>
                                        Make Offer
                                    </button>
                                )}
                                {application.stage === 'offer' && (
                                    <button
                                        onClick={() => handleStageUpdate('hired')}
                                        className="btn btn-sm btn-block btn-success gap-2"
                                        disabled={loading}
                                    >
                                        <i className="fa-solid fa-check-circle"></i>
                                        Mark as Hired
                                    </button>
                                )}
                                {!['rejected', 'hired'].includes(application.stage) && (
                                    <button
                                        onClick={() => handleStageUpdate('rejected')}
                                        className="btn btn-sm btn-block btn-error gap-2"
                                        disabled={loading}
                                    >
                                        <i className="fa-solid fa-xmark"></i>
                                        Reject
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Relationship Status */}
                    {relationship && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title text-lg">Relationship</h2>
                                <div className="space-y-2 text-sm">
                                    <div>
                                        <span className="text-base-content/70">Status:</span>{' '}
                                        <span className={`badge ${relationship.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                                            {relationship.status}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-base-content/70">Period:</span>{' '}
                                        {new Date(relationship.relationship_start_date).toLocaleDateString()} - {' '}
                                        {new Date(relationship.relationship_end_date).toLocaleDateString()}
                                    </div>
                                    {relationship.consent_given && (
                                        <div className="text-success">
                                            <i className="fa-solid fa-check mr-1"></i>
                                            Right to Represent consent given
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Application Timeline */}
                    <ApplicationTimeline auditLogs={auditLogs} />
                </div>
            </div>

            {/* Stage Update Modal */}
            {showStageModal && (
                <StageUpdateModal
                    currentStage={application.stage}
                    onClose={() => setShowStageModal(false)}
                    onUpdate={handleStageUpdate}
                    loading={loading}
                />
            )}

            {/* Add Note Modal */}
            {showNoteModal && (
                <AddNoteModal
                    applicationId={application.id}
                    onClose={() => setShowNoteModal(false)}
                    onSave={handleAddNote}
                    loading={loading}
                />
            )}
        </div>
    );
}
