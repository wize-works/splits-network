'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const { isLoaded, signIn } = useSignIn();
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [successfulCreation, setSuccessfulCreation] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [complete, setComplete] = useState(false);

    const handleSendCode = async (e: FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setIsLoading(true);

        try {
            await signIn.create({
                strategy: 'reset_password_email_code',
                identifier: email,
            });
            
            setSuccessfulCreation(true);
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Failed to send reset code');
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = async (e: FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setIsLoading(true);

        try {
            const result = await signIn.attemptFirstFactor({
                strategy: 'reset_password_email_code',
                code,
                password,
            });

            if (result.status === 'complete') {
                setComplete(true);
                setTimeout(() => {
                    router.push('/sign-in');
                }, 2000);
            } else {
                setError('Password reset incomplete. Please try again.');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Failed to reset password');
        } finally {
            setIsLoading(false);
        }
    };

    if (complete) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body items-center text-center">
                        <div className="text-success text-6xl mb-4">
                            <i className="fa-solid fa-circle-check"></i>
                        </div>
                        <h2 className="card-title text-2xl font-bold mb-2">
                            Password Reset Successful
                        </h2>
                        <p className="text-base-content/70 mb-4">
                            Your password has been updated. Redirecting to sign in...
                        </p>
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                </div>
            </div>
        );
    }

    if (successfulCreation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h2 className="card-title text-2xl font-bold justify-center mb-6">
                            Reset Your Password
                        </h2>

                        <div className="alert alert-info mb-4">
                            <i className="fa-solid fa-envelope"></i>
                            <span>We sent a reset code to {email}</span>
                        </div>

                        {error && (
                            <div className="alert alert-error mb-4">
                                <i className="fa-solid fa-circle-exclamation"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-4">
                            <div className="fieldset">
                                <label className="label">Reset Code</label>
                                <input
                                    type="text"
                                    placeholder="123456"
                                    className="input w-full text-center text-2xl tracking-widest"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    maxLength={6}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">New Password</span>
                                </label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="input input-bordered w-full"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                    minLength={8}
                                />
                                <label className="label">
                                    <span className="label-text-alt">Must be at least 8 characters</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full"
                                disabled={isLoading || !isLoaded}
                            >
                                {isLoading ? (
                                    <>
                                        <span className="loading loading-spinner"></span>
                                        Resetting password...
                                    </>
                                ) : (
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <button
                            onClick={() => setSuccessfulCreation(false)}
                            className="btn btn-ghost btn-sm w-full mt-2"
                        >
                            Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl font-bold justify-center mb-6">
                        Forgot Password?
                    </h2>

                    <p className="text-center text-base-content/70 mb-6">
                        Enter your email address and we'll send you a code to reset your password.
                    </p>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSendCode} className="space-y-4">
                        <div className="fieldset">
                            <label className="label">Email</label>
                            <input
                                type="email"
                                placeholder="you@example.com"
                                className="input w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary w-full"
                            disabled={isLoading || !isLoaded}
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner"></span>
                                    Sending code...
                                </>
                            ) : (
                                'Send Reset Code'
                            )}
                        </button>
                    </form>

                    <div className="divider"></div>

                    <p className="text-center text-sm">
                        Remember your password?{' '}
                        <Link href="/sign-in" className="link link-primary">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
