'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';

interface Job {
    id: string;
    title: string;
    company: { name: string };
    status: string;
    location?: string;
}

interface Recruiter {
    id: string;
    user_id: string;
    status: string;
}

interface Assignment {
    job_id: string;
    recruiter_id: string;
    assigned_at: string;
}

export default function RoleAssignmentsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [recruiters, setRecruiters] = useState<Recruiter[]>([]);
    const [selectedJob, setSelectedJob] = useState<string>('');
    const [selectedRecruiter, setSelectedRecruiter] = useState<string>('');
    const [assignments, setAssignments] = useState<Map<string, string[]>>(new Map());
    const [loading, setLoading] = useState(true);
    const [assigning, setAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [jobsResponse, recruitersResponse] = await Promise.all([
                apiClient.get('/jobs?status=active'),
                apiClient.get('/recruiters'),
            ]);

            const jobsList = jobsResponse.data || [];
            const recruitersList = recruitersResponse.data || [];

            setJobs(jobsList);
            setRecruiters(recruitersList.filter((r: Recruiter) => r.status === 'active'));

            // Load assignments for each job
            const assignmentsMap = new Map<string, string[]>();
            await Promise.all(
                jobsList.map(async (job: Job) => {
                    try {
                        const response = await apiClient.get(`/jobs/${job.id}/recruiters`);
                        assignmentsMap.set(job.id, response.data || []);
                    } catch (error) {
                        console.error(`Failed to load recruiters for job ${job.id}:`, error);
                    }
                })
            );
            setAssignments(assignmentsMap);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function assignRecruiter() {
        if (!selectedJob || !selectedRecruiter) {
            alert('Please select both a job and a recruiter');
            return;
        }

        setAssigning(true);
        try {
            await apiClient.post('/assignments', {
                job_id: selectedJob,
                recruiter_id: selectedRecruiter,
            });

            // Update local state
            setAssignments(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(selectedJob) || [];
                if (!existing.includes(selectedRecruiter)) {
                    newMap.set(selectedJob, [...existing, selectedRecruiter]);
                }
                return newMap;
            });

            // Reset selection
            setSelectedRecruiter('');
            alert('Recruiter assigned successfully!');
        } catch (error) {
            console.error('Failed to assign recruiter:', error);
            alert('Failed to assign recruiter');
        } finally {
            setAssigning(false);
        }
    }

    async function unassignRecruiter(jobId: string, recruiterId: string) {
        if (!confirm('Are you sure you want to remove this assignment?')) {
            return;
        }

        try {
            await apiClient.delete(`/assignments/${jobId}/${recruiterId}`);

            // Update local state
            setAssignments(prev => {
                const newMap = new Map(prev);
                const existing = newMap.get(jobId) || [];
                newMap.set(jobId, existing.filter(id => id !== recruiterId));
                return newMap;
            });

            alert('Assignment removed successfully!');
        } catch (error) {
            console.error('Failed to remove assignment:', error);
            alert('Failed to remove assignment');
        }
    }

    const selectedJobData = jobs.find(j => j.id === selectedJob);
    const assignedRecruiterIds = selectedJob ? (assignments.get(selectedJob) || []) : [];
    const availableRecruiters = recruiters.filter(r => !assignedRecruiterIds.includes(r.id));

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/admin" className="text-sm text-primary hover:underline mb-2 inline-block">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Back to Admin Dashboard
                </Link>
                <h1 className="text-3xl font-bold">Role Assignments</h1>
                <p className="text-base-content/70 mt-1">
                    Assign recruiters to active job roles
                </p>
            </div>

            {/* Assignment Form */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">Assign Recruiter to Role</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Job Selection */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Select Job</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={selectedJob}
                                onChange={(e) => {
                                    setSelectedJob(e.target.value);
                                    setSelectedRecruiter('');
                                }}
                            >
                                <option value="">Choose a job...</option>
                                {jobs.map((job) => (
                                    <option key={job.id} value={job.id}>
                                        {job.title} - {job.company.name} ({job.location || 'Remote'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Recruiter Selection */}
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Select Recruiter</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={selectedRecruiter}
                                onChange={(e) => setSelectedRecruiter(e.target.value)}
                                disabled={!selectedJob}
                            >
                                <option value="">Choose a recruiter...</option>
                                {availableRecruiters.map((recruiter) => (
                                    <option key={recruiter.id} value={recruiter.id}>
                                        {recruiter.id} ({recruiter.user_id.slice(0, 8)}...)
                                    </option>
                                ))}
                            </select>
                            {selectedJob && availableRecruiters.length === 0 && (
                                <label className="label">
                                    <span className="label-text-alt text-warning">
                                        All active recruiters are already assigned to this job
                                    </span>
                                </label>
                            )}
                        </div>
                    </div>

                    <div className="card-actions justify-end mt-4">
                        <button
                            onClick={assignRecruiter}
                            disabled={!selectedJob || !selectedRecruiter || assigning}
                            className="btn btn-primary"
                        >
                            {assigning ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <>
                                    <i className="fa-solid fa-link"></i>
                                    Assign Recruiter
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Current Assignments */}
            {selectedJobData && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title">
                            Current Assignments for {selectedJobData.title}
                        </h2>
                        {assignedRecruiterIds.length === 0 ? (
                            <p className="text-base-content/70 py-4">
                                No recruiters assigned to this job yet
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Recruiter ID</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {assignedRecruiterIds.map((recruiterId) => {
                                            const recruiter = recruiters.find(r => r.id === recruiterId);
                                            return (
                                                <tr key={recruiterId}>
                                                    <td className="font-mono text-sm">{recruiterId}</td>
                                                    <td>
                                                        {recruiter ? (
                                                            <span className="badge badge-success">Active</span>
                                                        ) : (
                                                            <span className="badge badge-ghost">Unknown</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => unassignRecruiter(selectedJob, recruiterId)}
                                                            className="btn btn-xs btn-error"
                                                        >
                                                            <i className="fa-solid fa-unlink"></i>
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* All Jobs Overview */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">All Active Jobs</h2>
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Company</th>
                                    <th>Location</th>
                                    <th>Assigned Recruiters</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map((job) => {
                                    const count = assignments.get(job.id)?.length || 0;
                                    return (
                                        <tr key={job.id}>
                                            <td>{job.title}</td>
                                            <td>{job.company.name}</td>
                                            <td>{job.location || 'Remote'}</td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <span className="badge badge-neutral">{count} recruiter{count !== 1 ? 's' : ''}</span>
                                                    <button
                                                        onClick={() => setSelectedJob(job.id)}
                                                        className="btn btn-xs btn-ghost"
                                                    >
                                                        View
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
