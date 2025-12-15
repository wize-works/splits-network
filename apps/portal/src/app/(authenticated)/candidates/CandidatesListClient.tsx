'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/useViewMode';

export default function CandidatesListClient() {
    const { getToken } = useAuth();
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useViewMode('candidatesViewMode');

    useEffect(() => {
        async function loadCandidates() {
            try {
                setLoading(true);
                setError(null);
                
                const token = await getToken();
                if (!token) {
                    setError('Not authenticated');
                    return;
                }
                
                const client = createAuthenticatedClient(token);
                const response = await client.get('/candidates');
                setCandidates(response.data || []);
            } catch (err: any) {
                console.error('Failed to load candidates:', err);
                setError(err.message || 'Failed to load candidates');
            } finally {
                setLoading(false);
            }
        }

        loadCandidates();
    }, [getToken]);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const filteredCandidates = candidates.filter(candidate =>
        searchQuery === '' ||
        candidate.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading candidates...</p>
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
                    <h1 className="text-3xl font-bold">Candidates</h1>
                    <p className="text-base-content/70 mt-1">
                        View and manage all your submitted candidates
                    </p>
                </div>
            </div>

            {/* Filters and View Toggle */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="fieldset flex-1">
                            <label className="label">Search</label>
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                className="input w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="join">
                            <button 
                                className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                            <button 
                                className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Candidates List - Grid View */}
            {viewMode === 'grid' && filteredCandidates.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredCandidates.map((candidate) => (
                        <div key={candidate.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="card-body">
                                <div className="flex items-start gap-3">
                                    <div className="avatar avatar-placeholder">
                                        <div className="bg-primary/10 text-primary rounded-full w-12">
                                            <span className="text-lg">{candidate.full_name[0]}</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <Link href={`/candidates/${candidate.id}`} className="hover:text-primary transition-colors">
                                            <h3 className="card-title text-xl">{candidate.full_name}</h3>
                                        </Link>
                                        <div className="text-sm text-base-content/70 mt-1">
                                            <a href={`mailto:${candidate.email}`} className="link link-hover">
                                                {candidate.email}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {candidate.linkedin_url && (
                                    <div className="mt-3">
                                        <a
                                            href={candidate.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-ghost btn-sm gap-2"
                                        >
                                            <i className="fa-brands fa-linkedin"></i>
                                            LinkedIn Profile
                                        </a>
                                    </div>
                                )}

                                <div className="card-actions justify-between items-center mt-4">
                                    <span className="text-sm text-base-content/60">
                                        Added {formatDate(candidate.created_at)}
                                    </span>
                                    <Link
                                        href={`/candidates/${candidate.id}`}
                                        className="btn btn-primary btn-sm gap-2"
                                    >
                                        View Details
                                        <i className="fa-solid fa-arrow-right"></i>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Candidates List - Table View */}
            {viewMode === 'table' && filteredCandidates.length > 0 && (
                <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Candidate</th>
                                    <th>Email</th>
                                    <th>LinkedIn</th>
                                    <th>Added</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCandidates.map((candidate) => (
                                    <tr key={candidate.id} className="hover">
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar avatar-placeholder">
                                                    <div className="bg-primary/10 text-primary rounded-full w-10">
                                                        <span className="text-sm">{candidate.full_name[0]}</span>
                                                    </div>
                                                </div>
                                                <Link href={`/candidates/${candidate.id}`} className="font-semibold hover:text-primary transition-colors">
                                                    {candidate.full_name}
                                                </Link>
                                            </div>
                                        </td>
                                        <td>
                                            <a href={`mailto:${candidate.email}`} className="link link-hover text-sm">
                                                {candidate.email}
                                            </a>
                                        </td>
                                        <td>
                                            {candidate.linkedin_url ? (
                                                <a
                                                    href={candidate.linkedin_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm"
                                                    title="View LinkedIn Profile"
                                                >
                                                    <i className="fa-brands fa-linkedin"></i>
                                                </a>
                                            ) : (
                                                <span className="text-base-content/40">—</span>
                                            )}
                                        </td>
                                        <td className="text-sm text-base-content/70">
                                            {formatDate(candidate.created_at)}
                                        </td>
                                        <td>
                                            <div className="flex gap-2 justify-end">
                                                <Link
                                                    href={`/candidates/${candidate.id}`}
                                                    className="btn btn-primary btn-sm"
                                                    title="View Details"
                                                >
                                                    <i className="fa-solid fa-arrow-right"></i>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredCandidates.length === 0 && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-users text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">No Candidates Found</h3>
                        <p className="text-base-content/70 mt-2">
                            {searchQuery ? 'Try adjusting your search' : 'Submit candidates to roles to see them appear here'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
