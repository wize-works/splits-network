'use client';

import { useState } from 'react';

interface Proposal {
    id: string;
    job_id: string;
    candidate_id: string;
    recruiter_id: string;
    proposed_by?: string;
    proposal_notes?: string;
    status: 'proposed' | 'accepted' | 'declined' | 'timedout';
    response_due_at: string;
    proposed_at: string;
    response_notes?: string;
    responded_at?: string;
}

interface ProposalCardProps {
    proposal: Proposal;
    jobTitle?: string;
    candidateName?: string;
    onAccept?: (proposalId: string, notes: string) => Promise<void>;
    onDecline?: (proposalId: string, notes: string) => Promise<void>;
}

export default function ProposalCard({
    proposal,
    jobTitle,
    candidateName,
    onAccept,
    onDecline
}: ProposalCardProps) {
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [responseNotes, setResponseNotes] = useState('');
    const [responding, setResponding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'proposed':
                return <span className="badge badge-warning gap-1">
                    <i className="fa-solid fa-clock"></i>
                    Pending Response
                </span>;
            case 'accepted':
                return <span className="badge badge-success gap-1">
                    <i className="fa-solid fa-check"></i>
                    Accepted
                </span>;
            case 'declined':
                return <span className="badge badge-error gap-1">
                    <i className="fa-solid fa-times"></i>
                    Declined
                </span>;
            case 'timedout':
                return <span className="badge badge-ghost gap-1">
                    <i className="fa-solid fa-hourglass-end"></i>
                    Timed Out
                </span>;
            default:
                return <span className="badge">{status}</span>;
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

    const handleAccept = async () => {
        if (!onAccept) return;
        
        setResponding(true);
        setError(null);
        
        try {
            await onAccept(proposal.id, responseNotes);
            setShowResponseForm(false);
        } catch (err: any) {
            setError(err.message || 'Failed to accept proposal');
        } finally {
            setResponding(false);
        }
    };

    const handleDecline = async () => {
        if (!onDecline) return;
        
        if (!responseNotes.trim()) {
            setError('Please provide a reason for declining');
            return;
        }

        setResponding(true);
        setError(null);
        
        try {
            await onDecline(proposal.id, responseNotes);
            setShowResponseForm(false);
        } catch (err: any) {
            setError(err.message || 'Failed to decline proposal');
        } finally {
            setResponding(false);
        }
    };

    const isPending = proposal.status === 'proposed';
    const dueStatus = isPending ? getDueStatus() : null;

    return (
        <div className={`card bg-base-100 border ${dueStatus?.urgent ? 'border-warning' : 'border-base-300'} shadow-sm`}>
            <div className="card-body">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">
                                {candidateName || 'Candidate'} → {jobTitle || 'Role'}
                            </h3>
                            {getStatusBadge(proposal.status)}
                        </div>
                        
                        {proposal.proposal_notes && (
                            <div className="bg-base-200 rounded-lg p-3 mb-3">
                                <div className="text-xs font-semibold text-base-content/60 mb-1">Proposal Notes</div>
                                <div className="text-sm">{proposal.proposal_notes}</div>
                            </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-base-content/60">
                            <div>
                                <i className="fa-solid fa-calendar-plus mr-1"></i>
                                Proposed {formatDate(proposal.proposed_at)}
                            </div>
                            {isPending && dueStatus && (
                                <div className={dueStatus.color}>
                                    <i className="fa-solid fa-clock mr-1"></i>
                                    {dueStatus.text}
                                </div>
                            )}
                            {proposal.responded_at && (
                                <div>
                                    <i className="fa-solid fa-reply mr-1"></i>
                                    Responded {formatDate(proposal.responded_at)}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Show response form if pending and user clicked respond */}
                {isPending && showResponseForm && (
                    <div className="space-y-3 mt-4 p-4 bg-base-200 rounded-lg">
                        {error && (
                            <div className="alert alert-error py-2">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        <div className="fieldset">
                            <label className="label">Response Notes</label>
                            <textarea
                                className="textarea h-20"
                                value={responseNotes}
                                onChange={(e) => setResponseNotes(e.target.value)}
                                placeholder="Add notes about your decision..."
                                disabled={responding}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                className="btn btn-sm"
                                onClick={() => setShowResponseForm(false)}
                                disabled={responding}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-sm btn-error"
                                onClick={handleDecline}
                                disabled={responding}
                            >
                                {responding ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Declining...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-times"></i>
                                        Decline
                                    </>
                                )}
                            </button>
                            <button
                                className="btn btn-sm btn-success"
                                onClick={handleAccept}
                                disabled={responding}
                            >
                                {responding ? (
                                    <>
                                        <span className="loading loading-spinner loading-xs"></span>
                                        Accepting...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-check"></i>
                                        Accept
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Show action buttons if pending and form not shown */}
                {isPending && !showResponseForm && onAccept && onDecline && (
                    <div className="flex gap-2 mt-4">
                        <button
                            className="btn btn-primary flex-1"
                            onClick={() => setShowResponseForm(true)}
                        >
                            <i className="fa-solid fa-reply"></i>
                            Respond to Proposal
                        </button>
                    </div>
                )}

                {/* Show response notes if already responded */}
                {!isPending && proposal.response_notes && (
                    <div className="bg-base-200 rounded-lg p-3 mt-3">
                        <div className="text-xs font-semibold text-base-content/60 mb-1">Response</div>
                        <div className="text-sm">{proposal.response_notes}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
