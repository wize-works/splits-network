'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export default function MarketplaceMetricsPage() {
    const [metrics, setMetrics] = useState<any>(null);
    const [healthScore, setHealthScore] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7'); // days

    useEffect(() => {
        loadMetrics();
        loadHealthScore();
    }, [dateRange]);

    const loadHealthScore = async () => {
        try {
            const api = new ApiClient();
            const response = await api.request<{ health_score: number; status: string }>('/automation/metrics/health');
            setHealthScore(response);
        } catch (error) {
            console.error('Failed to load health score:', error);
        }
    };

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            const response = await api.request<{ data: any[] }>(`/automation/metrics/recent?days=${dateRange}`);
            
            // Calculate aggregate metrics from daily data
            const dailyMetrics = response.data || [];
            
            if (dailyMetrics.length === 0) {
                setMetrics(null);
                return;
            }

            // Aggregate the metrics
            const aggregated = {
                activity: {
                    active_recruiters: Math.round(dailyMetrics.reduce((sum, d) => sum + (d.active_recruiters || 0), 0) / dailyMetrics.length),
                    active_companies: Math.round(dailyMetrics.reduce((sum, d) => sum + (d.active_companies || 0), 0) / dailyMetrics.length),
                    active_jobs: Math.round(dailyMetrics.reduce((sum, d) => sum + (d.active_jobs || 0), 0) / dailyMetrics.length),
                    new_jobs_posted: dailyMetrics.reduce((sum, d) => sum + (d.new_jobs_posted || 0), 0),
                },
                performance: {
                    total_applications: dailyMetrics.reduce((sum, d) => sum + (d.total_applications || 0), 0),
                    total_placements: dailyMetrics.reduce((sum, d) => sum + (d.placements_created || 0), 0),
                    avg_time_to_hire_days: Math.round((dailyMetrics.reduce((sum, d) => sum + (d.avg_time_to_hire_days || 0), 0) / dailyMetrics.length) * 10) / 10,
                },
                quality: {
                    hire_rate: Math.round((dailyMetrics.reduce((sum, d) => sum + (d.hire_rate_percent || 0), 0) / dailyMetrics.length) * 10) / 10,
                    placement_completion_rate: Math.round((dailyMetrics.reduce((sum, d) => sum + (d.completion_rate_percent || 0), 0) / dailyMetrics.length) * 10) / 10,
                    avg_recruiter_response_time_hours: Math.round((dailyMetrics.reduce((sum, d) => sum + (d.avg_response_time_hours || 0), 0) / dailyMetrics.length) * 10) / 10,
                },
                financial: {
                    total_fees_generated: Math.round(dailyMetrics.reduce((sum, d) => sum + (d.total_fees_usd || 0), 0)),
                    total_payouts_processed: Math.round(dailyMetrics.reduce((sum, d) => sum + (d.total_payouts_usd || 0), 0)),
                },
                health: {
                    fraud_signals_raised: dailyMetrics.reduce((sum, d) => sum + (d.fraud_signals_created || 0), 0),
                    disputes_opened: dailyMetrics.reduce((sum, d) => sum + (d.disputes_opened || 0), 0),
                },
            };

            setMetrics(aggregated);
        } catch (error) {
            console.error('Failed to load metrics:', error);
            // Fallback to empty metrics on error
            setMetrics(null);
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

            {/* Health Score Card */}
            {healthScore && (
                <div className="card bg-base-100 shadow-lg mb-6">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">
                            <i className="fa-solid fa-heartbeat text-error"></i>
                            Overall Health Score
                        </h2>
                        <div className="flex items-center gap-6">
                            <div 
                                className={`radial-progress text-6xl ${
                                    healthScore.status === 'excellent' ? 'text-success' :
                                    healthScore.status === 'good' ? 'text-info' :
                                    healthScore.status === 'fair' ? 'text-warning' :
                                    'text-error'
                                }`}
                                style={{ '--value': healthScore.health_score } as any}
                                role="progressbar"
                            >
                                {healthScore.health_score}
                            </div>
                            <div>
                                <div className={`badge badge-lg ${
                                    healthScore.status === 'excellent' ? 'badge-success' :
                                    healthScore.status === 'good' ? 'badge-info' :
                                    healthScore.status === 'fair' ? 'badge-warning' :
                                    'badge-error'
                                }`}>
                                    {healthScore.status.toUpperCase()}
                                </div>
                                <p className="text-sm text-base-content/60 mt-2">
                                    Based on fraud signals, hire rate, and dispute metrics
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!metrics && (
                <div className="alert alert-info">
                    <i className="fa-solid fa-info-circle"></i>
                    <span>No metrics data available for the selected date range. Run the daily metrics aggregation job to populate data.</span>
                </div>
            )}

            {metrics && (
                <>
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
                </>
            )}
        </div>
    );
}
