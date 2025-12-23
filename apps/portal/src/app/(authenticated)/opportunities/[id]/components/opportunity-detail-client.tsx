'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    description?: string;
    company: {
        id: string;
        name: string;
    };
}

interface Recruiter {
    id: string;
    user_id: string;
    full_name?: string;
}

interface Opportunity {
    id: string;
    stage: string;
    job: Job;
    recruiter: Recruiter;
    metadata?: {
        recruiter_pitch?: string;
    };
    created_at: string;
    expires_at: string;
}

export default function OpportunityDetailClient() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const params = useParams();
    const opportunityId = params?.id as string;

    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineModal, setShowDeclineModal] = useState(false);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user || !opportunityId) return;

        const fetchOpportunity = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch(`/api/applications/${opportunityId}`);

                if (!response.ok) {
                    throw new Error('Failed to fetch opportunity details');
                }

                const data = await response.json();
                setOpportunity(data.data);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load opportunity details'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunity();
    }, [isLoaded, isSignedIn, user, opportunityId]);

    const getDaysRemaining = (expiresAt: string): number => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            weekday: 'short',
        });
    };

    const handleApprove = async () => {
        if (!opportunityId) return;

        try {
            setActionLoading(true);
            setError(null);

            const response = await fetch(`/api/applications/${opportunityId}/approve-opportunity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to approve opportunity');
            }

            router.push('/opportunities?status=approved');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to approve opportunity');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!opportunityId) return;

        try {
            setActionLoading(true);
            setError(null);

            const response = await fetch(`/api/applications/${opportunityId}/decline-opportunity`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    decline_reason: declineReason,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to decline opportunity');
            }

            router.push('/opportunities?status=declined');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to decline opportunity');
        } finally {
            setActionLoading(false);
            setShowDeclineModal(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error || !opportunity) {
        return (
            <div className="p-6">
                <div className="mb-4">
                    <Link href="/opportunities" className="btn btn-ghost gap-2">
                        <i className="fa-solid fa-chevron-left"></i>
                        Back to Opportunities
                    </Link>
                </div>
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error || 'Opportunity not found'}</span>
                </div>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining(opportunity.expires_at);
    const isExpiring = daysRemaining <= 3;
    const isExpired = daysRemaining === 0;

    return (
        <div className="p-6">
            {/* Back link */}
            <div className="mb-6">
                <Link href="/opportunities" className="btn btn-ghost gap-2">
                    <i className="fa-solid fa-chevron-left"></i>
                    Back to Opportunities
                </Link>
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {isExpired && (
                <div className="alert alert-warning mb-6">
                    <i className="fa-solid fa-triangle-exclamation"></i>
                    <div>
                        <h3 className="font-bold">This opportunity has expired</h3>
                        <p className="text-sm">You can no longer respond to this proposal.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2">
                    {/* Job Header Card */}
                    <div className="card bg-base-100 shadow border border-base-300 mb-6">
                        <div className="card-body">
                            <h1 className="text-3xl font-bold mb-2">{opportunity.job.title}</h1>
                            <p className="text-lg text-base-content/70 mb-4">
                                {opportunity.job.company.name}
                            </p>

                            {opportunity.metadata?.recruiter_pitch && (
                                <div className="bg-base-200 rounded p-4 mb-4">
                                    <p className="text-sm font-semibold text-base-content/60 mb-2">
                                        Recruiter's Note
                                    </p>
                                    <p className="text-base italic">
                                        "{opportunity.metadata.recruiter_pitch}"
                                    </p>
                                </div>
                            )}

                            <div className="divider my-0"></div>

                            <div className="mt-4">
                                <p className="text-sm text-base-content/60 mb-2">
                                    Proposed by{' '}
                                    <span className="font-semibold">
                                        {opportunity.recruiter.full_name || 'a recruiter'}
                                    </span>
                                </p>
                                <p className="text-sm text-base-content/60">
                                    {formatDate(opportunity.created_at)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Job Description Card */}
                    {opportunity.job.description && (
                        <div className="card bg-base-100 shadow border border-base-300">
                            <div className="card-body">
                                <h2 className="card-title mb-4">About This Role</h2>
                                <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap">
                                        {opportunity.job.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Expiration Card */}
                    <div
                        className={`card shadow border mb-6 ${isExpired
                                ? 'bg-error/10 border-error'
                                : isExpiring
                                    ? 'bg-warning/10 border-warning'
                                    : 'bg-info/10 border-info'
                            }`}
                    >
                        <div className="card-body">
                            <h3 className="card-title text-lg">Time Remaining</h3>
                            <div className="text-4xl font-bold my-4">
                                {daysRemaining}
                                <span className="text-lg ml-1">days</span>
                            </div>
                            <p className="text-sm opacity-75">
                                Expires {formatDate(opportunity.expires_at)}
                            </p>
                            {isExpiring && !isExpired && (
                                <p className="text-sm font-semibold text-warning mt-2">
                                    Respond soon!
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {!isExpired && (
                        <div className="space-y-3">
                            <button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="btn btn-primary w-full gap-2"
                            >
                                {actionLoading && (
                                    <span className="loading loading-spinner loading-sm"></span>
                                )}
                                <i className="fa-solid fa-check"></i>
                                Accept Opportunity
                            </button>

                            <button
                                onClick={() => setShowDeclineModal(true)}
                                disabled={actionLoading}
                                className="btn btn-outline w-full gap-2"
                            >
                                <i className="fa-solid fa-times"></i>
                                Decline
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Decline Modal */}
            {showDeclineModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Decline This Opportunity</h3>

                        <div className="fieldset mb-6">
                            <label className="label">
                                Reason for declining (optional)
                            </label>
                            <textarea
                                className="textarea h-24"
                                placeholder="Let the recruiter know why you're passing on this opportunity..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button
                                onClick={() => setShowDeclineModal(false)}
                                className="btn"
                                disabled={actionLoading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDecline}
                                disabled={actionLoading}
                                className="btn btn-error"
                            >
                                {actionLoading && (
                                    <span className="loading loading-spinner loading-sm"></span>
                                )}
                                Confirm Decline
                            </button>
                        </div>
                    </div>
                    <form
                        method="dialog"
                        className="modal-backdrop"
                        onClick={() => !actionLoading && setShowDeclineModal(false)}
                    >
                        <button type="button"></button>
                    </form>
                </div>
            )}
        </div>
    );
}
