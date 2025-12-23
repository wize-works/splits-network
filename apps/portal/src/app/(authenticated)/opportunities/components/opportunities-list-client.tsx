'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';

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

export default function OpportunitiesListClient() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !isSignedIn || !user) return;

        const fetchOpportunities = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get candidate ID from user metadata or use user ID as fallback
                const candidateId = user.id;

                const response = await fetch(
                    `/api/candidates/${candidateId}/pending-opportunities`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch opportunities');
                }

                const data = await response.json();
                setOpportunities(data.data?.applications || []);
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : 'Failed to load opportunities'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4">
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2">Your Opportunities</h1>
                <p className="text-base-content/70">
                    Review and respond to job opportunities proposed by recruiters
                </p>
            </div>

            {opportunities.length === 0 ? (
                <div className="alert alert-info">
                    <i className="fa-solid fa-lightbulb"></i>
                    <div>
                        <h3 className="font-bold">No opportunities yet</h3>
                        <p className="text-sm">
                            When recruiters propose opportunities for you, they'll appear here.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {opportunities.map((opportunity) => {
                        const daysRemaining = getDaysRemaining(opportunity.expires_at);
                        const isExpiring = daysRemaining <= 3;

                        return (
                            <Link
                                key={opportunity.id}
                                href={`/opportunities/${opportunity.id}`}
                                className="block"
                            >
                                <div className="card bg-base-100 shadow hover:shadow-lg transition-shadow cursor-pointer border border-base-300">
                                    <div className="card-body">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="grow">
                                                <h2 className="card-title text-xl mb-2">
                                                    {opportunity.job.title}
                                                </h2>
                                                <p className="text-base-content/70 mb-3">
                                                    {opportunity.job.company.name}
                                                </p>

                                                {opportunity.metadata?.recruiter_pitch && (
                                                    <p className="text-sm mb-3 italic">
                                                        "{opportunity.metadata.recruiter_pitch}"
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-base-content/60">
                                                        Proposed by{' '}
                                                        <span className="font-semibold">
                                                            {opportunity.recruiter.full_name ||
                                                                'a recruiter'}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="mb-3">
                                                    <div
                                                        className={`badge ${isExpiring
                                                                ? 'badge-warning'
                                                                : 'badge-info'
                                                            }`}
                                                    >
                                                        {daysRemaining} days left
                                                    </div>
                                                </div>

                                                <div className="text-sm text-base-content/60">
                                                    <p className="mb-2">
                                                        {formatDate(opportunity.created_at)}
                                                    </p>
                                                    <button className="btn btn-sm btn-primary">
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
