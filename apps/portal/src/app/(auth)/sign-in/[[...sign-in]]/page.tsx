'use client';

import { useSignIn } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function SignInPage() {
    const { isLoaded, signIn, setActive } = useSignIn();
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setError('');
        setIsLoading(true);

        try {
            const signInAttempt = await signIn.create({
                identifier: email,
                password,
            });

            if (signInAttempt.status === 'complete') {
                await setActive({ session: signInAttempt.createdSessionId });
                router.push('/dashboard');
            } else {
                setError('Sign in incomplete. Please try again.');
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.message || 'Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithOAuth = (provider: 'oauth_google' | 'oauth_github' | 'oauth_microsoft') => {
        if (!isLoaded) return;
        
        signIn.authenticateWithRedirect({
            strategy: provider,
            redirectUrl: '/sso-callback',
            redirectUrlComplete: '/dashboard',
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <h2 className="card-title text-2xl font-bold justify-center mb-6">
                        Sign In to Splits Network
                    </h2>

                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fa-solid fa-circle-exclamation"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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

                        <div className="fieldset">
                            <label className="label">Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="input w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                            <label className="label">
                                <Link href="/forgot-password" className="label-text-alt link link-hover">
                                    Forgot password?
                                </Link>
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
                                    Signing in...
                                </>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="divider">OR</div>

                    <div className="space-y-2">
                        <button
                            onClick={() => signInWithOAuth('oauth_google')}
                            className="btn btn-outline w-full"
                            disabled={!isLoaded}
                        >
                            <i className="fa-brands fa-google"></i>
                            Continue with Google
                        </button>
                        <button
                            onClick={() => signInWithOAuth('oauth_github')}
                            className="btn btn-outline w-full"
                            disabled={!isLoaded}
                        >
                            <i className="fa-brands fa-github"></i>
                            Continue with GitHub
                        </button>
                        <button
                            onClick={() => signInWithOAuth('oauth_microsoft')}
                            className="btn btn-outline w-full"
                            disabled={!isLoaded}
                        >
                            <i className="fa-brands fa-microsoft"></i>
                            Continue with Microsoft
                        </button>
                    </div>

                    <p className="text-center text-sm mt-4">
                        Don't have an account?{' '}
                        <Link href="/sign-up" className="link link-primary">
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
