'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import UnifiedProposalCard from '@/components/unified-proposal-card';

interface PaginationInfo {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

interface ProposalSummary {
    actionable_count: number;
    waiting_count: number;
    urgent_count: number;
    overdue_count: number;
}

export default function ProposalsListClient() {
    const { getToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Check for success message
    const successMessage = searchParams.get('success');

    // Initialize state from URL params
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState<string | null>(successMessage);
    const [stateFilter, setStateFilter] = useState<'all' | 'actionable' | 'waiting'>(
        (searchParams.get('state') as 'all' | 'actionable' | 'waiting') || 'all'
    );
    const [pagination, setPagination] = useState<PaginationInfo>({
        total: 0,
        page: parseInt(searchParams.get('page') || '1'),
        limit: 25,
        total_pages: 0,
    });
    const [summary, setSummary] = useState<ProposalSummary>({
        actionable_count: 0,
        waiting_count: 0,
        urgent_count: 0,
        overdue_count: 0,
    });

    // Update URL when state changes (without navigation)
    useEffect(() => {
        const params = new URLSearchParams();
        if (stateFilter !== 'all') params.set('state', stateFilter);
        if (pagination.page > 1) params.set('page', pagination.page.toString());

        const newUrl = params.toString()
            ? `/proposals?${params.toString()}`
            : '/proposals';
        router.replace(newUrl, { scroll: false });
    }, [stateFilter, pagination.page, router]);

    // Load proposals when filters change
    useEffect(() => {
        // Reset to page 1 when filter changes
        if (pagination.page !== 1) {
            setPagination(prev => ({ ...prev, page: 1 }));
        } else {
            loadProposals();
        }
    }, [stateFilter]);

    // Load when pagination changes (but not on initial mount when triggered by filter)
    useEffect(() => {
        if (pagination.page > 0) {
            loadProposals();
        }
    }, [pagination.page]);

    async function loadProposals() {
        try {
            setLoading(true);
            setError(null);

            const token = await getToken();
            if (!token) {
                setError('Not authenticated');
                return;
            }

            const client = createAuthenticatedClient(token);

            // Build query parameters for server-side filtering
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                sort_by: 'created_at',
                sort_order: 'desc',
            });

            // Add state filter
            if (stateFilter !== 'all') {
                params.append('state', stateFilter);
            }

            // Call unified proposals API with pagination
            const response = await client.get(`/proposals?${params.toString()}`);

            // Response format: { data: proposals[], pagination: {...}, summary: {...} }
            setProposals(response.data || []);
            setPagination(response.pagination || {
                total: 0,
                page: 1,
                limit: 25,
                total_pages: 0,
            });
            setSummary(response.summary || {
                actionable_count: 0,
                waiting_count: 0,
                urgent_count: 0,
                overdue_count: 0,
            });
        } catch (err: any) {
            console.error('Failed to load proposals:', err);
            setError(err.message || 'Failed to load proposals');
        } finally {
            setLoading(false);
        }
    }

    async function handleAccept(proposalId: string, notes: string) {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const client = createAuthenticatedClient(token);
        await client.post(`/proposals/${proposalId}/accept`, { response_notes: notes });

        // Reload proposals
        await loadProposals();
    }

    async function handleDecline(proposalId: string, notes: string) {
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');

        const client = createAuthenticatedClient(token);
        await client.post(`/proposals/${proposalId}/decline`, { response_notes: notes });

        // Reload proposals
        await loadProposals();
    }

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading proposals...</p>
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
            {showSuccess && (
                <div className="alert alert-success">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>
                        {showSuccess === 'accepted'
                            ? 'Proposal accepted successfully! The candidate has been assigned to you for this role.'
                            : 'Proposal declined successfully.'
                        }
                    </span>
                    <button
                        onClick={() => setShowSuccess(null)}
                        className="btn btn-sm btn-ghost btn-circle"
                    >
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Candidate Proposals</h1>
                    <p className="text-base-content/70 mt-1">
                        Review and respond to candidate-role assignment proposals
                    </p>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="tabs tabs-boxed w-fit">
                <button
                    className={`tab ${stateFilter === 'all' ? 'tab-active' : ''}`}
                    onClick={() => setStateFilter('all')}
                >
                    All ({pagination.total})
                </button>
                <button
                    className={`tab ${stateFilter === 'actionable' ? 'tab-active' : ''}`}
                    onClick={() => setStateFilter('actionable')}
                >
                    Action Required ({summary.actionable_count})
                    {summary.actionable_count > 0 && (
                        <span className="badge badge-warning badge-sm ml-2">{summary.actionable_count}</span>
                    )}
                </button>
                <button
                    className={`tab ${stateFilter === 'waiting' ? 'tab-active' : ''}`}
                    onClick={() => setStateFilter('waiting')}
                >
                    Waiting ({summary.waiting_count})
                </button>
            </div>

            {/* Proposals list */}
            {proposals.length === 0 ? (
                <div className="card bg-base-100 shadow">
                    <div className="card-body items-center text-center py-12">
                        <i className="fa-solid fa-inbox text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">
                            {stateFilter === 'actionable' ? 'No Pending Proposals' : 'No Proposals'}
                        </h3>
                        <p className="text-base-content/70 mt-2">
                            {stateFilter === 'actionable'
                                ? 'You have no pending proposals to review'
                                : 'Proposals to work on candidate-role pairings will appear here'
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {proposals.map((proposal) => (
                            <UnifiedProposalCard
                                key={proposal.id}
                                proposal={proposal}
                                onAccept={handleAccept}
                                onDecline={handleDecline}
                            />
                        ))}
                    </div>

                    {/* Pagination Controls */}
                    {pagination.total_pages > 1 && (
                        <PaginationControls
                            currentPage={pagination.page}
                            totalPages={pagination.total_pages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function PaginationControls({
    currentPage,
    totalPages,
    onPageChange
}: PaginationControlsProps) {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];

    // Always show first page
    pages.push(1);

    // Show ellipsis and pages around current page
    if (currentPage > 3) {
        pages.push('...');
    }

    // Pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
    }

    // Show ellipsis and last page
    if (currentPage < totalPages - 2) {
        pages.push('...');
    }
    if (totalPages > 1) {
        pages.push(totalPages);
    }

    return (
        <div className="flex justify-center gap-2 mt-6">
            <button
                className="btn btn-sm"
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                <i className="fa-solid fa-chevron-left"></i>
            </button>

            {pages.map((page, index) => (
                typeof page === 'number' ? (
                    <button
                        key={index}
                        className={`btn btn-sm ${page === currentPage ? 'btn-primary' : ''}`}
                        onClick={() => onPageChange(page)}
                    >
                        {page}
                    </button>
                ) : (
                    <span key={index} className="px-2 flex items-center">
                        {page}
                    </span>
                )
            ))}

            <button
                className="btn btn-sm"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                <i className="fa-solid fa-chevron-right"></i>
            </button>
        </div>
    );
}
