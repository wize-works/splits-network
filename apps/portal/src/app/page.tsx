import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function HomePage() {
    const { userId } = await auth();

    // Redirect authenticated users to dashboard
    if (userId) {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-base-200">
            <div className="hero min-h-screen">
                <div className="hero-content text-center">
                    <div className="max-w-md">
                        <h1 className="text-5xl font-bold">Splits Network</h1>
                        <p className="py-6">
                            The split-fee recruiting marketplace connecting independent recruiters with
                            companies seeking top talent.
                        </p>
                        <div className="space-x-4">
                            <Link href="/sign-in" className="btn btn-primary">
                                Sign In
                            </Link>
                            <Link href="/sign-up" className="btn btn-outline">
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
