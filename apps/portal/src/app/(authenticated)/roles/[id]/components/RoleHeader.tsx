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

interface RoleHeaderProps {
    roleId: string;
}

export default function RoleHeader({ roleId }: RoleHeaderProps) {
    const { getToken } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    useEffect(() => {
        fetchJob();
    }, [roleId]);

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
                        <div className="flex justify-between items-start">
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-bold">{job.title}</h1>
                                    <div className={`badge ${job.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
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
                            <button 
                                className="btn btn-primary gap-2"
                                onClick={() => setShowSubmitModal(true)}
                            >
                                <i className="fa-solid fa-user-plus"></i>
                                Submit Candidate
                            </button>
                        </div>

                        {job.description && (
                            <div className="mt-6">
                                <h3 className="font-semibold text-lg mb-2">Description</h3>
                                <p className="text-base-content/80">{job.description}</p>
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
