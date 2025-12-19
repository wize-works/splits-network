import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import AcceptInvitationClient from './AcceptInvitationClient';

interface PageProps {
    params: Promise<{ id: string }>;
}

async function getInvitation(id: string) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    
    try {
        const res = await fetch(`${apiBaseUrl}/v1/invitations/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            return null;
        }

        const result = await res.json();
        return result.data;
    } catch (error) {
        console.error('Failed to fetch invitation:', error);
        return null;
    }
}

async function getOrganization(organizationId: string, token: string) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';
    
    try {
        const res = await fetch(`${apiBaseUrl}/v1/organizations/${organizationId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return null;
        }

        const result = await res.json();
        return result.data;
    } catch (error) {
        console.error('Failed to fetch organization:', error);
        return null;
    }
}

export default async function AcceptInvitationPage({ params }: PageProps) {
    const { id } = await params;
    const user = await currentUser();

    // Fetch invitation details
    const invitation = await getInvitation(id);

    if (!invitation) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body text-center">
                        <i className="fa-solid fa-circle-xmark text-5xl text-error mb-4"></i>
                        <h1 className="card-title text-2xl justify-center">Invitation Not Found</h1>
                        <p className="text-base-content/70">
                            This invitation link is invalid or may have been revoked.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <a href="/" className="btn btn-primary">
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Check if invitation is still valid
    if (invitation.status !== 'pending') {
        const statusMessages: Record<string, { icon: string; title: string; message: string; color: string }> = {
            accepted: {
                icon: 'fa-circle-check',
                title: 'Already Accepted',
                message: 'This invitation has already been accepted.',
                color: 'text-success',
            },
            expired: {
                icon: 'fa-clock',
                title: 'Invitation Expired',
                message: 'This invitation has expired. Please contact the organization administrator for a new invitation.',
                color: 'text-warning',
            },
            revoked: {
                icon: 'fa-ban',
                title: 'Invitation Revoked',
                message: 'This invitation has been revoked by the organization.',
                color: 'text-error',
            },
        };

        const status = statusMessages[invitation.status] || statusMessages.revoked;

        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body text-center">
                        <i className={`fa-solid ${status.icon} text-5xl ${status.color} mb-4`}></i>
                        <h1 className="card-title text-2xl justify-center">{status.title}</h1>
                        <p className="text-base-content/70">{status.message}</p>
                        <div className="card-actions justify-center mt-4">
                            <a href="/" className="btn btn-primary">
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Check if invitation has expired
    const expiresAt = new Date(invitation.expires_at);
    if (expiresAt < new Date()) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body text-center">
                        <i className="fa-solid fa-clock text-5xl text-warning mb-4"></i>
                        <h1 className="card-title text-2xl justify-center">Invitation Expired</h1>
                        <p className="text-base-content/70">
                            This invitation expired on {expiresAt.toLocaleDateString()}. Please contact the organization administrator for a new invitation.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <a href="/" className="btn btn-primary">
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If not logged in, redirect to sign up with invitation context
    if (!user) {
        const signUpUrl = `/sign-up?invitation_id=${id}&email=${encodeURIComponent(invitation.email)}`;
        redirect(signUpUrl);
    }

    // Check if user email matches invitation email
    const userEmail = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress;
    if (userEmail && userEmail.toLowerCase() !== invitation.email.toLowerCase()) {
        return (
            <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
                <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body text-center">
                        <i className="fa-solid fa-triangle-exclamation text-5xl text-warning mb-4"></i>
                        <h1 className="card-title text-2xl justify-center">Email Mismatch</h1>
                        <p className="text-base-content/70 mb-4">
                            This invitation was sent to <strong>{invitation.email}</strong>, but you're logged in as <strong>{userEmail}</strong>.
                        </p>
                        <p className="text-base-content/70">
                            Please sign out and sign in with the correct email address, or contact the organization administrator.
                        </p>
                        <div className="card-actions justify-center mt-4 gap-2">
                            <a href="/sign-out" className="btn btn-outline">
                                Sign Out
                            </a>
                            <a href="/" className="btn btn-primary">
                                Go to Home
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Fetch organization details (need to get a token first - we'll handle this in the client component)
    return <AcceptInvitationClient invitation={invitation} userId={user.id} />;
}
