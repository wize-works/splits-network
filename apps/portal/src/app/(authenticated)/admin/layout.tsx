import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createAuthenticatedClient } from '@/lib/api-client';

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId, getToken } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Get the user's profile to check if they're an admin
    try {
        const token = await getToken();
        if (!token) {
            redirect('/sign-in');
        }

        const apiClient = createAuthenticatedClient(token);
        const profile: any = await apiClient.get('/me');
        
        // Check if user has platform_admin role
        const isAdmin = profile.data?.memberships?.some(
            (m: any) => m.role === 'platform_admin'
        );

        if (!isAdmin) {
            // Not an admin, redirect to dashboard
            redirect('/dashboard');
        }
    } catch (error) {
        console.error('Failed to check admin access:', error);
        redirect('/dashboard');
    }

    return <>{children}</>;
}
