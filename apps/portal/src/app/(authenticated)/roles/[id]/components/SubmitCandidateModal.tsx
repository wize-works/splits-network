'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface SubmitCandidateModalProps {
    roleId: string;
    onClose: () => void;
}

export default function SubmitCandidateModal({ roleId, onClose }: SubmitCandidateModalProps) {
    const { getToken } = useAuth();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        linkedin_url: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);

        try {
            const token = await getToken();
            if (!token) {
                throw new Error('No auth token available');
            }

            const client = createAuthenticatedClient(token);
            await client.submitCandidate({
                job_id: roleId,
                ...formData,
            });

            // Success - close modal and refresh
            onClose();
            window.location.reload();
        } catch (err: any) {
            setError(err.message || 'An error occurred');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <h3 className="font-bold text-lg mb-4">Submit Candidate</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="fieldset">
                        <label className="label">Full Name *</label>
                        <input
                            type="text"
                            className="input w-full"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
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
                            required
                        />
                    </div>

                    <div className="fieldset">
                        <label className="label">LinkedIn URL</label>
                        <input
                            type="url"
                            className="input w-full"
                            value={formData.linkedin_url}
                            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                            placeholder="https://linkedin.com/in/..."
                        />
                    </div>

                    <div className="fieldset">
                        <label className="label">Notes</label>
                        <textarea
                            className="textarea w-full h-24"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Why is this candidate a great fit?"
                        />
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Candidate'
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
