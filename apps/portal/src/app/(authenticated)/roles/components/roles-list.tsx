'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { useViewMode } from '@/hooks/use-view-mode';

interface Job {
    id: string;
    title: string;
    company_id: string;
    location?: string;
    salary_min?: number;
    salary_max?: number;
    fee_percentage: number;
    status: string;
    created_at: string;
}

interface Membership {
    role: string;
    organization_id: string;
}

interface UserProfile {
    memberships: Membership[];
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

function getCardBorder(status: string) {
    const styles = {
        active: 'border-green-500',
        paused: 'border-yellow-500',
        filled: 'border-blue-500',
        closed: 'border-gray-500',
    };
    return styles[status as keyof typeof styles] || 'border-gray-300';
}

export default function RolesList() {
    const { getToken } = useAuth();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [userRole, setUserRole] = useState<string | null>(null);
    const [viewMode, setViewMode] = useViewMode('rolesViewMode');

    // Check if user can manage roles
    const canManageRole = userRole === 'company_admin' || userRole === 'platform_admin';

    useEffect(() => {
        fetchUserRole();
        fetchJobs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statusFilter]);

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

    const fetchJobs = async () => {
        try {
            const token = await getToken();
            if (!token) {
                console.error('No auth token available');
                setLoading(false);
                return;
            }

            const client = createAuthenticatedClient(token);
            // Use getRoles() which filters by recruiter assignments
            const response: any = await client.getRoles({
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
            {/* Filters and View Toggle */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="fieldset">
                            <label className="label">Status</label>
                            <select 
                                className="select w-full max-w-xs"
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
                        <div className="fieldset flex-1">
                            <label className="label">Search</label>
                            <input
                                type="text"
                                placeholder="Search roles..."
                                className="input w-full"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="join">
                            <button 
                                className={`btn join-item ${viewMode === 'grid' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <i className="fa-solid fa-grip"></i>
                            </button>
                            <button 
                                className={`btn join-item ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                                onClick={() => setViewMode('table')}
                                title="Table View"
                            >
                                <i className="fa-solid fa-table"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Roles List - Grid View */}
            {viewMode === 'grid' && filteredJobs.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => (
                        <div key={job.id} className={`card card-lg bg-base-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden relative border-2 ${getCardBorder(job.status)}`}>
                            <div className="flex flex-col items-end gap-2 absolute -top-1 -right-1">
                                <div className={`badge ${getStatusBadge(job.status)}`}>
                                    {job.status}
                                </div>
                            </div>
                            <div className="card-body min-h-40">
                                {(userRole === 'recruiter' || userRole === 'platform_admin' || userRole === 'company_admin') && (
                                    <div className='badge badge-info rounded-lg text-nowrap'>
                                        Max Fee: ${job.salary_max ? Math.round(job.fee_percentage * job.salary_max) : 'N/A'}
                                        <span className='tooltip' data-tip='Calculated as Fee Percentage multiplied by Maximum Salary'>
                                            <i className='fa fa-info-circle'></i>
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-auto min-h-40">
                                    <div className="flex-1">
                                        <div className='flex justify-between items-start'>
                                            <Link href={`/roles/${job.id}`} className="hover:text-primary transition-colors">
                                                <h2 className="card-title text-3xl">{job.title}</h2>
                                            </Link>
                                        </div>
                                        <div className="flex justify-between items-center gap-4 mt-2 text-sm text-base-content/70">
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
                                </div>
                                <div className="card-actions justify-between items-center">
                                    <span className="text-sm text-base-content/60">
                                        Posted {new Date(job.created_at).toLocaleDateString()}
                                    </span>
                                    <div className="flex gap-2">
                                        {canManageRole && (
                                            <Link 
                                                href={`/roles/${job.id}/edit`}
                                                className="btn btn-ghost btn-sm gap-2"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                                Edit
                                            </Link>
                                        )}
                                        <Link href={`/roles/${job.id}`} className="btn btn-primary btn-sm gap-2">
                                            View Pipeline
                                            <i className="fa-solid fa-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Roles List - Table View */}
            {viewMode === 'table' && filteredJobs.length > 0 && (
                <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Role Title</th>
                                    <th>Location</th>
                                    <th>Fee</th>
                                    <th>Status</th>
                                    <th>Posted</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredJobs.map((job) => (
                                    <tr key={job.id} className="hover">
                                        <td>
                                            <Link href={`/roles/${job.id}`} className="font-semibold hover:text-primary transition-colors">
                                                {job.title}
                                            </Link>
                                            <div className="text-sm text-base-content/60 mt-1">
                                                <i className="fa-solid fa-building mr-1"></i>
                                                Company {job.company_id.substring(0, 8)}
                                            </div>
                                        </td>
                                        <td>
                                            {job.location ? (
                                                <span className="flex items-center gap-1">
                                                    <i className="fa-solid fa-location-dot"></i>
                                                    {job.location}
                                                </span>
                                            ) : (
                                                <span className="text-base-content/40">—</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className="flex items-center gap-1">
                                                <i className="fa-solid fa-percent"></i>
                                                {job.fee_percentage}%
                                            </span>
                                        </td>
                                        <td>
                                            <div className={`badge ${getStatusBadge(job.status)}`}>
                                                {job.status}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="text-sm">
                                                {new Date(job.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2 justify-end">
                                                {canManageRole && (
                                                    <Link 
                                                        href={`/roles/${job.id}/edit`}
                                                        className="btn btn-ghost btn-sm"
                                                        title="Edit Role"
                                                    >
                                                        <i className="fa-solid fa-pen"></i>
                                                    </Link>
                                                )}
                                                <Link 
                                                    href={`/roles/${job.id}`}
                                                    className="btn btn-primary btn-sm"
                                                    title="View Pipeline"
                                                >
                                                    <i className="fa-solid fa-arrow-right"></i>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredJobs.length === 0 && (
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
