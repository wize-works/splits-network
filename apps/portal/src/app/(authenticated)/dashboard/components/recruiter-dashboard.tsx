'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import ProposedJobsList from './proposed-jobs-list';

interface RecruiterStats {
    active_roles: number;
    candidates_in_process: number;
    offers_pending: number;
    placements_this_month: number;
    placements_this_year: number;
    total_earnings_ytd: number;
    pending_payouts: number;
}

interface RecentActivity {
    id: string;
    type: 'application_submitted' | 'stage_changed' | 'offer_extended' | 'placement_created';
    message: string;
    job_title?: string;
    candidate_name?: string;
    timestamp: string;
    link?: string;
}

interface RecruiterDashboardProps {
    token: string;
    profile: any;
}

export default function RecruiterDashboard({ token, profile }: RecruiterDashboardProps) {
    const [stats, setStats] = useState<RecruiterStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [topRoles, setTopRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const api = new ApiClient(undefined, token);

            // Load recruiter stats
            const statsResponse = await api.get<{ data: RecruiterStats }>('/recruiter/dashboard/stats');
            setStats(statsResponse.data);

            // Load recent activity
            const activityResponse = await api.get<{ data: RecentActivity[] }>('/recruiter/dashboard/activity');
            setRecentActivity(activityResponse.data || []);

            // Load top active roles
            const rolesResponse = await api.get<{ data: any[] }>('/roles?limit=5&status=open');
            setTopRoles(rolesResponse.data || []);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'application_submitted': return 'fa-user-plus';
            case 'stage_changed': return 'fa-arrow-right';
            case 'offer_extended': return 'fa-file-contract';
            case 'placement_created': return 'fa-trophy';
            default: return 'fa-circle-info';
        }
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-3xl">
                        Welcome back, {profile.name || 'Recruiter'}!
                    </h2>
                    <p className="text-lg opacity-90">
                        Here's an overview of your recruiting activity.
                    </p>
                </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <i className="fa-solid fa-briefcase text-3xl"></i>
                        </div>
                        <div className="stat-title">Active Roles</div>
                        <div className="stat-value text-primary">{stats?.active_roles || 0}</div>
                        <div className="stat-desc">Roles assigned to you</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <i className="fa-solid fa-users text-3xl"></i>
                        </div>
                        <div className="stat-title">In Process</div>
                        <div className="stat-value text-secondary">{stats?.candidates_in_process || 0}</div>
                        <div className="stat-desc">Active candidates</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <i className="fa-solid fa-file-contract text-3xl"></i>
                        </div>
                        <div className="stat-title">Pending Offers</div>
                        <div className="stat-value text-accent">{stats?.offers_pending || 0}</div>
                        <div className="stat-desc">Awaiting acceptance</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <i className="fa-solid fa-trophy text-3xl"></i>
                        </div>
                        <div className="stat-title">Placements</div>
                        <div className="stat-value text-success">{stats?.placements_this_year || 0}</div>
                        <div className="stat-desc">This year</div>
                    </div>
                </div>
            </div>

            {/* Earnings Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title">
                            <i className="fa-solid fa-chart-line text-success mr-2"></i>
                            Earnings This Year
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-success">
                                ${((stats?.total_earnings_ytd || 0) / 1000).toFixed(1)}k
                            </div>
                            <div className="text-base-content/60">total</div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
                            <div>
                                <div className="text-sm text-base-content/60">This Month</div>
                                <div className="text-xl font-semibold">{stats?.placements_this_month || 0} placements</div>
                            </div>
                            <Link href="/placements" className="btn btn-sm btn-outline btn-success">
                                View Details
                                <i className="fa-solid fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title">
                            <i className="fa-solid fa-money-bill-transfer text-primary mr-2"></i>
                            Pending Payouts
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-primary">
                                ${((stats?.pending_payouts || 0) / 1000).toFixed(1)}k
                            </div>
                            <div className="text-base-content/60">pending</div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
                            <div className="text-sm text-base-content/60">
                                Payments processed after guarantee period
                            </div>
                            <Link href="/earnings" className="btn btn-sm btn-outline btn-primary">
                                View Payouts
                                <i className="fa-solid fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Proposed Jobs + Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Proposed Jobs Preview */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-paper-plane mr-2"></i>
                                    Recent Proposals
                                </h3>
                                <Link href="/proposed-jobs" className="text-sm text-primary hover:underline">
                                    View all →
                                </Link>
                            </div>
                            <ProposedJobsList compact={true} />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title">
                                <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                                Recent Activity
                            </h3>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-12 text-base-content/60">
                                    <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                                    <p>No recent activity</p>
                                    <p className="text-sm">Start by submitting candidates to active roles</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    {recentActivity.slice(0, 8).map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                                        >
                                            <div className="avatar avatar-placeholder">
                                                <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                                                    <i className={`fa-solid ${getActivityIcon(activity.type)}`}></i>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{activity.message}</p>
                                                {activity.job_title && (
                                                    <p className="text-sm text-primary">{activity.job_title}</p>
                                                )}
                                                <p className="text-sm text-base-content/60">{activity.timestamp}</p>
                                            </div>
                                            {activity.link && (
                                                <Link href={activity.link} className="btn btn-ghost btn-sm btn-square">
                                                    <i className="fa-solid fa-arrow-right"></i>
                                                </Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {recentActivity.length > 8 && (
                                <div className="card-actions justify-end mt-4">
                                    <Link href="/activity" className="btn btn-ghost btn-sm">
                                        View All Activity
                                        <i className="fa-solid fa-arrow-right ml-2"></i>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Top Roles */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Quick Actions</h3>
                            <div className="flex flex-col gap-2 mt-4">
                                <Link href="/roles" className="btn btn-primary w-full justify-start">
                                    <i className="fa-solid fa-briefcase"></i>
                                    Browse Roles
                                </Link>
                                <Link href="/candidates" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-users"></i>
                                    My Candidates
                                </Link>
                                <Link href="/proposals" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-inbox"></i>
                                    Proposals
                                </Link>
                                <Link href="/placements" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-trophy"></i>
                                    My Placements
                                </Link>
                                <Link href="/earnings" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-chart-line"></i>
                                    Earnings Report
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Top Active Roles */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Top Active Roles</h3>
                            {topRoles.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60 text-sm">
                                    <p>No active roles assigned yet</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    {topRoles.slice(0, 5).map((role) => (
                                        <Link
                                            key={role.id}
                                            href={`/roles/${role.id}`}
                                            className="block p-3 rounded-lg hover:bg-base-200 transition-colors"
                                        >
                                            <div className="font-semibold text-sm">{role.title}</div>
                                            <div className="text-xs text-base-content/60 flex items-center gap-2 mt-1">
                                                <span>{role.company?.name}</span>
                                                {role.location && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{role.location}</span>
                                                    </>
                                                )}
                                            </div>
                                            {role.candidate_count > 0 && (
                                                <div className="text-xs text-primary mt-1">
                                                    {role.candidate_count} candidate{role.candidate_count !== 1 ? 's' : ''} in pipeline
                                                </div>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                            <div className="card-actions justify-end mt-2">
                                <Link href="/roles" className="text-sm text-primary hover:underline">
                                    View all roles →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Insights & Tips */}
            {(stats?.active_roles === 0 || stats?.candidates_in_process === 0) && (
                <div className="alert alert-info">
                    <i className="fa-solid fa-lightbulb"></i>
                    <div>
                        <h4 className="font-bold">Getting Started Tips</h4>
                        <div className="text-sm mt-1">
                            {stats?.active_roles === 0 && (
                                <p>• Browse available roles and start submitting qualified candidates</p>
                            )}
                            {stats?.candidates_in_process === 0 && stats?.active_roles > 0 && (
                                <p>• You have {stats.active_roles} active role{stats.active_roles !== 1 ? 's' : ''} - submit your first candidate to get started!</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
