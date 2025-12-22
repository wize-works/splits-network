'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { UserDropdown } from './user-dropdown';
import NotificationBell from './notification-bell';

export function Header() {
    const pathname = usePathname();
    const { isSignedIn } = useAuth();
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Initialize theme from localStorage on mount
        try {
            const saved = localStorage.getItem('theme');
            if (saved) {
                document.documentElement.setAttribute('data-theme', saved);
                setIsDark(saved === 'splits-dark');
            }
        } catch { }
    }, []);

    const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.currentTarget.checked;
        const theme = checked ? 'splits-dark' : 'splits-light';
        document.documentElement.setAttribute('data-theme', theme);
        setIsDark(checked);
        try {
            localStorage.setItem('theme', theme);
        } catch { }
    };

    // Don't show header on auth pages
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/sso-callback');
    if (isAuthPage) return null;

    // Authenticated app pages
    const isAuthenticatedPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/roles') ||
        pathname?.startsWith('/candidates') || pathname?.startsWith('/placements') ||
        pathname?.startsWith('/admin') || pathname?.startsWith('/profile') || pathname?.startsWith('/billing') ||
        pathname?.startsWith('/notifications') || pathname?.startsWith('/applications') ||
        pathname?.startsWith('/proposals') || pathname?.startsWith('/teams') ||
        pathname?.startsWith('/company') || pathname?.startsWith('/integrations') ||
        pathname?.startsWith('/invitations');

    return (
        <header className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
            {/* Start: Brand + Mobile menu */}
            <div className="navbar-start ps-4">
                <div className="dropdown lg:hidden">
                    <label tabIndex={0} className="btn btn-ghost">
                        <i className="fa-solid fa-bars"></i>
                    </label>
                    <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52">
                        {isSignedIn ? (
                            <>
                                <li><Link href="/dashboard">Dashboard</Link></li>
                                <li><Link href="/roles">Roles</Link></li>
                                <li><Link href="/candidates">Candidates</Link></li>
                                <li><Link href="/invitations">Invitations</Link></li>
                                <li><Link href="/placements">Placements</Link></li>
                                <li><Link href="/applications">Applications</Link></li>
                                <li className="menu-title mt-2">Account</li>
                                <li><Link href="/profile">Profile</Link></li>
                                <li><Link href="/billing">Billing</Link></li>
                            </>
                        ) : (
                            <>
                                <li><a href="#how-it-works">How It Works</a></li>
                                <li><a href="#features">Features</a></li>
                                <li><a href="#pricing">Pricing</a></li>
                            </>
                        )}
                    </ul>
                </div>
                <Link href="/" className="">
                    <img src="/logo.svg" alt="Applicant Network" className="h-12" />
                </Link>
            </div>

            {/* Center: Desktop marketing links */}
            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li><a href="#how-it-works">How It Works</a></li>
                    <li><a href="#features">Features</a></li>
                    <li><a href="#pricing">Pricing</a></li>
                </ul>
            </div>

            {/* End: Actions + Theme toggle */}
            <div className="navbar-end gap-2 items-center pe-4">
                <label className="swap swap-rotate cursor-pointer btn btn-ghost btn-circle" title="Toggle Theme">
                    <input
                        type="checkbox"
                        checked={isDark}
                        onChange={handleThemeChange}
                        className="theme-controller"
                    />
                    <i className="fa-solid fa-sun swap-off text-xl"></i>
                    <i className="fa-solid fa-moon swap-on text-xl"></i>
                </label>

                {isSignedIn ? (
                    <>
                        <Link href="/dashboard" className="btn btn-ghost btn-circle" title='Dashboard'>
                            <i className="fa-solid fa-gauge text-xl"></i>
                        </Link>
                        <NotificationBell />
                        <UserDropdown />
                    </>
                ) : (
                    <>
                        <Link href="/sign-in" className="btn btn-ghost">Sign In</Link>
                        <Link href="/sign-up" className="btn btn-primary">Get Started</Link>
                    </>
                )}
            </div>
        </header>
    );
}
