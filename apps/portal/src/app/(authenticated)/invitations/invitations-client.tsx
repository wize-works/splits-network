'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface RecruiterCandidate {
    id: string;
    recruiter_id: string;
    candidate_id: string;
    relationship_start_date: string;
    relationship_end_date: string;
    status: 'active' | 'expired' | 'terminated';
    invited_at?: string;
    invitation_expires_at?: string;
    consent_given: boolean;
    consent_given_at?: string;
    declined_at?: string;
    declined_reason?: string;
}

interface Candidate {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    verification_status: string;
}

interface InvitationWithCandidate extends RecruiterCandidate {
    candidate?: Candidate;
}

export default function InvitationsPageClient() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [invitations, setInvitations] = useState<InvitationWithCandidate[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

    useEffect(() => {
        loadInvitations();
    }, []);

    const loadInvitations = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current recruiter's profile
            const recruiterResponse = await fetch('/api/proxy/network/recruiters/me', {
                credentials: 'include',
            });
            
            if (!recruiterResponse.ok) {
                throw new Error('Failed to fetch recruiter profile');
            }

            const recruiterData = await recruiterResponse.json();
            const recruiterId = recruiterData.data?.id;

            if (!recruiterId) {
                throw new Error('No recruiter profile found');
            }

            // Get all recruiter-candidate relationships
            const relationshipsResponse = await fetch(
                `/api/proxy/network/recruiter-candidates/recruiter/${recruiterId}`,
                { credentials: 'include' }
            );

            if (!relationshipsResponse.ok) {
                throw new Error('Failed to fetch invitations');
            }

            const relationshipsData = await relationshipsResponse.json();
            const relationships: RecruiterCandidate[] = relationshipsData.data || [];

            // Fetch candidate details for each relationship
            const invitationsWithCandidates = await Promise.all(
                relationships.map(async (rel) => {
                    try {
                        const candidateResponse = await fetch(
                            `/api/proxy/ats/candidates/${rel.candidate_id}`,
                            { credentials: 'include' }
                        );
                        
                        if (candidateResponse.ok) {
                            const candidateData = await candidateResponse.json();
                            return {
                                ...rel,
                                candidate: candidateData.data,
                            };
                        }
                    } catch (err) {
                        console.error('Failed to fetch candidate:', err);
                    }
                    return rel;
                })
            );

            setInvitations(invitationsWithCandidates);
        } catch (err: any) {
            setError(err.message || 'Failed to load invitations');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (invitation: RecruiterCandidate) => {
        if (invitation.consent_given) {
            return <span className="badge badge-success gap-2">
                <i className="fa-solid fa-check"></i> Accepted
            </span>;
        }
        
        if (invitation.declined_at) {
            return <span className="badge badge-error gap-2">
                <i className="fa-solid fa-times"></i> Declined
            </span>;
        }

        const isExpired = invitation.invitation_expires_at && 
            new Date(invitation.invitation_expires_at) < new Date();
        
        if (isExpired) {
            return <span className="badge badge-warning gap-2">
                <i className="fa-solid fa-clock"></i> Expired
            </span>;
        }

        return <span className="badge badge-info gap-2">
            <i className="fa-solid fa-hourglass-half"></i> Pending
        </span>;
    };

    const getFilteredInvitations = () => {
        return invitations.filter((inv) => {
            if (filter === 'all') return true;
            if (filter === 'accepted') return inv.consent_given === true;
            if (filter === 'declined') return inv.declined_at != null;
            if (filter === 'pending') {
                return !inv.consent_given && !inv.declined_at;
            }
            return true;
        });
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredInvitations = getFilteredInvitations();
    const stats = {
        total: invitations.length,
        pending: invitations.filter(i => !i.consent_given && !i.declined_at).length,
        accepted: invitations.filter(i => i.consent_given).length,
        declined: invitations.filter(i => i.declined_at).length,
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Candidate Invitations</h1>
                <p className="text-gray-600 mt-2">
                    Track the status of invitations you've sent to candidates
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Total Invitations</div>
                        <div className="stat-value">{stats.total}</div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Pending</div>
                        <div className="stat-value text-info">{stats.pending}</div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Accepted</div>
                        <div className="stat-value text-success">{stats.accepted}</div>
                    </div>
                </div>
                <div className="stats shadow">
                    <div className="stat">
                        <div className="stat-title">Declined</div>
                        <div className="stat-value text-error">{stats.declined}</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="tabs tabs-boxed">
                <button 
                    className={`tab ${filter === 'all' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({stats.total})
                </button>
                <button 
                    className={`tab ${filter === 'pending' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({stats.pending})
                </button>
                <button 
                    className={`tab ${filter === 'accepted' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('accepted')}
                >
                    Accepted ({stats.accepted})
                </button>
                <button 
                    className={`tab ${filter === 'declined' ? 'tab-active' : ''}`}
                    onClick={() => setFilter('declined')}
                >
                    Declined ({stats.declined})
                </button>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Invitations Table */}
            {filteredInvitations.length === 0 ? (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-inbox text-6xl text-gray-300 mb-4"></i>
                        <h3 className="text-xl font-semibold">No invitations found</h3>
                        <p className="text-gray-600">
                            {filter === 'all' 
                                ? 'Start adding candidates to send invitations'
                                : `No ${filter} invitations at this time`
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Candidate</th>
                                        <th>Email</th>
                                        <th>Invited</th>
                                        <th>Expires</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvitations.map((invitation) => (
                                        <tr key={invitation.id}>
                                            <td>
                                                <div className="font-bold">
                                                    {invitation.candidate?.full_name || 'Unknown'}
                                                </div>
                                            </td>
                                            <td>{invitation.candidate?.email || 'N/A'}</td>
                                            <td>{formatDate(invitation.invited_at)}</td>
                                            <td>
                                                {invitation.invitation_expires_at ? (
                                                    <span className={
                                                        new Date(invitation.invitation_expires_at) < new Date()
                                                            ? 'text-warning'
                                                            : ''
                                                    }>
                                                        {formatDate(invitation.invitation_expires_at)}
                                                    </span>
                                                ) : 'N/A'}
                                            </td>
                                            <td>{getStatusBadge(invitation)}</td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-ghost"
                                                        onClick={() => router.push(`/candidates/${invitation.candidate_id}`)}
                                                    >
                                                        <i className="fa-solid fa-eye"></i>
                                                    </button>
                                                    {invitation.declined_reason && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-ghost"
                                                            onClick={() => alert(invitation.declined_reason)}
                                                            title="View decline reason"
                                                        >
                                                            <i className="fa-solid fa-comment"></i>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
