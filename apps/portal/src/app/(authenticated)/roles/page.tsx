import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import RolesList from './components/RolesList';
import { createAuthenticatedClient } from '@/lib/api-client';

interface Membership {
    role: string;
    organization_id: string;
}

interface UserProfile {
    memberships: Membership[];
}

async function getUserRole(token: string): Promise<string | null> {
    try {
        const client = createAuthenticatedClient(token);
        const response: any = await client.getCurrentUser();
        const profile: UserProfile = response.data;
        
        // Return the first membership role (in Phase 1, users have one membership)
        if (profile.memberships && profile.memberships.length > 0) {
            return profile.memberships[0].role;
        }
        return null;
    } catch (error) {
        console.error('Failed to get user role:', error);
        return null;
    }
}

export default async function RolesPage() {
    const { userId, getToken } = await auth();
    const token = await getToken();
    const userRole = token ? await getUserRole(token) : null;
    const canCreateRole = userRole === 'company_admin' || userRole === 'platform_admin';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Roles</h1>
                    <p className="text-base-content/70 mt-1">
                        Browse and manage roles you're assigned to
                    </p>
                </div>
                {canCreateRole && (
                    <Link href="/roles/new" className="btn btn-primary gap-2">
                        <i className="fa-solid fa-plus"></i>
                        Create New Role
                    </Link>
                )}
            </div>

            <RolesList />
        </div>
    );
}
