'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface Company {
    id: string;
    name: string;
    identity_organization_id?: string;
}

interface UserProfile {
    memberships: Array<{
        organization_id: string;
        role: string;
    }>;
}

export default function NewRolePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
    const [companies, setCompanies] = useState<Company[]>([]);
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
        async function initializeForm() {
            try {
                const token = await getToken();
                if (!token) {
                    console.error('No auth token available');
                    return;
                }

                console.log('Initializing form...');
                const client = createAuthenticatedClient(token);

                // Get user profile to check role and company
                console.log('Fetching user profile...');
                const profileResponse = await client.get<{ data: UserProfile }>('/me');
                console.log('Profile response:', profileResponse);
                const profile = profileResponse.data;

                // Check if user is a platform admin
                const isAdmin = profile.memberships?.some(m => m.role === 'platform_admin');
                console.log('Is platform admin:', isAdmin);
                setIsPlatformAdmin(isAdmin);

                if (isAdmin) {
                    // Platform admin: fetch all companies for dropdown
                    try {
                        console.log('Fetching companies...');
                        const companiesResponse = await client.get<{ data: Company[] }>('/companies');
                        console.log('Companies response:', companiesResponse);
                        setCompanies(companiesResponse.data || []);
                    } catch (err) {
                        console.error('Failed to fetch companies:', err);
                        alert('Failed to load companies. Please check the console for details.');
                    }
                } else {
                    // Company admin: auto-populate from their organization
                    // Find the company associated with their organization
                    const membership = profile.memberships?.find(m => m.role === 'company_admin');
                    if (membership?.organization_id) {
                        // Fetch company by organization ID
                        try {
                            console.log('Fetching company for org:', membership.organization_id);
                            const companyResponse = await client.get<{ data: Company }>(`/companies/by-org/${membership.organization_id}`);
                            console.log('Company response:', companyResponse);
                            if (companyResponse.data) {
                                setFormData(prev => ({ ...prev, company_id: companyResponse.data.id }));
                            } else {
                                console.warn('No company found for organization');
                            }
                        } catch (err: any) {
                            // Company doesn't exist yet - they need to create one first
                            console.error('Could not fetch company:', err);
                            // Check if it's a 404 (company not found) vs other error
                            if (err.message?.includes('404') || err.message?.includes('not found')) {
                                alert('No company found for your organization. Please ask your platform admin to create a company linked to your organization first.');
                            } else {
                                alert('Error loading company information. Please try again or contact support.');
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to initialize form:', error);
            } finally {
                setInitializing(false);
            }
        }

        initializeForm();
    }, [getToken]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token');
            }

            // Validate company_id is set
            if (!formData.company_id) {
                alert('Please select a company');
                setLoading(false);
                return;
            }

            const client = createAuthenticatedClient(token);

            // Convert salary values to numbers
            const payload: any = {
                title: formData.title,
                company_id: formData.company_id,
                fee_percentage: formData.fee_percentage,
                status: formData.status,
            };

            console.log('Submitting job payload:', payload);

            if (formData.location) payload.location = formData.location;
            if (formData.department) payload.department = formData.department;
            if (formData.description) payload.description = formData.description;
            if (formData.salary_min) payload.salary_min = parseInt(formData.salary_min);
            if (formData.salary_max) payload.salary_max = parseInt(formData.salary_max);

            await client.post('/jobs', payload);
            
            alert('Role created successfully!');
            router.push('/roles');
        } catch (error: any) {
            console.error('Failed to create role:', error);
            alert(`Failed to create role: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
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
                <Link href="/roles" className="text-sm text-primary hover:underline mb-2 inline-block">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Back to Roles
                </Link>
                <h1 className="text-3xl font-bold">Create New Role</h1>
                <p className="text-base-content/70 mt-1">
                    Add a new role to your organization
                </p>
            </div>

            {/* Form */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="fieldset">
                                <label className="label">Job Title *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                    placeholder="e.g. Senior React Developer"
                                />
                            </div>

                            {isPlatformAdmin ? (
                                <div className="fieldset">
                                    <label className="label">Company *</label>
                                    <select
                                        className="select w-full"
                                        value={formData.company_id}
                                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Select a company...</option>
                                        {companies.map(company => (
                                            <option key={company.id} value={company.id}>
                                                {company.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="fieldset">
                                    <label className="label">Company</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.company_id}
                                        disabled
                                        placeholder="Auto-populated from your organization"
                                    />
                                    <label className="label">
                                        <span className="label-text-alt">Linked to your organization</span>
                                    </label>
                                </div>
                            )}

                            <div className="fieldset">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="e.g. Remote, New York, NY"
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Department</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    placeholder="e.g. Engineering"
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Fee Percentage *</label>
                                <input
                                    type="number"
                                    className="input w-full"
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
                                    className="select w-full"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    required
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
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
                                    className="input w-full"
                                    value={formData.salary_min}
                                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                                    placeholder="e.g. 100000"
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Maximum Salary</label>
                                <input
                                    type="number"
                                    className="input w-full"
                                    value={formData.salary_max}
                                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                                    placeholder="e.g. 150000"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="fieldset">
                            <label className="label">Job Description</label>
                            <textarea
                                className="textarea w-full h-32"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Describe the role, requirements, and responsibilities..."
                            ></textarea>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Link href="/roles" className="btn btn-ghost">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-plus mr-2"></i>
                                        Create Role
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
