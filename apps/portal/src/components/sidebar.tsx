'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createAuthenticatedClient } from '@/lib/api-client';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fa-house' },
    { href: '/roles', label: 'Roles', icon: 'fa-briefcase' },
    { href: '/candidates', label: 'Candidates', icon: 'fa-users' },
    { href: '/invitations', label: 'Invitations', icon: 'fa-envelope' },
    { href: '/proposals', label: 'Proposals', icon: 'fa-handshake', badge: true },
    { href: '/placements', label: 'Placements', icon: 'fa-trophy' },
];

const companyNavItems = [
    { href: '/company/settings', label: 'Company Settings', icon: 'fa-building' },
    { href: '/company/team', label: 'Team', icon: 'fa-user-group' },
];

const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: 'fa-gear' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { getToken, isLoaded } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompanyUser, setIsCompanyUser] = useState(false);

    useEffect(() => {
        async function checkUserRoles() {
            if (!isLoaded) return;
            
            try {
                const token = await getToken();
                if (!token) return;
                
                const apiClient = createAuthenticatedClient(token);
                const profile: any = await apiClient.get('/me');
                
                const memberships = profile.data?.memberships || [];
                
                const hasAdminRole = memberships.some(
                    (m: any) => m.role === 'platform_admin'
                );
                
                const hasCompanyRole = memberships.some(
                    (m: any) => ['company_admin', 'hiring_manager'].includes(m.role)
                );
                
                setIsAdmin(hasAdminRole);
                setIsCompanyUser(hasCompanyRole);
            } catch (error) {
                console.error('Failed to check user roles:', error);
                setIsAdmin(false);
                setIsCompanyUser(false);
            }
        }

        checkUserRoles();
    }, [isLoaded, getToken]);

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

                    {/* Company Management Section */}
                    {isCompanyUser && (
                        <>
                            <div className="divider my-2"></div>
                            <div className="px-3 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                                Company
                            </div>
                            {companyNavItems.map((item) => {
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
                        </>
                    )}

                    {/* Admin Section */}
                    {isAdmin && adminNavItems.length > 0 && (
                        <>
                            <div className="divider my-2"></div>
                            <div className="px-3 py-1 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                                Platform
                            </div>
                            {adminNavItems.map((item) => {
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
                        </>
                    )}
                </nav>
            </aside>
        </div>
    );
}
