'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import DocumentList from '@/components/document-list';

interface CandidateDetailClientProps {
    candidateId: string;
}

export default function CandidateDetailClient({ candidateId }: CandidateDetailClientProps) {
    const { getToken } = useAuth();
    const [candidate, setCandidate] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [relationship, setRelationship] = useState<any>(null);
    const [canEdit, setCanEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                const token = await getToken();
                if (!token) {
                    setError('Not authenticated');
                    return;
                }
                
                const client = createAuthenticatedClient(token);

                // Fetch candidate details
                const candidateResponse = await client.get(`/candidates/${candidateId}`);
                setCandidate(candidateResponse.data);

                // Check if user can edit this candidate (recruiter with active relationship or admin)
                // Try to fetch the candidate's recruiter relationship
                try {
                    // If this succeeds, the user has an active relationship or is an admin
                    const relationshipCheck = await client.get(`/candidates/${candidateId}`);
                    setCanEdit(true);
                    
                    // Try to get detailed relationship info
                    try {
                        const relationshipResponse = await client.get(`/recruiter-candidates/candidate/${candidateId}`);
                        if (relationshipResponse.data && relationshipResponse.data.length > 0) {
                            // Get the most recent active relationship
                            const activeRelationship = relationshipResponse.data.find((r: any) => r.status === 'active');
                            setRelationship(activeRelationship || relationshipResponse.data[0]);
                        }
                    } catch (err) {
                        // No relationship info available (might be admin or self-managed candidate)
                        console.log('No relationship info:', err);
                    }
                } catch (err) {
                    // User cannot edit this candidate
                    setCanEdit(false);
                }

                // Fetch applications
                const applicationsResponse = await client.get(`/candidates/${candidateId}/applications`);
                const apps = applicationsResponse.data || [];

                // Fetch job details for each application
                const applicationsWithJobs = await Promise.all(
                    apps.map(async (app: any) => {
                        try {
                            const jobResponse = await client.get(`/jobs/${app.job_id}`);
                            return { ...app, job: jobResponse.data };
                        } catch {
                            return { ...app, job: null };
                        }
                    })
                );

                setApplications(applicationsWithJobs);
            } catch (err: any) {
                console.error('Failed to load candidate:', err);
                setError(err.message || 'Failed to load candidate details');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [candidateId, getToken]);

    const getStageColor = (stage: string) => {
        switch (stage) {
            case 'submitted': return 'badge-info';
            case 'screen': return 'badge-primary';
            case 'interview': return 'badge-warning';
            case 'offer': return 'badge-success';
            case 'hired': return 'badge-success';
            case 'rejected': return 'badge-error';
            default: return 'badge-ghost';
        }
    };

    const getStageIcon = (stage: string) => {
        switch (stage) {
            case 'submitted': return 'fa-file-import';
            case 'screen': return 'fa-phone';
            case 'interview': return 'fa-comments';
            case 'offer': return 'fa-file-contract';
            case 'hired': return 'fa-check-circle';
            case 'rejected': return 'fa-times-circle';
            default: return 'fa-circle';
        }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const getRelationshipStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return 'badge-success';
            case 'expired':
                return 'badge-warning';
            case 'terminated':
                return 'badge-error';
            default:
                return 'badge-ghost';
        }
    };

    const isRelationshipExpiringSoon = (endDate: string) => {
        const end = new Date(endDate);
        const now = new Date();
        const daysUntilExpiration = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiration <= 30 && daysUntilExpiration > 0;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading candidate details...</p>
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

    if (!candidate) {
        return (
            <div className="alert alert-warning">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>Candidate not found</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm breadcrumbs">
                <ul>
                    <li><Link href="/candidates">Candidates</Link></li>
                    <li>{candidate.full_name}</li>
                </ul>
            </div>

            {/* Candidate Header */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                            <div className="avatar avatar-placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-20">
                                    <span className="text-2xl">{candidate.full_name[0]}</span>
                                </div>
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold">{candidate.full_name}</h1>
                                <div className="flex items-center gap-4 mt-2 text-base-content/70">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-envelope"></i>
                                        <a href={`mailto:${candidate.email}`} className="link link-hover">
                                            {candidate.email}
                                        </a>
                                    </div>
                                    {candidate.phone && (
                                        <div className="flex items-center gap-2">
                                            <i className="fa-solid fa-phone"></i>
                                            <span>{candidate.phone}</span>
                                        </div>
                                    )}
                                    {candidate.linkedin_url && (
                                        <div className="flex items-center gap-2">
                                            <i className="fa-brands fa-linkedin"></i>
                                            <a
                                                href={candidate.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="link link-hover"
                                            >
                                                LinkedIn Profile
                                            </a>
                                        </div>
                                    )}
                                </div>
                                {(candidate.current_title || candidate.current_company || candidate.location) && (
                                    <div className="flex items-center gap-4 mt-2 text-sm text-base-content/70">
                                        {candidate.current_title && (
                                            <div className="flex items-center gap-1">
                                                <i className="fa-solid fa-briefcase"></i>
                                                <span>{candidate.current_title}</span>
                                            </div>
                                        )}
                                        {candidate.current_company && (
                                            <div className="flex items-center gap-1">
                                                <i className="fa-solid fa-building"></i>
                                                <span>{candidate.current_company}</span>
                                            </div>
                                        )}
                                        {candidate.location && (
                                            <div className="flex items-center gap-1">
                                                <i className="fa-solid fa-location-dot"></i>
                                                <span>{candidate.location}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="text-sm text-base-content/60 mt-1">
                                    Added {formatDate(candidate.created_at)}
                                </div>
                            </div>
                        </div>
                        {canEdit && (
                            <Link href={`/candidates/${candidateId}/edit`} className="btn btn-primary gap-2">
                                <i className="fa-solid fa-edit"></i>
                                Edit
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Recruiter Relationship Information */}
            {relationship && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-lg">Recruiter Relationship</h2>
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Status:</span>
                                    <span className={`badge ${getRelationshipStatusBadge(relationship.status)}`}>
                                        {relationship.status.charAt(0).toUpperCase() + relationship.status.slice(1)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-base-content/70">
                                    <div>
                                        <i className="fa-solid fa-calendar-plus mr-1"></i>
                                        Started: {formatDate(relationship.relationship_start_date)}
                                    </div>
                                    <div>
                                        <i className="fa-solid fa-calendar-xmark mr-1"></i>
                                        Expires: {formatDate(relationship.relationship_end_date)}
                                    </div>
                                </div>
                                {relationship.status === 'active' && isRelationshipExpiringSoon(relationship.relationship_end_date) && (
                                    <div className="alert alert-warning mt-2">
                                        <i className="fa-solid fa-triangle-exclamation"></i>
                                        <span>Relationship expires in less than 30 days. Consider renewing.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {candidate.user_id && (
                <div className="alert alert-info">
                    <i className="fa-solid fa-info-circle"></i>
                    <span>This candidate is self-managed and has their own platform account.</span>
                </div>
            )}

            {/* Documents */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title text-lg mb-4">
                        <i className="fa-solid fa-file-lines mr-2"></i>
                        Documents
                    </h2>
                    <DocumentList
                        entityType="candidate"
                        entityId={candidateId}
                        showUpload={canEdit}
                    />
                </div>
            </div>

            {/* Applications */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Applications ({applications.length})</h2>

                {applications.length === 0 ? (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body items-center text-center py-12">
                            <i className="fa-solid fa-inbox text-6xl text-base-content/20"></i>
                            <h3 className="text-xl font-semibold mt-4">No Applications</h3>
                            <p className="text-base-content/70 mt-2">
                                This candidate hasn't been submitted to any roles yet.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {applications.map((application) => (
                            <div key={application.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow">
                                <div className="card-body">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Link
                                                    href={`/roles/${application.job_id}`}
                                                    className="text-lg font-semibold hover:link"
                                                >
                                                    {application.job?.title || 'Unknown Role'}
                                                </Link>
                                                <span className={`badge ${getStageColor(application.stage)}`}>
                                                    <i className={`fa-solid ${getStageIcon(application.stage)} mr-1`}></i>
                                                    {application.stage.charAt(0).toUpperCase() + application.stage.slice(1)}
                                                </span>
                                            </div>
                                            {application.job && (
                                                <div className="flex items-center gap-4 text-sm text-base-content/70 mb-3">
                                                    {application.job.location && (
                                                        <div className="flex items-center gap-1">
                                                            <i className="fa-solid fa-location-dot"></i>
                                                            <span>{application.job.location}</span>
                                                        </div>
                                                    )}
                                                    {application.job.department && (
                                                        <div className="flex items-center gap-1">
                                                            <i className="fa-solid fa-building"></i>
                                                            <span>{application.job.department}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-1">
                                                        <i className="fa-solid fa-percent"></i>
                                                        <span>{application.job.fee_percentage}% fee</span>
                                                    </div>
                                                </div>
                                            )}
                                            {application.notes && (
                                                <div className="bg-base-200 rounded-lg p-3 mt-2">
                                                    <div className="text-xs font-semibold text-base-content/60 mb-1">Notes</div>
                                                    <div className="text-sm">{application.notes}</div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-base-content/60 mt-3">
                                                <div>
                                                    <i className="fa-solid fa-calendar-plus mr-1"></i>
                                                    Submitted {formatDate(application.created_at)}
                                                </div>
                                                <div>
                                                    <i className="fa-solid fa-clock mr-1"></i>
                                                    Updated {formatDate(application.updated_at)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link
                                                href={`/roles/${application.job_id}`}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                <i className="fa-solid fa-arrow-right"></i>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Activity Timeline (Phase 1 - Simple version) */}
            <div>
                <h2 className="text-2xl font-bold mb-4">Activity Timeline</h2>
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="space-y-4">
                            {applications
                                .slice()
                                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                                .map((app) => (
                                    <div key={app.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full ${getStageColor(app.stage).replace('badge-', 'bg-')}`}></div>
                                            <div className="w-px h-full bg-base-300"></div>
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="font-semibold">
                                                Stage updated to {app.stage}
                                            </div>
                                            <div className="text-sm text-base-content/70">
                                                {app.job?.title || 'Unknown Role'}
                                            </div>
                                            <div className="text-xs text-base-content/60 mt-1">
                                                {formatDate(app.updated_at)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            <div className="flex gap-4">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-base-300"></div>
                                </div>
                                <div className="flex-1">
                                    <div className="font-semibold">Candidate added</div>
                                    <div className="text-xs text-base-content/60 mt-1">
                                        {formatDate(candidate.created_at)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
