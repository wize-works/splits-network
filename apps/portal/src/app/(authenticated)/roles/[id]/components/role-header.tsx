'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import SubmitCandidateModal from './submit-candidate-modal';

interface Job {
    id: string;
    title: string;
    company_id: string;
    location?: string;
    fee_percentage: number;
    status: string;
    salary_min?: number;
    salary_max?: number;
    department?: string;
    description?: string; // Deprecated
    recruiter_description?: string;
    candidate_description?: string;
    employment_type?: 'full_time' | 'contract' | 'temporary';
    open_to_relocation: boolean;
    show_salary_range: boolean;
    splits_fee_percentage: number;
    job_owner_id?: string;
    created_at: string;
    requirements?: Array<{ id: string; requirement_type: 'mandatory' | 'preferred'; description: string }>;
    pre_screen_questions?: Array<{ id: string; question: string; question_type: string; is_required: boolean }>;
}

interface Membership {
    role: string;
    organization_id: string;
}

interface UserProfile {
    memberships: Membership[];
}

interface RoleHeaderProps {
    roleId: string;
}

export default function RoleHeader({ roleId }: RoleHeaderProps) {
    const { getToken } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);

    // Check if user is company admin or platform admin
    const canManageRole = userRole === 'company_admin' || userRole === 'platform_admin';

    useEffect(() => {
        fetchUserRole();
        fetchJob();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId]);

    const fetchUserRole = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            const response: any = await client.getCurrentUser();
            const profile: UserProfile = response.data;

            // Get the first membership role (Phase 1: users have one membership)
            if (profile.memberships && profile.memberships.length > 0) {
                setUserRole(profile.memberships[0].role);
            }
        } catch (error) {
            console.error('Failed to fetch user role:', error);
        }
    };

    const fetchJob = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.error('No auth token available');
                setLoading(false);
                return;
            }

            const client = createAuthenticatedClient(token);
            const response: any = await client.getJob(roleId);
            setJob(response.data);
        } catch (error) {
            console.error('Failed to fetch job:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
            return;
        }

        setUpdating(true);
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token');
            }

            const client = createAuthenticatedClient(token);
            await client.patch(`/jobs/${roleId}`, { status: newStatus });

            // Refresh the job data
            await fetchJob();
            alert('Status updated successfully!');
        } catch (error: any) {
            console.error('Failed to update status:', error);
            alert(`Failed to update status: ${error.message}`);
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex justify-center py-12">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="alert alert-error">
                        <i className="fa-solid fa-circle-exclamation"></i>
                        <span>Job not found</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <Link href="/roles" className="btn btn-ghost btn-sm gap-2">
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Roles
                </Link>

                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{job.title}</h1>
                                    <div className={`badge ${job.status === 'active' ? 'badge-success' :
                                            job.status === 'paused' ? 'badge-warning' :
                                                job.status === 'filled' ? 'badge-info' :
                                                    'badge-neutral'
                                        }`}>
                                        {job.status}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 mt-3 text-base-content/70">
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-building"></i>
                                        Company {job.company_id.substring(0, 8)}
                                    </span>
                                    {job.location && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-location-dot"></i>
                                            {job.location}
                                        </span>
                                    )}
                                    {job.department && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-briefcase"></i>
                                            {job.department}
                                        </span>
                                    )}
                                    {job.employment_type && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-clock"></i>
                                            {job.employment_type === 'full_time' ? 'Full-Time' :
                                                job.employment_type === 'contract' ? 'Contract' : 'Temporary'}
                                        </span>
                                    )}
                                    {job.open_to_relocation && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-plane"></i>
                                            Open to Relocation
                                        </span>
                                    )}
                                    {job.show_salary_range && job.salary_min && job.salary_max && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-dollar-sign"></i>
                                            ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                                        </span>
                                    )}
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-percent"></i>
                                        {job.fee_percentage}% fee
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-handshake"></i>
                                        {job.splits_fee_percentage}% recruiter split
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2">
                                <button
                                    className="btn btn-primary gap-2"
                                    onClick={() => setShowSubmitModal(true)}
                                >
                                    <i className="fa-solid fa-user-plus"></i>
                                    Send Proposal
                                </button>

                                {canManageRole && (
                                    <>
                                        <Link
                                            href={`/roles/${roleId}/edit`}
                                            className="btn btn-ghost gap-2"
                                        >
                                            <i className="fa-solid fa-pen"></i>
                                            Edit Role
                                        </Link>

                                        {/* Status Management Dropdown */}
                                        <div className="dropdown dropdown-end">
                                            <button
                                                tabIndex={0}
                                                className="btn btn-ghost gap-2 w-full"
                                                disabled={updating}
                                            >
                                                {updating ? (
                                                    <span className="loading loading-spinner loading-xs"></span>
                                                ) : (
                                                    <i className="fa-solid fa-ellipsis-vertical"></i>
                                                )}
                                                Status Actions
                                            </button>
                                            <ul tabIndex={0} className="dropdown-content z-1 menu p-2 shadow bg-base-100 rounded-box w-52">
                                                {job.status !== 'active' && (
                                                    <li>
                                                        <button onClick={() => handleStatusChange('active')}>
                                                            <i className="fa-solid fa-play"></i>
                                                            Activate
                                                        </button>
                                                    </li>
                                                )}
                                                {job.status === 'active' && (
                                                    <li>
                                                        <button onClick={() => handleStatusChange('paused')}>
                                                            <i className="fa-solid fa-pause"></i>
                                                            Pause
                                                        </button>
                                                    </li>
                                                )}
                                                {job.status !== 'filled' && (
                                                    <li>
                                                        <button onClick={() => handleStatusChange('filled')}>
                                                            <i className="fa-solid fa-check"></i>
                                                            Mark as Filled
                                                        </button>
                                                    </li>
                                                )}
                                                {job.status !== 'closed' && (
                                                    <li>
                                                        <button onClick={() => handleStatusChange('closed')}>
                                                            <i className="fa-solid fa-xmark"></i>
                                                            Close Role
                                                        </button>
                                                    </li>
                                                )}
                                            </ul>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {(job.recruiter_description || job.description) && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-2">
                                    <i className="fa-solid fa-user-tie mr-2"></i>
                                    Recruiter-Facing Description
                                </h3>
                                <p className="text-base-content/80 whitespace-pre-wrap">
                                    {job.recruiter_description || job.description}
                                </p>
                            </div>
                        )}

                        {job.candidate_description && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-2">
                                    <i className="fa-solid fa-user mr-2"></i>
                                    Candidate-Facing Description
                                </h3>
                                <p className="text-base-content/80 whitespace-pre-wrap">
                                    {job.candidate_description}
                                </p>
                            </div>
                        )}

                        {job.requirements && job.requirements.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-3">
                                    <i className="fa-solid fa-list-check mr-2"></i>
                                    Requirements
                                </h3>
                                {job.requirements.filter(r => r.requirement_type === 'mandatory').length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-medium mb-2 text-base-content/80">Mandatory</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {job.requirements
                                                .filter(r => r.requirement_type === 'mandatory')
                                                .map(r => (
                                                    <li key={r.id}>{r.description}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                                {job.requirements.filter(r => r.requirement_type === 'preferred').length > 0 && (
                                    <div>
                                        <h4 className="font-medium mb-2 text-base-content/80">Preferred</h4>
                                        <ul className="list-disc list-inside space-y-1">
                                            {job.requirements
                                                .filter(r => r.requirement_type === 'preferred')
                                                .map(r => (
                                                    <li key={r.id} className="text-base-content/70">{r.description}</li>
                                                ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {job.pre_screen_questions && job.pre_screen_questions.length > 0 && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-3">
                                    <i className="fa-solid fa-clipboard-question mr-2"></i>
                                    Pre-Screen Questions
                                </h3>
                                <div className="space-y-2">
                                    {job.pre_screen_questions.map((q, idx) => (
                                        <div key={q.id} className="flex gap-2">
                                            <span className="text-base-content/60">{idx + 1}.</span>
                                            <span>
                                                {q.question}
                                                {q.is_required && <span className="text-error ml-1">*</span>}
                                                <span className="text-xs text-base-content/50 ml-2">
                                                    ({q.question_type.replace('_', ' ')})
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSubmitModal && (
                <SubmitCandidateModal
                    roleId={job.id}
                    onClose={() => setShowSubmitModal(false)}
                />
            )}
        </>
    );
}
