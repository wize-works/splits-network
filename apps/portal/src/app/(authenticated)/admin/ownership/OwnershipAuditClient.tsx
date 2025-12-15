'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface CandidateSourcer {
    id: string;
    candidate_id: string;
    sourcer_user_id: string;
    sourcer_type: 'recruiter' | 'tsn';
    sourced_at: string;
    protection_window_days: number;
    protection_expires_at: string;
    notes?: string;
    created_at: string;
}

interface Candidate {
    id: string;
    email: string;
    full_name: string;
    linkedin_url?: string;
}

interface OwnershipRecord extends CandidateSourcer {
    candidate?: Candidate;
    sourcer_name?: string;
    is_expired: boolean;
    days_remaining?: number;
}

export default function OwnershipAuditClient() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [ownerships, setOwnerships] = useState<OwnershipRecord[]>([]);
    const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOwnerships();
    }, []);

    async function loadOwnerships() {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                return;
            }
            const client = createAuthenticatedClient(token);

            // Fetch all candidate sourcers
            const response = await client.get('/candidates/sourcers');
            const sourcers = response.data || [];

            // Enrich with candidate and user data
            const enriched = await Promise.all(
                sourcers.map(async (sourcer: CandidateSourcer) => {
                    try {
                        const candidateResponse = await client.get(`/candidates/${sourcer.candidate_id}`);
                        const candidate = candidateResponse.data;

                        const expiresAt = new Date(sourcer.protection_expires_at);
                        const now = new Date();
                        const isExpired = expiresAt < now;
                        const daysRemaining = isExpired ? 0 : Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                        return {
                            ...sourcer,
                            candidate,
                            is_expired: isExpired,
                            days_remaining: daysRemaining,
                        };
                    } catch (err) {
                        return {
                            ...sourcer,
                            is_expired: new Date(sourcer.protection_expires_at) < new Date(),
                        };
                    }
                })
            );

            setOwnerships(enriched);
        } catch (err: any) {
            console.error('Failed to load ownership data:', err);
            setError(err.message || 'Failed to load ownership data');
        } finally {
            setLoading(false);
        }
    }

    const filteredOwnerships = ownerships.filter((o) => {
        if (filter === 'active') return !o.is_expired;
        if (filter === 'expired') return o.is_expired;
        return true;
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
                    <h1 className="text-3xl font-bold">Ownership Audit</h1>
                    <p className="text-base-content/70 mt-2">
                        Review candidate sourcing and ownership protection windows
                    </p>
                </div>
                <button onClick={loadOwnerships} className="btn btn-outline">
                    <i className="fa-solid fa-rotate"></i>
                    Refresh
                </button>
            </div>

            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Filters */}
            <div className="tabs tabs-boxed bg-base-200">
                <button
                    className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({ownerships.length})
                </button>
                <button
                    className={`tab ${filter === 'active' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    Active ({ownerships.filter((o) => !o.is_expired).length})
                </button>
                <button
                    className={`tab ${filter === 'expired' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('expired')}
                >
                    Expired ({ownerships.filter((o) => o.is_expired).length})
                </button>
            </div>

            {/* Ownership Table */}
            <div className="card bg-base-100 shadow-xl">
                <div className="card-body p-0">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Sourcer Type</th>
                                    <th>Sourced Date</th>
                                    <th>Protection Status</th>
                                    <th>Expires</th>
                                    <th>Notes</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredOwnerships.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-base-content/50">
                                            No ownership records found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOwnerships.map((ownership) => (
                                        <tr key={ownership.id}>
                                            <td>
                                                <div>
                                                    <div className="font-semibold">
                                                        {ownership.candidate?.full_name || 'Unknown'}
                                                    </div>
                                                    <div className="text-sm text-base-content/70">
                                                        {ownership.candidate?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${ownership.sourcer_type === 'tsn' ? 'badge-primary' : 'badge-neutral'}`}>
                                                    {ownership.sourcer_type === 'tsn' ? 'TSN' : 'Recruiter'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-sm">
                                                    {new Date(ownership.sourced_at).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td>
                                                {ownership.is_expired ? (
                                                    <span className="badge badge-ghost">
                                                        <i className="fa-solid fa-clock mr-1"></i>
                                                        Expired
                                                    </span>
                                                ) : (
                                                    <span className="badge badge-success">
                                                        <i className="fa-solid fa-shield-halved mr-1"></i>
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="text-sm">
                                                    {new Date(ownership.protection_expires_at).toLocaleDateString()}
                                                    {!ownership.is_expired && ownership.days_remaining && (
                                                        <div className="text-xs text-base-content/70">
                                                            {ownership.days_remaining} days remaining
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm text-base-content/70 max-w-xs truncate">
                                                    {ownership.notes || '-'}
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn btn-sm btn-ghost">
                                                    <i className="fa-solid fa-eye"></i>
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Statistics Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Total Ownerships</div>
                    <div className="stat-value text-primary">{ownerships.length}</div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Active Protections</div>
                    <div className="stat-value text-success">
                        {ownerships.filter((o) => !o.is_expired).length}
                    </div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">Expired</div>
                    <div className="stat-value text-base-content/50">
                        {ownerships.filter((o) => o.is_expired).length}
                    </div>
                </div>
                <div className="stat bg-base-100 shadow rounded-lg">
                    <div className="stat-title">TSN Sourced</div>
                    <div className="stat-value text-accent">
                        {ownerships.filter((o) => o.sourcer_type === 'tsn').length}
                    </div>
                </div>
            </div>
        </div>
    );
}
