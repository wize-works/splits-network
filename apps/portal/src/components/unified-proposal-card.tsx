'use client';

import { useState } from 'react';
import { UnifiedProposal } from '@splits-network/shared-types';

interface UnifiedProposalCardProps {
    proposal: UnifiedProposal;
    onAccept?: (proposalId: string, notes: string) => Promise<void>;
    onDecline?: (proposalId: string, notes: string) => Promise<void>;
    onClick?: (proposalId: string) => void;
}

/**
 * Unified Proposal Card
 * 
 * Adaptive component that displays any proposal type with appropriate
 * layout and actions based on workflow and user role.
 * 
 * @see docs/guidance/unified-proposals-system.md
 */
export default function UnifiedProposalCard({
    proposal,
    onAccept,
    onDecline,
    onClick
}: UnifiedProposalCardProps) {
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [responseNotes, setResponseNotes] = useState('');
    const [responding, setResponding] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const formatDate = (date: string | Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getUrgencyBadge = () => {
        if (proposal.is_overdue) {
            return (
                <span className="badge badge-error gap-1">
                    <i className="fa-solid fa-exclamation-triangle"></i>
                    Overdue
                </span>
            );
        }
        if (proposal.is_urgent) {
            return (
                <span className="badge badge-warning gap-1">
                    <i className="fa-solid fa-clock"></i>
                    {Math.round(proposal.hours_remaining || 0)}h left
                </span>
            );
        }
        return null;
    };

    const handleAccept = async () => {
        if (!onAccept) return;

        setResponding(true);
        setError(null);

        try {
            await onAccept(proposal.id, responseNotes);
            setShowResponseForm(false);
            setResponseNotes('');
        } catch (err: any) {
            setError(err.message || 'Failed to accept proposal');
        } finally {
            setResponding(false);
        }
    };

    const handleDecline = async () => {
        if (!onDecline) return;

        setResponding(true);
        setError(null);

        try {
            await onDecline(proposal.id, responseNotes);
            setShowResponseForm(false);
            setResponseNotes('');
        } catch (err: any) {
            setError(err.message || 'Failed to decline proposal');
        } finally {
            setResponding(false);
        }
    };

    const handleCardClick = () => {
        if (onClick && !showResponseForm) {
            onClick(proposal.id);
        }
    };

    return (
        <div
            className={`card bg-base-100 shadow hover:shadow transition-shadow ${onClick && !showResponseForm ? 'cursor-pointer' : ''}`}
            onClick={handleCardClick}
        >
            <div className="card-body">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                        <h3 className="card-title text-base">
                            {proposal.job_title}
                        </h3>
                        <p className="text-sm text-base-content/60">
                            {proposal.subtitle}
                        </p>
                    </div>
                    <div className="flex gap-2 items-start flex-shrink-0">
                        {getUrgencyBadge()}
                        <span className={`badge gap-1 badge-${proposal.status_badge.color}`}>
                            <i className={`fa-solid fa-${proposal.status_badge.icon}`}></i>
                            {proposal.status_badge.text}
                        </span>
                    </div>
                </div>

                {/* Candidate Info */}
                <div className="flex items-center gap-2 text-sm mb-2">
                    <div className="avatar avatar-placeholder">
                        <div className="bg-neutral text-neutral-content rounded-full w-8">
                            <span className="text-xs">{proposal.candidate.name.charAt(0)}</span>
                        </div>
                    </div>
                    <div>
                        <div className="font-medium">{proposal.candidate.name}</div>
                        {proposal.candidate.email && (
                            <div className="text-xs text-base-content/60">{proposal.candidate.email}</div>
                        )}
                    </div>
                </div>

                {/* Job Location */}
                {proposal.job_location && (
                    <div className="text-sm text-base-content/60 mb-2">
                        <i className="fa-solid fa-location-dot mr-1"></i>
                        {proposal.job_location}
                    </div>
                )}

                {/* Proposal Notes */}
                {proposal.proposal_notes && (
                    <div className="text-sm bg-base-200 p-3 rounded-lg mb-2">
                        <div className="font-medium mb-1 text-xs text-base-content/70">
                            {proposal.type === 'job_opportunity' ? 'Recruiter Notes:' : 'Notes:'}
                        </div>
                        <p className="whitespace-pre-wrap">{proposal.proposal_notes}</p>
                    </div>
                )}

                {/* AI Analysis (if available) */}
                {proposal.ai_analysis && (
                    <div className="text-sm bg-info/10 border border-info/20 p-3 rounded-lg mb-2">
                        <div className="font-medium mb-1 text-xs text-info flex items-center gap-1">
                            <i className="fa-solid fa-robot"></i>
                            AI Analysis
                        </div>
                        <p className="text-base-content/80">{proposal.ai_analysis.recommendation || 'Analysis available'}</p>
                    </div>
                )}

                {/* Action Area */}
                {proposal.can_current_user_act && !showResponseForm && (
                    <div className="card-actions justify-end mt-2">
                        <a
                            href={`/proposals/${proposal.id}/screen`}
                            className="btn btn-sm btn-primary"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fa-solid fa-user-check"></i>
                            Screen Proposal
                        </a>
                    </div>
                )}

                {/* Response Form */}
                {showResponseForm && (
                    <div
                        className="mt-4 space-y-3"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {error && (
                            <div className="alert alert-error">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="fieldset">
                            <label className="label">Your Response (optional)</label>
                            <textarea
                                className="textarea h-20 w-full"
                                placeholder="Add notes about your decision..."
                                value={responseNotes}
                                onChange={(e) => setResponseNotes(e.target.value)}
                                disabled={responding}
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                className="btn btn-sm"
                                onClick={() => {
                                    setShowResponseForm(false);
                                    setResponseNotes('');
                                    setError(null);
                                }}
                                disabled={responding}
                            >
                                Cancel
                            </button>
                            {onDecline && (
                                <button
                                    className="btn btn-sm btn-error"
                                    onClick={handleDecline}
                                    disabled={responding}
                                >
                                    {responding ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Declining...
                                        </>
                                    ) : (
                                        'Decline'
                                    )}
                                </button>
                            )}
                            {onAccept && (
                                <button
                                    className="btn btn-sm btn-success"
                                    onClick={handleAccept}
                                    disabled={responding}
                                >
                                    {responding ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Accepting...
                                        </>
                                    ) : (
                                        'Accept'
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-base-content/50 mt-2 border-t border-base-300 pt-2">
                    <div className="flex justify-between">
                        <span>Created: {formatDate(proposal.created_at)}</span>
                        {proposal.action_due_date && (
                            <span className={proposal.is_overdue ? 'text-error' : ''}>
                                Due: {formatDate(proposal.action_due_date)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
