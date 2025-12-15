'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';

interface CompanyStats {
    active_roles: number;
    total_applications: number;
    interviews_scheduled: number;
    offers_extended: number;
    placements_this_month: number;
    placements_this_year: number;
    avg_time_to_hire_days: number;
    active_recruiters: number;
}

interface RoleBreakdown {
    id: string;
    title: string;
    location: string;
    status: string;
    applications_count: number;
    interview_count: number;
    offer_count: number;
    days_open: number;
}

interface RecentActivity {
    id: string;
    type: 'application_received' | 'interview_scheduled' | 'offer_extended' | 'placement_completed' | 'role_created';
    message: string;
    role_title?: string;
    timestamp: string;
    link?: string;
}

interface CompanyDashboardProps {
    token: string;
    profile: any;
}

export default function CompanyDashboard({ token, profile }: CompanyDashboardProps) {
    const [stats, setStats] = useState<CompanyStats | null>(null);
    const [roleBreakdown, setRoleBreakdown] = useState<RoleBreakdown[]>([]);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const api = new ApiClient(undefined, token);
            
            // Load company stats
            const statsResponse = await api.get<{ data: CompanyStats }>('/company/dashboard/stats');
            setStats(statsResponse.data);

            // Load role breakdown
            const rolesResponse = await api.get<{ data: RoleBreakdown[] }>('/company/dashboard/roles');
            setRoleBreakdown(rolesResponse.data || []);

            // Load recent activity
            const activityResponse = await api.get<{ data: RecentActivity[] }>('/company/dashboard/activity');
            setRecentActivity(activityResponse.data || []);
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
            case 'application_received': return 'fa-inbox';
            case 'interview_scheduled': return 'fa-calendar-check';
            case 'offer_extended': return 'fa-file-contract';
            case 'placement_completed': return 'fa-check-circle';
            case 'role_created': return 'fa-plus-circle';
            default: return 'fa-circle-info';
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, string> = {
            open: 'badge-success',
            paused: 'badge-warning',
            filled: 'badge-info',
            closed: 'badge-ghost',
        };
        return statusMap[status] || 'badge-ghost';
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-3xl">
                        Hiring Dashboard
                    </h2>
                    <p className="text-lg opacity-90">
                        Track your recruiting pipeline and hiring performance.
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
                        <div className="stat-desc">Open positions</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <i className="fa-solid fa-users text-3xl"></i>
                        </div>
                        <div className="stat-title">Total Candidates</div>
                        <div className="stat-value text-secondary">{stats?.total_applications || 0}</div>
                        <div className="stat-desc">In pipeline</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <i className="fa-solid fa-calendar-check text-3xl"></i>
                        </div>
                        <div className="stat-title">Interviews</div>
                        <div className="stat-value text-accent">{stats?.interviews_scheduled || 0}</div>
                        <div className="stat-desc">Scheduled</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-success">
                            <i className="fa-solid fa-trophy text-3xl"></i>
                        </div>
                        <div className="stat-title">Hires</div>
                        <div className="stat-value text-success">{stats?.placements_this_year || 0}</div>
                        <div className="stat-desc">This year</div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg">
                            <i className="fa-solid fa-clock text-info mr-2"></i>
                            Avg Time to Hire
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-info">
                                {stats?.avg_time_to_hire_days || 0}
                            </div>
                            <div className="text-base-content/60">days</div>
                        </div>
                        <p className="text-sm text-base-content/60 mt-2">
                            Industry average: 42 days
                        </p>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg">
                            <i className="fa-solid fa-network-wired text-primary mr-2"></i>
                            Active Network
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-primary">
                                {stats?.active_recruiters || 0}
                            </div>
                            <div className="text-base-content/60">recruiters</div>
                        </div>
                        <p className="text-sm text-base-content/60 mt-2">
                            Working on your roles
                        </p>
                    </div>
                </div>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title text-lg">
                            <i className="fa-solid fa-chart-line text-success mr-2"></i>
                            This Month
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-success">
                                {stats?.placements_this_month || 0}
                            </div>
                            <div className="text-base-content/60">hires</div>
                        </div>
                        <p className="text-sm text-base-content/60 mt-2">
                            {stats?.offers_extended || 0} offers extended
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role Breakdown - Larger section */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <h3 className="card-title">
                                    <i className="fa-solid fa-list-check mr-2"></i>
                                    Active Roles Pipeline
                                </h3>
                                <Link href="/roles/new" className="btn btn-primary btn-sm">
                                    <i className="fa-solid fa-plus mr-2"></i>
                                    Post New Role
                                </Link>
                            </div>
                            {roleBreakdown.length === 0 ? (
                                <div className="text-center py-12 text-base-content/60">
                                    <i className="fa-solid fa-briefcase text-4xl mb-4"></i>
                                    <p>No active roles</p>
                                    <p className="text-sm">Create your first role to start receiving candidates</p>
                                    <Link href="/roles/new" className="btn btn-primary btn-sm mt-4">
                                        Create Role
                                    </Link>
                                </div>
                            ) : (
                                <div className="overflow-x-auto mt-4">
                                    <table className="table table-zebra">
                                        <thead>
                                            <tr>
                                                <th>Role</th>
                                                <th className="text-center">Applications</th>
                                                <th className="text-center">Interviews</th>
                                                <th className="text-center">Offers</th>
                                                <th className="text-center">Days Open</th>
                                                <th className="text-center">Status</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {roleBreakdown.map((role) => (
                                                <tr key={role.id} className="hover">
                                                    <td>
                                                        <div className="font-semibold">{role.title}</div>
                                                        <div className="text-sm text-base-content/60">{role.location}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="badge badge-ghost">{role.applications_count}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="badge badge-info badge-outline">{role.interview_count}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="badge badge-success badge-outline">{role.offer_count}</div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className={role.days_open > 60 ? 'text-warning font-semibold' : ''}>
                                                            {role.days_open}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className={`badge ${getStatusBadge(role.status)}`}>
                                                            {role.status}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <Link href={`/roles/${role.id}`} className="btn btn-ghost btn-sm btn-square">
                                                            <i className="fa-solid fa-arrow-right"></i>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Insights & Recommendations */}
                    {roleBreakdown.some(r => r.days_open > 60 && r.applications_count < 5) && (
                        <div className="alert alert-warning mt-6">
                            <i className="fa-solid fa-lightbulb"></i>
                            <div>
                                <h4 className="font-bold">Hiring Insights</h4>
                                <p className="text-sm mt-1">
                                    Some roles have been open for 60+ days with low candidate flow. 
                                    Consider expanding recruiter assignments or adjusting role requirements.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Quick Actions</h3>
                            <div className="flex flex-col gap-2 mt-4">
                                <Link href="/roles/new" className="btn btn-primary w-full justify-start">
                                    <i className="fa-solid fa-plus"></i>
                                    Post New Role
                                </Link>
                                <Link href="/roles" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-briefcase"></i>
                                    Manage Roles
                                </Link>
                                <Link href="/candidates" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-users"></i>
                                    View Candidates
                                </Link>
                                <Link href="/placements" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-trophy"></i>
                                    Placements
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">
                                <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                                Recent Activity
                            </h3>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-8 text-base-content/60 text-sm">
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    {recentActivity.slice(0, 6).map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                                        >
                                            <div className="avatar placeholder">
                                                <div className="bg-primary text-primary-content rounded-full w-8 h-8 text-sm">
                                                    <i className={`fa-solid ${getActivityIcon(activity.type)}`}></i>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{activity.message}</p>
                                                {activity.role_title && (
                                                    <p className="text-xs text-primary">{activity.role_title}</p>
                                                )}
                                                <p className="text-xs text-base-content/60">{activity.timestamp}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {recentActivity.length > 6 && (
                                <div className="card-actions justify-end mt-2">
                                    <Link href="/activity" className="text-sm text-primary hover:underline">
                                        View all →
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
