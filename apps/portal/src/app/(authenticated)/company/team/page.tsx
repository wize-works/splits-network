import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import TeamManagementContent from './team-content';

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

export default async function CompanyTeamPage() {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    const token = await getToken();
    if (!token) {
        redirect('/sign-in');
    }

    // Fetch user profile
    const profileResponse: any = await fetchFromGateway('/api/me', token);
    const profile = profileResponse?.data;

    // Check if user is company admin
    const memberships = profile?.memberships || [];
    const companyMembership = memberships.find((m: any) =>
        m.role === 'company_admin' // Only company admins can manage team
    );

    if (!companyMembership) {
        redirect('/dashboard');
    }

    const organizationId = companyMembership.organization?.id;

    return (
        <div className="container mx-auto py-6 px-4 max-w-6xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Team Management</h1>
                <p className="text-base-content/70 mt-2">
                    Manage your company's team members and their roles
                </p>
            </div>

            <TeamManagementContent organizationId={organizationId} />
        </div>
    );
}
