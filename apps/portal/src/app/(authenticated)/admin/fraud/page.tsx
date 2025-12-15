'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export default function FraudSignalsPage() {
    const [signals, setSignals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('active');

    useEffect(() => {
        loadSignals();
    }, [filter]);

    const loadSignals = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            const response = await api.request<{ data: any[] }>(`/automation/fraud/signals?status=${filter}`);
            setSignals(response.data || []);
        } catch (error) {
            console.error('Failed to load fraud signals:', error);
        } finally {
            setLoading(false);
        }
    };

    const resolveSignal = async (signalId: string, isFalsePositive: boolean) => {
        const action = isFalsePositive ? 'mark as false positive' : 'resolve';
        if (!confirm(`Are you sure you want to ${action} this signal?`)) return;

        const notes = prompt('Add resolution notes (optional):');

        try {
            const api = new ApiClient();
            await api.request(`/automation/fraud/signals/${signalId}/resolve`, {
                method: 'POST',
                body: JSON.stringify({
                    reviewed_by: 'admin', // TODO: Get from auth
                    is_false_positive: isFalsePositive,
                    notes,
                }),
            });
            alert('Signal resolved');
            loadSignals();
        } catch (error) {
            console.error('Failed to resolve signal:', error);
            alert('Failed to resolve signal');
        }
    };

    const getSeverityBadge = (severity: string) => {
        const colors: Record<string, string> = {
            low: 'badge-info',
            medium: 'badge-warning',
            high: 'badge-error',
            critical: 'badge-error',
        };
        return colors[severity] || 'badge-neutral';
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Fraud Detection</h1>
            </div>

            {/* Filters */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="flex gap-2">
                        {['active', 'resolved', 'false_positive'].map((status) => (
                            <button
                                key={status}
                                className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Signals List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : signals.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body text-center text-base-content/60">
                            <i className="fa-solid fa-shield-halved text-4xl mb-2"></i>
                            <p>No fraud signals found</p>
                        </div>
                    </div>
                ) : (
                    signals.map((signal) => (
                        <div key={signal.id} className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`badge ${getSeverityBadge(signal.severity)}`}>
                                                {signal.severity}
                                            </span>
                                            <span className="badge badge-outline">
                                                {signal.signal_type}
                                            </span>
                                            <span className="text-sm text-base-content/60">
                                                Confidence: {signal.confidence_score}%
                                            </span>
                                        </div>

                                        <p className="text-base-content/80 mb-4">
                                            {signal.signal_data.message}
                                        </p>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            {signal.recruiter_id && (
                                                <div>
                                                    <span className="text-base-content/60">Recruiter:</span>
                                                    <br />
                                                    <span className="font-mono">
                                                        {signal.recruiter_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            {signal.job_id && (
                                                <div>
                                                    <span className="text-base-content/60">Job:</span>
                                                    <br />
                                                    <span className="font-mono">
                                                        {signal.job_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            {signal.candidate_id && (
                                                <div>
                                                    <span className="text-base-content/60">Candidate:</span>
                                                    <br />
                                                    <span className="font-mono">
                                                        {signal.candidate_id.substring(0, 8)}...
                                                    </span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="text-base-content/60">Created:</span>
                                                <br />
                                                {new Date(signal.created_at).toLocaleString()}
                                            </div>
                                        </div>

                                        {/* Signal Details */}
                                        <details className="collapse collapse-arrow bg-base-200 mt-4">
                                            <summary className="collapse-title text-sm font-medium">
                                                Signal Details
                                            </summary>
                                            <div className="collapse-content">
                                                <pre className="text-xs overflow-auto">
                                                    {JSON.stringify(signal.signal_data, null, 2)}
                                                </pre>
                                            </div>
                                        </details>
                                    </div>

                                    {signal.status === 'active' && (
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                className="btn btn-success btn-sm"
                                                onClick={() => resolveSignal(signal.id, false)}
                                            >
                                                <i className="fa-solid fa-check"></i>
                                                Resolve
                                            </button>
                                            <button
                                                className="btn btn-ghost btn-sm"
                                                onClick={() => resolveSignal(signal.id, true)}
                                            >
                                                <i className="fa-solid fa-times"></i>
                                                False Positive
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Critical</div>
                        <div className="stat-value text-error">
                            {signals.filter(s => s.severity === 'critical').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">High</div>
                        <div className="stat-value text-warning">
                            {signals.filter(s => s.severity === 'high').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Medium</div>
                        <div className="stat-value text-info">
                            {signals.filter(s => s.severity === 'medium').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Low</div>
                        <div className="stat-value">
                            {signals.filter(s => s.severity === 'low').length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
