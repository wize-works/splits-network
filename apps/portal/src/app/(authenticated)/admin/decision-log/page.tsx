'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';

interface DecisionLog {
    id: string;
    decision_type: string;
    entity_type: string;
    entity_id: string;
    decision_data: any;
    ai_confidence_score: number | null;
    ai_reasoning: string[] | null;
    human_override: boolean;
    override_reason: string | null;
    created_by: string;
    created_at: string;
}

export default function DecisionAuditLogPage() {
    const [logs, setLogs] = useState<DecisionLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 50;

    useEffect(() => {
        loadLogs();
    }, [filter, page]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            const queryParams = new URLSearchParams({
                limit: limit.toString(),
                offset: ((page - 1) * limit).toString(),
            });

            if (filter !== 'all') {
                queryParams.append('decision_type', filter);
            }

            const response = await api.request<{ data: DecisionLog[]; total: number }>(
                `/admin/decision-log?${queryParams.toString()}`
            );
            
            setLogs(response.data || []);
            setTotalPages(Math.ceil((response.total || 0) / limit));
        } catch (error) {
            console.error('Failed to load decision logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getDecisionTypeBadge = (type: string) => {
        const badges: Record<string, { color: string; icon: string }> = {
            ai_suggestion_accepted: { color: 'badge-success', icon: 'fa-robot' },
            ai_suggestion_rejected: { color: 'badge-error', icon: 'fa-robot' },
            automation_triggered: { color: 'badge-info', icon: 'fa-bolt' },
            fraud_flag_raised: { color: 'badge-warning', icon: 'fa-shield-halved' },
            payout_approved: { color: 'badge-success', icon: 'fa-money-bill' },
            payout_rejected: { color: 'badge-error', icon: 'fa-money-bill' },
        };
        return badges[type] || { color: 'badge-ghost', icon: 'fa-circle-info' };
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Decision Audit Log</h1>
                    <p className="text-base-content/70 mt-1">
                        Track all AI and human decisions across the platform
                    </p>
                </div>
                <Link href="/admin" className="btn btn-ghost">
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Admin
                </Link>
            </div>

            {/* Stats */}
            <div className="stats shadow w-full">
                <div className="stat">
                    <div className="stat-figure text-primary">
                        <i className="fa-solid fa-robot text-3xl"></i>
                    </div>
                    <div className="stat-title">AI Decisions</div>
                    <div className="stat-value text-primary">
                        {logs.filter(l => l.ai_confidence_score !== null).length}
                    </div>
                    <div className="stat-desc">With AI involvement</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-secondary">
                        <i className="fa-solid fa-user text-3xl"></i>
                    </div>
                    <div className="stat-title">Human Overrides</div>
                    <div className="stat-value text-secondary">
                        {logs.filter(l => l.human_override).length}
                    </div>
                    <div className="stat-desc">AI suggestions overridden</div>
                </div>

                <div className="stat">
                    <div className="stat-figure text-accent">
                        <i className="fa-solid fa-clock text-3xl"></i>
                    </div>
                    <div className="stat-title">Recent</div>
                    <div className="stat-value text-accent">{logs.length}</div>
                    <div className="stat-desc">Last {limit} decisions</div>
                </div>
            </div>

            {/* Filters */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-2">
                        <button
                            className={`btn btn-sm ${filter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => {
                                setFilter('all');
                                setPage(1);
                            }}
                        >
                            All Decisions
                        </button>
                        {[
                            'ai_suggestion_accepted',
                            'ai_suggestion_rejected',
                            'automation_triggered',
                            'fraud_flag_raised',
                            'payout_approved',
                            'payout_rejected',
                        ].map((type) => (
                            <button
                                key={type}
                                className={`btn btn-sm ${filter === type ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => {
                                    setFilter(type);
                                    setPage(1);
                                }}
                            >
                                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-base-content/70">
                            <i className="fa-solid fa-clipboard-list text-4xl mb-4"></i>
                            <p>No decision logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Decision Type</th>
                                        <th>Entity</th>
                                        <th>AI Involvement</th>
                                        <th>Human Override</th>
                                        <th>Created By</th>
                                        <th>Timestamp</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const badge = getDecisionTypeBadge(log.decision_type);
                                        return (
                                            <tr key={log.id}>
                                                <td>
                                                    <span className={`badge ${badge.color} gap-2`}>
                                                        <i className={`fa-solid ${badge.icon}`}></i>
                                                        {log.decision_type.replace(/_/g, ' ')}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div>
                                                        <div className="font-semibold">{log.entity_type}</div>
                                                        <div className="text-sm text-base-content/70 font-mono">
                                                            {log.entity_id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {log.ai_confidence_score !== null ? (
                                                        <div>
                                                            <div className="text-sm font-semibold">
                                                                {log.ai_confidence_score}% confident
                                                            </div>
                                                            {log.ai_reasoning && (
                                                                <div className="text-xs text-base-content/70">
                                                                    {log.ai_reasoning.length} reason(s)
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-base-content/50">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    {log.human_override ? (
                                                        <span className="badge badge-warning badge-sm gap-1">
                                                            <i className="fa-solid fa-hand"></i>
                                                            Override
                                                        </span>
                                                    ) : (
                                                        <span className="text-base-content/50">—</span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className="text-sm">
                                                        {log.created_by === 'system' ? (
                                                            <span className="badge badge-ghost badge-sm">System</span>
                                                        ) : (
                                                            <span className="font-mono">{log.created_by.substring(0, 8)}...</span>
                                                        )}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="text-sm">
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </div>
                                                </td>
                                                <td>
                                                    <details className="dropdown dropdown-end">
                                                        <summary className="btn btn-ghost btn-sm">
                                                            <i className="fa-solid fa-ellipsis-vertical"></i>
                                                        </summary>
                                                        <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 z-10">
                                                            <li>
                                                                <button
                                                                    onClick={() => {
                                                                        alert(JSON.stringify(log.decision_data, null, 2));
                                                                    }}
                                                                >
                                                                    <i className="fa-solid fa-eye"></i>
                                                                    View Details
                                                                </button>
                                                            </li>
                                                            {log.ai_reasoning && (
                                                                <li>
                                                                    <button
                                                                        onClick={() => {
                                                                            alert(log.ai_reasoning?.join('\n'));
                                                                        }}
                                                                    >
                                                                        <i className="fa-solid fa-brain"></i>
                                                                        View AI Reasoning
                                                                    </button>
                                                                </li>
                                                            )}
                                                        </ul>
                                                    </details>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6">
                            <div className="join">
                                <button
                                    className="join-item btn"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    «
                                </button>
                                <button className="join-item btn">
                                    Page {page} of {totalPages}
                                </button>
                                <button
                                    className="join-item btn"
                                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                >
                                    »
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
