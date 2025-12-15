import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import RecruiterDashboard from './recruiter-dashboard';
import CompanyDashboard from './company-dashboard';
import AdminDashboard from './admin-dashboard';

// API client helper
async function fetchFromGateway(endpoint: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export default async function DashboardPage() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const token = await getToken();
    if (!token) {
        redirect('/sign-in');
    }

    // Fetch user profile to determine persona
    let profile: any;
    try {
        profile = await fetchFromGateway('/api/me', token);
    } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="alert alert-error max-w-md">
                    <i className="fa-solid fa-circle-exclamation"></i>
                    <span>Failed to load dashboard. Please try again.</span>
                </div>
            </div>
        );
    }

    // Determine user role/persona
    const memberships = profile.data?.memberships || [];
    const isAdmin = memberships.some((m: any) => m.role === 'platform_admin');
    const isCompanyUser = memberships.some((m: any) => ['company_admin', 'hiring_manager'].includes(m.role));
    const isRecruiter = memberships.some((m: any) => m.role === 'recruiter');

    // Route to appropriate dashboard
    if (isAdmin) {
        return <AdminDashboard token={token} profile={profile.data} />;
    } else if (isCompanyUser) {
        return <CompanyDashboard token={token} profile={profile.data} />;
    } else if (isRecruiter) {
        return <RecruiterDashboard token={token} profile={profile.data} />;
    }

    // Default: Show onboarding or empty state
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="card bg-base-100 shadow-xl max-w-md">
                <div className="card-body text-center">
                    <i className="fa-solid fa-user-circle text-6xl text-primary mb-4"></i>
                    <h2 className="card-title justify-center">Welcome to Splits Network!</h2>
                    <p className="text-base-content/70">
                        Your account is being set up. Please complete your profile to get started.
                    </p>
                    <div className="card-actions justify-center mt-4">
                        <a href="/settings" className="btn btn-primary">
                            Complete Profile
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
