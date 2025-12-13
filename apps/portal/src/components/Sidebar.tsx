'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
            <aside className="bg-base-100 w-64 min-h-screen flex flex-col border-r border-base-200">

                {/* Navigation */}
                <nav className="flex-1 px-3 py-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${
                                    isActive
                                        ? 'bg-primary text-primary-content font-medium'
                                        : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                                }`}
                            >
                                <i className={`fa-solid ${item.icon} w-4 text-center`}></i>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </div>
    );
}
