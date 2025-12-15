'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export default function PayoutsAdminPage() {
    const [payouts, setPayouts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('pending');

    useEffect(() => {
        loadPayouts();
    }, [filter]);

    const loadPayouts = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            // TODO: Add filter to API
            const response = await api.request<{ data: any[] }>('/billing/payouts');
            setPayouts(response.data || []);
        } catch (error) {
            console.error('Failed to load payouts:', error);
        } finally {
            setLoading(false);
        }
    };

    const processPayout = async (payoutId: string) => {
        if (!confirm('Process this payout? This will initiate a Stripe transfer.')) return;

        try {
            const api = new ApiClient();
            await api.request(`/billing/payouts/${payoutId}/process`, {
                method: 'POST',
            });
            alert('Payout processed successfully');
            loadPayouts();
        } catch (error) {
            console.error('Failed to process payout:', error);
            alert('Failed to process payout');
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: 'badge-warning',
            processing: 'badge-info',
            completed: 'badge-success',
            failed: 'badge-error',
            on_hold: 'badge-neutral',
        };
        return colors[status] || 'badge-neutral';
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Payout Management</h1>
            </div>

            {/* Filters */}
            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="flex gap-2">
                        {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
                            <button
                                key={status}
                                className={`btn btn-sm ${filter === status ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Payouts Table */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : payouts.length === 0 ? (
                        <div className="text-center p-8 text-base-content/60">
                            <i className="fa-solid fa-money-bill-wave text-4xl mb-2"></i>
                            <p>No payouts found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Placement</th>
                                        <th>Recruiter</th>
                                        <th>Amount</th>
                                        <th>Fee</th>
                                        <th>Share %</th>
                                        <th>Status</th>
                                        <th>Created</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout.id}>
                                            <td>
                                                <span className="font-mono text-sm">
                                                    {payout.placement_id.substring(0, 8)}...
                                                </span>
                                            </td>
                                            <td>
                                                <span className="font-mono text-sm">
                                                    {payout.recruiter_id.substring(0, 8)}...
                                                </span>
                                            </td>
                                            <td className="font-semibold">
                                                ${payout.payout_amount.toLocaleString()}
                                            </td>
                                            <td>${payout.placement_fee.toLocaleString()}</td>
                                            <td>{payout.recruiter_share_percentage}%</td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(payout.status)}`}>
                                                    {payout.status}
                                                </span>
                                            </td>
                                            <td>
                                                {new Date(payout.created_at).toLocaleDateString()}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {payout.status === 'pending' && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => processPayout(payout.id)}
                                                        >
                                                            <i className="fa-solid fa-play"></i>
                                                            Process
                                                        </button>
                                                    )}
                                                    <a
                                                        href={`/admin/payouts/${payout.id}`}
                                                        className="btn btn-ghost btn-sm"
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </a>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Pending</div>
                        <div className="stat-value text-warning">
                            {payouts.filter(p => p.status === 'pending').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Processing</div>
                        <div className="stat-value text-info">
                            {payouts.filter(p => p.status === 'processing').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Completed</div>
                        <div className="stat-value text-success">
                            {payouts.filter(p => p.status === 'completed').length}
                        </div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Total Amount</div>
                        <div className="stat-value text-sm">
                            ${payouts
                                .filter(p => p.status === 'completed')
                                .reduce((sum, p) => sum + p.payout_amount, 0)
                                .toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
