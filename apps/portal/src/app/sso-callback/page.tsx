'use client';

import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';

export default function SSOCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body items-center text-center">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                    <h2 className="card-title mt-4">Completing sign in...</h2>
                    <p className="text-sm text-base-content/70">
                        Please wait while we redirect you.
                    </p>
                </div>
            </div>
            <AuthenticateWithRedirectCallback />
        </div>
    );
}
