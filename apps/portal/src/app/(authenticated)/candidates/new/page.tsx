'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

export default function NewCandidatePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
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
    const [resumeFile, setResumeFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain'
            ];
            if (!allowedTypes.includes(file.type)) {
                setError('Please upload a PDF, DOC, DOCX, or TXT file');
                return;
            }
            // Validate file size (10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('File size must be less than 10MB');
                return;
            }
            setResumeFile(file);
            setError(null);
        }
    };

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

            // Step 1: Create candidate
            const payload: any = {
                email: formData.email,
                full_name: formData.full_name,
            };

            if (formData.linkedin_url) payload.linkedin_url = formData.linkedin_url;
            if (formData.phone) payload.phone = formData.phone;
            if (formData.location) payload.location = formData.location;
            if (formData.current_title) payload.current_title = formData.current_title;
            if (formData.current_company) payload.current_company = formData.current_company;

            const response = await client.post('/candidates', payload);
            const candidateId = response.data.id;

            // Step 2: Upload resume if provided
            if (resumeFile && candidateId) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', resumeFile);
                uploadFormData.append('entity_type', 'candidate');
                uploadFormData.append('entity_id', candidateId);
                uploadFormData.append('document_type', 'resume');

                await client.uploadDocument(uploadFormData);
            }

            // Redirect to candidate detail page
            router.push(`/candidates/${candidateId}`);
        } catch (error: any) {
            console.error('Failed to create candidate:', error);
            setError(error.message || 'Failed to create candidate');
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link href="/candidates" className="text-sm text-primary hover:underline mb-2 inline-block">
                    <i className="fa-solid fa-arrow-left mr-2"></i>
                    Back to Candidates
                </Link>
                <h1 className="text-3xl font-bold">Add New Candidate</h1>
                <p className="text-base-content/70 mt-1">
                    Add a candidate to your database
                </p>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-error">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {/* Form */}
            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <div className="fieldset">
                                <label className="label">Full Name *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    placeholder="Enter full name"
                                    required
                                />
                            </div>

                            <div className="fieldset">
                                <label className="label">Email *</label>
                                <input
                                    type="email"
                                    className="input w-full"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="candidate@example.com"
                                    required
                                />
                                <label className="label">
                                    <span className="label-text-alt">Primary contact email for the candidate</span>
                                </label>
                            </div>

                            <div className="fieldset">
                                <label className="label">LinkedIn URL</label>
                                <input
                                    type="url"
                                    className="input w-full"
                                    value={formData.linkedin_url}
                                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                                    placeholder="https://linkedin.com/in/username"
                                />
                                <label className="label">
                                    <span className="label-text-alt">Optional LinkedIn profile URL</span>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                            <div className="fieldset">
                                <label className="label">
                                    Resume (Optional)
                                    <span className="label-text-alt text-base-content/60">PDF, DOC, DOCX, or TXT - Max 10MB</span>
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="file-input w-full"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleFileChange}
                                />
                                {resumeFile && (
                                    <div className="mt-2 flex items-center gap-2">
                                        <i className="fa-solid fa-file text-primary"></i>
                                        <span className="text-sm">{resumeFile.name}</span>
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs"
                                            onClick={() => {
                                                setResumeFile(null);
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.value = '';
                                                }
                                            }}
                                        >
                                            <i className="fa-solid fa-times"></i>
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2 justify-end pt-4">
                            <Link href="/candidates" className="btn">
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <i className="fa-solid fa-plus mr-2"></i>
                                        Create Candidate
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Info Box */}
            <div className="alert alert-info">
                <i className="fa-solid fa-circle-info"></i>
                <div>
                    <p className="font-medium">After creating a candidate</p>
                    <p className="text-sm opacity-80">
                        Submit this candidate to job roles to add application-specific notes and track their progress.
                    </p>
                </div>
            </div>
        </div>
    );
}
