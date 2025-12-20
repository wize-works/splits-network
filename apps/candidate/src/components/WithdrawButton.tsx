'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

interface WithdrawButtonProps {
    applicationId: string;
    jobTitle: string;
}

export default function WithdrawButton({ applicationId, jobTitle }: WithdrawButtonProps) {
    const [isWithdrawing, setIsWithdrawing] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { getToken } = useAuth();

    const handleWithdraw = async () => {
        setIsWithdrawing(true);
        setError(null);

        try {
            const token = await getToken();

            if (!token) {
                throw new Error('Not authenticated');
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
            const response = await fetch(`${apiUrl}/applications/${applicationId}/withdraw`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                credentials: 'include',
                body: JSON.stringify({
                    reason: 'Candidate withdrew application',
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error?.message || 'Failed to withdraw application');
            }

            // Success - redirect to applications list with success message
            router.push('/applications?withdrawn=true');
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to withdraw application');
            setIsWithdrawing(false);
        }
    };

    return (
        <>
            {error && (
                <div className="alert alert-error mb-4">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>{error}</span>
                </div>
            )}

            {!showConfirm ? (
                <button
                    className="btn btn-error btn-outline w-full"
                    onClick={() => setShowConfirm(true)}
                    disabled={isWithdrawing}
                >
                    <i className="fa-solid fa-xmark"></i>
                    Withdraw Application
                </button>
            ) : (
                <div className="space-y-2">
                    <div className="alert alert-warning">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                        <div className="flex-1">
                            <div className="font-semibold">Are you sure?</div>
                            <div className="text-sm">
                                This will withdraw your application for {jobTitle}. This action cannot be undone.
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="btn btn-error flex-1"
                            onClick={handleWithdraw}
                            disabled={isWithdrawing}
                        >
                            {isWithdrawing ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Withdrawing...
                                </>
                            ) : (
                                <>
                                    <i className="fa-solid fa-check"></i>
                                    Yes, Withdraw
                                </>
                            )}
                        </button>
                        <button
                            className="btn btn-outline flex-1"
                            onClick={() => setShowConfirm(false)}
                            disabled={isWithdrawing}
                        >
                            <i className="fa-solid fa-xmark"></i>
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
