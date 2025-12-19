'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface PreScreenRequestModalProps {
    application: any;
    jobId: string;
    companyId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PreScreenRequestModal({
    application,
    jobId,
    companyId,
    onClose,
    onSuccess,
}: PreScreenRequestModalProps) {
    const { getToken } = useAuth();
    const [recruiters, setRecruiters] = useState<any[]>([]);
    const [loadingRecruiters, setLoadingRecruiters] = useState(true);
    const [selectedRecruiterId, setSelectedRecruiterId] = useState<string>('auto');
    const [message, setMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchRecruiters();
    }, []);

    const fetchRecruiters = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const client = createAuthenticatedClient(token);
            // Get recruiters assigned to this job
            const response: any = await client.get(`/jobs/${jobId}/recruiters`);
            setRecruiters(response.data || []);
        } catch (error) {
            console.error('Failed to fetch recruiters:', error);
        } finally {
            setLoadingRecruiters(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                setSubmitting(false);
                return;
            }

            const client = createAuthenticatedClient(token);
            await client.requestPreScreen(application.id, {
                company_id: companyId,
                recruiter_id: selectedRecruiterId === 'auto' ? undefined : selectedRecruiterId,
                message: message.trim() || undefined,
            });

            onSuccess();
        } catch (error: any) {
            console.error('Failed to request pre-screen:', error);
            setError(error.message || 'Failed to request pre-screen');
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-lg">
                <h3 className="font-bold text-lg mb-4">
                    <i className="fa-solid fa-user-check mr-2"></i>
                    Request Pre-Screen
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-base-200 p-4 rounded-lg">
                        <p className="text-sm">
                            <strong>Candidate:</strong> {application.candidate?.full_name || 'Unknown'}
                        </p>
                        <p className="text-sm mt-1">
                            <strong>Email:</strong> {application.candidate?.email || 'Unknown'}
                        </p>
                    </div>

                    <div className="fieldset">
                        <label className="label">Assign Recruiter</label>
                        <select
                            className="select w-full"
                            value={selectedRecruiterId}
                            onChange={(e) => setSelectedRecruiterId(e.target.value)}
                            disabled={loadingRecruiters || submitting}
                        >
                            <option value="auto">Auto-assign (System will select)</option>
                            {recruiters.map((recruiter) => (
                                <option key={recruiter.id} value={recruiter.id}>
                                    {recruiter.user?.full_name || recruiter.user?.email || `Recruiter ${recruiter.id}`}
                                </option>
                            ))}
                        </select>
                        <label className="label">
                            <span className="label-text-alt">
                                {selectedRecruiterId === 'auto'
                                    ? 'The system will automatically assign an available recruiter'
                                    : 'The selected recruiter will receive a notification'}
                            </span>
                        </label>
                    </div>

                    <div className="fieldset">
                        <label className="label">Message to Recruiter (Optional)</label>
                        <textarea
                            className="textarea h-24"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Add any context or special requirements..."
                            disabled={submitting}
                        />
                    </div>

                    <div className="alert alert-info">
                        <i className="fa-solid fa-circle-info"></i>
                        <div className="text-sm">
                            <p className="font-semibold">What happens next?</p>
                            <ul className="list-disc list-inside mt-1">
                                <li>Recruiter will review the candidate's profile</li>
                                <li>Recruiter can add notes and insights</li>
                                <li>Recruiter will submit back to you for final review</li>
                            </ul>
                        </div>
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
                            disabled={submitting || loadingRecruiters}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Requesting...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-paper-plane"></i>
                                    Send Request
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={onClose}></div>
        </div>
    );
}
