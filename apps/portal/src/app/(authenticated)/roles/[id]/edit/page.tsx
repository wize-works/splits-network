'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
    salary_min?: number;
    salary_max?: number;
    department?: string;
    description?: string;
}

export default function EditRolePage() {
    const router = useRouter();
    const params = useParams();
    const { getToken } = useAuth();
    const roleId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [job, setJob] = useState<Job | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        company_id: '',
        location: '',
        fee_percentage: 20,
        salary_min: '',
        salary_max: '',
        description: '',
        department: '',
        status: 'active',
    });

    useEffect(() => {
        fetchJob();
    }, [roleId]);

    const fetchJob = async () => {
        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token');
            }

            const client = createAuthenticatedClient(token);
            const response: any = await client.getJob(roleId);
            const jobData = response.data;

            setJob(jobData);
            setFormData({
                title: jobData.title || '',
                company_id: jobData.company_id || '',
                location: jobData.location || '',
                fee_percentage: jobData.fee_percentage || 20,
                salary_min: jobData.salary_min?.toString() || '',
                salary_max: jobData.salary_max?.toString() || '',
                description: jobData.description || '',
                department: jobData.department || '',
                status: jobData.status || 'active',
            });
        } catch (error: any) {
            console.error('Failed to fetch job:', error);
            alert(`Failed to load role: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token');
            }

            const client = createAuthenticatedClient(token);

            // Build payload with only changed fields
            const payload: any = {
                title: formData.title,
                fee_percentage: formData.fee_percentage,
                status: formData.status,
            };

            if (formData.location) payload.location = formData.location;
            if (formData.department) payload.department = formData.department;
            if (formData.description) payload.description = formData.description;
            if (formData.salary_min) payload.salary_min = parseInt(formData.salary_min);
            if (formData.salary_max) payload.salary_max = parseInt(formData.salary_max);

            await client.patch(`/jobs/${roleId}`, payload);
            
            alert('Role updated successfully!');
            router.push(`/roles/${roleId}`);
        } catch (error: any) {
            console.error('Failed to update role:', error);
            alert(`Failed to update role: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="alert alert-error">
                <i className="fa-solid fa-circle-exclamation"></i>
                <span>Role not found</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href={`/roles/${roleId}`} className="text-sm text-primary hover:underline mb-2 inline-block">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Back to Role
                </Link>
                <h1 className="text-3xl font-bold">Edit Role</h1>
                <p className="text-base-content/70 mt-1">
                    Update the role details and settings
                </p>
            </div>

            {/* Form */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className='fieldset'>
                                <label className="label">Job Title *</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="fieldset">
                                <label className="label">Company ID</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.company_id}
                                    disabled
                                />
                                <label className="label">
                                    <span className="label-text-alt">Company cannot be changed</span>
                                </label>
                            </div>

                            <div className="fieldset">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Department</label>
                                <input
                                    type="text"
                                    className="input"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Fee Percentage *</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.fee_percentage}
                                    onChange={(e) => setFormData({ ...formData, fee_percentage: parseFloat(e.target.value) })}
                                    required
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                                <label className="label">
                                    <span className="label-text-alt">Percentage of annual salary</span>
                                </label>
                            </div>

                            <div className="fieldset">
                                <label className="label">Status *</label>
                                <select
                                    className="select"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="filled">Filled</option>
                                    <option value="closed">Closed</option>
                                </select>
                            </div>
                        </div>

                        {/* Salary Range */}
                        <div className="divider">Salary Range (Optional)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="fieldset">
                                <label className="label">Minimum Salary</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Maximum Salary</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="fieldset">
                            <label className="label">Job Description</label>
                            <textarea
                                className="textarea h-32"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            ></textarea>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Link href={`/roles/${roleId}`} className="btn btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-save mr-2"></i>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
