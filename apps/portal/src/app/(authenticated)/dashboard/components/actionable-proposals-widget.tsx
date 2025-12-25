'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ApiClient } from '@/lib/api-client';
import { UnifiedProposal } from '@splits-network/shared-types';
import Link from 'next/link';

interface ActionableProposalsWidgetProps {
    compact?: boolean;
}

/**
 * Dashboard widget showing proposals requiring user action.
 * Uses the unified proposals system.
 * 
 * @see docs/guidance/unified-proposals-system.md
 */
export default function ActionableProposalsWidget({ compact = true }: ActionableProposalsWidgetProps) {
    const { getToken } = useAuth();
    const [proposals, setProposals] = useState<UnifiedProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                throw new Error('No authentication token available');
            }

            const apiClient = new ApiClient(undefined, token);

            // Fetch proposals requiring action (first 5 for dashboard)
            const response = await apiClient.get<{ data: { data: UnifiedProposal[] } }>(
                '/proposals?state=actionable&limit=5'
            );

            setProposals(response.data.data || []);
        } catch (err) {
            console.error('Error fetching actionable proposals:', err);
            setError(
                err instanceof Error ? err.message : 'Failed to load proposals'
            );
        } finally {
            setLoading(false);
        }
    };

    const getProposalTypeLabel = (type: string): string => {
        switch (type) {
            case 'job_opportunity':
                return 'Job Opportunity';
            case 'application_screen':
                return 'Candidate Screen';
            case 'application_review':
                return 'Application Review';
            case 'collaboration':
                return 'Collaboration';
            default:
                return type;
        }
    };

    const getProposalIcon = (type: string): string => {
        switch (type) {
            case 'job_opportunity':
                return 'fa-briefcase';
            case 'application_screen':
                return 'fa-phone';
            case 'application_review':
                return 'fa-file-lines';
            case 'collaboration':
                return 'fa-handshake';
            default:
                return 'fa-circle-info';
        }
    };

    const getTimeRemaining = (dueDate: Date | undefined): string | null => {
        if (!dueDate) return null;

        const now = new Date();
        const due = new Date(dueDate);
        const diffMs = due.getTime() - now.getTime();
        const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

        if (diffHours < 0) return 'Overdue';
        if (diffHours < 24) return `${diffHours}h remaining`;

        const diffDays = Math.ceil(diffHours / 24);
        return `${diffDays}d remaining`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
            </div>
        );
    }

    if (proposals.length === 0) {
        return (
            <div className="alert alert-info">
                <i className="fa-solid fa-circle-check"></i>
                <div>
                    <h3 className="font-bold">All caught up!</h3>
                    <p className="text-sm">
                        No proposals requiring your action at the moment.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Proposals list */}
            {proposals.map((proposal) => {
                const timeRemaining = getTimeRemaining(proposal.action_due_date);
                const isUrgent = proposal.is_urgent;

                return (
                    <Link
                        key={proposal.id}
                        href={`/applications/${proposal.id}`}
                        className={`block card bg-base-100 shadow-sm hover:shadow-md transition-all ${isUrgent ? 'border-2 border-warning' : 'border border-base-300'
                            }`}
                    >
                        <div className="card-body p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div className="grow">
                                    {/* Type badge and urgency indicator */}
                                    <div className="flex items-center gap-2 mb-2">
                                        <i className={`fa-solid ${getProposalIcon(proposal.type)} text-primary`}></i>
                                        <span className="badge badge-sm">
                                            {getProposalTypeLabel(proposal.type)}
                                        </span>
                                        {isUrgent && (
                                            <span className="badge badge-warning badge-sm">
                                                <i className="fa-solid fa-clock mr-1"></i>
                                                Urgent
                                            </span>
                                        )}
                                    </div>

                                    {/* Job title */}
                                    <h3 className="font-semibold text-base mb-1">
                                        {proposal.job_title}
                                    </h3>

                                    {/* Details based on type */}
                                    <div className="text-sm text-base-content/70">
                                        {proposal.type === 'job_opportunity' && (
                                            <p>Opportunity for: <span className="font-medium">{proposal.candidate.name}</span></p>
                                        )}
                                        {proposal.type === 'application_screen' && (
                                            <p>Screen candidate: <span className="font-medium">{proposal.candidate.name}</span></p>
                                        )}
                                        {proposal.type === 'application_review' && (
                                            <p>Review from: <span className="font-medium">{proposal.candidate.name}</span></p>
                                        )}
                                        {proposal.company && (
                                            <p className="text-xs mt-1">
                                                <i className="fa-solid fa-building mr-1"></i>
                                                {proposal.company.name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action label */}
                                    <div className="text-sm text-primary font-medium mt-2">
                                        <i className="fa-solid fa-arrow-right mr-1"></i>
                                        {proposal.action_label}
                                    </div>
                                </div>

                                {/* Time remaining */}
                                {timeRemaining && (
                                    <div className={`text-right text-sm ${isUrgent ? 'text-warning font-semibold' : 'text-base-content/60'}`}>
                                        <i className="fa-solid fa-clock mr-1"></i>
                                        {timeRemaining}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                );
            })}

            {/* View all link */}
            <div className="text-center pt-2">
                <Link href="/proposals" className="text-sm text-primary hover:underline">
                    View all proposals →
                </Link>
            </div>
        </div>
    );
}
