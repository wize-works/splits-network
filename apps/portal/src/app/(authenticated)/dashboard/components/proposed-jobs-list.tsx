'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';

interface ProposedJob {
    id: string;
    job_id: string;
    job_title: string;
    candidate_id: string;
    candidate_name: string;
    candidate_email: string;
    stage: string;
    metadata?: {
        recruiter_pitch?: string;
    };
    created_at: string;
    expires_at: string;
}

interface ProposedJobsListProps {
    compact?: boolean;
}

export default function ProposedJobsList({ compact = false }: ProposedJobsListProps) {
    const { user, isLoaded, isSignedIn } = useUser();
    const [jobs, setJobs] = useState<ProposedJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const fetchProposedJobs = async () => {
            try {
                setLoading(true);
                setError(null);

                const recruiterId = user.id;
                const response = await fetch(
                    `/api/recruiters/${recruiterId}/proposed-jobs`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch proposed jobs');
                }

                const data = await response.json();
                setJobs(data.data?.applications || []);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load proposed jobs'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchProposedJobs();
    }, [isLoaded, isSignedIn, user]);

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
        });
    };

    const getStatusBadge = (stage: string) => {
        switch (stage) {
            case 'recruiter_proposed':
                return 'badge-info';
            case 'approved':
                return 'badge-success';
            case 'declined':
                return 'badge-error';
            case 'expired':
                return 'badge-warning';
            default:
                return 'badge';
        }
    };

    const getStatusLabel = (stage: string) => {
        switch (stage) {
            case 'recruiter_proposed':
                return 'Pending Response';
            case 'approved':
                return 'Approved';
            case 'declined':
                return 'Declined';
            case 'expired':
                return 'Expired';
            default:
                return stage;
        }
    };

    const filteredJobs = statusFilter === 'all'
        ? jobs
        : jobs.filter(job => job.stage === statusFilter);

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

    if (jobs.length === 0) {
        return (
            <div className="alert alert-info">
                <i className="fa-solid fa-lightbulb"></i>
                <div>
                    <h3 className="font-bold">No proposed jobs yet</h3>
                    <p className="text-sm">
                        Start proposing candidates by visiting their profile or finding jobs to fill.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter buttons (only show in full view) */}
            {!compact && (
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setStatusFilter('all')}
                        className={`btn btn-sm ${statusFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        All ({jobs.length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('recruiter_proposed')}
                        className={`btn btn-sm ${statusFilter === 'recruiter_proposed' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Pending ({jobs.filter(j => j.stage === 'recruiter_proposed').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('approved')}
                        className={`btn btn-sm ${statusFilter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Approved ({jobs.filter(j => j.stage === 'approved').length})
                    </button>
                    <button
                        onClick={() => setStatusFilter('declined')}
                        className={`btn btn-sm ${statusFilter === 'declined' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Declined ({jobs.filter(j => j.stage === 'declined').length})
                    </button>
                </div>
            )}

            {/* Jobs list */}
            <div className="space-y-3">
                {filteredJobs.map((job) => {
                    const daysRemaining = getDaysRemaining(job.expires_at);
                    const isExpiring = daysRemaining <= 3 && job.stage === 'recruiter_proposed';

                    return (
                        <div
                            key={job.id}
                            className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow"
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="grow">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="card-title text-base">{job.job_title}</h3>
                                            <span
                                                className={`badge ${getStatusBadge(job.stage)}`}
                                            >
                                                {getStatusLabel(job.stage)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-base-content/70 mb-2">
                                            Candidate:{' '}
                                            <span className="font-semibold">
                                                {job.candidate_name}
                                            </span>
                                        </p>
                                        {job.metadata?.recruiter_pitch && !compact && (
                                            <p className="text-sm italic text-base-content/60 mb-2">
                                                "{job.metadata.recruiter_pitch}"
                                            </p>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <div className="text-sm text-base-content/60 mb-2">
                                            {job.stage === 'recruiter_proposed' && (
                                                <div className={isExpiring ? 'text-warning font-semibold' : ''}>
                                                    {daysRemaining} days remaining
                                                </div>
                                            )}
                                            {job.stage !== 'recruiter_proposed' && (
                                                <div>{formatDate(job.created_at)}</div>
                                            )}
                                        </div>
                                        <Link
                                            href={`/candidates/${job.candidate_id}`}
                                            className="btn btn-sm btn-outline"
                                        >
                                            View
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!compact && filteredJobs.length > 0 && (
                <div className="divider my-0"></div>
            )}
        </div>
    );
}
