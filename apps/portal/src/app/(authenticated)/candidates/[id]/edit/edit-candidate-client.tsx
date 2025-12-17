'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import DocumentList from '@/components/document-list';

interface EditCandidateClientProps {
    candidateId: string;
}

export default function EditCandidateClient({ candidateId }: EditCandidateClientProps) {
    const router = useRouter();
    const { getToken } = useAuth();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        linkedin_url: '',
        phone: '',
        location: '',
        current_title: '',
        current_company: '',
    });
    const [relationship, setRelationship] = useState<any>(null);

    useEffect(() => {
        async function loadCandidate() {
            try {
                setLoading(true);
                const token = await getToken();
                if (!token) {
                    setError('Not authenticated');
                    return;
                }
                
                const client = createAuthenticatedClient(token);
                const response = await client.get(`/candidates/${candidateId}`);
                const candidate = response.data;
                
                setFormData({
                    full_name: candidate.full_name || '',
                    email: candidate.email || '',
                    linkedin_url: candidate.linkedin_url || '',
                    phone: candidate.phone || '',
                    location: candidate.location || '',
                    current_title: candidate.current_title || '',
                    current_company: candidate.current_company || '',
                });

                // Check if user has an active relationship with this candidate
                // (The API will return 403 if they try to update without permission)
            } catch (err: any) {
                console.error('Failed to load candidate:', err);
                if (err.response?.status === 403) {
                    setError('You do not have permission to edit this candidate. Only candidates you are actively representing can be edited.');
                } else if (err.response?.status === 404) {
                    setError('Candidate not found');
                } else {
                    setError(err.response?.data?.message || err.message || 'Failed to load candidate');
                }
            } finally {
                setLoading(false);
            }
        }

        loadCandidate();
    }, [candidateId, getToken]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('Not authenticated');
            }

            const client = createAuthenticatedClient(token);
            
            await client.patch(`/candidates/${candidateId}`, {
                ...formData,
                linkedin_url: formData.linkedin_url || undefined,
                phone: formData.phone || undefined,
                location: formData.location || undefined,
                current_title: formData.current_title || undefined,
                current_company: formData.current_company || undefined,
            });

            router.push(`/candidates/${candidateId}`);
        } catch (err: any) {
            console.error('Failed to update candidate:', err);
            if (err.response?.status === 403) {
                setError('You do not have permission to edit this candidate. Your relationship may have expired or been terminated.');
            } else {
                setError(err.response?.data?.message || err.message || 'Failed to update candidate');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <span className="loading loading-spinner loading-lg"></span>
                    <p className="mt-4 text-base-content/70">Loading candidate...</p>
                </div>
            </div>
        );
    }

    if (error && !formData.full_name) {
        return (
            <div className="space-y-4">
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
                <Link href="/candidates" className="btn btn-ghost">
                    <i className="fa-solid fa-arrow-left"></i>
                    Back to Candidates
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="text-sm breadcrumbs">
                <ul>
                    <li><Link href="/candidates">Candidates</Link></li>
                    <li><Link href={`/candidates/${candidateId}`}>{formData.full_name}</Link></li>
                    <li>Edit</li>
                </ul>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <h1 className="card-title text-2xl mb-6">Edit Candidate</h1>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div className="fieldset">
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="John Doe"
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="fieldset">
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    className="input w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="john@example.com"
                                    required
                                />
                            </div>

                            {/* Phone */}
                            <div className="fieldset">
                                <label className="label">Phone</label>
                                <input
                                    type="tel"
                                    className="input w-full"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>

                            {/* Location */}
                            <div className="fieldset">
                                <label className="label">Location</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    placeholder="San Francisco, CA"
                                />
                            </div>

                            {/* Current Title */}
                            <div className="fieldset">
                                <label className="label">Current Title</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.current_title}
                                    onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                                    placeholder="Senior Software Engineer"
                                />
                            </div>

                            {/* Current Company */}
                            <div className="fieldset">
                                <label className="label">Current Company</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.current_company}
                                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                                    placeholder="Tech Corp Inc."
                                />
                            </div>
                        </div>

                        {/* LinkedIn URL */}
                        <div className="fieldset">
                            <label className="label">LinkedIn Profile</label>
                            <input
                                type="url"
                                className="input w-full"
                                value={formData.linkedin_url}
                                onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                placeholder="https://linkedin.com/in/johndoe"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end pt-4">
                            <Link href={`/candidates/${candidateId}`} className="btn">
                                Cancel
                            </Link>
                            <button type="submit" className="btn btn-primary" disabled={submitting}>
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-save"></i>
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            {/* Documents */}
            {!loading && formData.full_name && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-lg mb-4">
                            <i className="fa-solid fa-file-lines mr-2"></i>
                            Documents
                        </h2>
                        <DocumentList
                            entityType="candidate"
                            entityId={candidateId}
                            showUpload={true}
                        />
                    </div>
                </div>
            )}
            </div>
        </div>
    );
}
