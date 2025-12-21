'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/use-view-mode';
import { useSearchParams, useRouter } from 'next/navigation';
import { ApplicationCard } from './application-card';
import { ApplicationTableRow } from './application-table-row';
import { ApplicationFilters } from './application-filters';
import { PaginationControls } from './pagination-controls';
import BulkActionModal from './bulk-action-modal';

interface Application {
    id: string;
    job_id: string;
    candidate_id: string;
    recruiter_id?: string;
    stage: string;
    accepted_by_company: boolean;
    accepted_at?: string;
    created_at: string;
    updated_at: string;
    candidate: {
        id: string;
        full_name: string;
        email: string;
        linkedin_url?: string;
        _masked?: boolean;
    };
    recruiter?: {
        id: string;
        name: string;
        email: string;
    };
    job: {
        id: string;
        title: string;
        company_id?: string;
    };
    company: {
        id: string;
        name: string;
    };
}

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export default function ApplicationsListClient() {
    const { getToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // State
    const [applications, setApplications] = useState<Application[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: 1,
        limit: 25,
        total_pages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [stageFilter, setStageFilter] = useState('');
    const [viewMode, setViewMode] = useViewMode('applicationsViewMode');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    // Bulk actions state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkActionModal, setShowBulkActionModal] = useState(false);
    const [bulkAction, setBulkAction] = useState<'stage' | 'reject' | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Load applications
    const loadApplications = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Not authenticated');
                setLoading(false);
                return;
            }

            const client = createAuthenticatedClient(token);

            // Get user profile
            const profileRes = await client.get('/me');
            const profile = profileRes.data;
            const membership = profile?.memberships?.[0];
            const role = membership?.role;
            setUserRole(role);

            // Build query parameters
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sort_by: 'created_at',
                sort_order: 'desc',
            });

            if (searchQuery) {
                params.append('search', searchQuery);
            }
            if (stageFilter) {
                params.append('stage', stageFilter);
            }

            if (role === 'company_admin' || role === 'hiring_manager') {
                const companiesRes = await client.get(`/companies?org_id=${membership.organization_id}`);
                const companies = companiesRes.data || [];
                if (companies.length > 0) {
                    params.append('company_id', companies[0].id);
                }
            }

            const response = await client.get(`/applications/paginated?${params.toString()}`);

            // Debug: Check if company data is present
            console.log('[Applications Debug] First application:', response.data?.[0]);
            console.log('[Applications Debug] Company in first app:', response.data?.[0]?.company);

            setApplications(response.data || []);
            setPagination(response.pagination || pagination);

        } catch (err: any) {
            console.error('Failed to load applications:', err);
            setError(err.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    }, [getToken, pagination.page, pagination.limit, searchQuery, stageFilter]);

    // Initial load
    useEffect(() => {
        loadApplications();
    }, []);

    // Reload when filters change (debounced for search)
    useEffect(() => {
        const timer = setTimeout(() => {
            if (pagination.page !== 1) {
                setPagination(prev => ({ ...prev, page: 1 }));
            } else {
                loadApplications();
            }
        }, searchQuery ? 300 : 0);

        return () => clearTimeout(timer);
    }, [searchQuery, stageFilter]);

    // Reload when page changes
    useEffect(() => {
        if (pagination.page > 0) {
            loadApplications();
        }
    }, [pagination.page]);

    const handleAcceptApplication = async (applicationId: string) => {
        try {
            setAcceptingId(applicationId);
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            await client.post(`/applications/${applicationId}/accept`, {});

            await loadApplications();
        } catch (err: any) {
            console.error('Failed to accept application:', err);
            alert('Failed to accept application: ' + (err.message || 'Unknown error'));
        } finally {
            setAcceptingId(null);
        }
    };

    // Bulk selection handlers
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === applications.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(applications.map(app => app.id)));
        }
    };

    const handleBulkAction = (action: 'stage' | 'reject') => {
        setBulkAction(action);
        setShowBulkActionModal(true);
    };

    const clearSelections = () => {
        setSelectedIds(new Set());
        setShowBulkActionModal(false);
        setBulkAction(null);
    };

    const handleBulkConfirm = async (data: { newStage?: string; reason?: string; notes?: string }) => {
        setBulkLoading(true);
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const idsArray = Array.from(selectedIds);

            if (bulkAction === 'stage' && data.newStage) {
                await Promise.all(
                    idsArray.map(id =>
                        client.updateApplicationStage(id, data.newStage!, data.notes)
                    )
                );
            } else if (bulkAction === 'reject') {
                await Promise.all(
                    idsArray.map(id =>
                        client.updateApplicationStage(id, 'rejected', data.reason || data.notes)
                    )
                );
            }

            await loadApplications();
            clearSelections();
        } catch (err: any) {
            console.error('Bulk action failed:', err);
            alert('Bulk action failed: ' + (err.message || 'Unknown error'));
        } finally {
            setBulkLoading(false);
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getStageColor = (stage: string) => {
        const colors: Record<string, string> = {
            submitted: 'badge-info',
            screen: 'badge-primary',
            interview: 'badge-warning',
            offer: 'badge-success',
            hired: 'badge-success',
            rejected: 'badge-error',
        };
        return colors[stage] || 'badge-ghost';
    };

    const isCompanyUser = userRole === 'company_admin' || userRole === 'hiring_manager';
    const isRecruiter = userRole === 'recruiter';

    if (loading && applications.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading applications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            <ApplicationFilters
                searchQuery={searchQuery}
                stageFilter={stageFilter}
                viewMode={viewMode}
                onSearchChange={setSearchQuery}
                onStageFilterChange={setStageFilter}
                onViewModeChange={setViewMode}
            />

            {applications.length > 0 && (
                <div className="text-sm text-base-content/70">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} applications
                </div>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && applications.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {applications.map((application) => (
                        <ApplicationCard
                            key={application.id}
                            application={application}
                            canAccept={isCompanyUser && !application.accepted_by_company}
                            isAccepting={acceptingId === application.id}
                            onAccept={() => handleAcceptApplication(application.id)}
                            getStageColor={getStageColor}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && isRecruiter && (
                <div className="alert shadow-lg">
                    <div className="flex-1">
                        <i className="fa-solid fa-check-square text-xl"></i>
                        <div>
                            <h3 className="font-bold">{selectedIds.size} application{selectedIds.size !== 1 ? 's' : ''} selected</h3>
                            <div className="text-xs">Choose an action to apply to all selected applications</div>
                        </div>
                    </div>
                    <div className="flex-none flex gap-2">
                        <button
                            onClick={() => handleBulkAction('stage')}
                            className="btn btn-sm btn-primary gap-2"
                        >
                            <i className="fa-solid fa-list-check"></i>
                            Update Stage
                        </button>
                        <button
                            onClick={() => handleBulkAction('reject')}
                            className="btn btn-sm btn-error gap-2"
                        >
                            <i className="fa-solid fa-ban"></i>
                            Reject
                        </button>
                        <button
                            onClick={clearSelections}
                            className="btn btn-sm btn-ghost"
                        >
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Table View */}
            {viewMode === 'table' && applications.length > 0 && (
                <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    {isRecruiter && (
                                        <th>
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={selectedIds.size === applications.length && applications.length > 0}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                    )}
                                    <th>Candidate</th>
                                    <th>Job</th>
                                    <th>Company</th>
                                    <th>Stage</th>
                                    {isRecruiter && <th>Recruiter</th>}
                                    <th>Submitted</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((application) => (
                                    <ApplicationTableRow
                                        key={application.id}
                                        application={application}
                                        isSelected={selectedIds.has(application.id)}
                                        onToggleSelect={() => toggleSelection(application.id)}
                                        canAccept={isCompanyUser && !application.accepted_by_company}
                                        isAccepting={acceptingId === application.id}
                                        onAccept={() => handleAcceptApplication(application.id)}
                                        getStageColor={getStageColor}
                                        formatDate={formatDate}
                                        isRecruiter={isRecruiter}
                                        isCompanyUser={isCompanyUser}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.total_pages}
                onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
                disabled={loading}
            />

            {/* Empty State */}
            {applications.length === 0 && !loading && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-folder-open text-6xl text-base-content/20 mb-4"></i>
                        <h3 className="text-xl font-semibold">No applications found</h3>
                        <p className="text-base-content/70">
                            {searchQuery || stageFilter
                                ? 'Try adjusting your filters'
                                : isCompanyUser
                                    ? 'No candidates have been submitted to your jobs yet'
                                    : isRecruiter
                                        ? 'No applications for your assigned candidates yet'
                                        : 'No applications to display'}
                        </p>
                    </div>
                </div>
            )}

            {/* Bulk Action Modal */}
            {showBulkActionModal && bulkAction && (
                <BulkActionModal
                    action={bulkAction}
                    selectedCount={selectedIds.size}
                    onClose={clearSelections}
                    onConfirm={handleBulkConfirm}
                    loading={bulkLoading}
                />
            )}
        </div>
    );
}
