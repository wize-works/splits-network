'use client';

import { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api-client';

export default function AIMatchesPage() {
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMatches();
    }, []);

    const loadMatches = async () => {
        setLoading(true);
        try {
            const api = new ApiClient();
            const response = await api.request<{ data: any[] }>('/automation/matches/pending');
            setMatches(response.data || []);
        } catch (error) {
            console.error('Failed to load matches:', error);
        } finally {
            setLoading(false);
        }
    };

    const reviewMatch = async (matchId: string, accepted: boolean) => {
        const action = accepted ? 'accept' : 'reject';
        if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} this match suggestion?`)) return;

        let rejectionReason = null;
        if (!accepted) {
            rejectionReason = prompt('Rejection reason (optional):');
        }

        try {
            const api = new ApiClient();
            await api.request(`/automation/matches/${matchId}/review`, {
                method: 'POST',
                body: JSON.stringify({
                    reviewed_by: 'admin', // TODO: Get from auth
                    accepted,
                    rejection_reason: rejectionReason,
                }),
            });
            alert(`Match ${action}ed`);
            loadMatches();
        } catch (error) {
            console.error('Failed to review match:', error);
            alert('Failed to review match');
        }
    };

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">AI Match Suggestions</h1>
                    <p className="text-base-content/60 mt-1">
                        Review candidate-role matches suggested by the AI system
                    </p>
                </div>
            </div>

            {/* Matches List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center p-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                ) : matches.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body text-center text-base-content/60">
                            <i className="fa-solid fa-sparkles text-4xl mb-2"></i>
                            <p>No pending match suggestions</p>
                        </div>
                    </div>
                ) : (
                    matches.map((match) => (
                        <div key={match.id} className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="radial-progress text-primary" style={{ '--value': match.match_score } as any}>
                                                {match.match_score}%
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-lg">
                                                    Candidate Match
                                                </h3>
                                                <p className="text-sm text-base-content/60">
                                                    Suggested {new Date(match.suggested_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <span className="text-sm text-base-content/60">Candidate ID:</span>
                                                <br />
                                                <span className="font-mono text-sm">
                                                    {match.candidate_id.substring(0, 16)}...
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-sm text-base-content/60">Job ID:</span>
                                                <br />
                                                <span className="font-mono text-sm">
                                                    {match.job_id.substring(0, 16)}...
                                                </span>
                                            </div>
                                        </div>

                                        {/* Match Reasons */}
                                        <div className="mb-4">
                                            <h4 className="text-sm font-semibold mb-2">Why this match?</h4>
                                            <div className="flex flex-wrap gap-2">
                                                {match.match_reasons.map((reason: string, idx: number) => (
                                                    <span key={idx} className="badge badge-outline">
                                                        <i className="fa-solid fa-check-circle mr-1"></i>
                                                        {reason}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 ml-4">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => reviewMatch(match.id, true)}
                                        >
                                            <i className="fa-solid fa-check"></i>
                                            Accept
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-sm"
                                            onClick={() => reviewMatch(match.id, false)}
                                        >
                                            <i className="fa-solid fa-times"></i>
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {!loading && matches.length > 0 && (
                <div className="alert mt-6">
                    <i className="fa-solid fa-info-circle"></i>
                    <div>
                        <h3 className="font-bold">AI Match Scoring</h3>
                        <div className="text-sm">
                            Matches above 60% confidence are suggested for review. The AI considers title alignment, skills matching, experience level, and department specialization.
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
