import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';
import { AuthenticatedLayoutClient } from './layout-client';

export default async function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    return (
        <AuthenticatedLayoutClient>
            <div className="drawer lg:drawer-open">
                <input id="sidebar-drawer" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-col bg-base-200">
                    <main className="flex-1 p-6 container mx-auto">
                        {children}
                    </main>
                </div>
                <Sidebar />
            </div>
        </AuthenticatedLayoutClient>
    );
}
