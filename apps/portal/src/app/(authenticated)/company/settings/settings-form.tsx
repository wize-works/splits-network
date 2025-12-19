'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';

interface Company {
    id: string;
    name: string;
    identity_organization_id?: string;
    website?: string;
    industry?: string;
    company_size?: string;
    headquarters_location?: string;
    description?: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
}

interface CompanySettingsFormProps {
    company: Company | null;
    organizationId: string;
}

export default function CompanySettingsForm({ company: initialCompany, organizationId }: CompanySettingsFormProps) {
    const { getToken } = useAuth();
    const router = useRouter();

    const [formData, setFormData] = useState({
        name: initialCompany?.name || '',
        website: initialCompany?.website || '',
        industry: initialCompany?.industry || '',
        company_size: initialCompany?.company_size || '',
        headquarters_location: initialCompany?.headquarters_location || '',
        description: initialCompany?.description || '',
        logo_url: initialCompany?.logo_url || '',
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                setSaving(false);
                return;
            }

            const client = createAuthenticatedClient(token);

            if (initialCompany) {
                // Update existing company
                await client.patch(`/companies/${initialCompany.id}`, formData);
            } else {
                // Create new company
                await client.post('/companies', {
                    ...formData,
                    identity_organization_id: organizationId,
                });
            }

            setSuccess(true);
            router.refresh();
        } catch (error: any) {
            console.error('Failed to save company:', error);
            setError(error.message || 'Failed to save company settings');
        } finally {
            setSaving(false);
        }
    };

    const companySizes = [
        '1-10',
        '11-50',
        '51-200',
        '201-500',
        '501-1000',
        '1000+',
    ];

    const industries = [
        'Technology',
        'Healthcare',
        'Finance',
        'Manufacturing',
        'Retail',
        'Education',
        'Professional Services',
        'Real Estate',
        'Media & Entertainment',
        'Transportation',
        'Other',
    ];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    <i className="fa-solid fa-circle-check"></i>
                    <span>Company settings saved successfully!</span>
                </div>
            )}

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-building"></i>
                        Company Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="fieldset md:col-span-2">
                            <label className="label">Company Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="input w-full"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Acme Corporation"
                                required
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">Website</label>
                            <input
                                type="url"
                                name="website"
                                className="input w-full"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder="https://example.com"
                            />
                        </div>

                        <div className="fieldset">
                            <label className="label">Industry</label>
                            <select
                                name="industry"
                                className="select w-full"
                                value={formData.industry}
                                onChange={handleChange}
                            >
                                <option value="">Select industry...</option>
                                {industries.map((industry) => (
                                    <option key={industry} value={industry}>
                                        {industry}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="fieldset">
                            <label className="label">Company Size</label>
                            <select
                                name="company_size"
                                className="select w-full"
                                value={formData.company_size}
                                onChange={handleChange}
                            >
                                <option value="">Select size...</option>
                                {companySizes.map((size) => (
                                    <option key={size} value={size}>
                                        {size} employees
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="fieldset">
                            <label className="label">Headquarters Location</label>
                            <input
                                type="text"
                                name="headquarters_location"
                                className="input w-full"
                                value={formData.headquarters_location}
                                onChange={handleChange}
                                placeholder="San Francisco, CA"
                            />
                        </div>

                        <div className="fieldset md:col-span-2">
                            <label className="label">Company Description</label>
                            <textarea
                                name="description"
                                className="textarea w-full h-32"
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Tell us about your company, culture, and what makes you unique..."
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    This description will be visible to recruiters
                                </span>
                            </label>
                        </div>

                        <div className="fieldset md:col-span-2">
                            <label className="label">Logo URL (Optional)</label>
                            <input
                                type="url"
                                name="logo_url"
                                className="input w-full"
                                value={formData.logo_url}
                                onChange={handleChange}
                                placeholder="https://example.com/logo.png"
                            />
                            <label className="label">
                                <span className="label-text-alt">
                                    Enter a direct link to your company logo image
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h2 className="card-title">
                        <i className="fa-solid fa-cog"></i>
                        Hiring Preferences
                    </h2>
                    <p className="text-sm text-base-content/70">
                        More hiring preference options coming soon...
                    </p>
                </div>
            </div>

            <div className="flex gap-2 justify-end">
                <button
                    type="button"
                    className="btn"
                    onClick={() => router.back()}
                    disabled={saving}
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving || !formData.name.trim()}
                >
                    {saving ? (
                        <>
                            <span className="loading loading-spinner loading-sm"></span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <i className="fa-solid fa-save"></i>
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
