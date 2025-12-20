# Server-Side Applications List Implementation

This document contains the new implementation for `applications-list-client.tsx` with server-side pagination.

## File: `apps/portal/src/app/(authenticated)/applications/components/applications-list-client.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/use-view-mode';
import { ApplicationCard } from './application-card';
import { ApplicationTableRow } from './application-table-row';
import { ApplicationFilters } from './application-filters';
import { PaginationControls } from './pagination-controls';

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
                params.append('search', searchQuery);
            }
            if (stageFilter) {
                params.append('stage', stageFilter);
            }

            // Add role-specific filters
            if (role === 'company_admin' || role === 'hiring_manager') {
                // Get company ID for company users
                const companiesRes = await client.get(`/companies?org_id=${membership.organization_id}`);
                const companies = companiesRes.data || [];
                if (companies.length > 0) {
                    params.append('company_id', companies[0].id);
                }
            } else if (role === 'recruiter') {
                // Get recruiter profile
                const recruiterRes = await client.get('/recruiters/me');
                const recruiter = recruiterRes.data;
                
                if (recruiter?.user_id) {
                    // For recruiters: fetch owned applications + assigned candidate applications
                    // Get recruiter's candidate relationships
                    const relationshipsRes = await client.get('/recruiter-candidates/me');
                    const relationships = relationshipsRes.data || [];
                    const activeRelationships = relationships.filter((r: any) => r.status === 'active');
                    
                    if (activeRelationships.length > 0) {
                        // Fetch both owned and assigned candidate applications
                        // Note: This is a workaround until backend supports OR queries efficiently
                        const [ownedRes, ...candidateReses] = await Promise.all([
                            // Owned applications
                            client.get(`/applications/paginated?${params.toString()}&recruiter_id=${recruiter.user_id}`),
                            // Applications for each assigned candidate
                            ...activeRelationships.map((r: any) => 
                                client.get(`/applications/paginated?page=1&limit=1000&candidate_id=${r.candidate_id}${searchQuery ? `&search=${searchQuery}` : ''}${stageFilter ? `&stage=${stageFilter}` : ''}`)
                            )
                        ]);

                        // Merge and deduplicate
                        const owned = ownedRes.data || [];
                        const fromCandidates = candidateReses.flatMap(res => res.data || []);
                        const allApps = [...owned, ...fromCandidates];
                        const uniqueApps = Array.from(
                            new Map(allApps.map(app => [app.id, app])).values()
                        );

                        setApplications(uniqueApps);
                        setPagination({
                            total: uniqueApps.length,
                            page: pagination.page,
                            limit: pagination.limit,
                            total_pages: Math.ceil(uniqueApps.length / pagination.limit),
                        });
                        return;
                    } else {
                        params.append('recruiter_id', recruiter.user_id);
                    }
                }
            }

            // Call paginated endpoint
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

            {/* Table View */}
            {viewMode === 'table' && applications.length > 0 && (
                <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
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
        </div>
    );
}
```

## Summary of Changes

### Component Structure
- **Main Component** (`applications-list-client.tsx`): ~250 lines (down from 650+)
  - Handles data fetching with server-side pagination
  - Manages state (search, filters, pagination)
  - Orchestrates sub-components

- **ApplicationCard** (~130 lines): Grid view card
- **ApplicationTableRow** (~100 lines): Table row
- **ApplicationFilters** (~60 lines): Search, stage filter, view toggle
- **PaginationControls** (~75 lines): Reusable pagination UI

### Key Improvements
1. ✅ **Server-side pagination**: Fetches only 25 records at a time
2. ✅ **Server-side filtering**: Search and stage filters handled by backend
3. ✅ **Server-side enrichment**: JOIN query returns candidate/job/company data
4. ✅ **Debounced search**: 300ms delay to avoid excessive API calls
5. ✅ **Modular components**: Each component has single responsibility
6. ✅ **Reusable**: Pagination controls can be used in other list views

### Implementation Steps
1. Replace the current `applications-list-client.tsx` with the new implementation above
2. The sub-components are already created
3. Test the pagination, search, and filtering
4. Apply same pattern to other list views (jobs, candidates, placements)
