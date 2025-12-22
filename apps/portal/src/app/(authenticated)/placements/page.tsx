'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/use-view-mode';
import Link from 'next/link';

interface Placement {
    id: string;
    job_id: string;
    candidate_id: string;
    company_id: string;
    recruiter_id: string;
    hired_at: string;
    salary: number;
    fee_percentage: number;
    fee_amount: number;
    recruiter_share: number;
    platform_share: number;
    created_at: string;
    updated_at: string;
    // Enriched fields (added client-side)
    candidate_name?: string;
    job_title?: string;
    company_name?: string;
}

interface Candidate {
    id: string;
    name: string;
    email: string;
}

interface Job {
    id: string;
    title: string;
    company_id: string;
}

interface Company {
    id: string;
    name: string;
}

export default function PlacementsPage() {
    const { getToken } = useAuth();
    const [placements, setPlacements] = useState<Placement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useViewMode('placementsViewMode');

    useEffect(() => {
        const fetchPlacements = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = await getToken();
                if (!token) {
                    throw new Error('No authentication token available');
                }

                const client = createAuthenticatedClient(token);

                // Fetch placements
                const placementsResponse = await client.getPlacements() as any;
                const placementsData = (placementsResponse.data || []) as Placement[];

                if (placementsData.length === 0) {
                    setPlacements([]);
                    setLoading(false);
                    return;
                }

                // Extract unique IDs
                const candidateIds = [...new Set(placementsData.map((p: Placement) => p.candidate_id))];
                const jobIds = [...new Set(placementsData.map((p: Placement) => p.job_id))];
                const companyIds = [...new Set(placementsData.map((p: Placement) => p.company_id))];

                // Fetch related entities in parallel
                const [candidatesRes, jobsRes, companiesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/candidates`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(res => res.json()),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/jobs`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(res => res.json()),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/companies`, {
                        headers: { Authorization: `Bearer ${token}` }
                    }).then(res => res.json())
                ]);

                // Create lookup maps
                const candidatesMap = new Map<string, Candidate>(
                    (candidatesRes.data || []).map((c: Candidate) => [c.id, c])
                );
                const jobsMap = new Map<string, Job>(
                    (jobsRes.data || []).map((j: Job) => [j.id, j])
                );
                const companiesMap = new Map<string, Company>(
                    (companiesRes.data || []).map((c: Company) => [c.id, c])
                );

                // Enrich placements with related data
                const enrichedPlacements = placementsData.map((placement: Placement) => ({
                    ...placement,
                    candidate_name: candidatesMap.get(placement.candidate_id)?.name,
                    job_title: jobsMap.get(placement.job_id)?.title,
                    company_name: companiesMap.get(placement.company_id)?.name
                }));

                setPlacements(enrichedPlacements);
            } catch (err) {
                console.error('Error fetching placements:', err);
                setError(err instanceof Error ? err.message : 'Failed to load placements');
            } finally {
                setLoading(false);
            }
        };

        fetchPlacements();
    }, [getToken]);

    // Calculate earnings statistics
    const lifetimeEarnings = placements.reduce((sum, p) => sum + p.recruiter_share, 0);
    const thisYearEarnings = placements
        .filter(p => new Date(p.hired_at).getFullYear() === new Date().getFullYear())
        .reduce((sum, p) => sum + p.recruiter_share, 0);
    const last30DaysEarnings = placements
        .filter(p => {
            const hiredDate = new Date(p.hired_at);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return hiredDate >= thirtyDaysAgo;
        })
        .reduce((sum, p) => sum + p.recruiter_share, 0);

    // Filter placements based on search query
    const filteredPlacements = placements.filter(placement => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            placement.candidate_name?.toLowerCase().includes(query) ||
            placement.job_title?.toLowerCase().includes(query) ||
            placement.company_name?.toLowerCase().includes(query)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading placements...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>Error: {error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">My Placements</h1>
                    <p className="text-base-content/70 mt-1">
                        Track your successful placements and earnings
                    </p>
                </div>
            </div>

            {/* Earnings Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <i className="fa-solid fa-sack-dollar text-3xl"></i>
                        </div>
                        <div className="stat-title">Lifetime Earnings</div>
                        <div className="stat-value text-primary">
                            ${lifetimeEarnings.toLocaleString()}
                        </div>
                        <div className="stat-desc">Total from {placements.length} placements</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <i className="fa-solid fa-calendar-days text-3xl"></i>
                        </div>
                        <div className="stat-title">This Year</div>
                        <div className="stat-value text-secondary">
                            ${thisYearEarnings.toLocaleString()}
                        </div>
                        <div className="stat-desc">January - December {new Date().getFullYear()}</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <i className="fa-solid fa-clock text-3xl"></i>
                        </div>
                        <div className="stat-title">Last 30 Days</div>
                        <div className="stat-value text-accent">
                            ${last30DaysEarnings.toLocaleString()}
                        </div>
                        <div className="stat-desc">Recent activity</div>
                    </div>
                </div>
            </div>

            {/* Filters and View Toggle */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="fieldset flex-1">
                            <label className="label">Search</label>
                            <input
                                type="text"
                                placeholder="Search placements..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input w-full"
                            />
                        </div>
                        <div className="join">
                            <button
                                className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                            <button
                                className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredPlacements.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-trophy text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">
                            {searchQuery ? 'No placements found' : 'No placements yet'}
                        </h3>
                        <p className="text-base-content/70 mt-2">
                            {searchQuery
                                ? 'Try adjusting your search criteria'
                                : 'Your successful placements will appear here'}
                        </p>
                    </div>
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && filteredPlacements.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredPlacements.map((placement) => (
                        <div key={placement.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="card-body">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="badge badge-success badge-lg">
                                        ${placement.recruiter_share.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-base-content/70">
                                        {new Date(placement.hired_at).toLocaleDateString()}
                                    </div>
                                </div>

                                <h3 className="card-title text-xl">
                                    {placement.candidate_name || 'Unknown Candidate'}
                                </h3>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <i className="fa-solid fa-briefcase text-base-content/50 mt-1"></i>
                                        <div>
                                            <div className="font-medium">
                                                {placement.job_title || 'Unknown Role'}
                                            </div>
                                            <div className="text-base-content/70">
                                                {placement.company_name || 'Unknown Company'}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-dollar-sign text-base-content/50"></i>
                                        <span>Salary: ${placement.salary.toLocaleString()}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-percent text-base-content/50"></i>
                                        <span>Fee: {placement.fee_percentage}%</span>
                                    </div>
                                </div>

                                <div className="divider my-2"></div>

                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-base-content/70">
                                        Total Fee: ${placement.fee_amount.toLocaleString()}
                                    </span>
                                    <span className="font-semibold text-success">
                                        Your Share: ${placement.recruiter_share.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && filteredPlacements.length > 0 && (
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Candidate</th>
                                <th>Role</th>
                                <th>Company</th>
                                <th className="text-right">Salary</th>
                                <th className="text-right">Fee %</th>
                                <th className="text-right">Total Fee</th>
                                <th className="text-right">Your Share</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPlacements.map((placement) => (
                                <tr key={placement.id}>
                                    <td>{new Date(placement.hired_at).toLocaleDateString()}</td>
                                    <td className="font-medium">
                                        {placement.candidate_name || 'Unknown Candidate'}
                                    </td>
                                    <td>{placement.job_title || 'Unknown Role'}</td>
                                    <td>{placement.company_name || 'Unknown Company'}</td>
                                    <td className="text-right">
                                        ${placement.salary.toLocaleString()}
                                    </td>
                                    <td className="text-right">{placement.fee_percentage}%</td>
                                    <td className="text-right">
                                        ${placement.fee_amount.toLocaleString()}
                                    </td>
                                    <td className="text-right font-semibold text-success">
                                        ${placement.recruiter_share.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
