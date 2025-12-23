'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ProposeJobModalProps {
    applicationId: string;
    jobTitle: string;
    candidateName: string;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function ProposeJobModal({
    applicationId,
    jobTitle,
    candidateName,
    onClose,
    onSuccess,
}: ProposeJobModalProps) {
    const router = useRouter();
    const [pitch, setPitch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!pitch.trim()) {
            setError('Please provide a pitch for this opportunity');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/applications/${applicationId}/propose`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recruiter_pitch: pitch.trim(),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.error?.message || 'Failed to propose opportunity'
                );
            }

            // Success
            setPitch('');
            onClose();
            onSuccess?.();
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-lg">
                <h3 className="font-bold text-lg mb-2">Propose Opportunity</h3>
                <p className="text-sm text-base-content/70 mb-6">
                    Propose <span className="font-semibold">{jobTitle}</span> to{' '}
                    <span className="font-semibold">{candidateName}</span>
                </p>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="fieldset mb-6">
                        <label className="label">
                            Your pitch (why this role fits) *
                        </label>
                        <textarea
                            className="textarea h-32"
                            placeholder="Tell the candidate why you think this role is a great fit for them..."
                            value={pitch}
                            onChange={(e) => setPitch(e.target.value)}
                            disabled={loading}
                            required
                        ></textarea>
                        <label className="label">
                            <span className="label-text-alt">
                                {pitch.length} / 500 characters
                            </span>
                        </label>
                    </div>

                    <div className="modal-action">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading || !pitch.trim()}
                        >
                            {loading && (
                                <span className="loading loading-spinner loading-sm"></span>
                            )}
                            Send Proposal
                        </button>
                    </div>
                </form>
            </div>

            <form method="dialog" className="modal-backdrop" onClick={onClose}>
                <button type="button"></button>
            </form>
        </div>
    );
}
