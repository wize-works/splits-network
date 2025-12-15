'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import ProposalCard from '@/components/ProposalCard';

export default function ProposalsListClient() {
    const { getToken } = useAuth();
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'responded'>('all');

    useEffect(() => {
        loadProposals();
    }, [getToken]);

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
            
            // Fetch proposals for current user
            const response = await client.get('/proposals/my-proposals');
            const proposalsData = response.data || [];

            // Fetch job and candidate details for each proposal
            const proposalsWithDetails = await Promise.all(
                proposalsData.map(async (proposal: any) => {
                    try {
                        const [jobResponse, candidateResponse] = await Promise.all([
                            client.get(`/jobs/${proposal.job_id}`).catch(() => ({ data: null })),
                            client.get(`/candidates/${proposal.candidate_id}`).catch(() => ({ data: null }))
                        ]);

                        return {
                            ...proposal,
                            job: jobResponse.data,
                            candidate: candidateResponse.data
                        };
                    } catch {
                        return proposal;
                    }
                })
            );

            setProposals(proposalsWithDetails);
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

    const filteredProposals = proposals.filter((p) => {
        if (filter === 'pending') return p.status === 'proposed';
        if (filter === 'responded') return p.status !== 'proposed';
        return true;
    });

    const pendingCount = proposals.filter(p => p.status === 'proposed').length;

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
                    className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({proposals.length})
                </button>
                <button
                    className={`tab ${filter === 'pending' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({pendingCount})
                    {pendingCount > 0 && (
                        <span className="badge badge-warning badge-sm ml-2">{pendingCount}</span>
                    )}
                </button>
                <button
                    className={`tab ${filter === 'responded' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('responded')}
                >
                    Responded ({proposals.length - pendingCount})
                </button>
            </div>

            {/* Proposals list */}
            {filteredProposals.length === 0 ? (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body items-center text-center py-12">
                        <i className="fa-solid fa-inbox text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">
                            {filter === 'pending' ? 'No Pending Proposals' : 'No Proposals'}
                        </h3>
                        <p className="text-base-content/70 mt-2">
                            {filter === 'pending' 
                                ? 'You have no pending proposals to review'
                                : 'Proposals to work on candidate-role pairings will appear here'
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredProposals.map((proposal) => (
                        <ProposalCard
                            key={proposal.id}
                            proposal={proposal}
                            jobTitle={proposal.job?.title}
                            candidateName={proposal.candidate?.full_name}
                            onAccept={handleAccept}
                            onDecline={handleDecline}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
