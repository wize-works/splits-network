'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface Invitation {
    id: string;
    email: string;
    organization_id: string;
    role: string;
    invited_by: string;
    status: string;
    expires_at: string;
    created_at: string;
}

interface Organization {
    id: string;
    name: string;
    slug: string;
}

interface Props {
    invitation: Invitation;
    userId: string;
}

export default function AcceptInvitationClient({ invitation, userId }: Props) {
    const router = useRouter();
    const { getToken } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);
    const [accepting, setAccepting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const roleLabels: Record<string, string> = {
        company_admin: 'Company Administrator',
        hiring_manager: 'Hiring Manager',
        recruiter: 'Recruiter',
    };

    useEffect(() => {
        async function fetchOrganization() {
            try {
                const token = await getToken();
                const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
                
                const res = await fetch(`${apiBaseUrl}/v1/organizations/${invitation.organization_id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (res.ok) {
                    const result = await res.json();
                    setOrganization(result.data);
                }
            } catch (err) {
                console.error('Failed to fetch organization:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchOrganization();
    }, [invitation.organization_id, getToken]);

    async function handleAccept() {
        setAccepting(true);
        setError(null);

        try {
            const token = await getToken();
            const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
            
            const res = await fetch(`${apiBaseUrl}/v1/invitations/${invitation.id}/accept`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Failed to accept invitation');
            }

            // Success! Redirect to dashboard or organization page
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'An error occurred while accepting the invitation');
            setAccepting(false);
        }
    }

    function handleDecline() {
        router.push('/');
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body text-center">
                        <span className="loading loading-spinner loading-lg"></span>
                        <p className="text-base-content/70 mt-4">Loading invitation details...</p>
                    </div>
                </div>
            </div>
        );
    }

    const expiresAt = new Date(invitation.expires_at);
    const roleLabel = roleLabels[invitation.role] || invitation.role;

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card bg-base-100 shadow-xl max-w-md w-full">
                <div className="card-body">
                    <div className="text-center mb-6">
                        <i className="fa-solid fa-envelope-open-text text-5xl text-primary mb-4"></i>
                        <h1 className="card-title text-2xl justify-center">You've Been Invited!</h1>
                    </div>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <p className="text-sm text-base-content/60 mb-1">Organization</p>
                            <p className="text-lg font-semibold">
                                {organization?.name || invitation.organization_id}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-base-content/60 mb-1">Your Role</p>
                            <p className="text-lg">
                                <span className="badge badge-primary badge-lg">{roleLabel}</span>
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-base-content/60 mb-1">Invitation Expires</p>
                            <p className="text-base">
                                {expiresAt.toLocaleDateString('en-US', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <p className="text-sm text-base-content/70 text-center mb-4">
                        By accepting this invitation, you will become a member of this organization with {roleLabel} privileges.
                    </p>

                    <div className="card-actions justify-center gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleDecline}
                            disabled={accepting}
                        >
                            Decline
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleAccept}
                            disabled={accepting}
                        >
                            {accepting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Accepting...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-check"></i>
                                    Accept Invitation
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
