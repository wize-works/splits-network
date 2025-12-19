import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import CompanySettingsForm from './settings-form';

async function fetchFromGateway(endpoint: string, token: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}${endpoint}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
}

export default async function CompanySettingsPage() {
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
        ['company_admin', 'hiring_manager'].includes(m.role)
    );

    if (!companyMembership) {
        redirect('/dashboard');
    }

    // Fetch company details
    let company = null;
    if (companyMembership.organization?.id) {
        try {
            // First try to get company by organization ID
            const companiesResponse: any = await fetchFromGateway('/api/companies', token);
            const companies = companiesResponse?.data || [];
            company = companies.find((c: any) => c.identity_organization_id === companyMembership.organization.id);
        } catch (error) {
            console.error('Failed to fetch company:', error);
        }
    }

    return (
        <div className="container mx-auto py-6 px-4 max-w-4xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Company Settings</h1>
                <p className="text-base-content/70 mt-2">
                    Manage your company profile and preferences
                </p>
            </div>

            <CompanySettingsForm
                company={company}
                organizationId={companyMembership.organization?.id}
            />
        </div>
    );
}
