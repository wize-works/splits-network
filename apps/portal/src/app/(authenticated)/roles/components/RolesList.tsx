'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface Job {
    id: string;
    title: string;
    company_id: string;
    location?: string;
    fee_percentage: number;
    status: string;
    created_at: string;
}

function getStatusBadge(status: string) {
    const styles = {
        active: 'badge-success',
        paused: 'badge-warning',
        filled: 'badge-info',
        closed: 'badge-neutral',
    };
    return styles[status as keyof typeof styles] || 'badge-neutral';
}

export default function RolesList() {
    const { getToken } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchJobs();
    }, [statusFilter]);

    const fetchJobs = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.error('No auth token available');
                setLoading(false);
                return;
            }

            const client = createAuthenticatedClient(token);
            const response: any = await client.getJobs({
                status: statusFilter === 'all' ? undefined : statusFilter,
            });
            setJobs(response.data || []);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        searchQuery === '' || 
        job.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            <select 
                                className="select select-bordered w-full max-w-xs"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="paused">Paused</option>
                                <option value="filled">Filled</option>
                                <option value="closed">Closed</option>
                            </select>
                        </div>
                        <div className="form-control flex-1">
                            <label className="label">
                                <span className="label-text">Search</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Search roles..."
                                className="input input-bordered w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Roles List */}
            {filteredJobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {filteredJobs.map((job) => (
                        <Link key={job.id} href={`/roles/${job.id}`}>
                            <div className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                                <div className="card-body">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="card-title text-xl">{job.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-base-content/70">
                                                <span className="flex items-center gap-1">
                                                    <i className="fa-solid fa-building"></i>
                                                    Company {job.company_id.substring(0, 8)}
                                                </span>
                                                {job.location && (
                                                    <span className="flex items-center gap-1">
                                                        <i className="fa-solid fa-location-dot"></i>
                                                        {job.location}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1">
                                                    <i className="fa-solid fa-percent"></i>
                                                    {job.fee_percentage}% fee
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={`badge ${getStatusBadge(job.status)}`}>
                                                {job.status}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-actions justify-between items-center mt-4">
                                        <span className="text-sm text-base-content/60">
                                            Posted {new Date(job.created_at).toLocaleDateString()}
                                        </span>
                                        <button className="btn btn-primary btn-sm gap-2">
                                            View Pipeline
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body text-center py-12">
                        <i className="fa-solid fa-briefcase text-6xl text-base-content/20"></i>
                        <h3 className="text-xl font-semibold mt-4">No Roles Found</h3>
                        <p className="text-base-content/70 mt-2">
                            {searchQuery ? 'Try adjusting your search' : 'No roles have been created yet'}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
