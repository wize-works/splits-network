'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export default function MarketplaceMetricsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7'); // days

    useEffect(() => {
        loadMetrics();
    }, [dateRange]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            // TODO: Implement metrics aggregation endpoint
            // For now, mock data
            await new Promise(resolve => setTimeout(resolve, 500));
            setMetrics({
                activity: {
                    active_recruiters: 42,
                    active_companies: 18,
                    active_jobs: 127,
                },
                performance: {
                    total_applications: 284,
                    total_placements: 23,
                    avg_time_to_hire_days: 18.5,
                },
                quality: {
                    hire_rate: 8.1,
                    placement_completion_rate: 91.3,
                    avg_recruiter_response_time_hours: 4.2,
                },
                financial: {
                    total_fees_generated: 345600,
                    total_payouts_processed: 242920,
                },
                health: {
                    fraud_signals_raised: 7,
                    disputes_opened: 2,
                },
            });
        } catch (error) {
            console.error('Failed to load metrics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex justify-center p-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Marketplace Health</h1>
                    <p className="text-base-content/60 mt-1">
                        Key metrics and performance indicators
                    </p>
                </div>

                {/* Date Range Selector */}
                <select
                    className="select select-bordered"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                >
                    <option value="1">Last 24 hours</option>
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                </select>
            </div>

            {/* Activity Metrics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <i className="fa-solid fa-users text-3xl"></i>
                            </div>
                            <div className="stat-title">Active Recruiters</div>
                            <div className="stat-value text-primary">
                                {metrics.activity.active_recruiters}
                            </div>
                            <div className="stat-desc">Submitted in last {dateRange} days</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-figure text-secondary">
                                <i className="fa-solid fa-building text-3xl"></i>
                            </div>
                            <div className="stat-title">Active Companies</div>
                            <div className="stat-value text-secondary">
                                {metrics.activity.active_companies}
                            </div>
                            <div className="stat-desc">With open roles</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-figure text-accent">
                                <i className="fa-solid fa-briefcase text-3xl"></i>
                            </div>
                            <div className="stat-title">Active Jobs</div>
                            <div className="stat-value text-accent">
                                {metrics.activity.active_jobs}
                            </div>
                            <div className="stat-desc">Currently open</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Performance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Total Applications</div>
                            <div className="stat-value">{metrics.performance.total_applications}</div>
                            <div className="stat-desc">Submitted by recruiters</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Total Placements</div>
                            <div className="stat-value text-success">
                                {metrics.performance.total_placements}
                            </div>
                            <div className="stat-desc">Successful hires</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Avg Time to Hire</div>
                            <div className="stat-value text-sm">
                                {metrics.performance.avg_time_to_hire_days} days
                            </div>
                            <div className="stat-desc">From submission to hire</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quality Metrics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Quality</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Hire Rate</div>
                            <div className="stat-value text-info">
                                {metrics.quality.hire_rate}%
                            </div>
                            <div className="stat-desc">Applications → Hires</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Completion Rate</div>
                            <div className="stat-value text-success">
                                {metrics.quality.placement_completion_rate}%
                            </div>
                            <div className="stat-desc">Placements completed successfully</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-title">Avg Response Time</div>
                            <div className="stat-value text-sm">
                                {metrics.quality.avg_recruiter_response_time_hours}h
                            </div>
                            <div className="stat-desc">Recruiter proposal responses</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Financial Metrics */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Financial</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-figure text-success">
                                <i className="fa-solid fa-dollar-sign text-3xl"></i>
                            </div>
                            <div className="stat-title">Total Fees Generated</div>
                            <div className="stat-value text-success">
                                ${(metrics.financial.total_fees_generated / 1000).toFixed(0)}k
                            </div>
                            <div className="stat-desc">Placement fees from companies</div>
                        </div>
                    </div>

                    <div className="stats shadow">
                        <div className="stat">
                            <div className="stat-figure text-primary">
                                <i className="fa-solid fa-money-bill-transfer text-3xl"></i>
                            </div>
                            <div className="stat-title">Total Payouts Processed</div>
                            <div className="stat-value text-primary">
                                ${(metrics.financial.total_payouts_processed / 1000).toFixed(0)}k
                            </div>
                            <div className="stat-desc">Paid to recruiters</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Indicators */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Platform Health</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`stats shadow ${metrics.health.fraud_signals_raised > 5 ? 'border-2 border-warning' : ''}`}>
                        <div className="stat">
                            <div className="stat-figure text-warning">
                                <i className="fa-solid fa-shield-halved text-3xl"></i>
                            </div>
                            <div className="stat-title">Fraud Signals</div>
                            <div className="stat-value text-warning">
                                {metrics.health.fraud_signals_raised}
                            </div>
                            <div className="stat-desc">
                                {metrics.health.fraud_signals_raised > 5 ? '⚠️ Above threshold' : 'Normal'}
                            </div>
                        </div>
                    </div>

                    <div className={`stats shadow ${metrics.health.disputes_opened > 3 ? 'border-2 border-error' : ''}`}>
                        <div className="stat">
                            <div className="stat-figure text-error">
                                <i className="fa-solid fa-gavel text-3xl"></i>
                            </div>
                            <div className="stat-title">Disputes Opened</div>
                            <div className="stat-value text-error">
                                {metrics.health.disputes_opened}
                            </div>
                            <div className="stat-desc">
                                {metrics.health.disputes_opened > 3 ? '⚠️ Above threshold' : 'Normal'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Health Score Card */}
            <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-lg">
                <div className="card-body">
                    <h2 className="card-title">Overall Marketplace Health</h2>
                    <div className="flex items-center gap-4">
                        <div className="radial-progress text-white" style={{ '--value': 87 } as any}>
                            87%
                        </div>
                        <div>
                            <p className="text-lg font-semibold">Healthy</p>
                            <p className="opacity-80">
                                Strong activity, good quality metrics, minimal fraud signals
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
