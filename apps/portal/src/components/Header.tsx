'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { UserDropdown } from './UserDropdown';

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
        } catch {}
    }, []);

    const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const checked = e.currentTarget.checked;
        const theme = checked ? 'splits-dark' : 'splits-light';
        document.documentElement.setAttribute('data-theme', theme);
        setIsDark(checked);
        try {
            localStorage.setItem('theme', theme);
        } catch {}
    };

    // Don't show header on auth pages
    const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up') || pathname?.startsWith('/sso-callback');
    if (isAuthPage) return null;

    // Authenticated app pages
    const isAuthenticatedPage = pathname?.startsWith('/dashboard') || pathname?.startsWith('/roles') ||
        pathname?.startsWith('/candidates') || pathname?.startsWith('/placements') ||
        pathname?.startsWith('/admin') || pathname?.startsWith('/settings') || pathname?.startsWith('/billing');

    return (
        <header className="navbar bg-base-100 shadow-lg sticky top-0 z-50">
            {/* Start: Brand + Mobile menu */}
            <div className="navbar-start">
                {!isSignedIn && !isAuthenticatedPage && (
                    <div className="dropdown lg:hidden">
                        <label tabIndex={0} className="btn btn-ghost">
                            <i className="fa-solid fa-bars"></i>
                        </label>
                        <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-10 p-2 shadow bg-base-100 rounded-box w-52">
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><a href="#features">Features</a></li>
                            <li><a href="#pricing">Pricing</a></li>
                        </ul>
                    </div>
                )}
                <Link href={isSignedIn ? '/dashboard' : '/'} className="text-2xl">
                    <span className="font-bold">splits</span>
                </Link>
            </div>

            {/* Center: Desktop marketing links */}
            <div className="navbar-center hidden lg:flex">
                {!isSignedIn && !isAuthenticatedPage && (
                    <ul className="menu menu-horizontal px-1">
                        <li><a href="#how-it-works">How It Works</a></li>
                        <li><a href="#features">Features</a></li>
                        <li><a href="#pricing">Pricing</a></li>
                    </ul>
                )}
            </div>

            {/* End: Actions + Theme toggle */}
            <div className="navbar-end gap-2 items-center">
                <label className="swap swap-rotate cursor-pointer">
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
                        {!isAuthenticatedPage && (
                            <Link href="/dashboard" className="btn btn-ghost">
                                <i className="fa-solid fa-gauge"></i>
                                Dashboard
                            </Link>
                        )}
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
