'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { apiClient } from '@/lib/api-client';

interface MarketplaceRecruiter {
    id: string;
    user_id: string;
    marketplace_tagline?: string;
    marketplace_industries?: string[];
    marketplace_specialties?: string[];
    marketplace_location?: string;
    marketplace_years_experience?: number;
    marketplace_profile?: Record<string, any>;
    bio?: string;
    contact_available?: boolean;
    total_placements?: number;
    success_rate?: number;
    reputation_score?: number;
    created_at: string;
}

export default function RecruiterDetailPage() {
    const router = useRouter();
    const params = useParams();
    const recruiterId = params.id as string;
    const { getToken } = useAuth();

    const [recruiter, setRecruiter] = useState<MarketplaceRecruiter | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadRecruiter();
    }, [recruiterId]);

    const loadRecruiter = async () => {
        try {
            setLoading(true);
            setError('');

            const token = await getToken();
            if (!token) {
                setError('Please sign in to view this recruiter.');
                setLoading(false);
                return;
            }

            const result = await apiClient.get<any>(`/marketplace/recruiters/${recruiterId}`, token);
            setRecruiter(result.data);
        } catch (err) {
            console.error('Failed to load recruiter:', err);
            setError('Failed to load recruiter profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const token = await getToken();
            if (!token) {
                setError('Please sign in to connect with this recruiter.');
                setSubmitting(false);
                return;
            }

            await apiClient.post('/marketplace/connections', {
                recruiter_id: recruiterId,
                message: connectionMessage,
            }, token);

            setSuccess('Connection request sent successfully!');
            setShowConnectModal(false);
            setConnectionMessage('');
            setTimeout(() => {
                router.push('/connections');
            }, 2000);
        } catch (err: any) {
            console.error('Failed to send connection request:', err);
            setError(err.message || 'Failed to send connection request. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error && !recruiter) {
        return (
            <div className="container mx-auto p-6">
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
                <button className="btn mt-4" onClick={() => router.back()}>
                    Go Back
                </button>
            </div>
        );
    }

    if (!recruiter) {
        return null;
    }

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            {success && (
                <div className="alert alert-success mb-4">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>{success}</span>
                </div>
            )}

            {error && (
                <div className="alert alert-error mb-4">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Header */}
            <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                    <div className="flex items-start gap-4">
                        <div className="avatar placeholder">
                            <div className="bg-primary text-primary-content rounded-full w-20">
                                <span className="text-3xl">
                                    {recruiter.user_id.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        </div>

                        <div className="flex-1">
                            {recruiter.marketplace_tagline && (
                                <h1 className="text-3xl font-bold mb-2">{recruiter.marketplace_tagline}</h1>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                                {recruiter.marketplace_location && (
                                    <span className="flex items-center gap-1">
                                        <i className="fa-solid fa-location-dot"></i>
                                        {recruiter.marketplace_location}
                                    </span>
                                )}
                                {recruiter.marketplace_years_experience && (
                                    <span className="flex items-center gap-1">
                                        <i className="fa-solid fa-briefcase"></i>
                                        {recruiter.marketplace_years_experience}+ years experience
                                    </span>
                                )}
                            </div>

                            <div className="card-actions mt-4">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowConnectModal(true)}
                                >
                                    <i className="fa-solid fa-user-plus"></i>
                                    Connect
                                </button>
                                {recruiter.contact_available && (
                                    <button className="btn btn-outline">
                                        <i className="fa-solid fa-envelope"></i>
                                        Contact
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            {recruiter.total_placements !== undefined && (
                <div className="stats shadow-md w-full mb-6">
                    <div className="stat">
                        <div className="stat-title">Total Placements</div>
                        <div className="stat-value">{recruiter.total_placements}</div>
                    </div>
                    {recruiter.success_rate !== undefined && (
                        <div className="stat">
                            <div className="stat-title">Success Rate</div>
                            <div className="stat-value">{Math.round(recruiter.success_rate * 100)}%</div>
                        </div>
                    )}
                    {recruiter.reputation_score !== undefined && (
                        <div className="stat">
                            <div className="stat-title">Reputation Score</div>
                            <div className="stat-value">{recruiter.reputation_score.toFixed(1)}</div>
                            <div className="stat-desc">Out of 10</div>
                        </div>
                    )}
                </div>
            )}

            {/* Bio */}
            {recruiter.bio && (
                <div className="card bg-base-100 shadow-md mb-6">
                    <div className="card-body">
                        <h2 className="card-title">About</h2>
                        <p className="text-base-content/80 whitespace-pre-wrap">{recruiter.bio}</p>
                    </div>
                </div>
            )}

            {/* Industries & Specialties */}
            {(recruiter.marketplace_industries && recruiter.marketplace_industries.length > 0) ||
                (recruiter.marketplace_specialties && recruiter.marketplace_specialties.length > 0) ? (
                <div className="card bg-base-100 shadow-md mb-6">
                    <div className="card-body">
                        {recruiter.marketplace_industries && recruiter.marketplace_industries.length > 0 && (
                            <div className="mb-4">
                                <h3 className="font-semibold mb-2">Industries</h3>
                                <div className="flex flex-wrap gap-2">
                                    {recruiter.marketplace_industries.map(industry => (
                                        <span key={industry} className="badge badge-lg">
                                            {industry}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {recruiter.marketplace_specialties && recruiter.marketplace_specialties.length > 0 && (
                            <div>
                                <h3 className="font-semibold mb-2">Specialties</h3>
                                <div className="flex flex-wrap gap-2">
                                    {recruiter.marketplace_specialties.map(specialty => (
                                        <span key={specialty} className="badge badge-lg badge-outline">
                                            {specialty}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Connect Modal */}
            {showConnectModal && (
                <dialog className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Connect with Recruiter</h3>
                        <form onSubmit={handleConnect}>
                            <div className="fieldset">
                                <label className="label">Message (Optional)</label>
                                <textarea
                                    className="textarea w-full h-32"
                                    placeholder="Introduce yourself and explain why you'd like to connect..."
                                    maxLength={1000}
                                    value={connectionMessage}
                                    onChange={(e) => setConnectionMessage(e.target.value)}
                                />
                                <label className="label">
                                    <span className="label-text-alt">{connectionMessage.length}/1000 characters</span>
                                </label>
                            </div>

                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => {
                                        setShowConnectModal(false);
                                        setConnectionMessage('');
                                    }}
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button onClick={() => setShowConnectModal(false)}>close</button>
                    </form>
                </dialog>
            )}
        </div>
    );
}
