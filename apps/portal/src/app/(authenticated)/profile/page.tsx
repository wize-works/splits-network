'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createAuthenticatedClient } from '@/lib/api-client';
import { UserProfileSettings } from './components/user-profile-settings';
import { ProfileSettings } from './components/profile-settings';
import { MarketplaceSettings } from './components/marketplace-settings';

export default function SettingsPage() {
    const router = useRouter();
    const { getToken, isLoaded } = useAuth();
    const [userRoles, setUserRoles] = useState<{
        isRecruiter: boolean;
        isCompanyAdmin: boolean;
        isHiringManager: boolean;
        isPlatformAdmin: boolean;
    }>({
        isRecruiter: false,
        isCompanyAdmin: false,
        isHiringManager: false,
        isPlatformAdmin: false,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkUserRole() {
            if (!isLoaded) return;

            try {
                const token = await getToken();
                if (!token) {
                    setLoading(false);
                    return;
                }

                const apiClient = createAuthenticatedClient(token);
                const profile: any = await apiClient.get('/me');
                const memberships = profile.data?.memberships || [];

                // Check if user is a recruiter by looking for recruiter profile in network service
                // Recruiters don't need organization memberships - they operate independently
                let isRecruiterRole = false;
                try {
                    const recruiterResponse: any = await apiClient.get(`/recruiters/by-user/${profile.data.id}`);
                    if (recruiterResponse?.data && recruiterResponse.data.status === 'active') {
                        isRecruiterRole = true;
                    }
                } catch (error) {
                    // User is not a recruiter or recruiter profile doesn't exist yet
                    isRecruiterRole = false;
                }

                setUserRoles({
                    isRecruiter: isRecruiterRole,
                    isCompanyAdmin: memberships.some((m: any) => m.role === 'company_admin'),
                    isHiringManager: memberships.some((m: any) => m.role === 'hiring_manager'),
                    isPlatformAdmin: memberships.some((m: any) => m.role === 'platform_admin'),
                });
                setLoading(false);
            } catch (error) {
                console.error('Failed to check user role:', error);
                setLoading(false);
            }
        }

        checkUserRole();
    }, [isLoaded, getToken]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

            <div className="space-y-4">
                {/* Profile & Account Card - Available to ALL users */}
                <UserProfileSettings />

                {/* Recruiter Profile (Recruiters Only) */}
                {userRoles.isRecruiter && <ProfileSettings />}

                {/* Marketplace Settings (Recruiters Only) */}
                {userRoles.isRecruiter && <MarketplaceSettings />}

                {/* Company Settings - Future (Company Admins & Hiring Managers) */}
                {(userRoles.isCompanyAdmin || userRoles.isHiringManager) && (
                    <div className="card bg-base-100 shadow opacity-60">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-building"></i>
                                Company Settings
                                <div className="badge badge-sm">Coming Soon</div>
                            </h2>
                            <p className="text-sm text-base-content/70">
                                Manage company profile, branding, and hiring preferences
                            </p>
                        </div>
                    </div>
                )}

                {/* Platform Administration (Platform Admins Only) */}
                {userRoles.isPlatformAdmin && (
                    <div className="card bg-base-100 shadow opacity-60">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-shield-halved"></i>
                                Platform Administration
                                <div className="badge badge-sm">Coming Soon</div>
                            </h2>
                            <p className="text-sm text-base-content/70">
                                Platform-wide settings, user management, and analytics
                            </p>
                        </div>
                    </div>
                )}

                {/* Notifications Card (Future - All users) */}
                <div className="card bg-base-100 shadow opacity-60">
                    <div className="card-body">
                        <h2 className="card-title">
                            <i className="fa-solid fa-bell"></i>
                            Notifications
                            <div className="badge badge-sm">Coming Soon</div>
                        </h2>
                        <p className="text-sm text-base-content/70">
                            Configure email and in-app notification preferences
                        </p>
                    </div>
                </div>

                {/* Integrations Card (Future - Available based on role) */}
                {(userRoles.isRecruiter || userRoles.isCompanyAdmin || userRoles.isPlatformAdmin) && (
                    <div className="card bg-base-100 shadow opacity-60">
                        <div className="card-body">
                            <h2 className="card-title">
                                <i className="fa-solid fa-plug"></i>
                                Integrations
                                <div className="badge badge-sm">Coming Soon</div>
                            </h2>
                            <p className="text-sm text-base-content/70">
                                Connect to external services and ATS platforms
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
