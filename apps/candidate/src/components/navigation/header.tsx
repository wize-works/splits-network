'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function Header() {
  const { isSignedIn } = useAuth();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Initialize theme from localStorage on mount
    try {
      const saved = localStorage.getItem('theme');
      if (saved) {
        document.documentElement.setAttribute('data-theme', saved);
        setIsDark(saved === 'applicant-dark');
      }
    } catch {}
  }, []);

  const handleThemeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.currentTarget.checked;
    const theme = checked ? 'applicant-dark' : 'applicant-light';
    document.documentElement.setAttribute('data-theme', theme);
    setIsDark(checked);
    try {
      localStorage.setItem('theme', theme);
    } catch {}
  };

  return (
    <div className="navbar bg-base-100 shadow-md sticky top-0 z-50 border-b border-base-300">
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <i className="fa-solid fa-bars text-xl"></i>
          </div>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/jobs">Browse Jobs</Link></li>
            {isSignedIn ? (
              <>
                <li><Link href="/dashboard">Dashboard</Link></li>
                <li><Link href="/applications">Applications</Link></li>
                <li><Link href="/profile">Profile</Link></li>
                <li><Link href="/documents">Documents</Link></li>
              </>
            ) : (
              <>
                <li><Link href="/how-it-works">How It Works</Link></li>
                <li><Link href="/for-recruiters">For Recruiters</Link></li>
                <li><Link href="/sign-in">Sign In</Link></li>
                <li><Link href="/sign-up">Get Started</Link></li>
              </>
            )}
            <li><Link href="/help">Help</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          <i className="fa-solid fa-briefcase text-primary"></i>
          <span className="hidden sm:inline">Applicant Network</span>
        </Link>
      </div>
      
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/jobs">Browse Jobs</Link></li>
          {isSignedIn ? (
            <>
              <li><Link href="/dashboard">Dashboard</Link></li>
              <li><Link href="/applications">Applications</Link></li>
              <li><Link href="/profile">Profile</Link></li>
              <li><Link href="/documents">Documents</Link></li>
            </>
          ) : (
            <>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/for-recruiters">For Recruiters</Link></li>
            </>
          )}
          <li><Link href="/help">Help</Link></li>
        </ul>
      </div>
      
      <div className="navbar-end">
        <label className="swap swap-rotate cursor-pointer mr-4">
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
          <UserButton afterSignOutUrl="/" />
        ) : (
          <div className="hidden lg:flex gap-2">
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
  );
}
