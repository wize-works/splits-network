'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { ApiClient } from '@/lib/api-client';

interface AdminStats {
    totalRecruiters: number;
    activeRecruiters: number;
    pendingRecruiters: number;
    totalJobs: number;
    activeJobs: number;
    totalApplications: number;
    totalPlacements: number;
}

export default function AdminDashboardClient() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = await getToken();
                if (!token) {
                    setError('Unauthorized');
                    setLoading(false);
                    return;
                }

                const client = new ApiClient(undefined, token);
                const response = await client.get('/admin/stats');

                setStats(response.data);
            } catch (err) {
                console.error('Failed to fetch admin stats:', err);
                setError('Failed to load statistics');
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, [getToken]);

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-base-content/70 mt-1">
                    Platform administration and management
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Recruiters */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="fa-solid fa-users text-3xl"></i>
                    </div>
                    <div className="stat-title">Total Recruiters</div>
                    {loading ? (
                        <div className="stat-value">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : (
                        <>
                            <div className="stat-value text-primary">{stats?.totalRecruiters ?? 0}</div>
                            <div className="stat-desc">
                                {stats?.activeRecruiters ?? 0} active, {stats?.pendingRecruiters ?? 0} pending
                            </div>
                        </>
                    )}
                </div>

                {/* Active Jobs */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-secondary">
                        <i className="fa-solid fa-briefcase text-3xl"></i>
                    </div>
                    <div className="stat-title">Active Jobs</div>
                    {loading ? (
                        <div className="stat-value">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : (
                        <>
                            <div className="stat-value text-secondary">{stats?.activeJobs ?? 0}</div>
                            <div className="stat-desc">{stats?.totalJobs ?? 0} total jobs</div>
                        </>
                    )}
                </div>

                {/* Applications */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-accent">
                        <i className="fa-solid fa-file-lines text-3xl"></i>
                    </div>
                    <div className="stat-title">Applications</div>
                    {loading ? (
                        <div className="stat-value">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : (
                        <>
                            <div className="stat-value text-accent">{stats?.totalApplications ?? 0}</div>
                            <div className="stat-desc">All time</div>
                        </>
                    )}
                </div>

                {/* Placements */}
                <div className="stat bg-base-100 shadow-sm rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="fa-solid fa-handshake text-3xl"></i>
                    </div>
                    <div className="stat-title">Placements</div>
                    {loading ? (
                        <div className="stat-value">
                            <span className="loading loading-spinner loading-md"></span>
                        </div>
                    ) : (
                        <>
                            <div className="stat-value text-success">{stats?.totalPlacements ?? 0}</div>
                            <div className="stat-desc">Successful hires</div>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Phase 1 Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Recruiter Management */}
                    <Link href="/admin/recruiters" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <i className="fa-solid fa-user-check text-2xl text-primary"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Recruiter Management</h3>
                                    <p className="text-sm text-base-content/70">
                                        Approve and manage recruiters
                                    </p>
                                </div>
                            </div>
                            {!loading && stats && stats.pendingRecruiters > 0 && (
                                <div className="badge badge-warning gap-2 mt-2">
                                    <i className="fa-solid fa-clock"></i>
                                    {stats.pendingRecruiters} pending approval
                                </div>
                            )}
                        </div>
                    </Link>

                    {/* Role Assignments */}
                    <Link href="/admin/assignments" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                    <i className="fa-solid fa-link text-2xl text-secondary"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Role Assignments</h3>
                                    <p className="text-sm text-base-content/70">
                                        Assign recruiters to roles
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Placement Audit */}
                    <Link href="/admin/placements" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <i className="fa-solid fa-chart-line text-2xl text-success"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Placement Audit</h3>
                                    <p className="text-sm text-base-content/70">
                                        Review all placements
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Phase 2 Management */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Phase 2 Management</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ownership Audit */}
                    <Link href="/admin/ownership" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-lg">
                                    <i className="fa-solid fa-shield-halved text-2xl text-accent"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Ownership Audit</h3>
                                    <p className="text-sm text-base-content/70">
                                        Review candidate ownership and sourcing conflicts
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Reputation Management */}
                    <Link href="/admin/reputation" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-warning/10 rounded-lg">
                                    <i className="fa-solid fa-star text-2xl text-warning"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Reputation Management</h3>
                                    <p className="text-sm text-base-content/70">
                                        Monitor and manage recruiter reputation scores
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Phase 3 Management */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Phase 3: Automation & Intelligence</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Payout Management */}
                    <Link href="/admin/payouts" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-success/10 rounded-lg">
                                    <i className="fa-solid fa-money-bill-transfer text-2xl text-success"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Payout Management</h3>
                                    <p className="text-sm text-base-content/70">
                                        Process and reconcile recruiter payouts
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Automation Controls */}
                    <Link href="/admin/automation" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-info/10 rounded-lg">
                                    <i className="fa-solid fa-robot text-2xl text-info"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Automation Controls</h3>
                                    <p className="text-sm text-base-content/70">
                                        Manage automation rules and executions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Fraud Management */}
                    <Link href="/admin/fraud" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-error/10 rounded-lg">
                                    <i className="fa-solid fa-shield-halved text-2xl text-error"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Fraud Detection</h3>
                                    <p className="text-sm text-base-content/70">
                                        Review and resolve fraud signals
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Marketplace Metrics */}
                    <Link href="/admin/metrics" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <i className="fa-solid fa-chart-line text-2xl text-primary"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Marketplace Health</h3>
                                    <p className="text-sm text-base-content/70">
                                        Platform metrics and health indicators
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* AI Matches */}
                    <Link href="/admin/ai-matches" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-secondary/10 rounded-lg">
                                    <i className="fa-solid fa-wand-magic-sparkles text-2xl text-secondary"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">AI Match Suggestions</h3>
                                    <p className="text-sm text-base-content/70">
                                        Review candidate-role match suggestions
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Decision Audit Log */}
                    <Link href="/admin/decision-log" className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="card-body">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-accent/10 rounded-lg">
                                    <i className="fa-solid fa-clipboard-list text-2xl text-accent"></i>
                                </div>
                                <div>
                                    <h3 className="card-title text-lg">Decision Audit Log</h3>
                                    <p className="text-sm text-base-content/70">
                                        AI and human decision tracking
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
