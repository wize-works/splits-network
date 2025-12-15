'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import RecruiterReputationBadge from '@/components/RecruiterReputationBadge';

interface RecruiterReputation {
    recruiter_user_id: string;
    total_submissions: number;
    total_hires: number;
    total_completions: number;
    total_failures: number;
    hire_rate: number;
    completion_rate: number;
    avg_time_to_hire_days?: number;
    avg_response_time_hours?: number;
    quality_score?: number;
    // Additional fields from database
    recruiter_id?: string;
    total_placements?: number;
    completed_placements?: number;
    failed_placements?: number;
    total_collaborations?: number;
    collaboration_rate?: number;
    proposals_accepted?: number;
    proposals_declined?: number;
    proposals_timed_out?: number;
    reputation_score?: number;
    last_calculated_at?: string;
    created_at?: string;
    updated_at?: string;
}

interface Recruiter {
    id: string;
    user_id: string;
    status: string;
    bio?: string;
    created_at: string;
    updated_at: string;
}

interface RecruiterWithReputation {
    recruiter: Recruiter;
    reputation: RecruiterReputation;
    user_name?: string;
}

export default function ReputationManagementClient() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [recruiters, setRecruiters] = useState<RecruiterWithReputation[]>([]);
    const [sortBy, setSortBy] = useState<'reputation_score' | 'hire_rate' | 'completion_rate'>('reputation_score');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadRecruitersWithReputation();
    }, []);

    async function loadRecruitersWithReputation() {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                return;
            }
            const client = createAuthenticatedClient(token);

            // Fetch all recruiters
            const recruitersResponse = await client.get('/recruiters');
            const allRecruiters = recruitersResponse.data || [];

            // Fetch reputation for each recruiter
            const enriched = await Promise.all(
                allRecruiters.map(async (recruiter: Recruiter) => {
                    try {
                        const reputationResponse = await client.get(`/recruiters/${recruiter.id}/reputation`);
                        const reputation = reputationResponse.data;

                        return {
                            recruiter,
                            reputation,
                        };
                    } catch (err) {
                        // Recruiter might not have reputation yet
                        return {
                            recruiter,
                            reputation: {
                                recruiter_id: recruiter.id,
                                total_submissions: 0,
                                total_hires: 0,
                                total_placements: 0,
                                completed_placements: 0,
                                failed_placements: 0,
                                total_collaborations: 0,
                                proposals_accepted: 0,
                                proposals_declined: 0,
                                proposals_timed_out: 0,
                                reputation_score: 50.0,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString(),
                            } as RecruiterReputation,
                        };
                    }
                })
            );

            setRecruiters(enriched);
        } catch (err: any) {
            console.error('Failed to load reputation data:', err);
            setError(err.message || 'Failed to load reputation data');
        } finally {
            setLoading(false);
        }
    }

    async function refreshReputation(recruiterId: string) {
        try {
            const token = await getToken();
            if (!token) return;
            const client = createAuthenticatedClient(token);

            await client.post(`/recruiters/${recruiterId}/reputation/refresh`, {});

            // Reload all data
            await loadRecruitersWithReputation();
        } catch (err: any) {
            console.error('Failed to refresh reputation:', err);
            alert('Failed to refresh reputation: ' + (err.message || 'Unknown error'));
        }
    }

    const sortedRecruiters = [...recruiters].sort((a, b) => {
        const aValue = a.reputation[sortBy] || 0;
        const bValue = b.reputation[sortBy] || 0;
        return bValue - aValue;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Reputation Management</h1>
                    <p className="text-base-content/70 mt-2">
                        Monitor recruiter performance and reputation scores
                    </p>
                </div>
                <button onClick={loadRecruitersWithReputation} className="btn btn-outline">
                    <i className="fa-solid fa-rotate"></i>
                    Refresh All
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Sort Controls */}
            <div className="flex gap-2 items-center">
                <span className="font-semibold">Sort by:</span>
                <select
                    className="select select-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                >
                    <option value="reputation_score">Overall Score</option>
                    <option value="hire_rate">Hire Rate</option>
                    <option value="completion_rate">Completion Rate</option>
                </select>
            </div>

            {/* Recruiters Table */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Recruiter</th>
                                    <th>Overall Score</th>
                                    <th>Submissions</th>
                                    <th>Hire Rate</th>
                                    <th>Completion Rate</th>
                                    <th>Collaborations</th>
                                    <th>Response Time</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedRecruiters.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="text-center py-8 text-base-content/50">
                                            No recruiters found
                                        </td>
                                    </tr>
                                ) : (
                                    sortedRecruiters.map((item, index) => (
                                        <tr key={item.recruiter.id}>
                                            <td>
                                                <div className="font-bold text-lg">#{index + 1}</div>
                                            </td>
                                            <td>
                                                <div>
                                                    <div className="font-semibold">
                                                        Recruiter {item.recruiter.id.slice(0, 8)}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        Status: <span className={`badge badge-sm ${item.recruiter.status === 'active' ? 'badge-success' : 'badge-ghost'}`}>
                                                            {item.recruiter.status}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <RecruiterReputationBadge
                                                    reputation={item.reputation}
                                                />
                                            </td>
                                            <td>
                                                <div className="text-center">
                                                    <div className="font-semibold">
                                                        {item.reputation.total_submissions}
                                                    </div>
                                                    <div className="text-xs text-base-content/70">
                                                        {item.reputation.total_hires} hires
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-center">
                                                    {item.reputation.hire_rate !== undefined
                                                        ? `${(item.reputation.hire_rate * 100).toFixed(1)}%`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-center">
                                                    <div className="font-semibold">
                                                        {item.reputation.completion_rate !== undefined
                                                            ? `${(item.reputation.completion_rate * 100).toFixed(1)}%`
                                                            : '-'}
                                                    </div>
                                                    <div className="text-xs text-base-content/70">
                                                        {item.reputation.completed_placements}/{item.reputation.total_placements}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-center">
                                                    {item.reputation.total_collaborations}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-center">
                                                    {item.reputation.avg_response_time_hours !== undefined
                                                        ? `${item.reputation.avg_response_time_hours.toFixed(1)}h`
                                                        : '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => refreshReputation(item.recruiter.id)}
                                                        className="btn btn-xs btn-ghost"
                                                        title="Recalculate reputation"
                                                    >
                                                        <i className="fa-solid fa-rotate"></i>
                                                    </button>
                                                    <button className="btn btn-xs btn-ghost" title="View details">
                                                        <i className="fa-solid fa-eye"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Total Recruiters</div>
                    <div className="stat-value text-primary">{recruiters.length}</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Avg Score</div>
                    <div className="stat-value text-success">
                        {recruiters.length > 0
                            ? (
                                  recruiters.reduce((sum, r) => sum + (r.reputation.reputation_score ?? 0), 0) /
                                  recruiters.length
                              ).toFixed(1)
                            : '-'}
                    </div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Total Submissions</div>
                    <div className="stat-value">
                        {recruiters.reduce((sum, r) => sum + r.reputation.total_submissions, 0)}
                    </div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Total Hires</div>
                    <div className="stat-value">
                        {recruiters.reduce((sum, r) => sum + r.reputation.total_hires, 0)}
                    </div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Collaborations</div>
                    <div className="stat-value">
                        {recruiters.reduce((sum, r) => sum + (r.reputation.total_collaborations ?? 0), 0)}
                    </div>
                </div>
            </div>
        </div>
    );
}
