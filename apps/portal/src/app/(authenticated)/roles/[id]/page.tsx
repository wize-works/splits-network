import { notFound } from 'next/navigation';
import RoleHeader from './components/RoleHeader';
import CandidatePipeline from './components/CandidatePipeline';

// This would normally come from the API, but we'll let the client components handle it
async function getJobData(id: string) {
    // In a real app, you might fetch initial data here for SSR
    // For now, we'll let client components handle all fetching
    return { id };
}

export default async function RoleDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="space-y-6">
            <RoleHeader roleId={id} />
            <CandidatePipeline roleId={id} />
        </div>
    );
}
