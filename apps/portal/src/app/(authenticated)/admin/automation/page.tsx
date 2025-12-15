'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';
import Link from 'next/link';

interface AutomationRule {
    id: string;
    name: string;
    description: string;
    rule_type: string;
    status: 'active' | 'paused' | 'disabled';
    requires_human_approval: boolean;
    max_executions_per_day: number | null;
    times_triggered: number;
    times_executed: number;
    last_triggered_at: string | null;
    last_executed_at: string | null;
    created_at: string;
}

interface AutomationExecution {
    id: string;
    rule_id: string;
    entity_type: string;
    entity_id: string;
    status: 'pending' | 'approved' | 'executed' | 'failed' | 'rejected';
    requires_approval: boolean;
    executed_at: string | null;
    error_message: string | null;
    created_at: string;
}

export default function AutomationControlsPage() {
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [pendingExecutions, setPendingExecutions] = useState<AutomationExecution[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'rules' | 'executions'>('rules');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            
            // Load automation rules
            const rulesResponse = await api.request<{ data: AutomationRule[] }>('/admin/automation/rules');
            setRules(rulesResponse.data || []);

            // Load pending executions requiring approval
            const execResponse = await api.request<{ data: AutomationExecution[] }>(
                '/admin/automation/executions?status=pending&requires_approval=true'
            );
            setPendingExecutions(execResponse.data || []);
        } catch (error) {
            console.error('Failed to load automation data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleRuleStatus = async (ruleId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';
        
        try {
            const api = new ApiClient();
            await api.request(`/admin/automation/rules/${ruleId}`, {
                method: 'PATCH',
                body: JSON.stringify({ status: newStatus }),
            });
            await loadData();
        } catch (error) {
            console.error('Failed to update rule status:', error);
            alert('Failed to update rule status');
        }
    };

    const approveExecution = async (executionId: string) => {
        if (!confirm('Approve this automation execution?')) return;

        try {
            const api = new ApiClient();
            await api.request(`/admin/automation/executions/${executionId}/approve`, {
                method: 'POST',
            });
            await loadData();
        } catch (error) {
            console.error('Failed to approve execution:', error);
            alert('Failed to approve execution');
        }
    };

    const rejectExecution = async (executionId: string) => {
        const reason = prompt('Reason for rejection:');
        if (!reason) return;

        try {
            const api = new ApiClient();
            await api.request(`/admin/automation/executions/${executionId}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            });
            await loadData();
        } catch (error) {
            console.error('Failed to reject execution:', error);
            alert('Failed to reject execution');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            active: 'badge-success',
            paused: 'badge-warning',
            disabled: 'badge-error',
            pending: 'badge-warning',
            approved: 'badge-info',
            executed: 'badge-success',
            failed: 'badge-error',
            rejected: 'badge-error',
        };
        return badges[status] || 'badge-ghost';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Automation Controls</h1>
                    <p className="text-base-content/70 mt-1">
                        Manage automation rules and approve pending executions
                    </p>
                </div>
                <Link href="/admin" className="btn btn-ghost">
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Admin
                </Link>
            </div>

            {/* Pending Approvals Alert */}
            {pendingExecutions.length > 0 && (
                <div className="alert alert-warning">
                    <i className="fa-solid fa-clock"></i>
                    <span>
                        <strong>{pendingExecutions.length}</strong> automation{pendingExecutions.length !== 1 ? 's' : ''} pending approval
                    </span>
                </div>
            )}

            {/* Tabs */}
            <div className="tabs tabs-boxed">
                <button
                    className={`tab ${activeTab === 'rules' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('rules')}
                >
                    <i className="fa-solid fa-gears mr-2"></i>
                    Automation Rules
                </button>
                <button
                    className={`tab ${activeTab === 'executions' ? 'tab-active' : ''}`}
                    onClick={() => setActiveTab('executions')}
                >
                    <i className="fa-solid fa-list-check mr-2"></i>
                    Pending Approvals
                    {pendingExecutions.length > 0 && (
                        <span className="badge badge-warning badge-sm ml-2">
                            {pendingExecutions.length}
                        </span>
                    )}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : (
                <>
                    {/* Automation Rules Tab */}
                    {activeTab === 'rules' && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="overflow-x-auto">
                                    {rules.length === 0 ? (
                                        <div className="text-center py-8 text-base-content/70">
                                            <i className="fa-solid fa-inbox text-4xl mb-4"></i>
                                            <p>No automation rules configured</p>
                                        </div>
                                    ) : (
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Type</th>
                                                    <th>Status</th>
                                                    <th>Approval</th>
                                                    <th>Executions</th>
                                                    <th>Last Run</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rules.map((rule) => (
                                                    <tr key={rule.id}>
                                                        <td>
                                                            <div>
                                                                <div className="font-semibold">{rule.name}</div>
                                                                <div className="text-sm text-base-content/70">
                                                                    {rule.description}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-ghost">
                                                                {rule.rule_type}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${getStatusBadge(rule.status)}`}>
                                                                {rule.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {rule.requires_human_approval ? (
                                                                <span className="badge badge-warning badge-sm">
                                                                    <i className="fa-solid fa-user-check mr-1"></i>
                                                                    Required
                                                                </span>
                                                            ) : (
                                                                <span className="badge badge-ghost badge-sm">
                                                                    Auto
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="text-sm">
                                                                <div>Triggered: {rule.times_triggered}</div>
                                                                <div>Executed: {rule.times_executed}</div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {rule.last_executed_at ? (
                                                                <div className="text-sm">
                                                                    {new Date(rule.last_executed_at).toLocaleString()}
                                                                </div>
                                                            ) : (
                                                                <span className="text-base-content/50">Never</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-ghost"
                                                                    onClick={() => toggleRuleStatus(rule.id, rule.status)}
                                                                    title={rule.status === 'active' ? 'Pause' : 'Activate'}
                                                                >
                                                                    <i className={`fa-solid fa-${rule.status === 'active' ? 'pause' : 'play'}`}></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending Executions Tab */}
                    {activeTab === 'executions' && (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="overflow-x-auto">
                                    {pendingExecutions.length === 0 ? (
                                        <div className="text-center py-8 text-base-content/70">
                                            <i className="fa-solid fa-check-circle text-4xl mb-4"></i>
                                            <p>No pending approvals</p>
                                        </div>
                                    ) : (
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Entity</th>
                                                    <th>Rule</th>
                                                    <th>Status</th>
                                                    <th>Created</th>
                                                    <th>Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {pendingExecutions.map((execution) => (
                                                    <tr key={execution.id}>
                                                        <td>
                                                            <div>
                                                                <div className="font-semibold">{execution.entity_type}</div>
                                                                <div className="text-sm text-base-content/70 font-mono">
                                                                    {execution.entity_id.substring(0, 8)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="text-sm font-mono">
                                                                {execution.rule_id.substring(0, 8)}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${getStatusBadge(execution.status)}`}>
                                                                {execution.status}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="text-sm">
                                                                {new Date(execution.created_at).toLocaleString()}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    className="btn btn-sm btn-success"
                                                                    onClick={() => approveExecution(execution.id)}
                                                                >
                                                                    <i className="fa-solid fa-check"></i>
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    className="btn btn-sm btn-error"
                                                                    onClick={() => rejectExecution(execution.id)}
                                                                >
                                                                    <i className="fa-solid fa-times"></i>
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
