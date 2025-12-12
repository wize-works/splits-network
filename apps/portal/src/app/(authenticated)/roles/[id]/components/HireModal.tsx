'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';

interface Application {
    id: string;
    candidate_id: string;
    job_id: string;
}

interface HireModalProps {
    application: Application;
    onClose: () => void;
    onSuccess: () => void;
}

export default function HireModal({ application, onClose, onSuccess }: HireModalProps) {
    const { getToken } = useAuth();
    const [salary, setSalary] = useState('');
    const [startDate, setStartDate] = useState('');
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
            await client.createPlacement({
                application_id: application.id,
                salary: parseFloat(salary),
                hired_at: startDate || new Date().toISOString().split('T')[0],
            });

            onSuccess();
        } catch (err: any) {
            setError(err.message || 'Failed to create placement');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h3 className="font-bold text-lg mb-4">
                    <i className="fa-solid fa-check-circle text-success mr-2"></i>
                    Mark as Hired
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="alert alert-info">
                        <i className="fa-solid fa-info-circle"></i>
                        <span>This will create a placement record and calculate your earnings.</span>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Annual Salary (USD) *</span>
                        </label>
                        <input
                            type="number"
                            className="input input-bordered"
                            value={salary}
                            onChange={(e) => setSalary(e.target.value)}
                            placeholder="150000"
                            required
                            min="0"
                            step="1000"
                        />
                        <label className="label">
                            <span className="label-text-alt">The candidate's agreed annual salary</span>
                        </label>
                    </div>

                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Start Date</span>
                        </label>
                        <input
                            type="date"
                            className="input input-bordered"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                        <label className="label">
                            <span className="label-text-alt">Leave blank to use today's date</span>
                        </label>
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
                            className="btn btn-success"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-check"></i>
                                    Confirm Hire
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
