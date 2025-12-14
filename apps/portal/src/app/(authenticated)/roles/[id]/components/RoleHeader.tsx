'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import SubmitCandidateModal from './SubmitCandidateModal';

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
    description?: string;
    created_at: string;
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
                                    <div className={`badge ${
                                        job.status === 'active' ? 'badge-success' : 
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
                                    {job.salary_min && job.salary_max && (
                                        <span className="flex items-center gap-2">
                                            <i className="fa-solid fa-dollar-sign"></i>
                                            ${(job.salary_min / 1000).toFixed(0)}k - ${(job.salary_max / 1000).toFixed(0)}k
                                        </span>
                                    )}
                                    <span className="flex items-center gap-2">
                                        <i className="fa-solid fa-percent"></i>
                                        {job.fee_percentage}% fee
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
                                    Submit Candidate
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

                        {job.description && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-2">Description</h3>
                                <p className="text-base-content/80 whitespace-pre-wrap">{job.description}</p>
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
