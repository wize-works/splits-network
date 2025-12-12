import { auth } from '@clerk/nextjs/server';
import RolesList from './components/RolesList';

export default async function RolesPage() {
    const { userId } = await auth();

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
            </div>

            <RolesList />
        </div>
    );
}
