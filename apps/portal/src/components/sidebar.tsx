'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { createAuthenticatedClient } from '@/lib/api-client';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: 'fa-house', roles: ['all'] },
    { href: '/roles', label: 'Roles', icon: 'fa-briefcase', roles: ['all'] },
    { href: '/invitations', label: 'Invitations', icon: 'fa-envelope', roles: ['recruiter'] },
    { href: '/proposals', label: 'Proposals', icon: 'fa-inbox', roles: ['all'] },
    { href: '/candidates', label: 'Candidates', icon: 'fa-users', roles: ['recruiter', 'platform_admin'] },
    { href: '/applications', label: 'Applications', icon: 'fa-file-lines', roles: ['company_admin', 'hiring_manager'] },
    { href: '/placements', label: 'Placements', icon: 'fa-trophy', roles: ['recruiter', 'platform_admin'] },
    { href: '/profile', label: 'Profile', icon: 'fa-user', roles: ['recruiter'] },
    { href: '/billing', label: 'Billing', icon: 'fa-credit-card', roles: ['all'] },
    { href: '/company/settings', label: 'Company Settings', icon: 'fa-building', roles: ['company_admin', 'hiring_manager'] },
    { href: '/company/team', label: 'Team', icon: 'fa-user-group', roles: ['company_admin', 'hiring_manager'] },
];

const adminNavItems = [
    { href: '/admin', label: 'Admin Dashboard', icon: 'fa-gear' },
];

export function Sidebar() {
    const pathname = usePathname();
    const { getToken, isLoaded } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isCompanyUser, setIsCompanyUser] = useState(false);
    const [isRecruiter, setIsRecruiter] = useState(false);

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

                // Check if user is a recruiter by looking for recruiter profile in network service
                // Recruiters don't need organization memberships - they operate independently
                let hasRecruiterRole = false;
                try {
                    const recruiterResponse: any = await apiClient.get(`/recruiters/by-user/${profile.data.id}`);
                    if (recruiterResponse?.data && recruiterResponse.data.status === 'active') {
                        hasRecruiterRole = true;
                    }
                } catch (error) {
                    // User is not a recruiter or recruiter profile doesn't exist yet
                    hasRecruiterRole = false;
                }

                setIsAdmin(hasAdminRole);
                setIsCompanyUser(hasCompanyRole);
                setIsRecruiter(hasRecruiterRole);
            } catch (error) {
                console.error('Failed to check user roles:', error);
                setIsAdmin(false);
                setIsCompanyUser(false);
                setIsRecruiter(false);
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
                    {navItems
                        .filter((item) => {
                            if (item.roles.includes('all')) return true;
                            if (isAdmin) return true; // Admins see everything
                            if (isRecruiter && item.roles.includes('recruiter')) return true;
                            if (isCompanyUser && (item.roles.includes('company_admin') || item.roles.includes('hiring_manager'))) return true;
                            return false;
                        })
                        .map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${isActive
                                        ? 'bg-primary text-primary-content font-medium'
                                        : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                                        }`}
                                >
                                    <i className={`fa-solid ${item.icon} w-4 text-center`}></i>
                                    {item.label}
                                </Link>
                            );
                        })}

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
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors mb-1 ${isActive
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
