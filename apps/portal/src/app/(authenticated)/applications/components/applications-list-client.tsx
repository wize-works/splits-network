'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/use-view-mode';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
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
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Helper function to sanitize search query (remove smart search keywords)
    const sanitizeSearchQuery = (query: string): string => {
        // Remove smart search keywords like "job:", "company:", "from:", "to:"
        return query.replace(/^(job|company|from|to):\s*/i, '').trim();
    };

    // Initialize state from URL params
    const [applications, setApplications] = useState<Application[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: parseInt(searchParams.get('page') || '1'),
        limit: 25,
        total_pages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState(sanitizeSearchQuery(searchParams.get('search') || ''));
    const [stageFilter, setStageFilter] = useState(searchParams.get('stage') || '');
    const [viewMode, setViewMode] = useViewMode('applicationsViewMode');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [acceptingId, setAcceptingId] = useState<string | null>(null);

    // Bulk actions state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showBulkActionModal, setShowBulkActionModal] = useState(false);
    const [bulkAction, setBulkAction] = useState<'stage' | 'reject' | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    // Sync state with URL params (e.g., when user clicks back button)
    // Note: We don't sanitize here during sync, only on initial load
    useEffect(() => {
        const urlSearch = searchParams.get('search') || '';
        const urlStage = searchParams.get('stage') || '';
        const urlPage = parseInt(searchParams.get('page') || '1');

        if (urlSearch !== searchQuery) setSearchQuery(urlSearch);
        if (urlStage !== stageFilter) setStageFilter(urlStage);
        if (urlPage !== pagination.page) {
            setPagination(prev => ({ ...prev, page: urlPage }));
        }
    }, [searchParams]);

    // Update URL when state changes (shallow update to preserve focus)
    useEffect(() => {
        const params = new URLSearchParams();

        if (searchQuery) {
            params.set('search', searchQuery);
        }

        if (stageFilter) {
            params.set('stage', stageFilter);
        }

        if (pagination.page > 1) {
            params.set('page', pagination.page.toString());
        }

        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;

        // Use window.history.replaceState for a truly shallow update that doesn't trigger re-renders
        window.history.replaceState(null, '', newUrl);
    }, [searchQuery, stageFilter, pagination.page, pathname]);

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            // Reset to page 1 when search/filter changes
            setPagination(prev => ({ ...prev, page: 1 }));
            loadApplications();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, stageFilter]);

    // Load when pagination changes
    useEffect(() => {
        if (pagination.page > 0) {
            loadApplications();
        }
    }, [pagination.page]);

    const loadApplications = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const client = createAuthenticatedClient(token);

            // Get user profile
            const profileRes = await client.get('/me');
            const profile = profileRes.data;
            const membership = profile?.memberships?.[0];
            const role = membership?.role;
            setUserRole(role);

            // Build query parameters for server-side filtering
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sort_by: 'created_at',
                sort_order: 'desc',
            });

            if (searchQuery) {
                // Sanitize search query when sending to API (removes legacy smart search keywords)
                const cleanedSearch = sanitizeSearchQuery(searchQuery);
                if (cleanedSearch) {
                    params.append('search', cleanedSearch);
                }
            }
            if (stageFilter) {
                params.append('stage', stageFilter);
            }

            if (role === 'company_admin' || role === 'hiring_manager') {
                // Get company ID for company users
                const companiesRes = await client.get(`/companies?org_id=${membership.organization_id}`);
                const companies = companiesRes.data || [];
                if (companies.length > 0) {
                    params.append('company_id', companies[0].id);
                }
            }
            // For recruiters: API Gateway automatically adds recruiter_id filter (no extra call needed!)

            // Call paginated endpoint (Gateway applies RBAC filtering automatically)
            const response = await client.get(`/applications/paginated?${params.toString()}`);
            setApplications(response.data || []);
            setPagination(response.pagination || pagination);

        } catch (err: any) {
            console.error('Failed to load applications:', err);
            setError(err.message || 'Failed to load applications');
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptApplication = async (applicationId: string) => {
        try {
            setAcceptingId(applicationId);
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            await client.post(`/applications/${applicationId}/accept`, {});

            // Reload applications
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
                // Update stage for all selected applications
                await Promise.all(
                    idsArray.map(id =>
                        client.updateApplicationStage(id, data.newStage!, data.notes)
                    )
                );
            } else if (bulkAction === 'reject') {
                // Reject all selected applications
                await Promise.all(
                    idsArray.map(id =>
                        client.updateApplicationStage(id, 'rejected', data.reason || data.notes)
                    )
                );
            }

            // Reload applications and clear selections
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

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>{error}</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Applications</h1>
                    <p className="text-base-content/70 mt-1">
                        {isCompanyUser
                            ? 'Candidate submissions to your jobs'
                            : isRecruiter
                                ? 'Applications for your assigned candidates'
                                : 'All candidate applications'}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <ApplicationFilters
                ref={searchInputRef}
                searchQuery={searchQuery}
                stageFilter={stageFilter}
                viewMode={viewMode}
                onSearchChange={setSearchQuery}
                onStageFilterChange={setStageFilter}
                onViewModeChange={setViewMode}
            />

            {/* Results count */}
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
                        <table className="table">
                            <thead>
                                <tr>
                                    {isRecruiter && (
                                        <th className="w-12">
                                            <input
                                                type="checkbox"
                                                className="checkbox checkbox-sm"
                                                checked={selectedIds.size === applications.length && applications.length > 0}
                                                onChange={toggleSelectAll}
                                                aria-label="Select all applications"
                                            />
                                        </th>
                                    )}
                                    <th>Candidate</th>
                                    <th>Job</th>
                                    <th>Company</th>
                                    <th>Recruiter</th>
                                    <th>Stage</th>
                                    <th>Status</th>
                                    <th>Submitted</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map((application) => (
                                    <ApplicationTableRow
                                        key={application.id}
                                        application={application}
                                        canAccept={isCompanyUser && !application.accepted_by_company}
                                        isAccepting={acceptingId === application.id}
                                        onAccept={() => handleAcceptApplication(application.id)}
                                        getStageColor={getStageColor}
                                        formatDate={formatDate}
                                        showCheckbox={isRecruiter}
                                        isSelected={selectedIds.has(application.id)}
                                        onToggleSelect={() => toggleSelection(application.id)}
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
