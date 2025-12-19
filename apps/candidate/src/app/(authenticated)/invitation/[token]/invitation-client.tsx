'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
    getInvitationDetails,
    getRecruiterDetails,
    getCandidateDetails,
    getUserDetails,
    acceptInvitation,
    declineInvitation,
    ApiError,
    type InvitationDetails,
    type RecruiterDetails,
    type UserDetails,
    type CandidateDetails,
} from '@/lib/api';

interface InvitationPageClientProps {
    token: string;
}

export default function InvitationPageClient({ token }: InvitationPageClientProps) {
    const router = useRouter();
    const { getToken, isSignedIn, isLoaded } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
    const [recruiter, setRecruiter] = useState<RecruiterDetails | null>(null);
    const [recruiterUser, setRecruiterUser] = useState<UserDetails | null>(null);
    const [candidate, setCandidate] = useState<CandidateDetails | null>(null);
    const [processing, setProcessing] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const [showDeclineForm, setShowDeclineForm] = useState(false);

    useEffect(() => {
        // Wait for Clerk to load
        if (!isLoaded) return;
        
        // If not signed in, redirect to sign-in with return URL
        if (!isSignedIn) {
            router.push(`/sign-in?redirect_url=${encodeURIComponent(`/invitation/${token}`)}`);
            return;
        }
        
        // User is authenticated, load invitation data
        loadInvitationData();
    }, [token, isLoaded, isSignedIn]);

    const loadInvitationData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get auth token (we know user is signed in at this point)
            const authToken = await getToken();

            // Fetch invitation details
            const invitationData = await getInvitationDetails(token, authToken);
            setInvitation(invitationData);

            // Fetch recruiter details
            const recruiterData = await getRecruiterDetails(invitationData.recruiter_id, authToken);
            setRecruiter(recruiterData);

            // Fetch recruiter user details
            const userData = await getUserDetails(recruiterData.user_id, authToken);
            setRecruiterUser(userData);

            // Fetch candidate details
            const candidateData = await getCandidateDetails(invitationData.candidate_id, authToken);
            setCandidate(candidateData);

        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 404) {
                    setError('This invitation does not exist or has been revoked.');
                } else if (err.status === 410) {
                    setError('This invitation has expired. Please contact your recruiter for a new invitation.');
                } else if (err.status === 409) {
                    setError(err.message);
                } else {
                    setError(err.message || 'Failed to load invitation details.');
                }
            } else {
                setError('An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!invitation) return;

        try {
            setProcessing(true);
            setError(null);

            const authToken = await getToken();
            await acceptInvitation(token, authToken);

            // Redirect to success page
            router.push(`/invitation/${token}/accepted`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message || 'Failed to accept invitation.');
            } else {
                setError('An unexpected error occurred.');
            }
            setProcessing(false);
        }
    };

    const handleDecline = async () => {
        if (!invitation) return;

        try {
            setProcessing(true);
            setError(null);

            const authToken = await getToken();
            await declineInvitation(token, declineReason || undefined, authToken);

            // Redirect to declined page
            router.push(`/invitation/${token}/declined`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err.message || 'Failed to decline invitation.');
            } else {
                setError('An unexpected error occurred.');
            }
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <p className="mt-4 text-base-content/70">Loading invitation...</p>
                </div>
            </div>
        );
    }

    if (error || !invitation || !recruiter || !recruiterUser || !candidate) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                    <div className="card-body">
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <div>
                                <h3 className="font-bold">Unable to Load Invitation</h3>
                                <div className="text-sm">{error || 'Invitation data could not be loaded.'}</div>
                            </div>
                        </div>
                        <div className="card-actions justify-end mt-4">
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => router.push('/')}
                            >
                                Go to Home
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const expiryDate = new Date(invitation.expires_at);
    const formattedExpiry = expiryDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    if (showDeclineForm) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">Decline Invitation</h2>
                        <p className="text-base-content/70">
                            Are you sure you want to decline this invitation from {recruiterUser.name}?
                        </p>

                        <div className="fieldset mt-4">
                            <label className="label">Reason (Optional)</label>
                            <textarea
                                className="textarea h-24"
                                placeholder="Let your recruiter know why you're declining..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                disabled={processing}
                            />
                        </div>

                        {error && (
                            <div className="alert alert-error mt-4">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="card-actions justify-end mt-6">
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setShowDeclineForm(false)}
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-error"
                                onClick={handleDecline}
                                disabled={processing}
                            >
                                {processing ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Declining...
                                    </>
                                ) : (
                                    'Confirm Decline'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-base-200 py-12 px-4">
            <div className="container mx-auto space-y-6">
                {/* Header Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <h1 className="text-4xl font-bold mb-2">Welcome to Applicant Network</h1>
                        <p className="text-xl text-base-content/70">You've been invited by a professional recruiter</p>
                    </div>
                </div>

                {/* Recruiter Info Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">
                            <i className="fa-solid fa-user-tie"></i>
                            About Your Recruiter
                        </h2>
                        <div className="divider my-2"></div>
                        
                        <div className="flex items-start gap-4">
                            <div className="avatar avatar-placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-16 h-16">
                                    <span className="text-2xl">
                                        {recruiterUser?.name?.split(' ').map(part => part[0]).join('').slice(0, 2) || ''}
                                    </span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold">
                                    {recruiterUser?.name}
                                </h3>
                                <p className="text-base-content/70">{recruiterUser?.email}</p>
                                {recruiter.bio && (
                                    <p className="mt-3">{recruiter.bio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* What is Applicant Network Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">
                            <i className="fa-solid fa-circle-info"></i>
                            What is Applicant Network?
                        </h2>
                        <div className="divider my-2"></div>
                        
                        <p className="mb-4">
                            Applicant Network is a platform where you can collaborate with your recruiter and manage your job search:
                        </p>
                        
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-check-circle text-success mt-1"></i>
                                <span><strong>Track Opportunities:</strong> See all job opportunities your recruiter finds for you</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-check-circle text-success mt-1"></i>
                                <span><strong>Centralized Applications:</strong> Manage all your applications in one place</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-check-circle text-success mt-1"></i>
                                <span><strong>Direct Communication:</strong> Stay in touch with your recruiter throughout the process</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <i className="fa-solid fa-check-circle text-success mt-1"></i>
                                <span><strong>Progress Updates:</strong> Get real-time updates on your job search progress</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right to Represent Card */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">
                            <i className="fa-solid fa-file-contract"></i>
                            What is "Right to Represent"?
                        </h2>
                        <div className="divider my-2"></div>
                        
                        <p className="mb-4">
                            By accepting this invitation, you're giving {recruiterUser?.name} permission 
                            to submit your profile to job opportunities on your behalf. This is a standard agreement in the recruiting industry.
                        </p>
                        
                        <div className="bg-base-200 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-handshake text-primary mt-1"></i>
                                <span><strong>Formalizes Your Relationship:</strong> Creates a professional working agreement with your recruiter</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-shield-halved text-primary mt-1"></i>
                                <span><strong>Prevents Duplicates:</strong> Ensures you're not submitted to the same job by multiple recruiters</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-award text-primary mt-1"></i>
                                <span><strong>Protects Credit:</strong> Ensures your recruiter gets recognition for placements they facilitate</span>
                            </div>
                            <div className="flex items-start gap-3">
                                <i className="fa-solid fa-user-check text-primary mt-1"></i>
                                <span><strong>Safeguards Your Interests:</strong> Protects you throughout the entire hiring process</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agreement Card */}
                <div className="card bg-base-100 shadow-xl border-2 border-primary">
                    <div className="card-body">
                        <h2 className="card-title text-2xl">
                            <i className="fa-solid fa-file-signature"></i>
                            Right to Represent Agreement
                        </h2>
                        <div className="divider my-2"></div>
                        
                        <div className="bg-base-200 rounded-lg p-6 space-y-4 text-sm">
                            <p className="font-semibold text-base">
                                Please review the following agreement carefully before accepting this invitation:
                            </p>
                            
                            <div className="space-y-3">
                                <p>
                                    <strong>1. Authorization to Represent:</strong> By accepting this invitation, I, <strong>{candidate?.full_name || 'the Candidate'}</strong>, 
                                    hereby authorize {recruiterUser?.name} ("<strong>Recruiter</strong>") to represent me in seeking employment opportunities 
                                    and to submit my profile, resume, and related information to potential employers.
                                </p>
                                
                                <p>
                                    <strong>2. Exclusive Representation Period:</strong> I acknowledge that for any position to which the Recruiter submits 
                                    my profile, the Recruiter shall have the exclusive right to represent me for that specific position for a period 
                                    of twelve (12) months from the date of submission, or until I am hired for that position, whichever occurs first.
                                </p>
                                
                                <p>
                                    <strong>3. No Duplicate Submissions:</strong> I agree not to apply directly to any company or through any other recruiter 
                                    for positions to which the Recruiter has already submitted my profile during the exclusive representation period, 
                                    unless I have notified the Recruiter in writing and received acknowledgment of withdrawal.
                                </p>
                                
                                <p>
                                    <strong>4. Recruiter's Commission:</strong> I understand that the Recruiter's compensation is paid directly by the 
                                    hiring employer upon successful placement, and I will not be responsible for any fees or commissions related to 
                                    the Recruiter's services.
                                </p>
                                
                                <p>
                                    <strong>5. Accuracy of Information:</strong> I confirm that all information provided in my profile, resume, and 
                                    communications with the Recruiter is accurate and complete to the best of my knowledge. I will promptly notify 
                                    the Recruiter of any material changes to my employment status or availability.
                                </p>
                                
                                <p>
                                    <strong>6. Communication and Updates:</strong> I agree to maintain reasonable communication with the Recruiter 
                                    throughout the recruitment process and to provide timely updates regarding interviews, offers, and my continued 
                                    interest in opportunities presented.
                                </p>
                                
                                <p>
                                    <strong>7. Confidentiality:</strong> I understand that the Recruiter may share my information with potential 
                                    employers in confidence, and I authorize such disclosure for the purpose of securing employment opportunities.
                                </p>
                                
                                <p>
                                    <strong>8. Right to Decline:</strong> I retain the right to decline any opportunity presented by the Recruiter 
                                    without penalty. This agreement does not obligate me to accept any position offered through the Recruiter's efforts.
                                </p>
                                
                                <p>
                                    <strong>9. Termination:</strong> Either party may terminate this agreement at any time by providing written notice 
                                    through the Applicant Network platform. Termination will not affect the Recruiter's rights regarding positions 
                                    to which my profile was submitted prior to termination.
                                </p>
                                
                                <p>
                                    <strong>10. Governing Terms:</strong> This agreement is governed by the terms of service of Applicant Network 
                                    and applicable employment laws. By accepting this invitation, I acknowledge that I have read, understood, and 
                                    agree to these terms.
                                </p>
                            </div>
                            
                            <div className="bg-base-100 rounded-lg p-4 mt-4 border-l-4 border-primary">
                                <p className="text-xs text-base-content/70">
                                    <strong>Effective Date:</strong> This agreement becomes effective upon your acceptance of this invitation 
                                    and remains in effect until terminated by either party as described above.
                                </p>
                            </div>
                        </div>
                        
                        <div className="alert alert-info mt-4">
                            <i className="fa-solid fa-info-circle"></i>
                            <span className="text-sm">
                                By clicking "Accept Invitation" below, you acknowledge that you have read and agree to the terms of this 
                                Right to Represent Agreement with {recruiterUser?.name}.
                            </span>
                        </div>
                    </div>
                </div>

                {/* Expiry Warning */}
                <div className="alert alert-warning">
                    <i className="fa-solid fa-clock"></i>
                    <span>
                        <strong>Time Sensitive:</strong> This invitation expires on {formattedExpiry}. 
                        If you don't respond by then, {recruiterUser?.name?.split(' ')[0]} will need to send a new invitation.
                    </span>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="alert alert-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>{error}</span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl mb-4">Ready to Get Started?</h2>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                className="btn btn-primary flex-1 btn-lg"
                                onClick={handleAccept}
                                disabled={processing}
                            >
                                {processing ? (
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
                            
                            <button
                                type="button"
                                className="btn btn-outline flex-1 btn-lg"
                                onClick={() => setShowDeclineForm(true)}
                                disabled={processing}
                            >
                                <i className="fa-solid fa-times"></i>
                                Decline
                            </button>
                        </div>

                        <p className="text-sm text-base-content/70 mt-4 text-center">
                            Have questions? Contact {recruiterUser?.name?.split(' ')[0]} directly at{' '}
                            <a href={`mailto:${recruiterUser?.email}`} className="link link-primary">
                                {recruiterUser?.email}
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
