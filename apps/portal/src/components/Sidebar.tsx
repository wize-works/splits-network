'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fa-house' },
    { href: '/roles', label: 'Roles', icon: 'fa-briefcase' },
    { href: '/candidates', label: 'Candidates', icon: 'fa-users' },
    { href: '/placements', label: 'Placements', icon: 'fa-trophy' },
    { href: '/admin', label: 'Admin', icon: 'fa-gear', adminOnly: true },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="drawer-side">
            <label htmlFor="sidebar-drawer" className="drawer-overlay"></label>
            <aside className="bg-base-200 w-64 min-h-screen flex flex-col">
                {/* Logo/Brand */}
                <div className="p-4 border-b border-base-300">
                    <Link href="/dashboard" className="text-xl font-bold">
                        Splits Network
                    </Link>
                </div>

                {/* Navigation */}
                <ul className="menu p-4 flex-1">
                    {navItems.map((item) => (
                        <li key={item.href}>
                            <Link
                                href={item.href}
                                className={pathname === item.href ? 'active' : ''}
                            >
                                <i className={`fa-solid ${item.icon} w-5`}></i>
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* User Profile */}
                <div className="p-4 border-t border-base-300">
                    <div className="flex items-center gap-3">
                        <UserButton afterSignOutUrl="/" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">Profile</div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
