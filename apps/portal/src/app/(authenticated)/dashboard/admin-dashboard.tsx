'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';

interface PlatformStats {
    total_active_roles: number;
    total_applications: number;
    total_active_recruiters: number;
    total_companies: number;
    placements_this_month: number;
    placements_this_year: number;
    total_platform_revenue_ytd: number;
    pending_payouts: number;
    pending_approvals: number;
    fraud_alerts: number;
}

interface MarketplaceHealth {
    recruiter_satisfaction: number;
    company_satisfaction: number;
    avg_time_to_first_candidate_days: number;
    avg_time_to_placement_days: number;
    fill_rate_percentage: number;
}

interface RecentActivity {
    id: string;
    type: 'placement_created' | 'company_joined' | 'recruiter_joined' | 'role_created' | 'payout_processed' | 'alert';
    message: string;
    timestamp: string;
    link?: string;
    severity?: 'info' | 'warning' | 'error';
}

interface Alert {
    id: string;
    type: 'payout_approval' | 'fraud_signal' | 'automation_review' | 'system';
    message: string;
    count?: number;
    link: string;
    severity: 'info' | 'warning' | 'error';
}

interface AdminDashboardProps {
    token: string;
    profile: any;
}

export default function AdminDashboard({ token, profile }: AdminDashboardProps) {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [health, setHealth] = useState<MarketplaceHealth | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const api = new ApiClient(undefined, token);
            
            // Load platform stats
            const statsResponse = await api.get<{ data: PlatformStats }>('/admin/dashboard/stats');
            setStats(statsResponse.data);

            // Load marketplace health
            const healthResponse = await api.get<{ data: MarketplaceHealth }>('/admin/dashboard/health');
            setHealth(healthResponse.data);

            // Load recent activity
            const activityResponse = await api.get<{ data: RecentActivity[] }>('/admin/dashboard/activity');
            setRecentActivity(activityResponse.data || []);

            // Load alerts
            const alertsResponse = await api.get<{ data: Alert[] }>('/admin/dashboard/alerts');
            setAlerts(alertsResponse.data || []);
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
            case 'placement_created': return 'fa-trophy';
            case 'company_joined': return 'fa-building';
            case 'recruiter_joined': return 'fa-user-plus';
            case 'role_created': return 'fa-briefcase';
            case 'payout_processed': return 'fa-money-bill-transfer';
            case 'alert': return 'fa-triangle-exclamation';
            default: return 'fa-circle-info';
        }
    };

    const getAlertClass = (severity: string) => {
        switch (severity) {
            case 'error': return 'alert-error';
            case 'warning': return 'alert-warning';
            default: return 'alert-info';
        }
    };

    const getHealthScore = (score: number) => {
        if (score >= 80) return { color: 'text-success', label: 'Excellent' };
        if (score >= 60) return { color: 'text-info', label: 'Good' };
        if (score >= 40) return { color: 'text-warning', label: 'Fair' };
        return { color: 'text-error', label: 'Needs Attention' };
    };

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-3xl">
                        Platform Administration
                    </h2>
                    <p className="text-lg opacity-90">
                        Monitor marketplace health and manage platform operations.
                    </p>
                </div>
            </div>

            {/* Alerts Section */}
            {alerts.length > 0 && (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className={`alert ${getAlertClass(alert.severity)}`}>
                            <i className="fa-solid fa-bell"></i>
                            <div className="flex-1">
                                <span className="font-semibold">{alert.message}</span>
                                {alert.count && <span className="ml-2 badge badge-sm">{alert.count}</span>}
                            </div>
                            <Link href={alert.link} className="btn btn-sm">
                                Review
                                <i className="fa-solid fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {/* Key Platform Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-primary">
                            <i className="fa-solid fa-briefcase text-3xl"></i>
                        </div>
                        <div className="stat-title">Active Roles</div>
                        <div className="stat-value text-primary">{stats?.total_active_roles || 0}</div>
                        <div className="stat-desc">Platform-wide</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-secondary">
                            <i className="fa-solid fa-network-wired text-3xl"></i>
                        </div>
                        <div className="stat-title">Active Recruiters</div>
                        <div className="stat-value text-secondary">{stats?.total_active_recruiters || 0}</div>
                        <div className="stat-desc">{stats?.total_companies || 0} companies</div>
                    </div>
                </div>

                <div className="stats shadow-sm bg-base-100">
                    <div className="stat">
                        <div className="stat-figure text-accent">
                            <i className="fa-solid fa-users text-3xl"></i>
                        </div>
                        <div className="stat-title">Applications</div>
                        <div className="stat-value text-accent">{stats?.total_applications || 0}</div>
                        <div className="stat-desc">In pipeline</div>
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

            {/* Revenue & Payouts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title">
                            <i className="fa-solid fa-chart-line text-success mr-2"></i>
                            Platform Revenue YTD
                        </h3>
                        <div className="flex items-baseline gap-2 mt-4">
                            <div className="text-4xl font-bold text-success">
                                ${((stats?.total_platform_revenue_ytd || 0) / 1000000).toFixed(2)}M
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
                            <div>
                                <div className="text-sm text-base-content/60">This Month</div>
                                <div className="text-xl font-semibold">{stats?.placements_this_month || 0} placements</div>
                            </div>
                            <Link href="/admin/revenue" className="btn btn-sm btn-outline btn-success">
                                View Report
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
                        </div>
                        <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
                            <div className="text-sm text-base-content/60">
                                {stats?.pending_approvals || 0} awaiting approval
                            </div>
                            <Link href="/admin/payouts" className="btn btn-sm btn-outline btn-primary">
                                Review Payouts
                                <i className="fa-solid fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketplace Health */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h3 className="card-title">
                        <i className="fa-solid fa-heart-pulse text-error mr-2"></i>
                        Marketplace Health
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-6">
                        <div className="text-center">
                            <div className="radial-progress text-primary" style={{"--value": health?.recruiter_satisfaction || 0} as any}>
                                {health?.recruiter_satisfaction || 0}%
                            </div>
                            <p className="text-sm font-semibold mt-2">Recruiter Satisfaction</p>
                        </div>
                        <div className="text-center">
                            <div className="radial-progress text-secondary" style={{"--value": health?.company_satisfaction || 0} as any}>
                                {health?.company_satisfaction || 0}%
                            </div>
                            <p className="text-sm font-semibold mt-2">Company Satisfaction</p>
                        </div>
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${getHealthScore(health?.avg_time_to_first_candidate_days || 0).color}`}>
                                {health?.avg_time_to_first_candidate_days || 0}
                            </div>
                            <p className="text-sm font-semibold mt-2">Days to First Candidate</p>
                        </div>
                        <div className="text-center">
                            <div className={`text-4xl font-bold ${getHealthScore(100 - (health?.avg_time_to_placement_days || 0) / 2).color}`}>
                                {health?.avg_time_to_placement_days || 0}
                            </div>
                            <p className="text-sm font-semibold mt-2">Avg Time to Placement</p>
                        </div>
                        <div className="text-center">
                            <div className="radial-progress text-success" style={{"--value": health?.fill_rate_percentage || 0} as any}>
                                {health?.fill_rate_percentage || 0}%
                            </div>
                            <p className="text-sm font-semibold mt-2">Fill Rate</p>
                        </div>
                    </div>
                    <div className="card-actions justify-end mt-4">
                        <Link href="/admin/metrics" className="btn btn-ghost btn-sm">
                            View Detailed Metrics
                            <i className="fa-solid fa-arrow-right ml-2"></i>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Platform Activity */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title">
                                <i className="fa-solid fa-clock-rotate-left mr-2"></i>
                                Recent Platform Activity
                            </h3>
                            {recentActivity.length === 0 ? (
                                <div className="text-center py-12 text-base-content/60">
                                    <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                <div className="space-y-3 mt-4">
                                    {recentActivity.slice(0, 10).map((activity) => (
                                        <div
                                            key={activity.id}
                                            className="flex items-start gap-4 p-3 rounded-lg hover:bg-base-200 transition-colors cursor-pointer"
                                        >
                                            <div className="avatar placeholder">
                                                <div className="bg-primary text-primary-content rounded-full w-10 h-10">
                                                    <i className={`fa-solid ${getActivityIcon(activity.type)}`}></i>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium">{activity.message}</p>
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
                        </div>
                    </div>
                </div>

                {/* Admin Tools */}
                <div className="space-y-6">
                    {/* Phase 3 Tools */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Phase 3 Tools</h3>
                            <div className="flex flex-col gap-2 mt-4">
                                <Link href="/admin/payouts" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-money-bill-transfer"></i>
                                    Payout Management
                                </Link>
                                <Link href="/admin/automation" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-robot"></i>
                                    Automation Controls
                                </Link>
                                <Link href="/admin/fraud" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-shield-halved"></i>
                                    Fraud Detection
                                </Link>
                                <Link href="/admin/decision-log" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-clipboard-list"></i>
                                    Decision Log
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Core Admin Tools */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg">Platform Management</h3>
                            <div className="flex flex-col gap-2 mt-4">
                                <Link href="/admin/users" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-users"></i>
                                    Users
                                </Link>
                                <Link href="/admin/companies" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-building"></i>
                                    Companies
                                </Link>
                                <Link href="/admin/roles" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-briefcase"></i>
                                    All Roles
                                </Link>
                                <Link href="/admin/metrics" className="btn btn-outline w-full justify-start">
                                    <i className="fa-solid fa-chart-bar"></i>
                                    Metrics
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
