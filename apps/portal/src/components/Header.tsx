'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';

export function Header() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();

    // Don't show header on auth pages
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/sso-callback');
    if (isAuthPage) {
        return null;
    }

    // Check if we're on an authenticated page
    const isAuthenticatedPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/roles') || 
                                pathname?.startsWith('/candidates') || pathname?.startsWith('/placements') ||
                                pathname?.startsWith('/admin') || pathname?.startsWith('/settings') ||
                                pathname?.startsWith('/billing');

    return (
        <header className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto">
                <div className="flex">
                    <Link href={isSignedIn ? '/dashboard' : '/'} className="btn btn-ghost text-xl">
                        <span className="ml-2 font-bold">splits</span>
                    </Link>
                    
                    {/* Navigation Links */}
                    {isSignedIn && !isAuthenticatedPage && (
                        <div className="hidden lg:flex ml-8">
                            <ul className="menu menu-horizontal px-1">
                                <li>
                                    <Link href="/dashboard">
                                        <i className="fa-solid fa-home"></i>
                                        Dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    )}
                    
                    {!isSignedIn && !isAuthenticatedPage && (
                        <div className="hidden lg:flex ml-8">
                            <ul className="menu menu-horizontal px-1">
                                <li><a href="#how-it-works">How It Works</a></li>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                            </ul>
                        </div>
                    )}
                    {isSignedIn ? (
                        <>
                            {!isAuthenticatedPage && (
                                <Link href="/dashboard" className="btn btn-ghost">
                                    <i className="fa-solid fa-gauge"></i>
                                    Dashboard
                                </Link>
                            )}
                            <UserButton afterSignOutUrl="/" />
                        </>
                    ) : (
                        <div className='ml-auto'>
                            <Link href="/sign-in" className="btn btn-ghost">
                                Sign In
                            </Link>
                            <Link href="/sign-up" className="btn btn-primary">
                                Get Started
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
