'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface CandidateDetailClientProps {
    candidateId: string;
}

export default function CandidateDetailClient({ candidateId }: CandidateDetailClientProps) {
    const [candidate, setCandidate] = useState<any>(null);
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                setError(null);

                // Fetch candidate details
                const candidateResponse = await apiClient.get(`/candidates/${candidateId}`);
                setCandidate(candidateResponse.data);

                // Fetch applications
                const applicationsResponse = await apiClient.get(`/candidates/${candidateId}/applications`);
                const apps = applicationsResponse.data || [];

                // Fetch job details for each application
                const applicationsWithJobs = await Promise.all(
                    apps.map(async (app: any) => {
                        try {
                            const jobResponse = await apiClient.get(`/jobs/${app.job_id}`);
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
    }, [candidateId]);

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
                            <div className="avatar placeholder">
                                <div className="bg-primary text-primary-content rounded-full w-20">
                                    <span className="text-2xl">{candidate.full_name[0]}</span>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{candidate.full_name}</h1>
                                <div className="flex items-center gap-4 mt-2 text-base-content/70">
                                    <div className="flex items-center gap-2">
                                        <i className="fa-solid fa-envelope"></i>
                                        <a href={`mailto:${candidate.email}`} className="link link-hover">
                                            {candidate.email}
                                        </a>
                                    </div>
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
                                <div className="text-sm text-base-content/60 mt-1">
                                    Added {formatDate(candidate.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>
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
